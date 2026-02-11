'use client'

import { TimelineView, TimelineItem } from '@/components/timeline'
import { useParams } from 'next/navigation'

// Mock timeline data with connections - category + source 구조
const mockTimelineItems: TimelineItem[] = [
  // 화면 노드 추가
  {
    id: 'scr-001',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-001',
    title: '대시보드',
    date: '2024-01-14',
    description: '메인 대시보드 화면',
    connections: {
      sources: [
        {
          id: '1',
          type: 'decision',
          category: 'decision',
          code: 'DEC-004',
          title: '타임라인 뷰로 변경',
          relation: 'affects',
        },
        {
          id: '5',
          type: 'decision',
          category: 'decision',
          code: 'DEC-002',
          title: '다크 테마 기본 설정',
          relation: 'affects',
        },
      ],
      impacts: [],
    },
  },
  {
    id: 'scr-002',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-002',
    title: '로그인 화면',
    date: '2024-01-14',
    description: '사용자 로그인/회원가입',
    connections: {
      sources: [
        {
          id: '10',
          type: 'decision',
          category: 'decision',
          code: 'DEC-003',
          title: '소셜 로그인 우선',
          relation: 'affects',
        },
      ],
      impacts: [],
    },
  },
  {
    id: '1',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-004',
    title: '타임라인 뷰로 변경',
    date: '2024-01-18',
    description: '칸반 보드 대신 타임라인 뷰로 변경하여 컨텍스트 흐름을 개선',
    status: 'changed',
    connections: {
      sources: [
        {
          id: '3',
          type: 'meeting',
          category: 'meeting',
          code: 'MTG-002',
          title: 'UI/UX 리뷰',
          relation: 'created_from',
        },
        {
          id: '6',
          type: 'decision',
          category: 'decision',
          code: 'DEC-001',
          title: 'Next.js 14 사용',
          relation: 'changed_by',
        },
      ],
      impacts: [
        {
          id: 'scr-001',
          type: 'screen',
          category: 'screen',
          code: 'SCR-001',
          title: '대시보드',
          relation: 'affects',
        },
        {
          id: '2',
          type: 'github',
          category: 'implementation',
          code: 'PR #31',
          title: '타임라인 뷰 구현',
          relation: 'implemented_in',
        },
      ],
    },
  },
  {
    id: '2',
    type: 'github',
    category: 'implementation',
    source: 'github',
    code: 'PR #31',
    title: 'feat: 타임라인 뷰 구현 [SCR-001]',
    date: '2024-01-18',
    event_type: 'pr',
    url: 'https://github.com/...',
    connections: {
      sources: [
        {
          id: '1',
          type: 'decision',
          category: 'decision',
          code: 'DEC-004',
          title: '타임라인 뷰로 변경',
          relation: 'implemented_in',
        },
      ],
      impacts: [],
    },
  },
  {
    id: '3',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-002',
    title: 'UI/UX 리뷰',
    date: '2024-01-17',
    description: '타임라인 vs 칸반 논의, 다크 모드 색상 검토',
    connections: {
      sources: [],
      impacts: [
        {
          id: '1',
          type: 'decision',
          category: 'decision',
          code: 'DEC-004',
          title: '타임라인 뷰로 변경',
          relation: 'created_from',
        },
        {
          id: '8',
          type: 'decision',
          category: 'decision',
          code: 'DEC-005',
          title: '다크 테마 확정',
          relation: 'created_from',
        },
      ],
    },
  },
  {
    id: '4',
    type: 'github',
    category: 'implementation',
    source: 'github',
    code: 'PR #28',
    title: 'feat: 사이드바 레이아웃 구현',
    date: '2024-01-17',
    event_type: 'pr',
    url: 'https://github.com/...',
    connections: {
      sources: [
        {
          id: '6',
          type: 'decision',
          category: 'decision',
          code: 'DEC-001',
          title: 'Next.js 14 사용',
          relation: 'implemented_in',
        },
      ],
      impacts: [
        {
          id: 'scr-001',
          type: 'screen',
          category: 'screen',
          code: 'SCR-001',
          title: '대시보드',
          relation: 'affects',
        },
      ],
    },
  },
  {
    id: '5',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-002',
    title: '다크 테마 기본 설정',
    date: '2024-01-16',
    description: '애플리케이션의 기본 색상 스키마를 다크 테마로 설정',
    status: 'confirmed',
    connections: {
      sources: [
        {
          id: '7',
          type: 'meeting',
          category: 'meeting',
          code: 'MTG-001',
          title: '프로젝트 킥오프',
          relation: 'discussed_in',
        },
      ],
      impacts: [
        {
          id: 'scr-001',
          type: 'screen',
          category: 'screen',
          code: 'SCR-001',
          title: '대시보드',
          relation: 'affects',
        },
        {
          id: '9',
          type: 'github',
          category: 'implementation',
          code: 'PR #25',
          title: '다크 모드 색상 수정',
          relation: 'implemented_in',
        },
      ],
    },
  },
  {
    id: '9',
    type: 'github',
    category: 'implementation',
    source: 'github',
    code: 'PR #25',
    title: 'fix: 다크 모드 색상 수정 [DEC-002]',
    date: '2024-01-16',
    event_type: 'commit',
    url: 'https://github.com/...',
    connections: {
      sources: [
        {
          id: '5',
          type: 'decision',
          category: 'decision',
          code: 'DEC-002',
          title: '다크 테마 기본 설정',
          relation: 'implemented_in',
        },
      ],
      impacts: [],
    },
  },
  {
    id: '6',
    type: 'decision',
    category: 'decision',
    source: 'notion',
    code: 'DEC-001',
    title: 'Next.js 14 사용',
    date: '2024-01-15',
    description: '더 나은 성능과 개발자 경험을 위한 프론트엔드 프레임워크 결정',
    status: 'confirmed',
    connections: {
      sources: [
        {
          id: '7',
          type: 'meeting',
          category: 'meeting',
          code: 'MTG-001',
          title: '프로젝트 킥오프',
          relation: 'created_from',
        },
      ],
      impacts: [
        {
          id: '1',
          type: 'decision',
          category: 'decision',
          code: 'DEC-004',
          title: '타임라인 뷰로 변경',
          relation: 'affects',
        },
        {
          id: '4',
          type: 'github',
          category: 'implementation',
          code: 'PR #28',
          title: '사이드바 레이아웃 구현',
          relation: 'implemented_in',
        },
      ],
    },
  },
  {
    id: '10',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-003',
    title: '소셜 로그인 우선',
    date: '2024-01-15',
    description: '카카오, 구글 소셜 로그인을 먼저 구현하고 이메일 로그인은 나중에',
    status: 'confirmed',
    connections: {
      sources: [
        {
          id: '7',
          type: 'meeting',
          category: 'meeting',
          code: 'MTG-001',
          title: '프로젝트 킥오프',
          relation: 'created_from',
        },
      ],
      impacts: [
        {
          id: 'scr-002',
          type: 'screen',
          category: 'screen',
          code: 'SCR-002',
          title: '로그인 화면',
          relation: 'affects',
        },
        {
          id: '11',
          type: 'github',
          category: 'implementation',
          code: 'PR #23',
          title: '카카오 OAuth 구현',
          relation: 'implemented_in',
        },
      ],
    },
  },
  {
    id: '11',
    type: 'github',
    category: 'implementation',
    source: 'github',
    code: 'PR #23',
    title: 'feat: 카카오 OAuth 구현 [DEC-003]',
    date: '2024-01-15',
    event_type: 'pr',
    url: 'https://github.com/...',
    connections: {
      sources: [
        {
          id: '10',
          type: 'decision',
          category: 'decision',
          code: 'DEC-003',
          title: '소셜 로그인 우선',
          relation: 'implemented_in',
        },
      ],
      impacts: [],
    },
  },
  {
    id: '7',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-001',
    title: '프로젝트 킥오프',
    date: '2024-01-14',
    description: '초기 프로젝트 설정, 기술 스택 결정, MVP 범위 정의',
    connections: {
      sources: [],
      impacts: [
        {
          id: '6',
          type: 'decision',
          category: 'decision',
          code: 'DEC-001',
          title: 'Next.js 14 사용',
          relation: 'created_from',
        },
        {
          id: '10',
          type: 'decision',
          category: 'decision',
          code: 'DEC-003',
          title: '소셜 로그인 우선',
          relation: 'created_from',
        },
        {
          id: '5',
          type: 'decision',
          category: 'decision',
          code: 'DEC-002',
          title: '다크 테마 기본 설정',
          relation: 'discussed_in',
        },
      ],
    },
  },
]

export default function TimelinePage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  return <TimelineView items={mockTimelineItems} teamId={teamId} projectId={projectId} />
}
