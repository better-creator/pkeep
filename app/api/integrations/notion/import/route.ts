import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { createContextEdge, createDecisionEdge, recordConflict } from '@/lib/graph'
import { chunkDecision, batchEmbed, cosineSimilarity } from '@/lib/embeddings'

// ─── Notion block types we extract text from ────────────────
const TEXT_BLOCK_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'quote',
  'callout',
])

const NOTION_API_VERSION = '2022-06-28'

// ─── Helpers ────────────────────────────────────────────────

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

/** Extract plain-text from a Notion rich_text array. */
function richTextToPlain(richTexts: any[]): string {
  if (!Array.isArray(richTexts)) return ''
  return richTexts.map((rt: any) => rt.plain_text ?? '').join('')
}

/** Pull text content out of a single Notion block. */
function extractBlockText(block: any): string {
  const type = block.type
  if (!TEXT_BLOCK_TYPES.has(type)) return ''

  const data = block[type]
  if (!data) return ''

  let text = richTextToPlain(data.rich_text ?? [])

  // Heading prefixes for readability
  if (type === 'heading_1') text = `# ${text}`
  else if (type === 'heading_2') text = `## ${text}`
  else if (type === 'heading_3') text = `### ${text}`
  else if (type === 'to_do') {
    const checked = data.checked ? '[x]' : '[ ]'
    text = `${checked} ${text}`
  } else if (type === 'bulleted_list_item') text = `- ${text}`
  else if (type === 'numbered_list_item') text = `1. ${text}`
  else if (type === 'quote') text = `> ${text}`
  else if (type === 'callout') {
    const icon = data.icon?.emoji ?? ''
    text = `${icon} ${text}`.trim()
  }

  return text
}

/** Extract page title from Notion page properties. */
function extractPageTitle(pageData: any): string {
  const props = pageData.properties ?? {}
  // Title property can have various names; iterate to find the 'title' type
  for (const key of Object.keys(props)) {
    const prop = props[key]
    if (prop.type === 'title' && Array.isArray(prop.title)) {
      return richTextToPlain(prop.title)
    }
  }
  return 'Untitled'
}

// ─── LLM conflict check ────────────────────────────────────

async function checkLogicalConflict(
  openai: OpenAI,
  newTitle: string,
  newRationale: string,
  existingTitle: string,
  existingRationale: string
): Promise<{ isConflict: boolean; reason: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 프로젝트 의사결정 충돌 감지 전문가입니다.
두 결정이 논리적으로 충돌하는지 판단하세요.

"충돌"이란:
- 두 결정이 서로 모순되거나 양립 불가능한 경우
- 한 결정이 다른 결정의 전제를 부정하는 경우
- 동일 주제에 대해 상반된 방향을 제시하는 경우

단순히 관련이 있는 것은 충돌이 아닙니다.

JSON으로 응답:
{ "isConflict": true/false, "reason": "판단 근거" }`,
        },
        {
          role: 'user',
          content: `## 새 결정\n제목: ${newTitle}\n근거: ${newRationale}\n\n## 기존 결정\n제목: ${existingTitle}\n근거: ${existingRationale}\n\n이 두 결정이 논리적으로 충돌합니까?`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return { isConflict: result.isConflict === true, reason: result.reason || '' }
  } catch {
    return { isConflict: false, reason: 'LLM 충돌 판정 실패' }
  }
}

// ─── Analysis system prompt ─────────────────────────────────

