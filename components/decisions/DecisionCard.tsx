'use client'

import { memo } from 'react'
import {
  User,
  Users,
  Calendar,
  ArrowRight,
  ChevronRight,
  History,
  GitBranch,
  Image,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Decision,
  DecisionMaker,
  decisionStatusConfig,
  decisionHierarchyConfig,
} from './types'

interface DecisionCardProps {
  decision: Decision
  isSelected?: boolean
  showHierarchy?: boolean
  showRevisions?: boolean
  onSelect?: (decision: Decision) => void
  onViewHistory?: (decision: Decision) => void
  onViewParent?: (parentId: string) => void
  onViewSuperseding?: (supersededById: string) => void
  compact?: boolean
}

export const DecisionCard = memo(function DecisionCard({
  decision,
  isSelected = false,
  showHierarchy = true,
  showRevisions = false,
  onSelect,
  onViewHistory,
  onViewParent,
  onViewSuperseding,
  compact = false,
}: DecisionCardProps) {
  const statusConfig = decisionStatusConfig[decision.status]
  const StatusIcon = statusConfig.icon
  const isInactive = ['superseded', 'deprecated', 'disabled'].includes(decision.status)

  // 결정자 표시
  const renderDecisionMaker = (maker: DecisionMaker, size: 'sm' | 'md' = 'sm') => {
    const avatarSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

    return (
      <div key={maker.id} className="flex items-center gap-1.5">
        <Avatar className={avatarSize}>
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {maker.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(textSize, 'text-muted-foreground')}>{maker.name}</span>
        {maker.decidedAt && (
          <span className="text-xs text-muted-foreground/60">
            {new Date(maker.decidedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(decision)}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-border hover:bg-muted/30',
          isInactive && 'opacity-60'
        )}
      >
        {/* 상태 아이콘 */}
        <div className={cn('p-1.5 rounded-lg', statusConfig.bgColor)}>
          <StatusIcon className={cn('h-4 w-4', statusConfig.textColor)} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{decision.code}</span>
            <span className={cn('font-medium text-sm truncate', isInactive && 'line-through')}>{decision.title}</span>
          </div>
        </div>

        {/* 결정자 */}
        <div className="flex items-center gap-1">
          {renderDecisionMaker(decision.owner)}
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect?.(decision)}
      className={cn(
        'group relative p-4 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/50 hover:border-border hover:bg-muted/30',
        isInactive && 'opacity-70'
      )}
    >
      {/* 상단: 코드 + 상태 + 위계 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{decision.code}</span>
          <Badge variant="outline" className={cn('text-xs px-1.5 py-0', statusConfig.bgColor, statusConfig.textColor)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          {showHierarchy && decision.hierarchy !== 'root' && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {decisionHierarchyConfig[decision.hierarchy].label}
            </Badge>
          )}
          {decision.currentVersion > 1 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 text-purple-600 bg-purple-50">
              <History className="h-3 w-3 mr-1" />
              v{decision.currentVersion}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {decision.date}
        </span>
      </div>

      {/* 제목 */}
      <h4 className={cn(
        'font-semibold text-base mb-2',
        isInactive && 'line-through text-muted-foreground'
      )}>
        {decision.title}
      </h4>

      {/* 비주얼 컨텍스트 */}
      {decision.visual && (
        <div className="flex items-start gap-3 mb-3">
          {/* 썸네일 */}
          {decision.visual.thumbnail && (
            <div className="w-20 h-20 rounded-xl bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center overflow-hidden">
              <Image className="h-6 w-6 text-muted-foreground/20" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* 컬러 칩 */}
            {decision.visual.colorChips && decision.visual.colorChips.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                {decision.visual.colorChips.map((color, ci) => (
                  <div key={ci} className="flex items-center gap-1">
                    <div
                      className="h-5 w-5 rounded-md border border-black/10 shadow-inner"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">{color}</span>
                  </div>
                ))}
              </div>
            )}
            {/* 채널 */}
            {decision.visual.channel && (
              <Badge variant="outline" className="text-xs mb-1">{decision.visual.channel}</Badge>
            )}
            {/* 레퍼런스 미니 갤러리 */}
            {decision.visual.referenceImages && decision.visual.referenceImages.length > 0 && (
              <div className="flex gap-1.5 mt-1">
                {decision.visual.referenceImages.slice(0, 3).map((_, ri) => (
                  <div key={ri} className="h-10 w-10 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center">
                    <Image className="h-3.5 w-3.5 text-muted-foreground/20" />
                  </div>
                ))}
                {decision.visual.referenceImages.length > 3 && (
                  <div className="h-10 w-10 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">+{decision.visual.referenceImages.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 설명 */}
      {decision.content && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {decision.content}
        </p>
      )}

      {/* 위계 관계 표시 */}
      {showHierarchy && (decision.parentDecisionId || decision.supersededById || decision.supersedes) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {decision.parentDecisionId && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewParent?.(decision.parentDecisionId!)
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
            >
              <GitBranch className="h-3 w-3" />
              상위 결정 보기
            </button>
          )}
          {decision.supersededById && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewSuperseding?.(decision.supersededById!)
              }}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-md"
            >
              <ArrowRight className="h-3 w-3" />
              새 결정 보기
            </button>
          )}
          {decision.supersedes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <History className="h-3 w-3" />
              이전 결정 대체함
            </span>
          )}
        </div>
      )}

      {/* 결정자 정보 */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          {/* Owner */}
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {renderDecisionMaker(decision.owner, 'md')}
          </div>

          {/* Approvers */}
          {decision.approvers && decision.approvers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">|</span>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">승인:</span>
              <div className="flex -space-x-1">
                {decision.approvers.slice(0, 3).map((approver) => (
                  <Avatar key={approver.id} className="h-5 w-5 border-2 border-background">
                    <AvatarFallback className="text-[8px] bg-emerald-100 text-emerald-700">
                      {approver.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {decision.approvers.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{decision.approvers.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 수정 이력 보기 */}
        {showRevisions && decision.revisions && decision.revisions.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewHistory?.(decision)
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <History className="h-3 w-3" />
            {decision.revisions.length}개 변경
          </button>
        )}
      </div>

      {/* 키워드/영역 */}
      {(decision.area || (decision.keywords && decision.keywords.length > 0)) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {decision.area && (
            <Badge variant="secondary" className="text-xs">
              {decision.area}
            </Badge>
          )}
          {decision.keywords?.slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
})
