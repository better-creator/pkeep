import { NextRequest, NextResponse } from 'next/server'

// OpenAI 클라이언트를 동적으로 가져오기
async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  try {
    const { default: OpenAI } = await import('openai')
    return new OpenAI({ apiKey })
  } catch {
    return null
  }
}

// 코사인 유사도 계산
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// 키워드 기반 유사도 계산 (OpenAI 없을 때 폴백)
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
  words1.forEach(word => {
    if (words2.has(word)) intersection++
  })

  // Jaccard 유사도
  const union = words1.size + words2.size - intersection
  return intersection / union
}

// Mock 기존 결정 데이터 (실제로는 DB에서 가져옴)
const mockExistingDecisions = [
  {
    id: 'dec-001',
    code: 'DEC-001',
    title: 'Next.js 14 사용',
    description: '더 나은 성능과 개발자 경험을 위한 프론트엔드 프레임워크 결정',
    keywords: ['nextjs', 'next', '프레임워크', '프론트엔드', 'react'],
    status: 'confirmed',
    date: '2024-01-15',
    meeting: {
      id: 'mtg-001',
      title: '프로젝트 킥오프',
      date: '2024-01-14',
    },
    participants: ['김철수', '박지민', '이영희'],
  },
  {
    id: 'dec-002',
    code: 'DEC-002',
    title: '다크 테마 기본 설정',
    description: '애플리케이션의 기본 색상 스키마를 다크 테마로 설정',
    keywords: ['다크', '테마', '색상', '기본', 'dark', 'theme'],
    status: 'confirmed',
    date: '2024-01-16',
    meeting: {
      id: 'mtg-001',
      title: '프로젝트 킥오프',
      date: '2024-01-14',
    },
    participants: ['이영희', '김철수'],
  },
  {
    id: 'dec-003',
    code: 'DEC-003',
    title: '소셜 로그인 우선',
    description: '카카오, 구글 소셜 로그인을 먼저 구현하고 이메일 로그인은 나중에',
    keywords: ['소셜', '로그인', '카카오', '구글', 'oauth', '인증'],
    status: 'confirmed',
    date: '2024-01-15',
    meeting: {
      id: 'mtg-001',
      title: '프로젝트 킥오프',
      date: '2024-01-14',
    },
    participants: ['박지민', '김철수'],
  },
  {
    id: 'dec-004',
    code: 'DEC-004',
    title: '타임라인 뷰로 변경',
    description: '칸반 보드 대신 타임라인 뷰로 변경하여 컨텍스트 흐름을 개선',
    keywords: ['타임라인', '뷰', '칸반', '보드', 'timeline', 'view'],
    status: 'changed',
    date: '2024-01-18',
    meeting: {
      id: 'mtg-002',
      title: 'UI/UX 리뷰',
      date: '2024-01-17',
    },
    participants: ['이영희', '김철수', '박지민'],
  },
  {
    id: 'dec-012',
    code: 'DEC-012',
    title: '오렌지 컬러 사용 제한',
    description: '브랜드 톤앤매너 통일 위해 오렌지는 CTA에만 제한적 사용',
    keywords: ['오렌지', '컬러', '색상', '브랜드', 'orange', 'color', 'cta'],
    status: 'confirmed',
    date: '2024-11-15',
    meeting: {
      id: 'mtg-008',
      title: '브랜드 가이드 싱크',
      date: '2024-11-15',
    },
    participants: ['민주', '디자이너 김OO'],
  },
  {
    id: 'dec-015',
    code: 'DEC-015',
    title: '칸반 보드 사용 안 함',
    description: '타임라인 뷰가 더 적합하므로 칸반 보드 기능은 구현하지 않기로 결정',
    keywords: ['칸반', '보드', 'kanban', 'board', '타임라인'],
    status: 'confirmed',
    date: '2024-01-20',
    meeting: {
      id: 'mtg-002',
      title: 'UI/UX 리뷰',
      date: '2024-01-17',
    },
    participants: ['이영희', '김철수'],
  },
]

// 임베딩 캐시 (실제로는 DB에 저장)
const embeddingCache = new Map<string, number[]>()

