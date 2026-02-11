'use client'

import {
  GitBranch,
  Calendar,
  Layout,
  Code,
  Edit,
  Trash2,
  ExternalLink,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItemCategory, ItemStatus, Person } from './types'
import { cn } from '@/lib/utils'

interface ContextCardHeaderProps {
  code: string
  title: string
  category: ItemCategory
  status: ItemStatus
  owner?: Person
  createdAt: string
  source?: 'figma' | 'github' | 'internal'
  url?: string
  onClose?: () => void
  onEdit?: () => void
  onDelete?: () => void
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

const statusConfig: Record<ItemStatus, { label: string; color: string }> = {
  confirmed: { label: '확정', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  changed: { label: '변경됨', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cancelled: { label: '취소', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  pending: { label: '검토중', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  in_progress: { label: '진행중', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: '완료', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

const sourceConfig: Record<string, { label: string; color: string }> = {
  figma: { label: 'Figma', color: 'bg-purple-500/20 text-purple-400' },
  github: { label: 'GitHub', color: 'bg-gray-500/20 text-gray-400' },
  internal: { label: 'Internal', color: 'bg-blue-500/20 text-blue-400' },
}

export function ContextCardHeader({
  code,
  title,
  category,
  status,
  owner,
  createdAt,
  source,
  url,
  onClose,
  onEdit,
  onDelete,
}: ContextCardHeaderProps) {
  const CategoryIcon = categoryIcons[category]
  const statusInfo = statusConfig[status]
  const sourceInfo = source ? sourceConfig[source] : null

  return (
    <div className="space-y-4">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          닫기
        </Button>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="space-y-3">
        {/* 카테고리 + 코드 + 소스 배지 */}
        <div className="flex items-center gap-2">
          <CategoryIcon className={cn("h-5 w-5", categoryColors[category])} />
          <span className="font-mono text-sm text-muted-foreground">{code}</span>
          {sourceInfo && (
            <Badge variant="outline" className={cn("text-xs", sourceInfo.color)}>
              {sourceInfo.label}
            </Badge>
          )}
        </div>

        {/* 제목 + 상태 */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold leading-tight">{title}</h2>
          <Badge variant="outline" className={cn("shrink-0", statusInfo.color)}>
            {statusInfo.label}
          </Badge>
        </div>

        {/* 담당자 + 생성일 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {owner && (
            <div className="flex items-center gap-1">
              <span>담당:</span>
              <span className="text-foreground">{owner.name}</span>
              {owner.role && <span>({owner.role})</span>}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>생성:</span>
            <span>{createdAt}</span>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
            >
              <ExternalLink className="h-3 w-3" />
              열기
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
