'use client'

import { useState, useCallback, useEffect } from 'react'
import { GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { ContextCardHeader } from './context-card-header'
import { ContextCardContext } from './context-card-context'
import { ContextCardConnections } from './context-card-connections'
import { ContextCardConflicts } from './context-card-conflicts'
import { ContextCardHistory } from './context-card-history'
import { ContextCardBreadcrumb } from './context-card-breadcrumb'
import {
  ContextCardData,
  BreadcrumbItem,
  ConnectionItem,
  ConflictItem,
} from './types'

interface ContextCardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ContextCardData | null
  onNavigate?: (itemId: string, category: string) => void
  onViewInFlow?: (itemId: string) => void
}

export function ContextCard({
  open,
  onOpenChange,
  data,
  onNavigate,
  onViewInFlow,
}: ContextCardProps) {
  // 브레드크럼 히스토리 관리
  const [navigationHistory, setNavigationHistory] = useState<BreadcrumbItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 데이터 변경 시 브레드크럼 업데이트
  useEffect(() => {
    if (data) {
      const newItem: BreadcrumbItem = {
        id: data.item.id,
        code: data.item.code,
        title: data.item.title,
        category: data.item.category,
      }

      // 현재 인덱스 이후 히스토리 제거하고 새 아이템 추가
      setNavigationHistory(prev => {
        // 이미 같은 아이템이면 스킵
        if (prev.length > 0 && prev[currentIndex]?.id === newItem.id) {
          return prev
        }
        const newHistory = [...prev.slice(0, currentIndex + 1), newItem]
        setCurrentIndex(newHistory.length - 1)
        return newHistory
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.item.id, currentIndex])

  // 패널 닫을 때 히스토리 초기화
  const handleClose = useCallback(() => {
    onOpenChange(false)
    // 닫을 때 히스토리 초기화
    setTimeout(() => {
      setNavigationHistory([])
      setCurrentIndex(0)
    }, 300)
  }, [onOpenChange])

  // 연결 아이템 클릭
  const handleItemClick = useCallback((item: ConnectionItem) => {
    onNavigate?.(item.id, item.category)
  }, [onNavigate])

  // 충돌 아이템 클릭
  const handleConflictClick = useCallback((conflict: ConflictItem) => {
    onNavigate?.(conflict.id, 'decision')
  }, [onNavigate])

  // 미팅 클릭
  const handleMeetingClick = useCallback((meetingId: string) => {
    onNavigate?.(meetingId, 'meeting')
  }, [onNavigate])

  // 브레드크럼 네비게이션
  const handleBreadcrumbNavigate = useCallback((index: number) => {
    const item = navigationHistory[index]
    if (item) {
      setCurrentIndex(index)
      onNavigate?.(item.id, item.category)
    }
  }, [navigationHistory, onNavigate])

  // 뒤로가기
  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      const item = navigationHistory[newIndex]
      if (item) {
        setCurrentIndex(newIndex)
        onNavigate?.(item.id, item.category)
      }
    }
  }, [currentIndex, navigationHistory, onNavigate])

  // 플로우에서 보기
  const handleViewInFlow = useCallback(() => {
    if (data) {
      handleClose()
      setTimeout(() => {
        onViewInFlow?.(data.item.id)
      }, 300)
    }
  }, [data, handleClose, onViewInFlow])

  if (!data) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* 브레드크럼 네비게이션 */}
            {navigationHistory.length > 1 && (
              <ContextCardBreadcrumb
                items={navigationHistory}
                currentIndex={currentIndex}
                onNavigate={handleBreadcrumbNavigate}
                onBack={handleBack}
              />
            )}

            {/* 헤더 */}
            <ContextCardHeader
              code={data.item.code}
              title={data.item.title}
              category={data.item.category}
              status={data.item.status}
              owner={data.item.owner}
              createdAt={data.item.createdAt}
              onClose={handleClose}
            />

            <Separator />

            {/* 맥락 섹션 */}
            <ContextCardContext
              sourceMeeting={data.context?.sourceMeeting}
              reason={data.context?.reason}
              onMeetingClick={handleMeetingClick}
            />

            {data.context && <Separator />}

            {/* 연결된 항목 */}
            <ContextCardConnections
              precedents={data.connections.precedents}
              implementations={data.connections.implementations}
              affected={data.connections.affected}
              screens={data.connections.screens}
              onItemClick={handleItemClick}
            />

            {(data.connections.precedents.length > 0 ||
              data.connections.implementations.length > 0 ||
              data.connections.affected.length > 0 ||
              data.connections.screens.length > 0) && <Separator />}

            {/* 충돌 섹션 */}
            <ContextCardConflicts
              conflicts={data.conflicts}
              onConflictClick={handleConflictClick}
            />

            <Separator />

            {/* 히스토리 */}
            <ContextCardHistory history={data.history} />
          </div>
        </ScrollArea>

        {/* 하단 액션 바 */}
        <div className="p-4 border-t border-border bg-background/50">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewInFlow}
          >
            <GitMerge className="h-4 w-4 mr-2" />
            플로우에서 보기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// 타입 내보내기
export * from './types'
export { ContextCardHeader } from './context-card-header'
export { ContextCardContext } from './context-card-context'
export { ContextCardConnections } from './context-card-connections'
export { ContextCardConflicts } from './context-card-conflicts'
export { ContextCardHistory } from './context-card-history'
export { ContextCardBreadcrumb } from './context-card-breadcrumb'
