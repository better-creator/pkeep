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

// 5종 맥락 요소 타입 정의 (특허 청구항 1, 5, 7, 9 매핑)
interface ExtractedIssue {
  title: string
  description?: string
}

interface ExtractedDecision {
  title: string
  rationale: string           // 근거 (Why) — 킬러 피처
  area?: 'planning' | 'design' | 'dev'
  proposed_by?: string
}

interface ExtractedRejectedAlternative {
  title: string
  reason: string              // 기각 사유
  related_decision: string    // 어떤 결정과 관련된 기각인지
  proposed_by?: string
}

interface ExtractedTask {
  title: string
  assignee?: string
  related_decision?: string
}

interface ContextRelation {
  previous_decision_title: string
  relation: 'maintained' | 'changed' | 'completed' | 'conflicting'
  explanation: string
}

interface AnalysisResult {
  issues: ExtractedIssue[]
  decisions: ExtractedDecision[]
  rejected_alternatives: ExtractedRejectedAlternative[]
  tasks: ExtractedTask[]
  context_relations: ContextRelation[]  // 이전 미팅과의 관계
  summary: string
  keywords: string[]
}

// 이전 미팅 맥락 가져오기 (청구항 2, 10 — Dual KB 구조화 저장)
async function getPreviousContext(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  projectId: string,
  currentMeetingId: string
) {
  // 최근 5개 미팅의 AI 요약
  const { data: recentMeetings } = await supabase
    .from('meetings')
    .select('id, code, title, date, ai_summary')
    .eq('project_id', projectId)
    .neq('id', currentMeetingId)
    .not('ai_summary', 'is', null)
    .order('date', { ascending: false })
    .limit(5)

  // Pending 상태 결정
  const { data: pendingDecisions } = await supabase
    .from('decisions')
    .select('id, code, title, content, reason, status, area')
    .eq('project_id', projectId)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(20)

  // 미완료 태스크
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('id, title, assignee_name, status')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .limit(20)

  return { recentMeetings, pendingDecisions, pendingTasks }
}

// 이전 맥락을 시스템 프롬프트 형태로 변환
function buildPreviousContextPrompt(context: {
  recentMeetings: any[] | null
  pendingDecisions: any[] | null
  pendingTasks: any[] | null
}): string {
  let contextStr = ''

  if (context.recentMeetings && context.recentMeetings.length > 0) {
    contextStr += '\n\n## 이전 미팅 기록\n'
    for (const mtg of context.recentMeetings) {
      contextStr += `\n### ${mtg.code} - ${mtg.title} (${mtg.date})\n`
      if (mtg.ai_summary) {
        const summary = mtg.ai_summary
        if (summary.decisions) {
          contextStr += `결정사항: ${JSON.stringify(summary.decisions)}\n`
        }
        if (summary.tasks) {
          contextStr += `할 일: ${JSON.stringify(summary.tasks)}\n`
        }
      }
    }
  }

  if (context.pendingDecisions && context.pendingDecisions.length > 0) {
    contextStr += '\n\n## 현재 프로젝트의 주요 결정 사항\n'
    for (const dec of context.pendingDecisions) {
      contextStr += `- [${dec.code}] ${dec.title} (상태: ${dec.status})`
      if (dec.reason) contextStr += ` — 근거: ${dec.reason}`
      contextStr += '\n'
    }
  }

  if (context.pendingTasks && context.pendingTasks.length > 0) {
    contextStr += '\n\n## 미완료 태스크\n'
    for (const task of context.pendingTasks) {
      contextStr += `- ${task.title} (담당: ${task.assignee_name || '미지정'}, 상태: ${task.status})\n`
    }
  }

  return contextStr
}

