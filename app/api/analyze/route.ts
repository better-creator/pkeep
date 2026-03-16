import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// POST /api/analyze
// 텍스트를 직접 받아 5종 맥락 요소 추출 (Supabase 불필요)
export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })

    const langHint = language === 'ko' ? '한국어' : language === 'en' ? '영어' : '감지된 언어'

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
- ${langHint}로 응답하세요.

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

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    // 자동 코드 부여
    const decisions = (analysis.decisions || []).map((d: any, i: number) => ({
      id: `dec-${i + 1}`,
      code: `DEC-${String(i + 1).padStart(3, '0')}`,
      title: d.title,
      reason: d.rationale,
      status: 'confirmed',
      area: d.area,
      proposed_by: d.proposed_by,
    }))

    const tasks = (analysis.tasks || []).map((t: any, i: number) => ({
      id: `task-${i + 1}`,
      title: t.title,
      assignee: t.assignee,
      related_decision: t.related_decision,
    }))

    return NextResponse.json({
      success: true,
      analysis,
      auto_created: {
        decisions,
        tasks,
        rejected_alternatives: analysis.rejected_alternatives || [],
      },
      conflicts: [],
      summary: analysis.summary || '',
    })
  } catch (error) {
    console.error('Analysis error:', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
