'use client'

import {
  GitBranch,
  Calendar,
  Layout,
  Code,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConnectionItem, ItemCategory } from './types'
import { cn } from '@/lib/utils'

interface ContextCardConnectionsProps {
  precedents: ConnectionItem[]      // 선행 결정 (이것 때문에)
  implementations: ConnectionItem[] // 구현물 (이걸로 만들어짐)
  affected: ConnectionItem[]        // 영향받은 결정 (이것 때문에 바뀐 것)
  screens: ConnectionItem[]         // 연관 화면
  onItemClick?: (item: ConnectionItem) => void
}

const categoryIcons: Record<ItemCategory, typeof GitBranch> = {
  decision: GitBranch,
  meeting: Calendar,
  screen: Layout,
  implementation: Code,
}

const categoryColors: Record<ItemCategory, string> = {
  decision: 'text-green-500',
  meeting: 'text-blue-500',
  screen: 'text-purple-500',
  implementation: 'text-gray-400',
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  figma: { label: 'Figma', color: 'bg-purple-500/20 text-purple-400' },
  github: { label: 'GitHub', color: 'bg-gray-500/20 text-gray-400' },
}

interface ConnectionGroupProps {
  title: string
  description: string
  items: ConnectionItem[]
  onItemClick?: (item: ConnectionItem) => void
}

function ConnectionGroup({ title, description, items, onItemClick }: ConnectionGroupProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const CategoryIcon = categoryIcons[item.category]
          const sourceInfo = item.source ? sourceConfig[item.source] : null

          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="w-full flex items-start gap-2 p-2.5 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left group"
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CategoryIcon className={cn("h-4 w-4 shrink-0", categoryColors[item.category])} />
                  <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                  <span className="font-medium truncate">{item.title}</span>
                  {sourceInfo && (
                    <Badge variant="outline" className={cn("text-xs shrink-0", sourceInfo.color)}>
                      {sourceInfo.label}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 pl-6 truncate">
                    &ldquo;{item.description}&rdquo;
                  </p>
                )}
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ContextCardConnections({
  precedents,
  implementations,
  affected,
  screens,
  onItemClick,
}: ContextCardConnectionsProps) {
  const hasAnyConnections =
    precedents.length > 0 ||
    implementations.length > 0 ||
    affected.length > 0 ||
    screens.length > 0

  if (!hasAnyConnections) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span className="text-base">🔗</span>
        연결된 항목
      </h3>

      <div className="space-y-4">
        {/* 선행 결정 */}
        <ConnectionGroup
          title="선행 결정"
          description="이것 때문에 이 결정이 나옴"
          items={precedents}
          onItemClick={onItemClick}
        />

        {/* 구현 */}
        <ConnectionGroup
          title="구현"
          description="이 결정으로 만들어진 것"
          items={implementations}
          onItemClick={onItemClick}
        />

        {/* 관련 화면 */}
        <ConnectionGroup
          title="관련 화면"
          description="이 결정이 반영된 화면"
          items={screens}
          onItemClick={onItemClick}
        />

        {/* 영향받은 결정 */}
        <ConnectionGroup
          title="영향받은 결정"
          description="이것 때문에 바뀌거나 취소된 결정"
          items={affected}
          onItemClick={onItemClick}
        />
      </div>
    </div>
  )
}