// 5종 맥락 요소 추출 시스템 프롬프트 (특허 청구항 1, 5, 7, 9)
function buildSystemPrompt(previousContext: string, hasSpeakerLabels: boolean): string {
  return `당신은 프로젝트 의사결정 맥락 분석 AI입니다.
회의 내용을 분석하여 5종 맥락 요소를 구조적으로 추출합니다.

## 추출해야 할 5종 맥락 요소

1. **안건 (Issues)**: 논의된 주제/안건
2. **결정 (Decisions)**: 확정된 의사결정 + 반드시 "근거(rationale)"를 함께 추출
3. **기각된 대안 (Rejected Alternatives)**: 논의되었으나 채택되지 않은 안과 기각 사유
4. **액션아이템 (Tasks)**: 구체적인 할 일과 담당자
5. **이전 맥락과의 관계 (Context Relations)**: 이전 미팅 결정과의 유지/변경/완료/충돌 관계

## 중요 지침
- "결정"에는 반드시 "왜(Why)" 근거를 추출하세요. 이것이 핵심입니다.
- 대화에서 "~하지 말자", "~은 안 된다" 등의 표현은 "기각된 대안"으로 추출하세요.
- ${hasSpeakerLabels ? '화자 정보(Speaker A, B 등)가 있으면 proposed_by/assignee에 반영하세요.' : '담당자가 언급되면 assignee에 반영하세요.'}
- 이전 맥락이 제공되면, 이번 회의 내용이 이전 결정과 어떤 관계인지 반드시 분석하세요.
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
      "proposed_by": "제안자 이름 또는 Speaker 라벨"
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
  "summary": "회의 전체 요약 (2-3문장)",
  "keywords": ["키워드1", "키워드2"]
}`
}

