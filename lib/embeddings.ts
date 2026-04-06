import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// OpenAI client (lazy singleton)
// ---------------------------------------------------------------------------

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
    _client = new OpenAI({ apiKey })
  }
  return _client
}

const MODEL = 'text-embedding-3-small'

// Rough chars-per-token ratio for English text. Not exact, but good enough
// for chunking without pulling in a full tokenizer.
const CHARS_PER_TOKEN = 4

// ---------------------------------------------------------------------------
// 1. createEmbedding
// ---------------------------------------------------------------------------

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getClient()
  const response = await openai.embeddings.create({
    model: MODEL,
    input: text,
  })
  return response.data[0].embedding
}

// ---------------------------------------------------------------------------
// 2. chunkText
// ---------------------------------------------------------------------------

export function chunkText(text: string, maxTokens = 300): string[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN
  const overlapChars = Math.floor(maxChars * 0.15) // 15 % overlap

  const cleaned = text.replace(/\n{3,}/g, '\n\n').trim()
  if (!cleaned) return []
  if (cleaned.length <= maxChars) return [cleaned]

  const chunks: string[] = []
  let start = 0

  while (start < cleaned.length) {
    let end = start + maxChars

    // Try to break at a sentence or paragraph boundary
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end)
      const lastBreak = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('! '),
      )
      if (lastBreak > maxChars * 0.5) {
        end = start + lastBreak + 1
      }
    }

    chunks.push(cleaned.slice(start, end).trim())
    start = end - overlapChars
  }

  return chunks.filter(Boolean)
}

// ---------------------------------------------------------------------------
// 3. chunkDecision
// ---------------------------------------------------------------------------

type DecisionInput = {
  title: string
  content?: string
  reason?: string
}

type DecisionChunk = {
  text: string
  type: 'title' | 'content' | 'rationale' | 'full'
}

export function chunkDecision(decision: DecisionInput): DecisionChunk[] {
  const chunks: DecisionChunk[] = []

  // Always include a "full" chunk with all fields concatenated — good for
  // broad semantic search.
  const fullParts = [decision.title]
  if (decision.content) fullParts.push(decision.content)
  if (decision.reason) fullParts.push(decision.reason)
  chunks.push({ text: fullParts.join('\n\n'), type: 'full' })

  // Title as its own chunk (short but high-signal)
  chunks.push({ text: decision.title, type: 'title' })

  // Content — may be long, so run through chunkText
  if (decision.content) {
    const contentChunks = chunkText(decision.content)
    for (const c of contentChunks) {
      chunks.push({ text: c, type: 'content' })
    }
  }

  // Rationale
  if (decision.reason) {
    const rationaleChunks = chunkText(decision.reason)
    for (const c of rationaleChunks) {
      chunks.push({ text: c, type: 'rationale' })
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// 4. chunkMeeting
// ---------------------------------------------------------------------------

type Segment = {
  speaker?: string
  text: string
  start: number
  end: number
}

type MeetingChunk = {
  text: string
  speaker?: string
  startSeconds?: number
  endSeconds?: number
}

export function chunkMeeting(
  transcript: string,
  segments?: Segment[],
): MeetingChunk[] {
  // If we have speaker-segmented data, group by consecutive speaker turns and
  // re-chunk if any single turn is too long.
  if (segments && segments.length > 0) {
    return chunkBySegments(segments)
  }

  // Fallback: plain text chunking
  const textChunks = chunkText(transcript)
  return textChunks.map((text) => ({ text }))
}

function chunkBySegments(segments: Segment[]): MeetingChunk[] {
  const maxChars = 300 * CHARS_PER_TOKEN
  const results: MeetingChunk[] = []

  let currentSpeaker = segments[0].speaker
  let currentText = segments[0].text
  let currentStart = segments[0].start
  let currentEnd = segments[0].end

  const flush = () => {
    if (!currentText.trim()) return
    // If accumulated text is too long, sub-chunk it
    if (currentText.length > maxChars) {
      const sub = chunkText(currentText)
      for (const s of sub) {
        results.push({
          text: s,
          speaker: currentSpeaker,
          startSeconds: currentStart,
          endSeconds: currentEnd,
        })
      }
    } else {
      results.push({
        text: currentText.trim(),
        speaker: currentSpeaker,
        startSeconds: currentStart,
        endSeconds: currentEnd,
      })
    }
  }

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]
    if (seg.speaker === currentSpeaker) {
      // Same speaker — accumulate
      currentText += ' ' + seg.text
      currentEnd = seg.end
    } else {
      flush()
      currentSpeaker = seg.speaker
      currentText = seg.text
      currentStart = seg.start
      currentEnd = seg.end
    }
  }
  flush()

  return results
}

// ---------------------------------------------------------------------------
// 5. cosineSimilarity
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`)
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0

  return dot / denom
}

// ---------------------------------------------------------------------------
// 6. batchEmbed
// ---------------------------------------------------------------------------

export async function batchEmbed(
  texts: string[],
  batchSize = 100,
): Promise<number[][]> {
  const openai = getClient()
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    const response = await openai.embeddings.create({
      model: MODEL,
      input: batch,
    })

    // The API returns embeddings in the same order as input
    const sorted = response.data.sort((a, b) => a.index - b.index)
    for (const item of sorted) {
      results.push(item.embedding)
    }

    // Basic rate-limit courtesy: pause between batches if there are more
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return results
}
