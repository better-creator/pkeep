'use client'

import { useState } from 'react'
import { TimelineView, TimelineItem } from '@/components/timeline'
import { DecisionHierarchyView, Decision, DecisionMaker } from '@/components/decisions'
import { useParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, GitBranch } from 'lucide-react'

// Mock 사용자 데이터 (Person 타입과 호환되도록)
const users = {
  kim: { id: 'u1', name: '김철수', role: 'owner' as const },
  lee: { id: 'u2', name: '이영희', role: 'owner' as const },
  park: { id: 'u3', name: '박지민', role: 'contributor' as const },
  choi: { id: 'u4', name: '최수연', role: 'reviewer' as const },
}

// DecisionMaker 버전 (결정 전용)
const decisionUsers: Record<string, DecisionMaker> = {
  kim: { id: 'u1', name: '김철수', role: 'owner' },
  lee: { id: 'u2', name: '이영희', role: 'owner' },
  park: { id: 'u3', name: '박지민', role: 'contributor' },
  choi: { id: 'u4', name: '최수연', role: 'approver' },
}

// Mock timeline data with connections, owners, tasks - category + source 구조
const mockTimelineItems: TimelineItem[] = [
  // 화면 노드
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
  // 결정 노드
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
]

// Mock decisions (확장된 데이터)
const mockDecisions: Decision[] = [
  {
    id: '6',
    code: 'DEC-001',
    title: 'Next.js 14 사용',
    content: '더 나은 성능과 개발자 경험을 위한 프론트엔드 프레임워크 결정. App Router와 서버 컴포넌트를 활용하여 최적의 성능을 달성한다.',
    date: '2024-01-15',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.kim, decidedAt: '2024-01-15' },
    approvers: [{ ...decisionUsers.lee, decidedAt: '2024-01-15' }, { ...decisionUsers.choi, decidedAt: '2024-01-15' }],
    contributors: [decisionUsers.park],
    currentVersion: 1,
    area: '기술',
    keywords: ['프론트엔드', 'React', 'Next.js'],
    projectId: 'proj-1',
    meetingId: '7',
    affectedScreenIds: ['scr-001'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '5',
    code: 'DEC-002',
    title: '다크 테마 기본 설정',
    content: '애플리케이션의 기본 색상 스키마를 다크 테마로 설정. 사용자 눈의 피로를 줄이고 모던한 느낌을 준다.',
    date: '2024-01-16',
    status: 'superseded',
    hierarchy: 'root',
    owner: { ...decisionUsers.lee, decidedAt: '2024-01-16' },
    approvers: [{ ...decisionUsers.kim, decidedAt: '2024-01-16' }],
    supersededById: '8',
    currentVersion: 1,
    area: 'UI',
    keywords: ['테마', '다크모드', '색상'],
    projectId: 'proj-1',
    meetingId: '7',
    affectedScreenIds: ['scr-001'],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-17',
  },
  {
    id: '8',
    code: 'DEC-005',
    title: '라이트 테마로 변경',
    content: '사용자 피드백을 반영하여 라이트 테마를 기본으로 변경. 다크 테마는 옵션으로 제공.',
    date: '2024-01-18',
    status: 'confirmed',
    hierarchy: 'revision',
    owner: { ...decisionUsers.lee, decidedAt: '2024-01-18' },
    approvers: [{ ...decisionUsers.kim, decidedAt: '2024-01-18' }],
    supersedes: '5',
    currentVersion: 2,
    revisions: [
      {
        id: 'rev-1',
        version: 1,
        title: '다크 테마 기본 설정',
        changedBy: decisionUsers.lee,
        changedAt: '2024-01-16',
        previousDecisionId: undefined,
      },
      {
        id: 'rev-2',
        version: 2,
        title: '라이트 테마로 변경',
        changedBy: decisionUsers.lee,
        changedAt: '2024-01-18',
        changeReason: '사용자 피드백 반영',
        previousDecisionId: '5',
      },
    ],
    area: 'UI',
    keywords: ['테마', '라이트모드', '색상'],
    projectId: 'proj-1',
    meetingId: '3',
    affectedScreenIds: ['scr-001'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
  },
  {
    id: '10',
    code: 'DEC-003',
    title: '소셜 로그인 우선',
    content: '카카오, 구글 소셜 로그인을 먼저 구현하고 이메일 로그인은 나중에 추가',
    date: '2024-01-15',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.park, decidedAt: '2024-01-15' },
    approvers: [{ ...decisionUsers.kim, decidedAt: '2024-01-15' }],
    currentVersion: 1,
    area: '기능',
    keywords: ['로그인', 'OAuth', '인증'],
    projectId: 'proj-1',
    meetingId: '7',
    affectedScreenIds: ['scr-002'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '1',
    code: 'DEC-004',
    title: '타임라인 뷰로 변경',
    content: '칸반 보드 대신 타임라인 뷰로 변경하여 컨텍스트 흐름을 개선',
    date: '2024-01-18',
    status: 'pending',
    hierarchy: 'child',
    owner: { ...decisionUsers.lee, decidedAt: '2024-01-18' },
    contributors: [decisionUsers.kim],
    parentDecisionId: '6',
    currentVersion: 1,
    area: 'UI',
    keywords: ['타임라인', '뷰', 'UX'],
    projectId: 'proj-1',
    meetingId: '3',
    affectedScreenIds: ['scr-001'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
  },
  {
    id: '12',
    code: 'DEC-006',
    title: 'PostgreSQL 대신 SQLite 사용',
    content: 'MVP 단계에서는 SQLite로 시작하고 추후 PostgreSQL로 마이그레이션',
    date: '2024-01-14',
    status: 'deprecated',
    hierarchy: 'root',
    owner: { ...decisionUsers.kim, decidedAt: '2024-01-14' },
    currentVersion: 1,
    area: '기술',
    keywords: ['데이터베이스', 'SQLite'],
    projectId: 'proj-1',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-20',
  },
  {
    id: '13',
    code: 'DEC-007',
    title: '모바일 앱 개발 보류',
    content: '웹 MVP 완성 후 모바일 앱 개발 여부 재검토',
    date: '2024-01-14',
    status: 'disabled',
    hierarchy: 'root',
    owner: { ...decisionUsers.choi, decidedAt: '2024-01-14' },
    currentVersion: 1,
    area: '기능',
    keywords: ['모바일', '앱'],
    projectId: 'proj-1',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14',
  },
]

type ViewType = 'timeline' | 'decisions'

export default function DecisionsPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string
  const [viewType, setViewType] = useState<ViewType>('timeline')
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>()

  return (
    <div className="flex flex-col h-full text-[1.3em]">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h1 className="text-2xl font-semibold">결정</h1>
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-background">
              <Clock className="h-5 w-5" />
              컨텍스트 흐름
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2 data-[state=active]:bg-background">
              <GitBranch className="h-5 w-5" />
              상태별 보기
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 뷰 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {viewType === 'timeline' && (
          <TimelineView items={mockTimelineItems} teamId={teamId} projectId={projectId} />
        )}
        {viewType === 'decisions' && (
          <div className="h-full overflow-auto p-6">
            <DecisionHierarchyView
              decisions={mockDecisions}
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={(d) => setSelectedDecisionId(d.id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
