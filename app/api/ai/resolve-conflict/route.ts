import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OpenAI 클라이언트를 동적으로 가져오기
async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const { default: OpenAI } = await import('openai')
    return new OpenAI({ apiKey })
  } catch {
    return null
  }
}

// ── Types ────────────────────────────────────────────────────

interface ResolveConflictRequest {
  projectId: string
  newDecisionId: string
  existingDecisionId: string
  conflictType: 'semantic' | 'logical' | 'temporal' | 'area_overlap'
}

interface ConflictRecommendation {
  risk_level: number
  action: 'keep_existing' | 'adopt_new' | 'merge' | 'defer' | 'escalate'
  reasoning: string
  merge_suggestion?: string
  affected_items: string[]
  questions: string[]
}

// ── Helpers ──────────────────────────────────────────────────

async function fetchDecision(supabase: any, decisionId: string) {
  const { data, error } = await supabase
    .from('decisions')
    .select('id, code, title, content, reason, area, status, proposed_by, meeting_id, created_at')
    .eq('id', decisionId)
    .maybeSingle()

  if (error) throw new Error(`Decision ${decisionId} lookup failed: ${error.message}`)
  if (!data) throw new Error(`Decision ${decisionId} not found`)
  return data
}

async function fetchMeeting(supabase: any, meetingId: string | null) {
  if (!meetingId) return null
  const { data } = await supabase
    .from('meetings')
    .select('id, title, summary, date')
    .eq('id', meetingId)
    .maybeSingle()
  return data ?? null
}

async function fetchRelatedEdges(supabase: any, decisionId: string) {
  try {
    const { data, error } = await supabase
      .from('decision_edges')
      .select('source_id, target_id, edge_type, reason')
      .or(`source_id.eq.${decisionId},target_id.eq.${decisionId}`)
      .limit(10)

    if (error) return []
    return data ?? []
  } catch {
    // Table may not exist yet — graceful fallback
    return []
  }
}

async function fetchRelatedDecisionsSummary(supabase: any, edgeIds: string[]) {
  if (edgeIds.length === 0) return []
  try {
    const { data } = await supabase
      .from('decisions')
      .select('id, code, title, status')
      .in('id', edgeIds)
      .limit(10)
    return data ?? []
  } catch {
    return []
  }
}

async function fetchDependentTasks(supabase: any, decisionIds: string[]) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, code, title, status, decision_id')
      .in('decision_id', decisionIds)
      .limit(20)

    if (error) return []
    return data ?? []
  } catch {
    // tasks table may not have decision_id column yet
    return []
  }
}

