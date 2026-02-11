'use client'

import { useState, useRef, useCallback } from 'react'
import { Filter, Clock, Download, List, GitMerge, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { TimelineItemComponent } from './TimelineItem'
import { FlowView } from './FlowView'
import { TimelineItem, Connection } from './types'
import { CreateDecisionForm } from '@/components/decisions'
import { useRouter } from 'next/navigation'

interface TimelineViewProps {
  items: TimelineItem[]
  teamId: string
  projectId: string
}

type ViewMode = 'list' | 'flow'

export function TimelineView({ items, teamId, projectId }: TimelineViewProps) {
  const router = useRouter()
  const [filterType, setFilterType] = useState<string>('all')
  const [filterScreen, setFilterScreen] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('flow')
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [showNewDecisionPanel, setShowNewDecisionPanel] = useState(false)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false
    // Screen filter would check connections to screens
    return true
  })

  // Group by date
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = []
    }
    acc[item.date].push(item)
    return acc
  }, {} as Record<string, TimelineItem[]>)

  const isEmpty = Object.keys(groupedItems).length === 0

  // Handle connection click
  const handleConnectionClick = useCallback((connection: Connection) => {
    // Check if the item exists in current timeline
    const targetItem = items.find(
      (item) => item.code === connection.code || item.id === connection.id
    )

    if (targetItem) {
      // Scroll to and highlight the item
      setHighlightedItemId(targetItem.id)
      const ref = itemRefs.current.get(targetItem.id)
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Remove highlight after animation
      setTimeout(() => setHighlightedItemId(null), 2000)
    } else {
      // Navigate to the appropriate page
      switch (connection.type) {
        case 'decision':
          router.push(`/${teamId}/${projectId}/decisions`)
          break
        case 'meeting':
          router.push(`/${teamId}/${projectId}/meetings`)
          break
        case 'screen':
          router.push(`/${teamId}/${projectId}/screens`)
          break
        default:
          // For external links like GitHub, we could open URL
          break
      }
    }
  }, [items, teamId, projectId, router])

  // Store ref for each item
  const setItemRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    if (ref) {
      itemRefs.current.set(id, ref)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-secondary/50 p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-lg ${
                viewMode === 'list' ? 'bg-background shadow-sm' : ''
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1.5" />
              리스트
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-lg ${
                viewMode === 'flow' ? 'bg-background shadow-sm' : ''
              }`}
              onClick={() => setViewMode('flow')}
            >
              <GitMerge className="h-4 w-4 mr-1.5" />
              플로우
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-border/50 hover:bg-secondary/50">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => setShowNewDecisionPanel(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            새 결정
          </Button>
        </div>
      </div>

      {/* 새 결정 추가 슬라이드 패널 */}
      <Sheet open={showNewDecisionPanel} onOpenChange={setShowNewDecisionPanel}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>새 결정 추가</SheetTitle>
            <SheetDescription>
              프로젝트의 새로운 결정사항을 기록합니다. 유사한 과거 결정이 있으면 자동으로 알려드립니다.
            </SheetDescription>
          </SheetHeader>
          <CreateDecisionForm
            projectId={projectId}
            onSuccess={() => {
              setShowNewDecisionPanel(false)
              // TODO: 타임라인 새로고침
              router.refresh()
            }}
            onCancel={() => setShowNewDecisionPanel(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Filters - 리스트 뷰에서만 표시 */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44 h-9 rounded-xl bg-secondary/50 border-0">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="이벤트 타입" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="decision">결정</SelectItem>
                <SelectItem value="meeting">미팅</SelectItem>
                <SelectItem value="github">Github</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterScreen} onValueChange={setFilterScreen}>
              <SelectTrigger className="w-48 h-9 rounded-xl bg-secondary/50 border-0">
                <SelectValue placeholder="화면 필터" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">전체 화면</SelectItem>
                <SelectItem value="SCR-001">SCR-001: Home</SelectItem>
                <SelectItem value="SCR-002">SCR-002: Dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="h-full flex items-center justify-center">
            <div className="empty-state rounded-2xl bg-secondary/30">
              <Clock className="empty-state-icon" />
              <h3 className="text-lg font-medium mb-2">타임라인 이벤트가 없습니다</h3>
              <p className="text-muted-foreground max-w-sm">
                결정, 미팅, 외부 도구를 연결하면 여기에 이벤트가 표시됩니다.
              </p>
            </div>
          </div>
        )}

        {/* List View */}
        {!isEmpty && viewMode === 'list' && (
          <div className="relative h-full overflow-auto p-4">
            {/* Timeline line */}
            <div className="timeline-line left-[27px] top-8 bottom-8" />

            <div className="space-y-10">
              {Object.entries(groupedItems).map(([date, dateItems], groupIndex) => (
                <div
                  key={date}
                  className="animate-fade-in"
                  style={{ animationDelay: `${groupIndex * 100}ms` }}
                >
                  {/* Date header */}
                  <div className="relative pl-16 mb-5">
                    <div className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {new Date(date).toLocaleDateString('ko-KR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                  </div>

                  {/* Items for this date */}
                  <div className="space-y-3">
                    {dateItems.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="animate-slide-up"
                        style={{
                          animationDelay: `${groupIndex * 100 + itemIndex * 50}ms`,
                        }}
                      >
                        <TimelineItemComponent
                          ref={(ref) => setItemRef(item.id, ref)}
                          item={item}
                          isHighlighted={highlightedItemId === item.id}
                          onConnectionClick={handleConnectionClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flow View */}
        {!isEmpty && viewMode === 'flow' && (
          <div className="h-full">
            <FlowView items={filteredItems} />
          </div>
        )}
      </div>
    </div>
  )
}
