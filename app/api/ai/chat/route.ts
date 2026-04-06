import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

// ── Types ────────────────────────────────────────────────────

interface DecisionChunkResult {
  chunk_id: string
  decision_id: string
  decision_code: string
  decision_title: string
  decision_status: string
  chunk_text: string
  chunk_type: string
  similarity: number
}

interface MeetingChunkResult {
  chunk_id: string
  meeting_id: string
  meeting_code: string
  meeting_title: string
  chunk_text: string
  speaker: string | null
  similarity: number
}

interface DecisionEdge {
  id: string
  source_id: string
  target_id: string
  edge_type: string
  confidence: number
  reason: string | null
}

// ── Embedding helper ─────────────────────────────────────────

async function createEmbedding(
  openai: OpenAI,
  text: string,
): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}

// ── Semantic search (with fallback) ──────────────────────────

async function semanticSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  embedding: number[],
  projectId: string,
) {
  // Try RPC-based semantic search first
  const [decisionRes, meetingRes] = await Promise.all([
    supabase.rpc('match_decision_chunks', {
      query_embedding: embedding,
      match_count: 8,
      project_filter: projectId,
      similarity_threshold: 0.6,
    }),
    supabase.rpc('match_meeting_chunks', {
      query_embedding: embedding,
      match_count: 5,
      project_filter: projectId,
      similarity_threshold: 0.6,
    }),
  ])

  const rpcWorked =
    !decisionRes.error && !meetingRes.error

  if (rpcWorked) {
    return {
      decisionChunks: (decisionRes.data ?? []) as DecisionChunkResult[],
      meetingChunks: (meetingRes.data ?? []) as MeetingChunkResult[],
      mode: 'semantic' as const,
    }
  }

  // ── Fallback: plain SQL (tables may not exist yet) ─────────
  console.warn(
    'Semantic search RPC unavailable — falling back to recent items.',
    decisionRes.error?.message,
    meetingRes.error?.message,
  )
  return null // caller will use fallback
}

async function fallbackSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
) {
  const [{ data: decisions }, { data: meetings }] = await Promise.all([
    supabase
      .from('decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('meetings')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(10),
  ])
  return {
    decisions: decisions ?? [],
    meetings: meetings ?? [],
  }
}

// ── Graph context ────────────────────────────────────────────

async function fetchGraphContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  decisionIds: string[],
): Promise<{ edges: DecisionEdge[]; relatedDecisions: Record<string, string> }> {
  if (decisionIds.length === 0) {
    return { edges: [], relatedDecisions: {} }
  }

  try {
    const { data: edges, error } = await supabase
      .from('decision_edges')
      .select('id, source_id, target_id, edge_type, confidence, reason')
      .or(
        decisionIds
          .map((id) => `source_id.eq.${id},target_id.eq.${id}`)
          .join(','),
      )

    if (error) {
      // Table may not exist yet — that's OK
      console.warn('decision_edges query failed (table may not exist):', error.message)
      return { edges: [], relatedDecisions: {} }
    }

    // Collect IDs of related decisions we haven't fetched yet
    const relatedIds = new Set<string>()
    for (const e of edges ?? []) {
      if (!decisionIds.includes(e.source_id)) relatedIds.add(e.source_id)
      if (!decisionIds.includes(e.target_id)) relatedIds.add(e.target_id)
    }

    let relatedDecisions: Record<string, string> = {}
    if (relatedIds.size > 0) {
      const { data: related } = await supabase
        .from('decisions')
        .select('id, code, title')
        .in('id', Array.from(relatedIds))

      if (related) {
        for (const r of related as { id: string; code: string; title: string }[]) {
          relatedDecisions[r.id] = `${r.code}: ${r.title}`
        }
      }
    }

    return { edges: (edges ?? []) as DecisionEdge[], relatedDecisions }
  } catch {
    return { edges: [], relatedDecisions: {} }
  }
}

// ── Context builders ─────────────────────────────────────────

function buildSemanticContext(
  project: { name: string; description?: string },
  decisionChunks: DecisionChunkResult[],
  meetingChunks: MeetingChunkResult[],
  graphEdges: DecisionEdge[],
  relatedDecisions: Record<string, string>,
): string {
  const decisionSection =
    decisionChunks.length > 0
      ? decisionChunks
          .map(
            (c) =>
              `[sim=${c.similarity.toFixed(3)}] ${c.decision_code}: ${c.decision_title} [${c.decision_status}] (${c.chunk_type})\n  ${c.chunk_text}`,
          )
          .join('\n')
      : 'No semantically relevant decisions found.'

  const meetingSection =
    meetingChunks.length > 0
      ? meetingChunks
          .map(
            (c) =>
              `[sim=${c.similarity.toFixed(3)}] ${c.meeting_code}: ${c.meeting_title}${c.speaker ? ` (${c.speaker})` : ''}\n  ${c.chunk_text}`,
          )
          .join('\n')
      : 'No semantically relevant meeting notes found.'

  let graphSection = ''
  if (graphEdges.length > 0) {
    // Build a lookup from IDs already in chunks
    const idToCode: Record<string, string> = {}
    for (const c of decisionChunks) {
      idToCode[c.decision_id] = c.decision_code
    }
    for (const [id, label] of Object.entries(relatedDecisions)) {
      idToCode[id] = label
    }

    graphSection = `\n## Decision Relationships (Graph)\n${graphEdges
      .map((e) => {
        const src = idToCode[e.source_id] ?? e.source_id.slice(0, 8)
        const tgt = idToCode[e.target_id] ?? e.target_id.slice(0, 8)
        return `- ${src} --[${e.edge_type}${e.confidence < 1 ? ` (conf ${e.confidence})` : ''}]--> ${tgt}${e.reason ? ` — ${e.reason}` : ''}`
      })
      .join('\n')}`
  }

  return `# Project: ${project.name}
${project.description || ''}

## Relevant Decision Chunks (ranked by similarity)
${decisionSection}

## Relevant Meeting Chunks (ranked by similarity)
${meetingSection}
${graphSection}`
}