async function getEmbedding(text: string, openai: any): Promise<number[]> {
  // 캐시 확인
  const cacheKey = text.substring(0, 100)
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!
  }

  // OpenAI API 호출
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  const embedding = response.data[0].embedding
  embeddingCache.set(cacheKey, embedding)
  return embedding
}

export interface ConflictResult {
  id: string
  code: string
  title: string
  description: string
  similarity: number
  status: string
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

// 키워드 기반 충돌 검색 (OpenAI 없을 때 폴백)
function findConflictsWithKeywords(
  newTitle: string,
  newDescription: string | undefined,
  threshold: number
): ConflictResult[] {
  const newText = `${newTitle} ${newDescription || ''}`.toLowerCase()
  const conflicts: ConflictResult[] = []

  for (const decision of mockExistingDecisions) {
    // 키워드 매칭 체크
    const keywordMatches = decision.keywords.filter(kw =>
      newText.includes(kw.toLowerCase())
    ).length

    // 제목/설명 키워드 유사도
    const existingText = `${decision.title} ${decision.description}`
    const textSimilarity = keywordSimilarity(newText, existingText)

    // 키워드 매칭 점수 (최대 0.5) + 텍스트 유사도 (최대 0.5)
    const keywordScore = Math.min(keywordMatches / 3, 1) * 0.5
    const similarity = keywordScore + textSimilarity * 0.5

    // 조정된 임계값 (키워드 기반은 더 낮은 임계값 사용)
    const adjustedThreshold = threshold * 0.4

    if (similarity >= adjustedThreshold || keywordMatches >= 2) {
      conflicts.push({
        id: decision.id,
        code: decision.code,
        title: decision.title,
        description: decision.description,
        similarity: Math.min(Math.round(similarity * 100) / 100 + 0.3, 0.95), // 보정된 유사도
        status: decision.status,
        meeting: decision.meeting,
        participants: decision.participants,
      })
    }
  }

  return conflicts
}

// POST /api/decisions/check-conflict - Check for similar decisions
export async function POST(request: NextRequest): Promise<NextResponse<CheckConflictResponse | { error: string }>> {
  try {
    const body = await request.json()
    const { title, description, threshold = 0.75 } = body

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    const openai = await getOpenAIClient()
    let conflicts: ConflictResult[] = []

    // OpenAI 사용 가능하면 임베딩 기반 검색
    if (openai) {
      try {
        // 새 결정 텍스트 결합
        const newDecisionText = `${title}${description ? `. ${description}` : ''}`

        // 새 결정 임베딩 생성
        const newEmbedding = await getEmbedding(newDecisionText, openai)

        // 기존 결정들과 유사도 비교
        for (const decision of mockExistingDecisions) {
          const existingText = `${decision.title}. ${decision.description}`
          const existingEmbedding = await getEmbedding(existingText, openai)

          const similarity = cosineSimilarity(newEmbedding, existingEmbedding)

          if (similarity >= threshold) {
            conflicts.push({
              id: decision.id,
              code: decision.code,
              title: decision.title,
              description: decision.description,
              similarity: Math.round(similarity * 100) / 100,
              status: decision.status,
              meeting: decision.meeting,
              participants: decision.participants,
            })
          }
        }
      } catch (embeddingError) {
        console.error('Embedding error, falling back to keyword search:', embeddingError)
        // 임베딩 실패 시 키워드 기반으로 폴백
        conflicts = findConflictsWithKeywords(title, description, threshold)
      }
    } else {
      // OpenAI 없으면 키워드 기반 검색
      console.log('OpenAI not configured, using keyword-based search')
      conflicts = findConflictsWithKeywords(title, description, threshold)
    }

    // 유사도 높은 순으로 정렬
    conflicts.sort((a, b) => b.similarity - a.similarity)

    // 상위 5개만 반환
    const topConflicts = conflicts.slice(0, 5)

    return NextResponse.json({
      hasConflict: topConflicts.length > 0,
      conflicts: topConflicts,
    })
  } catch (error) {
    console.error('Conflict check error:', error)
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}
