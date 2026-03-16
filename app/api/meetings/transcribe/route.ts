import { NextRequest, NextResponse } from 'next/server'

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2'

interface TranscriptSegment {
  speaker: string
  text: string
  start: number
  end: number
}

// Step 1: Upload audio to AssemblyAI
async function uploadAudio(audioBuffer: Buffer, apiKey: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(audioBuffer),
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error('[transcribe] AssemblyAI upload error:', errBody)
    throw new Error(`Upload failed: ${errBody}`)
  }
  const data = await res.json()
  return data.upload_url
}

// Step 2: Request transcription with speaker diarization
async function requestTranscription(audioUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-2'],
      speaker_labels: true,
      language_detection: true,
    }),
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error('[transcribe] AssemblyAI request error:', errBody)
    throw new Error(`Transcription request failed: ${errBody}`)
  }
  const data = await res.json()
  return data.id
}

// Step 3: Poll for result
async function pollTranscription(transcriptId: string, apiKey: string) {
  const maxAttempts = 120 // 10 minutes max (5s * 120)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: { 'Authorization': apiKey },
    })
    if (!res.ok) throw new Error(`Poll failed: ${res.statusText}`)

    const data = await res.json()

    if (data.status === 'completed') {
      const segments: TranscriptSegment[] = []
      const speakers = new Set<string>()

      if (data.utterances) {
        for (const u of data.utterances) {
          const label = `Speaker ${u.speaker}`
          speakers.add(label)
          segments.push({
            speaker: label,
            text: u.text,
            start: u.start / 1000,
            end: u.end / 1000,
          })
        }
      }

      return {
        text: data.text || '',
        segments,
        speakers: Array.from(speakers),
        duration_seconds: Math.round(data.audio_duration || 0),
        language: data.language_code || 'unknown',
      }
    }

    if (data.status === 'error') {
      throw new Error(`Transcription failed: ${data.error}`)
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  throw new Error('Transcription timed out')
}

// POST /api/meetings/transcribe
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const meetingId = formData.get('meetingId') as string | null

    if (!audioFile) {
      return NextResponse.json({ error: 'audio file is required' }, { status: 400 })
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) {
      // Mock fallback
      console.log('[transcribe] ASSEMBLYAI_API_KEY not set — using mock')
      await new Promise(resolve => setTimeout(resolve, 1500))
      return NextResponse.json({
        success: true,
        meetingId,
        transcription: {
          text: '화자 A: 오늘 회의 시작하겠습니다.\n화자 B: 네, 준비됐습니다.',
          segments: [
            { speaker: 'Speaker A', text: '오늘 회의 시작하겠습니다.', start: 0, end: 3 },
            { speaker: 'Speaker B', text: '네, 준비됐습니다.', start: 4, end: 6 },
          ],
          speakers: ['Speaker A', 'Speaker B'],
          duration_seconds: 6,
          language: 'ko',
        },
      })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    const uploadUrl = await uploadAudio(audioBuffer, apiKey)
    const transcriptId = await requestTranscription(uploadUrl, apiKey)
    const result = await pollTranscription(transcriptId, apiKey)

    return NextResponse.json({
      success: true,
      meetingId,
      transcription: {
        text: result.text,
        segments: result.segments,
        speakers: result.speakers,
        duration_seconds: result.duration_seconds,
        language: result.language,
      },
    })
  } catch (error) {
    console.error('Transcription error:', error)
    const message = error instanceof Error ? error.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
