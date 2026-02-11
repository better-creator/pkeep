import { NextRequest, NextResponse } from 'next/server'

// Mock 데이터
const mockRejectedAlternatives = [
  {
    id: 'rej-001',
    projectId: 'project-1',
    decisionId: '6',
    meetingId: '7',
    title: 'Remix 프레임워크 사용',
    description: 'Remix로 마이그레이션 제안',
    rejectionReason: '이미 Next.js 14로 진행 중. Supabase 호환성 및 서버 컴포넌트 활용 위해 Next.js 유지하기로 함',
    proposedBy: '김개발',
    rejectedAt: '2024-01-20',
    keywords: ['remix', 'framework', '마이그레이션', 'next.js'],
    createdAt: '2024-01-20',
  },
  {
    id: 'rej-002',
    projectId: 'project-1',
    meetingId: '3',
    title: '카페24 기본 컬러칩 외 바리에이션',
    description: '패턴 컬러칩, 그라데이션 컬러칩 추가 제안',
    rejectionReason: '카페24 인풋 제약으로 구현 어려움. 추가 개발 공수 대비 효용 낮음',
    proposedBy: '박디자인',
    rejectedAt: '2024-02-15',
    keywords: ['컬러칩', '카페24', 'UI', '디자인'],
    createdAt: '2024-02-15',
  },
  {
    id: 'rej-003',
    projectId: 'project-1',
    decisionId: '10',
    meetingId: '7',
    title: '이메일/비밀번호 로그인 우선 구현',
    description: '전통적인 이메일 로그인을 먼저 구현하자는 의견',
    rejectionReason: '최근 사용자 트렌드는 소셜 로그인 선호. 초기 진입 장벽을 낮추기 위해 소셜 로그인 우선 구현',
    proposedBy: '최기획',
    rejectedAt: '2024-01-15',
    keywords: ['로그인', '이메일', '인증', '회원가입'],
    createdAt: '2024-01-15',
  },
  {
    id: 'rej-004',
    projectId: 'project-1',
    decisionId: '1',
    meetingId: '3',
    title: '칸반 보드 유지',
    description: '기존 칸반 보드 UI를 유지하고 개선하자는 의견',
    rejectionReason: '칸반은 상태 중심 뷰라 맥락 흐름 파악이 어려움. 타임라인 뷰가 결정-구현-화면 연결 관계를 더 잘 보여줌',
    proposedBy: '이영희',
    rejectedAt: '2024-01-17',
    keywords: ['칸반', 'kanban', 'UI', '타임라인'],
    createdAt: '2024-01-17',
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  let filtered = mockRejectedAlternatives

  if (projectId) {
    filtered = filtered.filter(item => item.projectId === projectId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const data = await request.json()

  // 실제로는 DB에 저장
  const newRejected = {
    id: `rej-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json(newRejected, { status: 201 })
}
