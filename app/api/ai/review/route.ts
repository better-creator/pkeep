import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Mock fallback
      return NextResponse.json({
        review: '현재 프로젝트에 대한 AI 리뷰를 생성하려면 OPENAI_API_KEY 설정이 필요합니다. 환경변수를 확인해주세요.',
      })
    }

    const { meetings, decisions, tasks, rejected } = await request.json()

    const context = `
## 미팅 (${meetings?.length || 0}건)
${(meetings || []).map((m: any) => `- ${m.code}: ${m.title} (${m.date}) — ${m.summary || '요약 없음'}`).join('\n') || '없음'}

## 결정 (${decisions?.length || 0}건)
${(decisions || []).map((d: any) => `- ${d.code} [${d.status}] ${d.title} — 근거: ${d.rationale || '없음'}`).join('\n') || '없음'}

## 할 일 (${tasks?.length || 0}건, 완료 ${(tasks || []).filter((t: any) => t.done).length}건)
${(tasks || []).map((t: any) => `- ${t.done ? '✅' : '⬜'} ${t.title} ${t.assignee ? `(${t.assignee})` : ''}`).join('\n') || '없음'}

## 기각된 대안 (${rejected?.length || 0}건)
${(rejected || []).map((r: any) => `- ${r.title} — 사유: ${r.reason}`).join('\n') || '없음'}
`.trim()

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 PKEEP의 AI 프로젝트 어드바이저입니다.
프로젝트의 현재 상태를 분석하고 간결한 리뷰를 제공하세요.

## 리뷰 포맷
1. **현재 상태** — 프로젝트가 어디쯤 와 있는지 한 문장
2. **주의 사항** — 충돌, 변경된 결정, 밀린 태스크 등 (있으면)
3. **제안** — 다음에 할 것 한 가지

## 규칙
- 한국어로 답변
- 3~5문장으로 간결하게
- 구체적인 코드(DEC-001, MTG-002 등)를 반드시 언급
- 친근하지만 전문적인 톤 (반말 아닌 존댓말)`,
        },
        {
          role: 'user',
          content: `이 프로젝트의 현재 상태를 리뷰해주세요.\n\n${context}`,
        },
      ],
      max_tokens: 500,
    })

    return NextResponse.json({
      review: completion.choices[0].message.content || '',
    })
  } catch (error) {
    console.error('AI review error:', error)
    const message = error instanceof Error ? error.message : 'Review failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
