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

// 코사인 유사도 계산
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// 키워드 기반 유사도 계산 (폴백)
function keywordSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1)

  const words1 = new Set(normalize(text1))
  const words2 = new Set(normalize(text2))
  if (words1.size === 0 || words2.size === 0) return 0

  let intersection = 0
  words1.forEach(word => { if (words2.has(word)) intersection++ })
  const union = words1.size + words2.size - intersection
  return intersection / union
}

export interface ConflictResult {
  id: string
  code: string
  title: string
  description: string
  similarity: number
  status: string
  // 2단계 LLM 논리적 충돌 판정 결과
  logical_conflict?: {
    is_conflict: boolean
    reason: string
  }
  meeting?: {
    id: string
    title: string
    date: string
  }
  participants: string[]
}

export interface CheckConflictResponse {
  hasConflict: boolean
  conflicts: ConflictResult[]
}

// 2단계: LLM 논리적 충돌 판정 (특허 청구항 6, 11-15)
async function checkLogicalConflict(
  openai: any,
  newTitle: string,
  newDescription: string | undefined,
  existingTitle: string,
  existingDescription: string
): Promise<{ is_conflict: boolean; reason: string }> {
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

단순히 주제가 관련된 것은 충돌이 아닙니다.
같은 방향의 결정도 충돌이 아닙니다.

JSON으로 응답:
{ "is_conflict": true/false, "reason": "판단 근거 (한국어, 1-2문장)" }`,
        },
        {
          role: 'user',
          content: `## 새 결정
제목: ${newTitle}
설명: ${newDescription || '없음'}

## 기존 결정
제목: ${existingTitle}
설명: ${existingDescription}

이 두 결정이 논리적으로 충돌합니까?`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    return JSON.parse(completion.choices[0].message.content || '{"is_conflict":false,"reason":""}')
  } catch {
    return { is_conflict: false, reason: 'LLM 판정 실패' }
  }
}

// Mock 기존 결정 데이터 (DB 연동 전 폴백)
const mockExistingDecisions = [
  {
    id: 'dec-001', code: 'DEC-001', title: 'Next.js 14 사용',
    description: '더 나은 성능과 개발자 경험을 위한 프론트엔드 프레임워크 결정',
    keywords: ['nextjs', 'next', '프레임워크', '프론트엔드', 'react'],
    status: 'confirmed', date: '2024-01-15',
    meeting: { id: 'mtg-001', title: '프로젝트 킥오프', date: '2024-01-14' },
    participants: ['김철수', '박지민', '이영희'],
  },
  {
    id: 'dec-002', code: 'DEC-002', title: '다크 테마 기본 설정',
    description: '애플리케이션의 기본 색상 스키마를 다크 테마로 설정',
    keywords: ['다크', '테마', '색상', '기본', 'dark', 'theme'],
    status: 'confirmed', date: '2024-01-16',
    meeting: { id: 'mtg-001', title: '프로젝트 킥오프', date: '2024-01-14' },
    participants: ['이영희', '김철수'],
  },
  {
    id: 'dec-003', code: 'DEC-003', title: '소셜 로그인 우선',
    description: '카카오, 구글 소셜 로그인을 먼저 구현하고 이메일 로그인은 나중에',
    keywords: ['소셜', '로그인', '카카오', '구글', 'oauth', '인증'],
    status: 'confirmed', date: '2024-01-15',
    meeting: { id: 'mtg-001', title: '프로젝트 킥오프', date: '2024-01-14' },
    participants: ['박지민', '김철수'],
  },
  {
    id: 'dec-004', code: 'DEC-004', title: '타임라인 뷰로 변경',
    description: '칸반 보드 대신 타임라인 뷰로 변경하여 컨텍스트 흐름을 개선',
    keywords: ['타임라인', '뷰', '칸반', '보드', 'timeline', 'view'],
    status: 'changed', date: '2024-01-18',
    meeting: { id: 'mtg-002', title: 'UI/UX 리뷰', date: '2024-01-17' },
    participants: ['이영희', '김철수', '박지민'],
  },
  {
    id: 'dec-012', code: 'DEC-012', title: '오렌지 컬러 사용 제한',
    description: '브랜드 톤앤매너 통일 위해 오렌지는 CTA에만 제한적 사용',
    keywords: ['오렌지', '컬러', '색상', '브랜드', 'orange', 'color', 'cta'],
    status: 'confirmed', date: '2024-11-15',
    meeting: { id: 'mtg-008', title: '브랜드 가이드 싱크', date: '2024-11-15' },
    participants: ['민주', '디자이너 김OO'],
  },
  {
    id: 'dec-015', code: 'DEC-015', title: '칸반 보드 사용 안 함',
    description: '타임라인 뷰가 더 적합하므로 칸반 보드 기능은 구현하지 않기로 결정',
    keywords: ['칸반', '보드', 'kanban', 'board', '타임라인'],
    status: 'confirmed', date: '2024-01-20',
    meeting: { id: 'mtg-002', title: 'UI/UX 리뷰', date: '2024-01-17' },
    participants: ['이영희', '김철수'],
  },
]

// 임베딩 캐시
const embeddingCache = new Map<string, number[]>()

async function getEmbedding(text: string, openai: any): Promise<number[]> {
  const cacheKey = text.substring(0, 100)
  if (embeddingCache.has(cacheKey)) return embeddingCache.get(cacheKey)!

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  const embedding = response.data[0].embedding
  embeddingCache.set(cacheKey, embedding)
  return embedding
}

// 키워드 기반 충돌 검색 (폴백)
function findConflictsWithKeywords(
  newTitle: string,
  newDescription: string | undefined,
  threshold: number
): ConflictResult[] {
  const newText = `${newTitle} ${newDescription || ''}`.toLowerCase()
  const conflicts: ConflictResult[] = []

  for (const decision of mockExistingDecisions) {
    const keywordMatches = decision.keywords.filter(kw =>
      newText.includes(kw.toLowerCase())
    ).length

    const existingText = `${decision.title} ${decision.description}`
    const textSimilarity = keywordSimilarity(newText, existingText)
    const keywordScore = Math.min(keywordMatches / 3, 1) * 0.5
    const similarity = keywordScore + textSimilarity * 0.5
    const adjustedThreshold = threshold * 0.4

    if (similarity >= adjustedThreshold || keywordMatches >= 2) {
      conflicts.push({
        id: decision.id,
        code: decision.code,
        title: decision.title,
        description: decision.description,
        similarity: Math.min(Math.round(similarity * 100) / 100 + 0.3, 0.95),
        status: decision.status,
        meeting: decision.meeting,
        participants: decision.participants,
      })
    }
  }

  return conflicts
}

// POST /api/decisions/check-conflict
// 3단계 충돌감지: 1차 유사도 → 2차 LLM 논리 판정 → 3차 사용자 분기
export async function POST(request: NextRequest): Promise<NextResponse<CheckConflictResponse | { error: string }>> {
  try {
    const body = await request.json()
    const { title, description, threshold = 0.75, projectId } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const openai = await getOpenAIClient()
    let conflicts: ConflictResult[] = []

    // === 1단계: 벡터 유사도 검색 (특허 청구항 6) ===
    if (openai) {
      try {
        const newDecisionText = `${title}${description ? `. ${description}` : ''}`
        const newEmbedding = await getEmbedding(newDecisionText, openai)

        // DB에서 기존 결정 조회 시도, 실패하면 mock 사용
        let decisionsToCheck = mockExistingDecisions

        if (projectId) {
          try {
            const supabase = await createClient()
            const { data: dbDecisions } = await supabase
              .from('decisions')
              .select('id, code, title, content, reason, status, embedding')
              .eq('project_id', projectId)
              .limit(50)

            if (dbDecisions && dbDecisions.length > 0) {
              // DB 결정이 있으면 사용
              for (const dec of dbDecisions) {
                let similarity = 0

                if (dec.embedding) {
                  similarity = cosineSimilarity(newEmbedding, dec.embedding)
                } else {
                  // 임베딩 없는 결정은 실시간 생성
                  const existingText = `${dec.title}. ${dec.content || dec.reason || ''}`
                  const existingEmbedding = await getEmbedding(existingText, openai)
                  similarity = cosineSimilarity(newEmbedding, existingEmbedding)
                }

                if (similarity >= threshold) {
                  // === 2단계: LLM 논리적 충돌 판정 (특허 청구항 6, 11-15) ===
                  const logicalCheck = await checkLogicalConflict(
                    openai, title, description,
                    dec.title, dec.content || dec.reason || ''
                  )

                  conflicts.push({
                    id: dec.id,
                    code: dec.code,
                    title: dec.title,
                    description: dec.content || dec.reason || '',
                    similarity: Math.round(similarity * 100) / 100,
                    status: dec.status,
                    logical_conflict: logicalCheck,
                    participants: [],
                  })
                }
              }

              // DB에서 찾았으면 mock은 스킵
              decisionsToCheck = []
            }
          } catch {
            // DB 조회 실패하면 mock으로 폴백
          }
        }

        // Mock 데이터로 충돌 검색 (DB가 없는 경우)
        for (const decision of decisionsToCheck) {
          const existingText = `${decision.title}. ${decision.description}`
          const existingEmbedding = await getEmbedding(existingText, openai)
          const similarity = cosineSimilarity(newEmbedding, existingEmbedding)

          if (similarity >= threshold) {
            // === 2단계: LLM 논리적 충돌 판정 ===
            const logicalCheck = await checkLogicalConflict(
              openai, title, description,
              decision.title, decision.description
            )

            conflicts.push({
              id: decision.id,
              code: decision.code,
              title: decision.title,
              description: decision.description,
              similarity: Math.round(similarity * 100) / 100,
              status: decision.status,
              logical_conflict: logicalCheck,
              meeting: decision.meeting,
              participants: decision.participants,
            })
          }
        }
      } catch (embeddingError) {
        console.error('Embedding error, falling back to keyword search:', embeddingError)
        conflicts = findConflictsWithKeywords(title, description, threshold)
      }
    } else {
      // OpenAI 없으면 키워드 기반
      console.log('OpenAI not configured, using keyword-based search')
      conflicts = findConflictsWithKeywords(title, description, threshold)
    }

    // 유사도 높은 순 정렬
    conflicts.sort((a, b) => b.similarity - a.similarity)

    // 상위 5개만
    const topConflicts = conflicts.slice(0, 5)

    // 3단계: 사용자 분기 (UI에서 처리 — 취소/검토/무시)
    return NextResponse.json({
      hasConflict: topConflicts.some(c => c.logical_conflict?.is_conflict !== false),
      conflicts: topConflicts,
    })
  } catch (error) {
    console.error('Conflict check error:', error)
    return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 })
  }
}
