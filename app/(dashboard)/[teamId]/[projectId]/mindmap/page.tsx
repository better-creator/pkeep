'use client'

import { MindmapView } from '@/components/boards'
import { TimelineItem } from '@/components/timeline/types'

// Mock 사용자 데이터
const users = {
  kim: { id: 'u1', name: '김철수' },
  lee: { id: 'u2', name: '이영희' },
  park: { id: 'u3', name: '박지민' },
  choi: { id: 'u4', name: '최수연' },
}

// Mock timeline data
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
    description: '칸반 보드 대신 타임라인 뷰로 변경',
    status: 'confirmed',
    owner: users.lee,
    connections: {
      sources: [
        { id: '3', type: 'meeting', category: 'meeting', code: 'MTG-002', title: 'UI/UX 리뷰', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '대시보드', relation: 'affects' },
      ],
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
    description: '타임라인 vs 칸반 논의',
    owner: users.kim,
    connections: {
      sources: [],
      impacts: [
        { id: '1', type: 'decision', category: 'decision', code: 'DEC-004', title: '타임라인 뷰로 변경', relation: 'created_from' },
      ],
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
    description: '프론트엔드 프레임워크 결정',
    status: 'confirmed',
    owner: users.kim,
    connections: {
      sources: [
        { id: '7', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '프로젝트 킥오프', relation: 'created_from' },
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
    description: '초기 프로젝트 설정',
    owner: users.kim,
    connections: {
      sources: [],
      impacts: [
        { id: '6', type: 'decision', category: 'decision', code: 'DEC-001', title: 'Next.js 14 사용', relation: 'created_from' },
      ],
    },
  },
]

export default function MindmapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">프로젝트 & 팀</h1>
        <p className="text-muted-foreground mt-1">
          프로젝트 개요와 팀 구성원 현황
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <MindmapView items={mockTimelineItems} />
      </div>
    </div>
  )
}