// 자동 티켓(Decision) 생성 (특허 전체 파이프라인)
async function autoCreateTickets(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  openai: OpenAI,
  projectId: string,
  meetingId: string,
  analysis: AnalysisResult
) {
  const createdDecisions: any[] = []
  const createdTasks: any[] = []
  const createdRejected: any[] = []
  const conflicts: any[] = []

  // 다음 Decision 번호 가져오기
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

  // 각 추출된 결정에 대해 티켓 생성
  for (const decision of analysis.decisions) {
    const code = `DEC-${nextDecNum.toString().padStart(3, '0')}`
    nextDecNum++

    // 충돌 감지 — 1단계: 임베딩 유사도 (청구항 6)
    const conflictResults: any[] = []
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${decision.title}. ${decision.rationale}`,
      })
      const newEmbedding = embeddingResponse.data[0].embedding

      // DB에서 기존 결정들의 임베딩과 비교
      // (pgvector가 설정되어 있으면 DB 쿼리로 대체 가능)
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
              // 2단계: LLM 논리적 충돌 판정 (청구항 6, 11-15)
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

      // Decision INSERT
      const { data: newDecision, error } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          code,
          title: decision.title,
          content: decision.rationale,  // 근거를 content에 저장
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
        console.error(`Failed to create decision ${code}:`, error)
        continue
      }

      // Decision Source 연결
      await supabase.from('decision_sources').insert({
        decision_id: newDecision.id,
        source_type: 'meeting',
        source_id: meetingId,
      })

      createdDecisions.push({
        ...newDecision,
        conflicts: conflictResults,
      })

      if (conflictResults.length > 0) {
        conflicts.push({
          decision: newDecision,
          conflicts: conflictResults,
        })
      }
    } catch (embError) {
      console.error('Embedding/conflict check error:', embError)

      // 임베딩 실패해도 Decision은 생성
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

  // 기각된 대안 저장
  for (const rejected of analysis.rejected_alternatives) {
    const relatedDecision = createdDecisions.find(
      d => d.title === rejected.related_decision
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

    if (!error && data) createdRejected.push(data)
  }

  // 태스크 저장
  for (const task of analysis.tasks) {
    const relatedDecision = createdDecisions.find(
      d => d.title === task.related_decision
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

    if (!error && data) createdTasks.push(data)
  }

  // 맥락 관계 처리 (이전 결정 변경/완료 처리)
  for (const relation of analysis.context_relations) {
    if (relation.relation === 'changed' || relation.relation === 'completed') {
      // 이전 결정 찾기
      const { data: prevDecision } = await supabase
        .from('decisions')
        .select('id')
        .eq('project_id', projectId)
        .ilike('title', `%${relation.previous_decision_title}%`)
        .limit(1)
        .single()

      if (prevDecision) {
        const newStatus = relation.relation === 'completed' ? 'confirmed' : 'changed'
        await supabase
          .from('decisions')
          .update({
            status: newStatus,
            changed_at: new Date().toISOString(),
          })
          .eq('id', prevDecision.id)
      }
    }
  }

  return { createdDecisions, createdTasks, createdRejected, conflicts }
}

// 2단계 LLM 논리적 충돌 판정 (특허 청구항 6, 11-15)
async function checkLogicalConflict(
  openai: OpenAI,
  newTitle: string,
  newRationale: string,
  existingTitle: string,
  existingRationale: string
): Promise<{ isConflict: boolean; reason: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
          content: `## 새 결정
제목: ${newTitle}
근거: ${newRationale}

## 기존 결정
제목: ${existingTitle}
근거: ${existingRationale}

이 두 결정이 논리적으로 충돌합니까?`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      isConflict: result.isConflict === true,
      reason: result.reason || '',
    }
  } catch {
    return { isConflict: false, reason: 'LLM 충돌 판정 실패' }
  }
}

// 코사인 유사도
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// POST /api/meetings/[meetingId]/analyze
// 5종 맥락 추출 + 자동 티켓 생성 + 충돌 감지
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const supabase = await createClient()
  const { meetingId } = await params

  // 요청 바디에서 옵션 받기
  let options: { speaker_map?: Record<string, string> } = {}
  try {
    options = await request.json()
  } catch {
    // body가 없어도 OK
  }

  // 미팅 정보 가져오기
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (!meeting.content && !meeting.transcript) {
    return NextResponse.json(
      { error: 'Meeting has no content or transcript to analyze' },
      { status: 400 }
    )
  }

  try {
    const openai = getOpenAIClient()

    // 화자 매핑 적용
    if (options.speaker_map) {
      await supabase
        .from('meetings')
        .update({ speaker_map: options.speaker_map })
        .eq('id', meetingId)
    }

    // 분석할 텍스트 준비 (화자 분리 트랜스크립트 우선)
    let contentToAnalyze = meeting.content || ''
    const hasSpeakerLabels = !!meeting.transcript?.segments

    if (meeting.transcript?.segments) {
      const speakerMap = options.speaker_map || meeting.speaker_map || {}
      contentToAnalyze = meeting.transcript.segments
        .map((seg: any) => {
          const speakerName = speakerMap[seg.speaker] || seg.speaker
          return `[${speakerName}] ${seg.text}`
        })
        .join('\n')
    }

    // 이전 맥락 가져오기 (특허 청구항 2, 10)
    const previousContext = await getPreviousContext(supabase, meeting.project_id, meetingId)
    const contextPrompt = buildPreviousContextPrompt(previousContext)

    // GPT-4o로 5종 맥락 추출 (특허 청구항 1, 5, 7, 9)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(contextPrompt, hasSpeakerLabels),
        },
        {
          role: 'user',
          content: contentToAnalyze,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })

    const analysis: AnalysisResult = JSON.parse(
      completion.choices[0].message.content || '{}'
    )

    // 자동 티켓 생성 + 충돌 감지 (특허 전체 파이프라인)
    const ticketResults = await autoCreateTickets(
      supabase, openai, meeting.project_id, meetingId, analysis
    )

    // AI 요약을 미팅에 저장 (하위호환)
    const aiSummary = {
      // 기존 형식 호환
      decisions: analysis.decisions.map(d => d.title),
      todos: analysis.tasks.map(t => ({
        task: t.title,
        assignee: t.assignee || null,
      })),
      keywords: analysis.keywords,
      // 확장 형식 (5종 맥락)
      full_analysis: analysis,
    }

    await supabase
      .from('meetings')
      .update({ ai_summary: aiSummary })
      .eq('id', meetingId)

    return NextResponse.json({
      success: true,
      meeting_id: meetingId,
      analysis,
      auto_created: {
        decisions: ticketResults.createdDecisions,
        tasks: ticketResults.createdTasks,
        rejected_alternatives: ticketResults.createdRejected,
      },
      conflicts: ticketResults.conflicts,
      summary: analysis.summary,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