function buildSystemPrompt(previousContext: string): string {
  return `당신은 프로젝트 의사결정 맥락 분석 AI입니다.
Notion 페이지 내용을 분석하여 5종 맥락 요소를 구조적으로 추출합니다.

## 추출해야 할 5종 맥락 요소

1. **안건 (Issues)**: 논의된 주제/안건
2. **결정 (Decisions)**: 확정된 의사결정 + 반드시 "근거(rationale)"를 함께 추출
3. **기각된 대안 (Rejected Alternatives)**: 논의되었으나 채택되지 않은 안과 기각 사유
4. **액션아이템 (Tasks)**: 구체적인 할 일과 담당자
5. **이전 맥락과의 관계 (Context Relations)**: 이전 결정과의 유지/변경/완료/충돌 관계

## 중요 지침
- "결정"에는 반드시 "왜(Why)" 근거를 추출하세요. 이것이 핵심입니다.
- "~하지 말자", "~은 안 된다" 등의 표현은 "기각된 대안"으로 추출하세요.
- 담당자가 언급되면 assignee에 반영하세요.
- 이전 맥락이 제공되면, 이번 내용이 이전 결정과 어떤 관계인지 반드시 분석하세요.
- 한국어로 응답하세요.
${previousContext ? `\n## 이전 프로젝트 맥락 (분석 시 참고)\n${previousContext}` : ''}

## 응답 JSON 형식
{
  "issues": [
    { "title": "안건 제목", "description": "안건 설명" }
  ],
  "decisions": [
    {
      "title": "결정 내용",
      "rationale": "이 결정을 내린 근거/이유 (Why)",
      "area": "planning|design|dev",
      "proposed_by": "제안자"
    }
  ],
  "rejected_alternatives": [
    {
      "title": "기각된 대안",
      "reason": "기각 사유",
      "related_decision": "관련 결정 제목",
      "proposed_by": "제안자"
    }
  ],
  "tasks": [
    {
      "title": "할 일",
      "assignee": "담당자",
      "related_decision": "관련 결정 제목"
    }
  ],
  "context_relations": [
    {
      "previous_decision_title": "이전 결정 제목",
      "relation": "maintained|changed|completed|conflicting",
      "explanation": "관계 설명"
    }
  ],
  "summary": "전체 요약 (2-3문장)",
  "keywords": ["키워드1", "키워드2"]
}`
}

// ─── Previous context (same pattern as meeting analyze) ─────

async function getPreviousContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  const { data: pendingDecisions } = await supabase
    .from('decisions')
    .select('id, code, title, content, reason, status, area')
    .eq('project_id', projectId)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('id, title, assignee_name, status')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .limit(20)

  let contextStr = ''

  if (pendingDecisions && pendingDecisions.length > 0) {
    contextStr += '\n\n## 현재 프로젝트의 주요 결정 사항\n'
    for (const dec of pendingDecisions) {
      contextStr += `- [${dec.code}] ${dec.title} (상태: ${dec.status})`
      if (dec.reason) contextStr += ` — 근거: ${dec.reason}`
      contextStr += '\n'
    }
  }

  if (pendingTasks && pendingTasks.length > 0) {
    contextStr += '\n\n## 미완료 태스크\n'
    for (const task of pendingTasks) {
      contextStr += `- ${task.title} (담당: ${task.assignee_name || '미지정'}, 상태: ${task.status})\n`
    }
  }

  return contextStr
}

// ─── Auto-create decisions/tasks (mirrors meeting analyze) ──

async function autoCreateTickets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  openai: OpenAI,
  projectId: string,
  meetingId: string,
  analysis: any
) {
  const createdDecisions: any[] = []
  const createdTasks: any[] = []
  const createdRejected: any[] = []
  const conflicts: any[] = []

  // Next decision number
  const { data: existingDecisions } = await supabase
    .from('decisions')
    .select('code')
    .eq('project_id', projectId)
    .order('code', { ascending: false })
    .limit(1)

  let nextDecNum = 1
  if (existingDecisions && existingDecisions.length > 0) {
    const match = existingDecisions[0].code.match(/DEC-(\d+)/)
    if (match) nextDecNum = parseInt(match[1]) + 1
  }

  // Create decisions
  for (const decision of (analysis.decisions ?? [])) {
    const code = `DEC-${nextDecNum.toString().padStart(3, '0')}`
    nextDecNum++

    const conflictResults: any[] = []
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${decision.title}. ${decision.rationale}`,
      })
      const newEmbedding = embeddingResponse.data[0].embedding

      const { data: existingDecs } = await supabase
        .from('decisions')
        .select('id, code, title, content, reason, status, embedding')
        .eq('project_id', projectId)
        .not('embedding', 'is', null)
        .limit(50)

      if (existingDecs) {
        for (const existing of existingDecs) {
          if (existing.embedding) {
            const similarity = cosineSimilarity(newEmbedding, existing.embedding)
            if (similarity >= 0.75) {
              const conflictCheck = await checkLogicalConflict(
                openai,
                decision.title,
                decision.rationale,
                existing.title,
                existing.reason || existing.content || ''
              )
              if (conflictCheck.isConflict) {
                conflictResults.push({
                  existing_code: existing.code,
                  existing_title: existing.title,
                  similarity: Math.round(similarity * 100) / 100,
                  conflict_reason: conflictCheck.reason,
                })
              }
            }
          }
        }
      }

      const { data: newDecision, error } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          code,
          title: decision.title,
          content: decision.rationale,
          reason: decision.rationale,
          area: decision.area || 'planning',
          status: conflictResults.length > 0 ? 'pending' : 'confirmed',
          auto_created: true,
          source_meeting_id: meetingId,
          embedding: newEmbedding,
        })
        .select()
        .single()

      if (error) {
        console.error(`[notion-import] Failed to create decision ${code}:`, error)
        continue
      }

      await supabase.from('decision_sources').insert({
        decision_id: newDecision.id,
        source_type: 'meeting',
        source_id: meetingId,
      })

      // Graph KB: meeting -> decision
      await createContextEdge({
        projectId,
        decisionId: newDecision.id,
        entityType: 'meeting',
        entityId: meetingId,
        relationType: 'created_from',
      })

      // Chunk + embed (non-fatal)
      try {
        const chunks = chunkDecision({
          title: decision.title,
          content: decision.rationale,
          reason: decision.rationale,
        })
        const texts = chunks.map((c: any) => c.text)
        const embeddings = await batchEmbed(texts)
        for (let ci = 0; ci < chunks.length; ci++) {
          try {
            await supabase.from('decision_chunks').insert({
              decision_id: newDecision.id,
              chunk_index: ci,
              chunk_text: chunks[ci].text,
              chunk_type: chunks[ci].type,
              embedding: embeddings[ci] || null,
              token_count: Math.ceil(chunks[ci].text.length / 4),
            })
          } catch { /* non-fatal */ }
        }
      } catch (chunkErr) {
        console.error('[notion-import] Chunk creation failed (non-fatal):', chunkErr)
      }

      createdDecisions.push({ ...newDecision, conflicts: conflictResults })

      // Conflict edges
      if (conflictResults.length > 0) {
        for (const cr of conflictResults) {
          const existingDec = existingDecs?.find((d: any) => d.code === cr.existing_code)
          if (existingDec) {
            await createDecisionEdge({
              projectId,
              sourceId: newDecision.id,
              targetId: existingDec.id,
              edgeType: 'conflicts',
              reason: cr.conflict_reason,
              meetingId,
              confidence: cr.similarity,
            })
            await recordConflict({
              projectId,
              newDecisionId: newDecision.id,
              existingDecisionId: existingDec.id,
              conflictType: 'logical',
              severity: cr.similarity >= 0.85 ? 'high' : 'medium',
              similarityScore: cr.similarity,
              reason: cr.conflict_reason,
            })
          }
        }
        conflicts.push({ decision: newDecision, conflicts: conflictResults })
      }
    } catch (embError) {
      console.error('[notion-import] Embedding/conflict error:', embError)

      // Fallback: create decision without embedding
      const { data: newDecision, error } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          code,
          title: decision.title,
          content: decision.rationale,
          reason: decision.rationale,
          area: decision.area || 'planning',
          status: 'confirmed',
          auto_created: true,
          source_meeting_id: meetingId,
        })
        .select()
        .single()

      if (!error && newDecision) {
        await supabase.from('decision_sources').insert({
          decision_id: newDecision.id,
          source_type: 'meeting',
          source_id: meetingId,
        })
        createdDecisions.push(newDecision)
      }
    }
  }

  // Rejected alternatives
  for (const rejected of (analysis.rejected_alternatives ?? [])) {
    const relatedDecision = createdDecisions.find(
      (d: any) => d.title === rejected.related_decision
    )
    const { data, error } = await supabase
      .from('rejected_alternatives')
      .insert({
        project_id: projectId,
        decision_id: relatedDecision?.id || null,
        meeting_id: meetingId,
        title: rejected.title,
        description: rejected.reason,
        rejection_reason: rejected.reason,
        proposed_by: rejected.proposed_by,
        auto_created: true,
      })
      .select()
      .single()

    if (!error && data) {
      createdRejected.push(data)
      if (relatedDecision) {
        await createContextEdge({
          projectId,
          decisionId: relatedDecision.id,
          entityType: 'rejected_alternative',
          entityId: data.id,
          relationType: 'rejected_for',
        })
      }
    }
  }

  // Tasks
  for (const task of (analysis.tasks ?? [])) {
    const relatedDecision = createdDecisions.find(
      (d: any) => d.title === task.related_decision
    )
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        decision_id: relatedDecision?.id || null,
        meeting_id: meetingId,
        title: task.title,
        assignee_name: task.assignee,
        auto_created: true,
      })
      .select()
      .single()

    if (!error && data) {
      createdTasks.push(data)
      if (relatedDecision) {
        await createContextEdge({
          projectId,
          decisionId: relatedDecision.id,
          entityType: 'task',
          entityId: data.id,
          relationType: 'produces',
        })
      }
    }
  }

  // Context relations (update previous decisions)
  for (const relation of (analysis.context_relations ?? [])) {
    if (relation.relation === 'changed' || relation.relation === 'completed') {
      const { data: prevDecision } = await supabase
        .from('decisions')
        .select('id')
        .eq('project_id', projectId)
        .ilike('title', `%${relation.previous_decision_title}%`)
        .limit(1)
        .maybeSingle()

      if (prevDecision) {
        const newStatus = relation.relation === 'completed' ? 'confirmed' : 'changed'
        await supabase
          .from('decisions')
          .update({ status: newStatus, changed_at: new Date().toISOString() })
          .eq('id', prevDecision.id)

        const relatedNew = createdDecisions.find((d: any) =>
          d.title?.toLowerCase().includes(
            relation.previous_decision_title?.toLowerCase()?.slice(0, 20)
          )
        )
        if (relatedNew) {
          await createDecisionEdge({
            projectId,
            sourceId: relatedNew.id,
            targetId: prevDecision.id,
            edgeType: relation.relation === 'changed' ? 'changed_from' : 'related',
            reason: relation.explanation,
            meetingId,
          })
        }
      }
    }
  }

  return { createdDecisions, createdTasks, createdRejected, conflicts }
}

