'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Filter, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RejectedAlternative,
  RejectedAlternativeCard,
  RejectedAlternativeForm,
  RejectedAlternativeFormData,
} from '@/components/rejected'

// Mock 데이터
const mockRejectedAlternatives: RejectedAlternative[] = [
  {
    id: 'rej-001',
    projectId: 'project-1',
    decisionId: '6',
    meetingId: '7',
    title: 'Remix 프레임워크 사용',
    description: 'Remix로 마이그레이션 제안. 서버 컴포넌트와 데이터 로딩 패턴이 더 직관적이라는 의견.',
    rejectionReason: '이미 Next.js 14로 진행 중. Supabase 호환성 및 서버 컴포넌트 활용 위해 Next.js 유지하기로 함. 마이그레이션 비용 대비 효용이 낮다고 판단.',
    proposedBy: '김개발',
    rejectedAt: '2024-01-20',
    keywords: ['remix', 'framework', '마이그레이션', 'next.js'],
    createdAt: '2024-01-20',
    decision: {
      id: '6',
      code: 'DEC-001',
      title: 'Next.js 14 사용',
    },
    meeting: {
      id: '7',
      code: 'MTG-001',
      title: '프로젝트 킥오프',
    },
  },
  {
    id: 'rej-002',
    projectId: 'project-1',
    meetingId: '3',
    title: '카페24 기본 컬러칩 외 바리에이션',
    description: '패턴 컬러칩, 그라데이션 컬러칩 추가 제안. 사용자에게 더 다양한 선택지 제공.',
    rejectionReason: '카페24 인풋 제약으로 구현 어려움. 추가 개발 공수 대비 효용 낮음. 향후 API 개선 시 재검토 예정.',
    proposedBy: '박디자인',
    rejectedAt: '2024-02-15',
    keywords: ['컬러칩', '카페24', 'UI', '디자인'],
    createdAt: '2024-02-15',
    meeting: {
      id: '3',
      code: 'MTG-002',
      title: 'UI/UX 리뷰',
    },
  },
  {
    id: 'rej-003',
    projectId: 'project-1',
    decisionId: '10',
    meetingId: '7',
    title: '이메일/비밀번호 로그인 우선 구현',
    description: '전통적인 이메일 로그인을 먼저 구현하고 소셜 로그인은 나중에 추가하자는 의견.',
    rejectionReason: '최근 사용자 트렌드는 소셜 로그인 선호. 초기 진입 장벽을 낮추기 위해 소셜 로그인 우선 구현. 이메일 로그인은 Phase 2에서 추가.',
    proposedBy: '최기획',
    rejectedAt: '2024-01-15',
    keywords: ['로그인', '이메일', '인증', '회원가입'],
    createdAt: '2024-01-15',
    decision: {
      id: '10',
      code: 'DEC-003',
      title: '소셜 로그인 우선',
    },
    meeting: {
      id: '7',
      code: 'MTG-001',
      title: '프로젝트 킥오프',
    },
  },
  {
    id: 'rej-004',
    projectId: 'project-1',
    decisionId: '1',
    meetingId: '3',
    title: '칸반 보드 유지',
    description: '기존 칸반 보드 UI를 유지하고 개선하자는 의견.',
    rejectionReason: '칸반은 상태 중심 뷰라 맥락 흐름 파악이 어려움. 타임라인 뷰가 결정-구현-화면 연결 관계를 더 잘 보여줌. UX 테스트에서도 타임라인 선호도가 높았음.',
    proposedBy: '이영희',
    rejectedAt: '2024-01-17',
    keywords: ['칸반', 'kanban', 'UI', '타임라인'],
    createdAt: '2024-01-17',
    decision: {
      id: '1',
      code: 'DEC-004',
      title: '타임라인 뷰로 변경',
    },
    meeting: {
      id: '3',
      code: 'MTG-002',
      title: 'UI/UX 리뷰',
    },
  },
]

const mockMeetings = [
  { id: '7', code: 'MTG-001', title: '프로젝트 킥오프' },
  { id: '3', code: 'MTG-002', title: 'UI/UX 리뷰' },
]

const mockDecisions = [
  { id: '6', code: 'DEC-001', title: 'Next.js 14 사용' },
  { id: '5', code: 'DEC-002', title: '다크 테마 기본 설정' },
  { id: '10', code: 'DEC-003', title: '소셜 로그인 우선' },
  { id: '1', code: 'DEC-004', title: '타임라인 뷰로 변경' },
]

export default function RejectedPage() {
  useParams() // For future use with dynamic routing
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMeeting, setFilterMeeting] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 필터링된 목록
  const filteredItems = useMemo(() => {
    return mockRejectedAlternatives.filter(item => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.rejectionReason.toLowerCase().includes(query) ||
          item.keywords?.some(k => k.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // 미팅 필터
      if (filterMeeting !== 'all' && item.meetingId !== filterMeeting) {
        return false
      }

      return true
    })
  }, [searchQuery, filterMeeting])

  const handleAddRejected = async (data: RejectedAlternativeFormData) => {
    setIsLoading(true)
    // 실제로는 API 호출
    console.log('Adding rejected alternative:', data)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setShowAddForm(false)
  }

  const handleViewMeeting = (meetingId: string) => {
    // 미팅 상세로 이동
    console.log('View meeting:', meetingId)
  }

  const handleViewDecision = (decisionId: string) => {
    // 결정 상세로 이동
    console.log('View decision:', decisionId)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">기각 히스토리</h1>
          <p className="text-muted-foreground mt-1">
            과거에 기각된 안건을 기록하고, 비슷한 제안 시 참고할 수 있습니다
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          기각 대안 등록
        </Button>
      </div>

      {/* 필터 영역 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목, 사유, 키워드로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterMeeting} onValueChange={setFilterMeeting}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="미팅 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 미팅</SelectItem>
              {mockMeetings.map(meeting => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.code}: {meeting.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 통계 */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{mockRejectedAlternatives.length}</div>
            <div className="text-xs text-muted-foreground">총 기각된 안건</div>
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="text-lg font-semibold">{filteredItems.length}</div>
          <div className="text-xs text-muted-foreground">현재 필터 결과</div>
        </div>
      </div>

      {/* 목록 */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <XCircle className="empty-state-icon" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || filterMeeting !== 'all'
              ? '검색 결과가 없습니다'
              : '기각된 안건이 없습니다'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterMeeting !== 'all'
              ? '다른 검색어나 필터를 시도해보세요'
              : '미팅에서 기각된 안건을 기록하면 나중에 비슷한 제안 시 경고를 받을 수 있습니다'}
          </p>
          {!searchQuery && filterMeeting === 'all' && (
            <Button onClick={() => setShowAddForm(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              첫 기각 대안 등록하기
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map(item => (
            <RejectedAlternativeCard
              key={item.id}
              item={item}
              onViewMeeting={handleViewMeeting}
              onViewDecision={handleViewDecision}
            />
          ))}
        </div>
      )}

      {/* 등록 폼 시트 */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>기각 대안 등록</SheetTitle>
            <SheetDescription>
              미팅에서 기각된 안건을 기록합니다. 나중에 비슷한 제안이 나오면 경고가 표시됩니다.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <RejectedAlternativeForm
              meetings={mockMeetings}
              decisions={mockDecisions}
              onSubmit={handleAddRejected}
              onCancel={() => setShowAddForm(false)}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
