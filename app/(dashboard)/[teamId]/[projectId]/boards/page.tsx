'use client'

import { useState } from 'react'
import { Network, Columns3, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MindmapView, AffinityView, KanbanView } from '@/components/boards'
import { TimelineItem } from '@/components/timeline/types'

type ViewMode = 'mindmap' | 'affinity' | 'kanban'

// Mock 사용자 데이터
const users = {
  kim: { id: 'u1', name: '김철수' },
  lee: { id: 'u2', name: '이영희' },
  park: { id: 'u3', name: '박지민' },
  choi: { id: 'u4', name: '최수연' },
}

// Mock timeline data - category + source 구조
const mockTimelineItems: TimelineItem[] = [
  {
    id: 'scr-001',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-001',
    title: '대시보드',
    date: '2024-01-14',
    description: '메인 대시보드 화면',
    owner: users.lee,
    contributors: [users.park],
    connections: {
      sources: [
        { id: '1', type: 'decision', category: 'decision', code: 'DEC-004', title: '타임라인 뷰로 변경', relation: 'affects' },
        { id: '5', type: 'decision', category: 'decision', code: 'DEC-002', title: '다크 테마 기본 설정', relation: 'affects' },
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
    owner: users.park,
    connections: {
      sources: [
        { id: '10', type: 'decision', category: 'decision', code: 'DEC-003', title: '소셜 로그인 우선', relation: 'affects' },
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
    owner: users.lee,
    contributors: [users.kim],
    reviewers: [users.choi],
    tasks: [
      { id: 't1', title: '타임라인 컴포넌트 설계', status: 'done', assignee: users.lee },
      { id: 't2', title: 'React Flow 연동', status: 'done', assignee: users.park },
      { id: 't3', title: '애니메이션 추가', status: 'in_progress', assignee: users.lee },
    ],
    connections: {
      sources: [
        { id: '3', type: 'meeting', category: 'meeting', code: 'MTG-002', title: 'UI/UX 리뷰', relation: 'created_from' },
        { id: '6', type: 'decision', category: 'decision', code: 'DEC-001', title: 'Next.js 14 사용', relation: 'changed_by' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '대시보드', relation: 'affects' },
        { id: '2', type: 'github', category: 'implementation', code: 'PR #31', title: '타임라인 뷰 구현', relation: 'implemented_in' },
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
    owner: users.park,
    reviewers: [users.kim, users.lee],
    connections: {
      sources: [
        { id: '1', type: 'decision', category: 'decision', code: 'DEC-004', title: '타임라인 뷰로 변경', relation: 'implemented_in' },
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
    owner: users.kim,
    contributors: [users.lee, users.park],
    connections: {
      sources: [],
      impacts: [
        { id: '1', type: 'decision', category: 'decision', code: 'DEC-004', title: '타임라인 뷰로 변경', relation: 'created_from' },
        { id: '8', type: 'decision', category: 'decision', code: 'DEC-005', title: '다크 테마 확정', relation: 'created_from' },
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
    owner: users.park,
    reviewers: [users.kim],
    connections: {
      sources: [
        { id: '6', type: 'decision', category: 'decision', code: 'DEC-001', title: 'Next.js 14 사용', relation: 'implemented_in' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '대시보드', relation: 'affects' },
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
    owner: users.lee,
    reviewers: [users.kim],
    tasks: [
      { id: 't4', title: '색상 팔레트 정의', status: 'done', assignee: users.lee },
      { id: 't5', title: 'CSS 변수 설정', status: 'done', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: '7', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '프로젝트 킥오프', relation: 'discussed_in' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '대시보드', relation: 'affects' },
        { id: '9', type: 'github', category: 'implementation', code: 'PR #25', title: '다크 모드 색상 수정', relation: 'implemented_in' },
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
    owner: users.park,
    connections: {
      sources: [
        { id: '5', type: 'decision', category: 'decision', code: 'DEC-002', title: '다크 테마 기본 설정', relation: 'implemented_in' },
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
    owner: users.kim,
    contributors: [users.park],
    reviewers: [users.lee, users.choi],
    tasks: [
      { id: 't6', title: '프로젝트 초기 설정', status: 'done', assignee: users.kim },
      { id: 't7', title: 'App Router 마이그레이션', status: 'done', assignee: users.park },
      { id: 't8', title: '서버 컴포넌트 적용', status: 'in_progress', assignee: users.kim },
      { id: 't9', title: '성능 최적화', status: 'todo', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: '7', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '프로젝트 킥오프', relation: 'created_from' },
      ],
      impacts: [
        { id: '1', type: 'decision', category: 'decision', code: 'DEC-004', title: '타임라인 뷰로 변경', relation: 'affects' },
        { id: '4', type: 'github', category: 'implementation', code: 'PR #28', title: '사이드바 레이아웃 구현', relation: 'implemented_in' },
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
    owner: users.park,
    reviewers: [users.kim],
    tasks: [
      { id: 't10', title: '카카오 OAuth 설정', status: 'done', assignee: users.park },
      { id: 't11', title: '구글 OAuth 설정', status: 'in_progress', assignee: users.park },
      { id: 't12', title: '로그인 UI 구현', status: 'todo', assignee: users.lee },
    ],
    connections: {
      sources: [
        { id: '7', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '프로젝트 킥오프', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-002', type: 'screen', category: 'screen', code: 'SCR-002', title: '로그인 화면', relation: 'affects' },
        { id: '11', type: 'github', category: 'implementation', code: 'PR #23', title: '카카오 OAuth 구현', relation: 'implemented_in' },
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
    owner: users.park,
    reviewers: [users.kim],
    connections: {
      sources: [
        { id: '10', type: 'decision', category: 'decision', code: 'DEC-003', title: '소셜 로그인 우선', relation: 'implemented_in' },
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
    owner: users.kim,
    contributors: [users.lee, users.park, users.choi],
    connections: {
      sources: [],
      impacts: [
        { id: '6', type: 'decision', category: 'decision', code: 'DEC-001', title: 'Next.js 14 사용', relation: 'created_from' },
        { id: '10', type: 'decision', category: 'decision', code: 'DEC-003', title: '소셜 로그인 우선', relation: 'created_from' },
        { id: '5', type: 'decision', category: 'decision', code: 'DEC-002', title: '다크 테마 기본 설정', relation: 'discussed_in' },
      ],
    },
  },
  // 문서 타입 추가 예시
  {
    id: 'doc-001',
    type: 'decision',
    category: 'document',
    source: 'notion',
    code: 'DOC-001',
    title: 'API 설계 문서',
    date: '2024-01-16',
    description: 'RESTful API 엔드포인트 설계 및 스펙 정의',
    owner: users.kim,
    contributors: [users.park],
    connections: {
      sources: [
        { id: '7', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '프로젝트 킥오프', relation: 'created_from' },
      ],
      impacts: [],
    },
  },
]

const viewModes: { id: ViewMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'mindmap', label: '마인드맵', icon: Network, description: '미팅에서 결정, 구현까지의 흐름' },
  { id: 'affinity', label: '어피니티', icon: Tag, description: '유사한 항목끼리 그룹화' },
  { id: 'kanban', label: '칸반', icon: Columns3, description: '상태별 진행 현황' },
]

export default function BoardsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('mindmap')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">보드</h1>
          <p className="text-muted-foreground mt-1">다양한 뷰로 프로젝트 맥락을 시각화합니다</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/50 w-fit">
        {viewModes.map(mode => {
          const Icon = mode.icon
          const isActive = viewMode === mode.id
          return (
            <Button
              key={mode.id}
              variant="ghost"
              size="sm"
              className={`h-10 px-4 rounded-lg gap-2 ${
                isActive
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setViewMode(mode.id)}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                {mode.label}
              </span>
            </Button>
          )
        })}
      </div>

      {/* View Description */}
      <p className="text-sm text-muted-foreground">
        {viewModes.find(m => m.id === viewMode)?.description}
      </p>

      {/* Content */}
      <div className="card-soft p-6">
        {viewMode === 'mindmap' && <MindmapView items={mockTimelineItems} />}
        {viewMode === 'affinity' && <AffinityView items={mockTimelineItems} />}
        {viewMode === 'kanban' && <KanbanView items={mockTimelineItems} />}
      </div>
    </div>
  )
}
