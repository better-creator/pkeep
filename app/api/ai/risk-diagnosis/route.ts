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

interface RiskDiagnosisRequest {
  projectId: string
}

interface TopRisk {
  title: string
  severity: number
  description: string
}

interface RiskDiagnosisResult {
  overall_risk_score: number
  top_risks: TopRisk[]
  recommended_priorities: string[]
  health_summary: string
}

// ── Helpers ──────────────────────────────────────────────────

async function fetchUnresolvedConflicts(supabase: any, projectId: string) {
  try {
    const { data, error } = await supabase
      .from('conflict_records')
      .select(
        'id, new_decision_id, existing_decision_id, conflict_type, severity, reason, resolved'
      )
      .eq('project_id', projectId)
      .eq('resolved', false)
      .order('detected_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    // Table may not exist — graceful fallback
    return []
  }
}

async function fetchPendingDecisions(supabase: any, projectId: string) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('id, code, title, content, area, status, created_at')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

async function fetchAllDecisionsSummary(supabase: any, projectId: string) {
  try {
    const { data, error } = await supabase
      .from('decisions')
      .select('id, code, title, area, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

async function fetchOverdueTasks(supabase: any, projectId: string) {
  try {
    // Tasks created more than 7 days ago that are not done
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data, error } = await supabase
      .from('tasks')
      .select('id, code, title, status, assignee_name, created_at')
      .eq('project_id', projectId)
      .neq('status', 'done')
      .lt('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(30)

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

/** Fallback: compute conflicts from decisions if conflict_records table is empty */
async function computeConflictsFromDecisions(decisions: any[]) {
  const conflicts: any[] = []
  const confirmed = decisions.filter((d) => d.status === 'confirmed')
  const pending = decisions.filter((d) => d.status === 'pending')
  const changed = decisions.filter((d) => d.status === 'changed')

  // Area overlaps: pending vs confirmed in same area
  for (const p of pending) {
    for (const c of confirmed) {
      if (p.area && c.area && p.area === c.area && p.id !== c.id) {
        conflicts.push({
          new_decision_id: p.id,
          existing_decision_id: c.id,
          conflict_type: 'area_overlap',
          severity: 'high',
          reason: `같은 영역(${p.area})에 pending/confirmed 결정 공존`,
        })
      }
    }
  }

  // Direct changes
  for (const ch of changed) {
    const replacements = confirmed.filter(
      (d) =>
        d.area === ch.area &&
        new Date(d.created_at) > new Date(ch.created_at)
    )
    for (const r of replacements) {
      conflicts.push({
        new_decision_id: r.id,
        existing_decision_id: ch.id,
        conflict_type: 'temporal',
        severity: 'medium',
        reason: `변경된 결정과 대체 결정 간 충돌`,
      })
    }
  }

  return conflicts
}

// ── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: RiskDiagnosisRequest = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
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

    // Fetch all data in parallel
    const [unresolvedConflicts, pendingDecisions, allDecisions, overdueTasks] =
      await Promise.all([
        fetchUnresolvedConflicts(supabase, projectId),
        fetchPendingDecisions(supabase, projectId),
        fetchAllDecisionsSummary(supabase, projectId),
        fetchOverdueTasks(supabase, projectId),
      ])

    // Fallback: if no conflict_records, compute from decisions
    let conflicts = unresolvedConflicts
    if (conflicts.length === 0 && allDecisions.length > 0) {
      conflicts = await computeConflictsFromDecisions(allDecisions)
    }

    // Build context strings for the prompt
    const conflictSummary =
      conflicts.length > 0
        ? conflicts
            .map(
              (c: any) =>
                `- [${c.severity}] ${c.conflict_type}: ${c.reason || '사유 없음'} (결정 ${c.new_decision_id?.substring(0, 8)}... vs ${c.existing_decision_id?.substring(0, 8)}...)`
            )
            .join('\n')
        : '미해결 충돌 없음'

    const pendingSummary =
      pendingDecisions.length > 0
        ? pendingDecisions
            .map(
              (d: any) =>
                `- ${d.code} "${d.title}" (${d.area || '미지정'}, ${d.created_at})`
            )
            .join('\n')
        : '대기 중인 결정 없음'

    const overdueSummary =
      overdueTasks.length > 0
        ? overdueTasks
            .map(
              (t: any) =>
                `- ${t.code} "${t.title}" (${t.status}, 담당: ${t.assignee_name || '미배정'}, 생성: ${t.created_at})`
            )
            .join('\n')
        : '지연된 태스크 없음'

    const decisionStats = {
      total: allDecisions.length,
      confirmed: allDecisions.filter((d: any) => d.status === 'confirmed').length,
      pending: allDecisions.filter((d: any) => d.status === 'pending').length,
      changed: allDecisions.filter((d: any) => d.status === 'changed').length,
    }

    // Send to GPT-4.1-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 프로젝트 리스크 진단 전문가입니다.
프로젝트의 현재 상태를 분석하고, 위험도와 우선순위를 진단하세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "overall_risk_score": <1-100 정수, 프로젝트 전체 위험도>,
  "top_risks": [
    {
      "title": <위험 요인 제목, 한국어>,
      "severity": <1-5 정수>,
      "description": <설명, 한국어 1-2문장>
    }
  ],
  "recommended_priorities": [<우선 조치 항목들, 한국어, 중요도순>],
  "health_summary": <프로젝트 건강 상태 한국어 요약, 2-3문장>
}

점수 기준:
- 1-20: 건강한 프로젝트
- 21-40: 경미한 주의 필요
- 41-60: 적극적 관리 필요
- 61-80: 위험 수준, 즉각 조치 필요
- 81-100: 심각한 위기 상황

위험 요인 판단 시 고려:
- 미해결 충돌 수와 심각도
- 대기 중인 결정의 수와 기간
- 지연된 태스크의 수
- 결정 변경 빈도 (변경이 잦으면 방향성 불안정)
- 영역 간 충돌 패턴`,
        },
        {
          role: 'user',
          content: `## 프로젝트 결정 통계
- 전체: ${decisionStats.total}건
- 확정: ${decisionStats.confirmed}건
- 대기: ${decisionStats.pending}건
- 변경: ${decisionStats.changed}건

## 미해결 충돌 (${conflicts.length}건)
${conflictSummary}

## 대기 중인 결정 (${pendingDecisions.length}건)
${pendingSummary}

## 지연된 태스크 (${overdueTasks.length}건)
${overdueSummary}

위 데이터를 바탕으로 프로젝트 리스크를 진단하세요.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.3,
    })

    const rawResult = JSON.parse(
      completion.choices[0].message.content || '{}'
    )

    const diagnosis: RiskDiagnosisResult = {
      overall_risk_score: rawResult.overall_risk_score ?? 50,
      top_risks: (rawResult.top_risks ?? []).map((r: any) => ({
        title: r.title ?? '알 수 없는 위험',
        severity: r.severity ?? 3,
        description: r.description ?? '',
      })),
      recommended_priorities: rawResult.recommended_priorities ?? [],
      health_summary: rawResult.health_summary ?? '진단 결과를 생성하지 못했습니다.',
    }

    return NextResponse.json({
      success: true,
      diagnosis,
      metadata: {
        conflicts_count: conflicts.length,
        pending_decisions_count: pendingDecisions.length,
        overdue_tasks_count: overdueTasks.length,
        total_decisions: decisionStats.total,
      },
    })
  } catch (error: any) {
    console.error('[risk-diagnosis] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run risk diagnosis' },
      { status: 500 }
    )
  }
}
