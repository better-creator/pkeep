import { NextRequest, NextResponse } from 'next/server'

// Mock 기각된 안건 데이터 (실제로는 DB에서 가져옴)
const mockRejectedAlternatives = [
  {
    id: 'rej-001',
    title: 'Remix 프레임워크 사용',
    description: 'Remix로 마이그레이션 제안',
    rejectionReason: '이미 Next.js 14로 진행 중. Supabase 호환성 및 서버 컴포넌트 활용 위해 Next.js 유지하기로 함',
    proposedBy: '김개발',
    rejectedAt: '2024-01-20',
    keywords: ['remix', 'framework', '마이그레이션', 'next.js', 'react'],
    meetingId: '7',
    meeting: { id: '7', code: 'MTG-001', title: '프로젝트 킥오프' },
  },
  {
    id: 'rej-002',
    title: '카페24 기본 컬러칩 외 바리에이션',
    description: '패턴 컬러칩, 그라데이션 컬러칩 추가 제안',
    rejectionReason: '카페24 인풋 제약으로 구현 어려움. 추가 개발 공수 대비 효용 낮음',
    proposedBy: '박디자인',
    rejectedAt: '2024-02-15',
    keywords: ['컬러칩', '카페24', 'UI', '디자인', '그라데이션', '패턴'],
    meetingId: '3',
    meeting: { id: '3', code: 'MTG-002', title: 'UI/UX 리뷰' },
  },
  {
    id: 'rej-003',
    title: '이메일/비밀번호 로그인 우선 구현',
    description: '전통적인 이메일 로그인을 먼저 구현하자는 의견',
    rejectionReason: '최근 사용자 트렌드는 소셜 로그인 선호. 초기 진입 장벽을 낮추기 위해 소셜 로그인 우선 구현',
    proposedBy: '최기획',
    rejectedAt: '2024-01-15',
    keywords: ['로그인', '이메일', '인증', '회원가입', 'password', 'email'],
    meetingId: '7',
    meeting: { id: '7', code: 'MTG-001', title: '프로젝트 킥오프' },
  },
  {
    id: 'rej-004',
    title: '칸반 보드 유지',
    description: '기존 칸반 보드 UI를 유지하고 개선하자는 의견',
    rejectionReason: '칸반은 상태 중심 뷰라 맥락 흐름 파악이 어려움. 타임라인 뷰가 결정-구현-화면 연결 관계를 더 잘 보여줌',
    proposedBy: '이영희',
    rejectedAt: '2024-01-17',
    keywords: ['칸반', 'kanban', 'UI', '타임라인', 'board', '보드'],
    meetingId: '3',
    meeting: { id: '3', code: 'MTG-002', title: 'UI/UX 리뷰' },
  },
]

// 간단한 키워드 기반 유사도 계산
function calculateSimilarity(input: string, rejected: typeof mockRejectedAlternatives[0]): number {
  const inputLower = input.toLowerCase()
  const inputWords = inputLower.split(/\s+/).filter(w => w.length > 1)

  // 키워드 매칭
  const keywords = rejected.keywords || []
  let matchCount = 0

  for (const keyword of keywords) {
    if (inputLower.includes(keyword.toLowerCase())) {
      matchCount += 2 // 키워드 직접 매칭은 가중치 높게
    }
  }

  // 제목 단어 매칭
  const titleWords = rejected.title.toLowerCase().split(/\s+/)
  for (const word of inputWords) {
    if (titleWords.some(tw => tw.includes(word) || word.includes(tw))) {
      matchCount += 1
    }
  }

  // 설명 단어 매칭
  const descWords = (rejected.description || '').toLowerCase().split(/\s+/)
  for (const word of inputWords) {
    if (descWords.some(dw => dw.includes(word) || word.includes(dw))) {
      matchCount += 0.5
    }
  }

  // 유사도 점수 계산 (0-100)
  const maxPossibleScore = keywords.length * 2 + inputWords.length * 1.5
  const similarity = Math.min(100, Math.round((matchCount / Math.max(maxPossibleScore, 1)) * 100))

  return similarity
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const inputText = `${title} ${description || ''}`

    // 각 기각된 안건과의 유사도 계산
    const results = mockRejectedAlternatives.map(rejected => ({
      rejected,
      similarity: calculateSimilarity(inputText, rejected),
    }))

    // 가장 유사한 항목 찾기
    const sorted = results.sort((a, b) => b.similarity - a.similarity)
    const topMatch = sorted[0]

    // 70% 이상 유사도면 충돌로 판단
    if (topMatch && topMatch.similarity >= 70) {
      return NextResponse.json({
        hasConflict: true,
        similarity: topMatch.similarity,
        rejectedAlternative: topMatch.rejected,
      })
    }

    // 50% 이상이면 경고 수준
    if (topMatch && topMatch.similarity >= 50) {
      return NextResponse.json({
        hasConflict: false,
        similarity: topMatch.similarity,
        rejectedAlternative: topMatch.rejected,
        warning: true,
      })
    }

    return NextResponse.json({
      hasConflict: false,
      similarity: topMatch?.similarity || 0,
    })
  } catch (error) {
    console.error('Error checking conflict:', error)
    return NextResponse.json(
      { error: 'Failed to check conflict' },
      { status: 500 }
    )
  }
}
