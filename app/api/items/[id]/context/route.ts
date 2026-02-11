import { NextRequest, NextResponse } from 'next/server'

// ID 매핑 - TimelineView의 노드 ID를 context 데이터 키로 변환
// 실제 DB에서는 이런 매핑이 필요 없음 (같은 ID 사용)
const idMapping: Record<string, string> = {
  // 결정 노드
  '1': 'dec-004',   // DEC-004: 타임라인 뷰로 변경
  '5': 'dec-002',   // DEC-002: 다크 테마 기본 설정
  '6': 'dec-001',   // DEC-001: Next.js 14 사용
  '10': 'dec-003',  // DEC-003: 소셜 로그인 우선
  // 미팅 노드
  '3': 'mtg-002',   // MTG-002: UI/UX 리뷰
  '7': 'mtg-001',   // MTG-001: 프로젝트 킥오프
  // 화면 노드 (scr-XXX 형식은 이미 일치)
  // 구현 노드 (GitHub PRs)
  '2': 'pr-031',    // PR #31
  '4': 'pr-028',    // PR #28
  '9': 'pr-025',    // PR #25
  '11': 'pr-023',   // PR #23
}

// Mock 데이터 - 실제로는 DB에서 가져옴
const mockContextData: Record<string, any> = {
  'dec-004': {
    item: {
      id: '1',
      code: 'DEC-004',
      category: 'decision',
      title: '타임라인 뷰로 변경',
      description: '칸반 보드 대신 타임라인 뷰로 변경하여 컨텍스트 흐름을 개선',
      status: 'confirmed',
      owner: { id: 'user-3', name: '이영희', role: '프론트엔드' },
      createdAt: '2024-01-17',
    },
    context: {
      sourceMeeting: {
        id: '3',
        code: 'MTG-002',
        title: 'UI/UX 리뷰',
        date: '2024-01-17',
        participants: [
          { id: 'user-1', name: '김철수', role: '백엔드' },
          { id: 'user-3', name: '이영희', role: '프론트엔드' },
          { id: 'user-2', name: '박지민', role: '디자인' },
        ],
        relatedQuote: '칸반보다 타임라인이 흐름 파악에 더 좋을 것 같아요',
        quotedBy: '이영희',
      },
    },
    connections: {
      precedents: [
        {
          id: '6',
          code: 'DEC-001',
          category: 'decision',
          title: 'Next.js 14 사용',
          description: 'SSR 지원 필요해서 Next.js 선택',
          status: 'confirmed',
        },
      ],
      implementations: [
        {
          id: '2',
          code: 'PR #31',
          category: 'implementation',
          title: 'feat: 타임라인 뷰 구현',
          source: 'github',
          status: 'completed',
          url: 'https://github.com/example/repo/pull/31',
        },
      ],
      screens: [
        {
          id: 'scr-001',
          code: 'SCR-001',
          category: 'screen',
          title: '대시보드',
          source: 'figma',
          status: 'completed',
        },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.20', action: 'PR #31 머지됨' },
      { id: 'h2', date: '01.18', action: '이영희 담당자 지정' },
      { id: 'h3', date: '01.17', action: 'MTG-002에서 결정됨' },
    ],
  },
  'dec-001': {
    item: {
      id: '6',
      code: 'DEC-001',
      category: 'decision',
      title: 'Next.js 14 사용',
      description: '더 나은 성능과 개발자 경험을 위한 프론트엔드 프레임워크 결정',
      status: 'confirmed',
      owner: { id: 'user-1', name: '김철수', role: '백엔드' },
      createdAt: '2024-01-15',
    },
    context: {
      sourceMeeting: {
        id: '7',
        code: 'MTG-001',
        title: '프로젝트 킥오프',
        date: '2024-01-14',
        participants: [
          { id: 'user-1', name: '김철수', role: '백엔드' },
          { id: 'user-3', name: '이영희', role: '프론트엔드' },
          { id: 'user-2', name: '박지민', role: '디자인' },
        ],
        relatedQuote: 'SSR 지원이 필요하고 App Router가 좋아 보여요',
        quotedBy: '김철수',
      },
    },
    connections: {
      precedents: [],
      implementations: [
        {
          id: '4',
          code: 'PR #28',
          category: 'implementation',
          title: 'feat: 사이드바 레이아웃 구현',
          source: 'github',
          status: 'completed',
        },
      ],
      screens: [],
      affected: [
        {
          id: '1',
          code: 'DEC-004',
          category: 'decision',
          title: '타임라인 뷰로 변경',
          status: 'confirmed',
        },
      ],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.16', action: '확정됨' },
      { id: 'h2', date: '01.15', action: '김철수 담당자 지정' },
      { id: 'h3', date: '01.14', action: 'MTG-001에서 결정됨' },
    ],
  },
  'dec-002': {
    item: {
      id: '5',
      code: 'DEC-002',
      category: 'decision',
      title: '다크 테마 기본 설정',
      description: '애플리케이션의 기본 색상 스키마를 다크 테마로 설정',
      status: 'confirmed',
      owner: { id: 'user-3', name: '이영희', role: '프론트엔드' },
      createdAt: '2024-01-16',
    },
    context: {
      sourceMeeting: {
        id: '7',
        code: 'MTG-001',
        title: '프로젝트 킥오프',
        date: '2024-01-14',
        participants: [
          { id: 'user-1', name: '김철수', role: '백엔드' },
          { id: 'user-3', name: '이영희', role: '프론트엔드' },
        ],
        relatedQuote: '개발자 도구 특성상 다크 모드가 기본이어야 해요',
        quotedBy: '이영희',
      },
    },
    connections: {
      precedents: [],
      implementations: [
        {
          id: '9',
          code: 'PR #25',
          category: 'implementation',
          title: 'fix: 다크 모드 색상 수정 [DEC-002]',
          source: 'github',
          status: 'completed',
        },
      ],
      screens: [
        { id: 'scr-001', code: 'SCR-001', category: 'screen', title: '대시보드', source: 'figma', status: 'completed' },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.18', action: 'PR #25 머지됨' },
      { id: 'h2', date: '01.16', action: 'MTG-001에서 결정됨' },
    ],
  },
  'dec-003': {
    item: {
      id: '10',
      code: 'DEC-003',
      category: 'decision',
      title: '소셜 로그인 우선',
      description: '카카오, 구글 소셜 로그인을 먼저 구현하고 이메일 로그인은 나중에',
      status: 'confirmed',
      owner: { id: 'user-2', name: '박지민', role: '디자인' },
      createdAt: '2024-01-15',
    },
    context: {
      sourceMeeting: {
        id: '7',
        code: 'MTG-001',
        title: '프로젝트 킥오프',
        date: '2024-01-14',
        participants: [
          { id: 'user-2', name: '박지민', role: '디자인' },
          { id: 'user-1', name: '김철수', role: '백엔드' },
        ],
      },
    },
    connections: {
      precedents: [],
      implementations: [
        {
          id: '11',
          code: 'PR #23',
          category: 'implementation',
          title: 'feat: 카카오 OAuth 구현 [DEC-003]',
          source: 'github',
          status: 'completed',
        },
      ],
      screens: [
        { id: 'scr-002', code: 'SCR-002', category: 'screen', title: '로그인 화면', source: 'figma', status: 'completed' },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.20', action: 'PR #23 머지됨' },
      { id: 'h2', date: '01.15', action: 'MTG-001에서 결정됨' },
    ],
  },
  'dec-012': {
    item: {
      id: 'dec-012',
      code: 'DEC-012',
      category: 'decision',
      title: '오렌지 컬러 사용 제한',
      description: '브랜드 톤앤매너 통일 위해 오렌지는 CTA에만 제한적 사용',
      status: 'confirmed',
      owner: { id: 'user-4', name: '민주', role: 'PM' },
      createdAt: '2024-11-15',
    },
    context: {
      sourceMeeting: {
        id: 'mtg-008',
        code: 'MTG-008',
        title: '브랜드 가이드 싱크',
        date: '2024-11-15',
        participants: [
          { id: 'user-4', name: '민주', role: 'PM' },
          { id: 'user-5', name: '디자이너 김OO', role: '디자인' },
        ],
        relatedQuote: '오렌지는 너무 강렬해서 CTA에만 쓰는 게 좋겠어요',
        quotedBy: '디자이너 김OO',
      },
    },
    connections: {
      precedents: [],
      implementations: [],
      screens: [],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '11.15', action: 'MTG-008에서 결정됨' },
    ],
  },
  'mtg-001': {
    item: {
      id: '7',
      code: 'MTG-001',
      category: 'meeting',
      title: '프로젝트 킥오프',
      status: 'completed',
      owner: { id: 'user-1', name: '김철수', role: '백엔드' },
      createdAt: '2024-01-14',
    },
    context: {
      reason: '프로젝트 시작 전 주요 기술 스택 및 방향성 논의',
    },
    connections: {
      precedents: [],
      implementations: [],
      screens: [],
      affected: [
        { id: '6', code: 'DEC-001', category: 'decision', title: 'Next.js 14 사용', status: 'confirmed' },
        { id: '5', code: 'DEC-002', category: 'decision', title: '다크 테마 기본 설정', status: 'confirmed' },
        { id: '10', code: 'DEC-003', category: 'decision', title: '소셜 로그인 우선', status: 'confirmed' },
      ],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.14', action: '미팅 진행' },
    ],
  },
  'mtg-002': {
    item: {
      id: '3',
      code: 'MTG-002',
      category: 'meeting',
      title: 'UI/UX 리뷰',
      status: 'completed',
      owner: { id: 'user-1', name: '김철수', role: '백엔드' },
      createdAt: '2024-01-17',
    },
    context: {
      reason: 'UI/UX 디자인 검토 및 피드백',
    },
    connections: {
      precedents: [],
      implementations: [],
      screens: [],
      affected: [
        { id: '1', code: 'DEC-004', category: 'decision', title: '타임라인 뷰로 변경', status: 'confirmed' },
      ],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.17', action: '미팅 진행' },
    ],
  },
  'scr-001': {
    item: {
      id: 'scr-001',
      code: 'SCR-001',
      category: 'screen',
      title: '대시보드',
      status: 'completed',
      createdAt: '2024-01-20',
    },
    context: {
      reason: '메인 대시보드 화면 디자인',
    },
    connections: {
      precedents: [
        { id: '1', code: 'DEC-004', category: 'decision', title: '타임라인 뷰로 변경', status: 'confirmed' },
        { id: '5', code: 'DEC-002', category: 'decision', title: '다크 테마 기본 설정', status: 'confirmed' },
      ],
      implementations: [
        { id: '2', code: 'PR #31', category: 'implementation', title: 'feat: 타임라인 뷰 구현', source: 'github', status: 'completed' },
      ],
      screens: [],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.25', action: 'PR #31 머지됨' },
      { id: 'h2', date: '01.20', action: '디자인 완료' },
    ],
  },
  'scr-002': {
    item: {
      id: 'scr-002',
      code: 'SCR-002',
      category: 'screen',
      title: '로그인 화면',
      status: 'completed',
      createdAt: '2024-01-14',
    },
    context: {
      reason: '사용자 로그인/회원가입 화면 디자인',
    },
    connections: {
      precedents: [
        { id: '10', code: 'DEC-003', category: 'decision', title: '소셜 로그인 우선', status: 'confirmed' },
      ],
      implementations: [],
      screens: [],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.14', action: '디자인 완료' },
    ],
  },
  // PR/Implementation 노드들
  'pr-031': {
    item: {
      id: '2',
      code: 'PR #31',
      category: 'implementation',
      title: 'feat: 타임라인 뷰 구현 [SCR-001]',
      status: 'completed',
      owner: { id: 'user-3', name: '박지민', role: '프론트엔드' },
      createdAt: '2024-01-18',
    },
    context: {
      reason: 'DEC-004 결정에 따른 타임라인 뷰 구현',
    },
    connections: {
      precedents: [
        { id: '1', code: 'DEC-004', category: 'decision', title: '타임라인 뷰로 변경', status: 'confirmed' },
      ],
      implementations: [],
      screens: [
        { id: 'scr-001', code: 'SCR-001', category: 'screen', title: '대시보드', source: 'figma', status: 'completed' },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.20', action: 'PR 머지됨' },
      { id: 'h2', date: '01.18', action: 'PR 생성' },
    ],
  },
  'pr-028': {
    item: {
      id: '4',
      code: 'PR #28',
      category: 'implementation',
      title: 'feat: 사이드바 레이아웃 구현',
      status: 'completed',
      owner: { id: 'user-3', name: '박지민', role: '프론트엔드' },
      createdAt: '2024-01-17',
    },
    context: {
      reason: 'DEC-001 결정에 따른 Next.js 기반 레이아웃 구현',
    },
    connections: {
      precedents: [
        { id: '6', code: 'DEC-001', category: 'decision', title: 'Next.js 14 사용', status: 'confirmed' },
      ],
      implementations: [],
      screens: [
        { id: 'scr-001', code: 'SCR-001', category: 'screen', title: '대시보드', source: 'figma', status: 'completed' },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.18', action: 'PR 머지됨' },
      { id: 'h2', date: '01.17', action: 'PR 생성' },
    ],
  },
  'pr-025': {
    item: {
      id: '9',
      code: 'PR #25',
      category: 'implementation',
      title: 'fix: 다크 모드 색상 수정 [DEC-002]',
      status: 'completed',
      owner: { id: 'user-3', name: '박지민', role: '프론트엔드' },
      createdAt: '2024-01-16',
    },
    context: {
      reason: 'DEC-002 결정에 따른 다크 모드 색상 수정',
    },
    connections: {
      precedents: [
        { id: '5', code: 'DEC-002', category: 'decision', title: '다크 테마 기본 설정', status: 'confirmed' },
      ],
      implementations: [],
      screens: [],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.18', action: 'PR 머지됨' },
      { id: 'h2', date: '01.16', action: 'PR 생성' },
    ],
  },
  'pr-023': {
    item: {
      id: '11',
      code: 'PR #23',
      category: 'implementation',
      title: 'feat: 카카오 OAuth 구현 [DEC-003]',
      status: 'completed',
      owner: { id: 'user-3', name: '박지민', role: '프론트엔드' },
      createdAt: '2024-01-15',
    },
    context: {
      reason: 'DEC-003 결정에 따른 카카오 OAuth 구현',
    },
    connections: {
      precedents: [
        { id: '10', code: 'DEC-003', category: 'decision', title: '소셜 로그인 우선', status: 'confirmed' },
      ],
      implementations: [],
      screens: [
        { id: 'scr-002', code: 'SCR-002', category: 'screen', title: '로그인 화면', source: 'figma', status: 'completed' },
      ],
      affected: [],
    },
    conflicts: [],
    history: [
      { id: 'h1', date: '01.20', action: 'PR 머지됨' },
      { id: 'h2', date: '01.15', action: 'PR 생성' },
    ],
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // ID 매핑 적용 (숫자 ID를 context 키로 변환)
  const mappedId = idMapping[id] || id

  // Mock 데이터에서 찾기
  const contextData = mockContextData[mappedId]

  if (!contextData) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(contextData)
}
