'use client'

import { ArrowDownLeft, ArrowUpRight, GitBranch, Calendar, MonitorSmartphone, MessageSquare, Github, ExternalLink } from 'lucide-react'
import { Connection, ItemType, relationLabels } from './types'

interface TimelineConnectionsProps {
  sources: Connection[]
  impacts: Connection[]
  onConnectionClick?: (connection: Connection) => void
}

const typeIconMap: Record<ItemType, React.ReactNode> = {
  meeting: <Calendar className="h-3.5 w-3.5" />,
  decision: <GitBranch className="h-3.5 w-3.5" />,
  screen: <MonitorSmartphone className="h-3.5 w-3.5" />,
  github: <Github className="h-3.5 w-3.5" />,
  slack: <MessageSquare className="h-3.5 w-3.5" />,
}

const typeColorMap: Record<ItemType, string> = {
  meeting: 'text-blue-400',
  decision: 'text-teal-400',
  screen: 'text-purple-400',
  github: 'text-accent',
  slack: 'text-yellow-400',
}

function ConnectionItem({
  connection,
  direction,
  onClick,
}: {
  connection: Connection
  direction: 'source' | 'impact'
  onClick?: () => void
}) {
  const icon = typeIconMap[connection.type]
  const colorClass = typeColorMap[connection.type]

  // 관계 텍스트 생성
  const relationText = direction === 'source'
    ? `${connection.code} ${relationLabels[connection.relation]}`
    : `${connection.code} ${connection.title}`

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      {direction === 'impact' && (
        <span className="text-muted-foreground">→</span>
      )}
      <span className={`${colorClass}`}>{icon}</span>
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
        {relationText}
      </span>
      <ExternalLink className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

export function TimelineConnections({
  sources,
  impacts,
  onConnectionClick,
}: TimelineConnectionsProps) {
  const hasSources = sources.length > 0
  const hasImpacts = impacts.length > 0

  if (!hasSources && !hasImpacts) {
    return null
  }

  return (
    <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
      {/* Sources Section */}
      {hasSources && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span className="font-medium">출처</span>
          </div>
          <div className="space-y-1">
            {sources.map((source) => (
              <ConnectionItem
                key={source.id}
                connection={source}
                direction="source"
                onClick={() => onConnectionClick?.(source)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Impacts Section */}
      {hasImpacts && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span className="font-medium">영향</span>
          </div>
          <div className="space-y-1">
            {impacts.map((impact) => (
              <ConnectionItem
                key={impact.id}
                connection={impact}
                direction="impact"
                onClick={() => onConnectionClick?.(impact)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