function buildFallbackContext(
  project: { name: string; description?: string },
  decisions: Record<string, unknown>[],
  meetings: Record<string, unknown>[],
): string {
  return `# Project: ${project.name}
${project.description || ''}

## Recent Decisions (${decisions.length})
${
  decisions
    .map(
      (d: any) =>
        `- ${d.code}: ${d.title} [${d.status}] (${d.area})\n  ${d.content || ''}${d.reason ? `\n  Reason: ${d.reason}` : ''}`,
    )
    .join('\n') || 'No decisions'
}

## Recent Meetings (${meetings.length})
${
  meetings
    .map(
      (m: any) =>
        `- ${m.code}: ${m.title} (${m.date})\n  ${m.content ? m.content.substring(0, 500) + '...' : ''}`,
    )
    .join('\n') || 'No meetings'
}`
}

// ── POST handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { project_id, query } = body

  if (!project_id || !query) {
    return NextResponse.json(
      { error: 'project_id and query are required' },
      { status: 400 },
    )
  }

  // 1. Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    const openai = getOpenAIClient()

    // 2. Create embedding of the query
    const embedding = await createEmbedding(openai, query)

    // 3. Semantic search (with fallback)
    const semanticResult = await semanticSearch(supabase, embedding, project_id)

    let context: string
    let sourcesUsed: { decisions: string[]; meetings: string[] }
    let searchMode: 'semantic' | 'fallback'

    if (semanticResult) {
      // ── Semantic path ──────────────────────────────────────
      searchMode = 'semantic'
      const { decisionChunks, meetingChunks } = semanticResult

      // De-duplicate decision IDs for graph lookup
      const uniqueDecisionIds = Array.from(
        new Set(decisionChunks.map((c) => c.decision_id)),
      )

      // 6. Fetch graph context for matched decisions
      const { edges, relatedDecisions } = await fetchGraphContext(
        supabase,
        uniqueDecisionIds,
      )

      // 5. Build enriched context
      context = buildSemanticContext(
        project,
        decisionChunks,
        meetingChunks,
        edges,
        relatedDecisions,
      )

      sourcesUsed = {
        decisions: Array.from(new Set(decisionChunks.map((c) => c.decision_code))),
        meetings: Array.from(new Set(meetingChunks.map((c) => c.meeting_code))),
      }
    } else {
      // ── Fallback path ──────────────────────────────────────
      searchMode = 'fallback'
      const { decisions, meetings } = await fallbackSearch(supabase, project_id)

      context = buildFallbackContext(project, decisions, meetings)

      sourcesUsed = {
        decisions: decisions.map((d: any) => d.code as string),
        meetings: meetings.map((m: any) => m.code as string),
      }
    }

    // 7. Send to GPT-4o-mini
    const systemPrompt =
      searchMode === 'semantic'
        ? `You are a project advisor AI with access to semantically retrieved context from the project's knowledge base.
The context below is RANKED by relevance — items with higher similarity scores (closer to 1.0) are more relevant to the user's question. Prioritise those.
Relationship edges (if present) show how decisions relate to each other — use them to explain lineage, dependencies, and conflicts.
Always reference specific codes (like DEC-001, MTG-002) when discussing items.
Respond in the same language as the user's query.

${context}`
        : `You are a project advisor AI. You have access to the following project context and can answer questions about it.
Help users understand their project decisions, suggest improvements, identify conflicts, and provide insights.
Always reference specific codes (like DEC-001, SCR-002, MTG-001) when discussing items from the context.
Respond in the same language as the user's query.

${context}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
    })

    const response = completion.choices[0].message.content

    // 8. Log to ai_queries table
    try {
      await supabase.from('ai_queries').insert({
        project_id,
        query,
        context: {
          search_mode: searchMode,
          decisions_count: sourcesUsed.decisions.length,
          meetings_count: sourcesUsed.meetings.length,
        },
        response,
      })
    } catch {
      // Logging failure should not break the response
    }

    return NextResponse.json({
      response,
      sources_used: sourcesUsed,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 },
    )
  }
}
