'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BreadcrumbItem, ItemCategory } from './types'
import { cn } from '@/lib/utils'

interface ContextCardBreadcrumbProps {
  items: BreadcrumbItem[]
  currentIndex: number
  onNavigate: (index: number) => void
  onBack: () => void
}

const categoryColors: Record<ItemCategory, string> = {
  decision: 'text-green-400',
  meeting: 'text-blue-400',
  screen: 'text-purple-400',
  implementation: 'text-gray-400',
}

export function ContextCardBreadcrumb({
  items,
  currentIndex,
  onNavigate,
  onBack,
}: ContextCardBreadcrumbProps) {
  if (items.length <= 1) return null

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      {/* 뒤로가기 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        disabled={currentIndex === 0}
        className="shrink-0 h-7 px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 브레드크럼 아이템들 */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex items-center shrink-0">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            <button
              onClick={() => onNavigate(index)}
              className={cn(
                "px-2 py-1 rounded text-xs transition-colors",
                index === currentIndex
                  ? cn("bg-secondary font-medium", categoryColors[item.category])
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.code}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