async function fetchAffectedScreens(supabase: any, decisionIds: string[]) {
  try {
    const { data } = await supabase
      .from('context_edges')
      .select('entity_id, entity_type, relation_type')
      .in('decision_id', decisionIds)
      .in('entity_type', ['screen', 'feature', 'task'])
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

// ── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: ResolveConflictRequest = await request.json()
    const { projectId, newDecisionId, existingDecisionId, conflictType } = body

    if (!projectId || !newDecisionId || !existingDecisionId) {
      return NextResponse.json(
        { error: 'projectId, newDecisionId, existingDecisionId are required' },
        { status: 400 }
      )
    }

    const openai = await getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    // 1. Fetch both decisions
    const [newDecision, existingDecision] = await Promise.all([
      fetchDecision(supabase, newDecisionId),
      fetchDecision(supabase, existingDecisionId),
    ])

    // 2. Fetch source meetings
    const [newMeeting, existingMeeting] = await Promise.all([
      fetchMeeting(supabase, newDecision.meeting_id),
      fetchMeeting(supabase, existingDecision.meeting_id),
    ])

    // 3. Fetch related edges for broader context
    const [newEdges, existingEdges] = await Promise.all([
      fetchRelatedEdges(supabase, newDecisionId),
      fetchRelatedEdges(supabase, existingDecisionId),
    ])

    // Collect unique related decision IDs (excluding the two main ones)
    const relatedIds = new Set<string>()
    for (const edge of [...newEdges, ...existingEdges]) {
      if (edge.source_id !== newDecisionId && edge.source_id !== existingDecisionId) {
        relatedIds.add(edge.source_id)
      }
      if (edge.target_id !== newDecisionId && edge.target_id !== existingDecisionId) {
        relatedIds.add(edge.target_id)
      }
    }
    const relatedDecisions = await fetchRelatedDecisionsSummary(
      supabase,
      Array.from(relatedIds)
    )

    // 4. Fetch dependent tasks & affected screens
    const bothIds = [newDecisionId, existingDecisionId]
    const [dependentTasks, affectedContextEdges] = await Promise.all([
      fetchDependentTasks(supabase, bothIds),
      fetchAffectedScreens(supabase, bothIds),
    ])

    // Build context strings
    const formatDecision = (d: any, meeting: any) => {
      const lines = [
        `코드: ${d.code}`,
        `제목: ${d.title}`,
        `내용: ${d.content || '없음'}`,
        `근거: ${d.reason || '없음'}`,
        `영역: ${d.area || '미지정'}`,
        `상태: ${d.status}`,
        `제안자: ${d.proposed_by || '미상'}`,
        `생성일: ${d.created_at}`,
      ]
      if (meeting) {
        lines.push(`출처 회의: ${meeting.title} (${meeting.date})`)
        if (meeting.summary) lines.push(`회의 요약: ${meeting.summary}`)
      }
      return lines.join('\n')
    }

    const relatedContext =
      relatedDecisions.length > 0
        ? relatedDecisions
            .map((d: any) => `- ${d.code} "${d.title}" (${d.status})`)
            .join('\n')
        : '없음'

    const taskContext =
      dependentTasks.length > 0
        ? dependentTasks
            .map((t: any) => `- ${t.code} "${t.title}" (${t.status})`)
            .join('\n')
        : '없음'

    const screenContext =
      affectedContextEdges.length > 0
        ? affectedContextEdges
            .map((e: any) => `- [${e.entity_type}] ${e.entity_id} (${e.relation_type})`)
            .join('\n')
        : '없음'

    // 5. Send to GPT-4.1-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 프로젝트 의사결정 충돌 해결 전문가입니다.
두 결정 간의 충돌을 분석하고, 최적의 해결 방안을 제안하세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "risk_level": <1-5 정수, 미해결 시 위험도>,
  "action": <"keep_existing" | "adopt_new" | "merge" | "defer" | "escalate">,
  "reasoning": <한국어 2-3문장, 왜 이 추천인지>,
  "merge_suggestion": <action이 "merge"일 때만, 두 결정을 어떻게 결합할지 한국어 설명. 아닐 경우 null>,
  "affected_items": <영향받는 태스크/화면 코드 배열>,
  "questions": <팀이 결정 전 논의해야 할 질문 1-2개, 한국어>
}

판단 기준:
- keep_existing: 기존 결정이 더 근거가 탄탄하거나, 이미 많은 작업이 진행된 경우
- adopt_new: 새 결정이 더 합리적이고, 전환 비용이 낮은 경우
- merge: 두 결정의 장점을 결합할 수 있는 경우
- defer: 정보가 부족하여 판단을 보류해야 하는 경우
- escalate: 팀 전체 또는 리더의 판단이 필요한 중대한 분기점인 경우`,
        },
        {
          role: 'user',
          content: `## 충돌 유형
${conflictType}

## 새 결정
${formatDecision(newDecision, newMeeting)}

## 기존 결정
${formatDecision(existingDecision, existingMeeting)}

## 관련 결정 (그래프 엣지)
${relatedContext}

## 의존 태스크
${taskContext}

## 영향받는 화면/기능
${screenContext}

이 충돌의 위험도를 평가하고, 최적의 해결 방안을 제안하세요.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3,
    })

    const rawResult = JSON.parse(
      completion.choices[0].message.content || '{}'
    )

    const recommendation: ConflictRecommendation = {
      risk_level: rawResult.risk_level ?? 3,
      action: rawResult.action ?? 'defer',
      reasoning: rawResult.reasoning ?? '분석 결과를 생성하지 못했습니다.',
      merge_suggestion: rawResult.merge_suggestion ?? undefined,
      affected_items: rawResult.affected_items ?? [],
      questions: rawResult.questions ?? [],
    }

    return NextResponse.json({
      success: true,
      recommendation,
    })
  } catch (error: any) {
    console.error('[resolve-conflict] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resolve conflict' },
      { status: 500 }
    )
  }
}
