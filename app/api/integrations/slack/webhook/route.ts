import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createContextEdge, createDecisionEdge } from '@/lib/graph'

// ─── Slack Signature Verification ────────────────────────────

function verifySlackSignature(
  signingSecret: string,
  signature: string | null,
  timestamp: string | null,
  rawBody: string
): boolean {
  if (!signature || !timestamp) return false

  // Reject requests older than 5 minutes (replay protection)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(timestamp)) > 60 * 5) return false

  const sigBasestring = `v0:${timestamp}:${rawBody}`
  const mySignature =
    'v0=' +
    crypto.createHmac('sha256', signingSecret).update(sigBasestring).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  )
}

// ─── OpenAI Analysis (same prompt as /api/analyze) ──────────

async function analyzeText(openai: OpenAI, text: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 프로젝트 의사결정 맥락 분석 AI입니다.
회의 녹취록을 분석하여 5종 맥락 요소를 구조적으로 추출합니다.

## 추출해야 할 5종 맥락 요소

1. **안건 (Issues)**: 논의된 주제/안건
2. **결정 (Decisions)**: 확정된 의사결정 + 반드시 "근거(rationale)"를 함께 추출
3. **기각된 대안 (Rejected Alternatives)**: 논의되었으나 채택되지 않은 안과 기각 사유
4. **액션아이템 (Tasks)**: 구체적인 할 일과 담당자
5. **화자 구분**: 대화 맥락에서 화자를 구분하고, 각 발언의 제안자/담당자를 추론하세요

## 중요 지침
- "결정"에는 반드시 "왜(Why)" 근거를 추출하세요. 이것이 핵심입니다.
- 대화에서 "~하지 말자", "~은 안 된다" 등의 표현은 "기각된 대안"으로 추출하세요.
- 화자가 명시되어 있지 않더라도, 대화 맥락에서 화자 전환을 추론하세요.
- 감지된 언어로 응답하세요.

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
      "proposed_by": "제안자 (추론)"
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
  "summary": "회의 전체 요약 (2-3문장)",
  "keywords": ["키워드1", "키워드2"]
}`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

// ─── Generate meeting code ──────────────────────────────────

async function generateMeetingCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<string> {
  const { count } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const nextNum = (count ?? 0) + 1
  return `MTG-${String(nextNum).padStart(3, '0')}`
}

// ─── Generate decision code ─────────────────────────────────

async function generateDecisionCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  index: number
): Promise<string> {
  const { count } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const nextNum = (count ?? 0) + index + 1
  return `DEC-${String(nextNum).padStart(3, '0')}`
}

// ─── POST Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // ── Slack URL Verification ──────────────────────────────
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // ── Verify Slack signature (optional) ───────────────────
    const signingSecret = process.env.SLACK_SIGNING_SECRET
    if (signingSecret) {
      const signature = request.headers.get('x-slack-signature')
      const timestamp = request.headers.get('x-slack-request-timestamp')

      if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // ── Only handle event_callback with message events ──────
    if (body.type !== 'event_callback') {
      return NextResponse.json({ ok: true })
    }

    const event = body.event
    if (!event || event.type !== 'message') {
      return NextResponse.json({ ok: true })
    }

    // Ignore bot messages
    if (event.bot_id) {
      return NextResponse.json({ ok: true })
    }

    // Ignore message subtypes (edits, deletes, joins, etc.)
    if (event.subtype) {
      return NextResponse.json({ ok: true })
    }

    const messageText: string = event.text ?? ''
    const slackUser: string = event.user ?? 'unknown'
    const slackChannel: string = event.channel ?? 'unknown'
    const slackTs: string = event.ts

    if (!messageText || messageText.trim().length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Reject excessively long messages to prevent abuse
    if (messageText.length > 10000) {
      return NextResponse.json(
        { error: 'Message text exceeds maximum length (10000 chars)' },
        { status: 413 }
      )
    }

    // ── Determine project from query params ─────────────────
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      )
    }

    // ── Check OpenAI API key ────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // ── Dedup: check if this channel+ts already processed ───
    const dedupKey = `slack:${slackChannel}:${slackTs}`
    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('project_id', projectId)
      .eq('title', dedupKey)
      .maybeSingle()

    if (existingMeeting) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'duplicate' })
    }

    // ── Create meeting record ───────────────────────────────
    const meetingCode = await generateMeetingCode(supabase, projectId)
    const today = new Date().toISOString().split('T')[0]

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        project_id: projectId,
        code: meetingCode,
        title: dedupKey,
        date: today,
        content: messageText,
        ai_summary: {
          source: 'slack',
          source_type: 'text',
          slack_channel: slackChannel,
          slack_user: slackUser,
          slack_ts: slackTs,
        },
      })
      .select('id')
      .single()

    if (meetingError || !meeting) {
      console.error('[slack-webhook] Failed to create meeting:', meetingError?.message)
      return NextResponse.json(
        { error: 'Failed to create meeting record' },
        { status: 500 }
      )
    }

    const meetingId = meeting.id

    // ── Run OpenAI analysis ─────────────────────────────────
    const openai = new OpenAI({ apiKey })
    const analysis = await analyzeText(openai, messageText)

    // Update meeting with analysis summary
    await supabase
      .from('meetings')
      .update({
        ai_summary: {
          source: 'slack',
          source_type: 'text',
          slack_channel: slackChannel,
          slack_user: slackUser,
          slack_ts: slackTs,
          summary: analysis.summary,
          keywords: analysis.keywords,
        },
      })
      .eq('id', meetingId)

    // ── Auto-create decisions ───────────────────────────────
    const createdDecisions: { id: string; code: string; title: string }[] = []

    for (let i = 0; i < (analysis.decisions || []).length; i++) {
      const d = analysis.decisions[i]
      const decCode = await generateDecisionCode(supabase, projectId, i)

      const { data: decision, error: decError } = await supabase
        .from('decisions')
        .insert({
          project_id: projectId,
          code: decCode,
          title: d.title,
          content: d.title,
          reason: d.rationale,
          status: 'confirmed',
          area: ['planning', 'design', 'dev'].includes(d.area) ? d.area : null,
        })
        .select('id, code, title')
        .single()

      if (decError || !decision) {
        console.error('[slack-webhook] Failed to create decision:', decError?.message)
        continue
      }

      createdDecisions.push(decision)

      // Create decision source linking to slack
      await supabase.from('decision_sources').insert({
        decision_id: decision.id,
        source_type: 'slack',
        source_id: meetingId,
      })

      // Create context edge: decision <-> meeting
      await createContextEdge({
        projectId,
        decisionId: decision.id,
        entityType: 'meeting',
        entityId: meetingId,
        relationType: 'created_from',
        metadata: { slack_channel: slackChannel, slack_ts: slackTs },
      })

      // Create context edges for keywords
      for (const kw of analysis.keywords || []) {
        await createContextEdge({
          projectId,
          decisionId: decision.id,
          entityType: 'keyword',
          entityId: kw,
          relationType: 'tagged_with',
        })
      }
    }

    // Create decision edges between related decisions in the same batch
    for (let i = 1; i < createdDecisions.length; i++) {
      await createDecisionEdge({
        projectId,
        sourceId: createdDecisions[i].id,
        targetId: createdDecisions[0].id,
        edgeType: 'related',
        reason: 'Extracted from same Slack message',
        meetingId,
      })
    }

    // ── Auto-create tasks ───────────────────────────────────
    const createdTasks: { id: string; title: string }[] = []

    for (const t of analysis.tasks || []) {
      // Find related decision by title match
      const relatedDec = createdDecisions.find(
        (d) => d.title === t.related_decision
      )

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          decision_id: relatedDec?.id ?? null,
          meeting_id: meetingId,
          title: t.title,
          assignee_name: t.assignee,
          status: 'pending',
          auto_created: true,
        })
        .select('id, title')
        .single()

      if (taskError || !task) {
        console.error('[slack-webhook] Failed to create task:', taskError?.message)
        continue
      }

      createdTasks.push(task)

      // Create context edge: decision <-> task
      if (relatedDec) {
        await createContextEdge({
          projectId,
          decisionId: relatedDec.id,
          entityType: 'task',
          entityId: task.id,
          relationType: 'produces',
        })
      }
    }

    // ── Auto-create rejected alternatives ───────────────────
    for (const ra of analysis.rejected_alternatives || []) {
      const relatedDec = createdDecisions.find(
        (d) => d.title === ra.related_decision
      )

      const { data: rejected } = await supabase
        .from('rejected_alternatives')
        .insert({
          project_id: projectId,
          decision_id: relatedDec?.id ?? null,
          meeting_id: meetingId,
          title: ra.title,
          reason: ra.reason,
          proposed_by: ra.proposed_by,
          auto_created: true,
        })
        .select('id')
        .single()

      if (rejected && relatedDec) {
        await createContextEdge({
          projectId,
          decisionId: relatedDec.id,
          entityType: 'rejected_alternative',
          entityId: rejected.id,
          relationType: 'rejected_for',
        })
      }
    }

    // ── Store external link for traceability ────────────────
    await supabase.from('external_links').insert({
      project_id: projectId,
      entity_type: 'meeting',
      entity_id: meetingId,
      platform: 'slack',
      external_id: slackTs,
      external_url: null, // Slack deep links require workspace info not available here
    })

    return NextResponse.json({
      ok: true,
      meeting_id: meetingId,
      meeting_code: meetingCode,
      decisions_created: createdDecisions.length,
      tasks_created: createdTasks.length,
      rejected_alternatives_created: (analysis.rejected_alternatives || []).length,
      summary: analysis.summary,
    })
  } catch (error) {
    console.error('[slack-webhook] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
