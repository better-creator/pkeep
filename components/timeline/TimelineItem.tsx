'use client'

import { useState, forwardRef } from 'react'
import { ChevronDown, ChevronRight, GitBranch, Calendar, Github, MessageSquare, ExternalLink, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TimelineConnections } from './TimelineConnections'
import { TimelineItem as TimelineItemType, Connection, ItemType } from './types'

interface TimelineItemProps {
  item: TimelineItemType
  isHighlighted?: boolean
  onConnectionClick?: (connection: Connection) => void
}

const typeConfig: Record<ItemType, {
  icon: React.ElementType
  color: string
  lightBg: string
  dotColor: string
}> = {
  decision: {
    icon: GitBranch,
    color: 'text-teal-500',
    lightBg: 'bg-teal-500/10',
    dotColor: 'bg-teal-500',
  },
  meeting: {
    icon: Calendar,
    color: 'text-blue-500',
    lightBg: 'bg-blue-500/10',
    dotColor: 'bg-blue-500',
  },
  github: {
    icon: Github,
    color: 'text-purple-500',
    lightBg: 'bg-purple-500/10',
    dotColor: 'bg-purple-500',
  },
  slack: {
    icon: MessageSquare,
    color: 'text-amber-500',
    lightBg: 'bg-amber-500/10',
    dotColor: 'bg-amber-500',
  },
  screen: {
    icon: GitBranch,
    color: 'text-purple-500',
    lightBg: 'bg-purple-500/10',
    dotColor: 'bg-purple-500',
  },
}

const statusConfig: Record<string, { label: string, className: string }> = {
  confirmed: { label: '확정', className: 'status-confirmed' },
  changed: { label: '변경됨', className: 'status-changed' },
  pending: { label: '검토중', className: 'status-pending' },
  superseded: { label: '대체됨', className: 'status-superseded' },
  deprecated: { label: '폐기', className: 'status-deprecated' },
  disabled: { label: '비활성', className: 'status-disabled' },
  draft: { label: '초안', className: 'status-draft' },
}

export const TimelineItemComponent = forwardRef<HTMLDivElement, TimelineItemProps>(
  function TimelineItemComponent({ item, isHighlighted, onConnectionClick }, ref) {
    const [isExpanded, setIsExpanded] = useState(false)
    const config = typeConfig[item.type]
    const Icon = config.icon

    const hasConnections =
      item.connections.sources.length > 0 || item.connections.impacts.length > 0

    const connectionCount =
      item.connections.sources.length + item.connections.impacts.length

    return (
      <div
        ref={ref}
        data-item-id={item.id}
        className={`relative pl-16 transition-all duration-300 ${
          isHighlighted ? 'scale-[1.02]' : ''
        }`}
      >
        {/* Timeline dot */}
        <div
          className={`absolute left-[22px] top-5 h-3 w-3 rounded-full ring-4 ring-background transition-all duration-300 ${
            config.dotColor
          } ${isHighlighted ? 'ring-primary/30 scale-125' : ''}`}
        />

        {/* Card */}
        <div
          className={`card-soft overflow-hidden transition-all duration-300 ${
            isHighlighted ? 'ring-2 ring-primary/50 shadow-lg' : ''
          }`}
        >
          {/* Main Content */}
          <div
            className="p-4 cursor-pointer group"
            onClick={() => hasConnections && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-xl ${config.lightBg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-mono text-primary font-medium">
                      {item.code}
                    </span>
                    {item.status && (
                      <Badge
                        variant="outline"
                        className={statusConfig[item.status].className}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                    )}
                    {item.event_type && (
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                      >
                        {item.event_type}
                      </Badge>
                    )}
                    {hasConnections && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>{connectionCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </p>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {item.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(item.url, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {hasConnections && (
                  <div className="p-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connections (Expandable) */}
          {hasConnections && isExpanded && (
            <div className="px-4 pb-4 animate-fade-in">
              <TimelineConnections
                sources={item.connections.sources}
                impacts={item.connections.impacts}
                onConnectionClick={onConnectionClick}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)