// ─── POST /api/integrations/notion/import ───────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, projectId, notionToken } = body

    if (!pageId || !projectId) {
      return NextResponse.json(
        { error: 'pageId and projectId are required' },
        { status: 400 }
      )
    }

    // Resolve Notion token
    const token = notionToken || process.env.NOTION_API_KEY
    if (!token) {
      return NextResponse.json(
        { error: 'Notion API token is required. Provide notionToken in body or set NOTION_API_KEY env var.' },
        { status: 401 }
      )
    }

    const notionHeaders = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json',
    }

    // ── 1. Fetch page metadata ──────────────────────────────
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'GET',
      headers: notionHeaders,
    })

    if (pageRes.status === 404) {
      return NextResponse.json(
        { error: 'Notion page not found' },
        { status: 404 }
      )
    }

    if (!pageRes.ok) {
      const errBody = await pageRes.text()
      console.error('[notion-import] Page fetch failed:', pageRes.status, errBody)
      return NextResponse.json(
        { error: `Notion API error: ${pageRes.status}` },
        { status: pageRes.status }
      )
    }

    const pageData = await pageRes.json()
    const pageTitle = extractPageTitle(pageData)

    // ── 2. Fetch page blocks (content) ──────────────────────
    const blocksRes = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
      { method: 'GET', headers: notionHeaders }
    )

    if (!blocksRes.ok) {
      const errBody = await blocksRes.text()
      console.error('[notion-import] Blocks fetch failed:', blocksRes.status, errBody)
      return NextResponse.json(
        { error: `Failed to fetch Notion page content: ${blocksRes.status}` },
        { status: 500 }
      )
    }

    const blocksData = await blocksRes.json()
    const blocks: any[] = blocksData.results ?? []

    // Extract text from all supported blocks
    const textLines: string[] = []
    for (const block of blocks) {
      const text = extractBlockText(block)
      if (text) textLines.push(text)
    }

    const fullText = textLines.join('\n')

    // ── 3. Handle empty page ────────────────────────────────
    if (!fullText.trim()) {
      return NextResponse.json({
        success: true,
        meetingId: null,
        analysis: { decisions: 0, tasks: 0, issues: 0 },
        message: 'Page has no extractable text content',
      })
    }

    // ── 4. Store as meeting in Supabase ─────────────────────
    const supabase = await createClient()

    // Generate next meeting code
    const { data: existingMeetings } = await supabase
      .from('meetings')
      .select('code')
      .eq('project_id', projectId)
      .order('code', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (existingMeetings && existingMeetings.length > 0) {
      const match = existingMeetings[0].code.match(/MTG-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const meetingCode = `MTG-${nextNum.toString().padStart(3, '0')}`

    const sourceUrl = `https://notion.so/${pageId.replace(/-/g, '')}`

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        project_id: projectId,
        code: meetingCode,
        title: pageTitle,
        date: new Date().toISOString().split('T')[0],
        content: fullText,
        source: 'text',
        source_type: 'notion',
        source_url: sourceUrl,
      })
      .select()
      .single()

    if (meetingError || !meeting) {
      console.error('[notion-import] Meeting insert failed:', meetingError)
      return NextResponse.json(
        { error: 'Failed to store Notion content' },
        { status: 500 }
      )
    }

    // ── 5. Run GPT-4.1-mini analysis ────────────────────────
    const openai = getOpenAIClient()

    const previousContext = await getPreviousContext(supabase, projectId)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(previousContext) },
        { role: 'user', content: fullText },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    // ── 6. Auto-create decisions/tasks + graph edges ────────
    const ticketResults = await autoCreateTickets(
      supabase,
      openai,
      projectId,
      meeting.id,
      analysis
    )

    // ── 7. Save AI summary back to meeting ──────────────────
    const aiSummary = {
      decisions: (analysis.decisions ?? []).map((d: any) => d.title),
      todos: (analysis.tasks ?? []).map((t: any) => ({
        task: t.title,
        assignee: t.assignee || null,
      })),
      keywords: analysis.keywords ?? [],
      full_analysis: analysis,
    }

    await supabase
      .from('meetings')
      .update({ ai_summary: aiSummary })
      .eq('id', meeting.id)

    // ── 8. Return results ───────────────────────────────────
    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
      analysis: {
        decisions: ticketResults.createdDecisions.length,
        tasks: ticketResults.createdTasks.length,
        issues: (analysis.issues ?? []).length,
      },
    })
  } catch (error) {
    console.error('[notion-import] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Notion import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
