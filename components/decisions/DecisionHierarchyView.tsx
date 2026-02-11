'use client'

import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  GitBranch,
  Layers,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  History,
  AlertTriangle,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DecisionCard } from './DecisionCard'
import {
  Decision,
  DecisionStatus,
  DecisionGroupBy,
  DecisionFilter,
} from './types'

interface DecisionHierarchyViewProps {
  decisions: Decision[]
  onSelectDecision?: (decision: Decision) => void
  selectedDecisionId?: string
}

// 상태 탭 설정
type StatusTab = 'all' | DecisionStatus

interface StatusTabConfig {
  label: string
  icon: typeof CheckCircle
  color: string
  bgColor: string
  textColor: string
}

const statusTabs: Record<StatusTab, StatusTabConfig> = {
  all: {
    label: '전체',
    icon: Layers,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  confirmed: {
    label: '확정',
    icon: CheckCircle,
    color: '#10b981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
  },
  pending: {
    label: '검토중',
    icon: AlertTriangle,
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  draft: {
    label: '초안',
    icon: Clock,
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  superseded: {
    label: '대체됨',
    icon: History,
    color: '#8b5cf6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  deprecated: {
    label: '폐기',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  disabled: {
    label: '비활성',
    icon: Archive,
    color: '#94a3b8',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
}

// 그룹별 설정
const groupByConfig: Record<DecisionGroupBy, { label: string; icon: typeof GitBranch }> = {
  none: { label: '그룹 없음', icon: Layers },
  status: { label: '상태별', icon: GitBranch },
  owner: { label: '결정자별', icon: Users },
  area: { label: '영역별', icon: Layers },
  date: { label: '날짜별', icon: Calendar },
  hierarchy: { label: '위계별', icon: GitBranch },
}

export function DecisionHierarchyView({
  decisions,
  onSelectDecision,
  selectedDecisionId,
}: DecisionHierarchyViewProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [groupBy, setGroupBy] = useState<DecisionGroupBy>('none')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['confirmed', 'pending', 'draft', 'all']))
  const [filter, setFilter] = useState<DecisionFilter>({
    showDisabled: true,
    showSuperseded: true,
  })

  // 상태별 카운트 계산
  const statusCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      all: decisions.length,
      draft: 0,
      pending: 0,
      confirmed: 0,
      superseded: 0,
      deprecated: 0,
      disabled: 0,
    }

    decisions.forEach((d) => {
      counts[d.status]++
    })

    return counts
  }, [decisions])

  // 탭 + 추가 필터 적용
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      // 탭 필터
      if (activeTab !== 'all' && d.status !== activeTab) return false
      // 추가 필터
      if (!filter.showDisabled && d.status === 'disabled') return false
      if (!filter.showSuperseded && d.status === 'superseded') return false
      if (filter.area && d.area !== filter.area) return false
      if (filter.ownerId && d.owner.id !== filter.ownerId) return false
      return true
    })
  }, [decisions, activeTab, filter])

  // 그룹핑
  const groupedDecisions = useMemo(() => {
    const groups: Record<string, { label: string; decisions: Decision[]; config?: any }> = {}

    if (groupBy === 'none' || groupBy === 'status') {
      // 상태 탭이 활성화되어 있으면 그룹핑 없이 리스트로
      groups['all'] = { label: '결정 목록', decisions: filteredDecisions }
      return groups
    }

    filteredDecisions.forEach((decision) => {
      let key: string
      let label: string
      let config: any

      switch (groupBy) {
        case 'owner':
          key = decision.owner.id
          label = decision.owner.name
          break
        case 'area':
          key = decision.area || 'none'
          label = decision.area || '미분류'
          break
        case 'date':
          key = decision.date.slice(0, 7) // YYYY-MM
          label = new Date(decision.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
          break
        case 'hierarchy':
          key = decision.hierarchy
          label = decision.hierarchy === 'root' ? '최상위 결정' : decision.hierarchy === 'child' ? '하위 결정' : '수정본'
          break
        default:
          key = 'all'
          label = '모든 결정'
      }

      if (!groups[key]) {
        groups[key] = { label, decisions: [], config }
      }
      groups[key].decisions.push(decision)
    })

    return groups
  }, [filteredDecisions, groupBy])

  // 그룹 정렬
  const sortedGroupKeys = useMemo(() => {
    const keys = Object.keys(groupedDecisions)

    if (groupBy === 'date') {
      return keys.sort((a, b) => b.localeCompare(a)) // 최신순
    }

    return keys.sort()
  }, [groupedDecisions, groupBy])

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  // 활성 탭 목록 (카운트가 0인 것 제외, 단 all은 항상 표시)
  const visibleTabs = useMemo(() => {
    const tabs: StatusTab[] = ['all', 'confirmed', 'pending', 'draft']

    // 비활성 상태들은 카운트가 있을 때만 표시
    if (statusCounts.superseded > 0) tabs.push('superseded')
    if (statusCounts.deprecated > 0) tabs.push('deprecated')
    if (statusCounts.disabled > 0) tabs.push('disabled')

    return tabs
  }, [statusCounts])

  return (
    <div className="space-y-4">
      {/* 상태 탭 */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl overflow-x-auto">
        {visibleTabs.map((tab) => {
          const config = statusTabs[tab]
          const Icon = config.icon
          const count = statusCounts[tab]
          const isActive = activeTab === tab

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                // 상태 탭 선택 시 그룹핑은 none으로
                if (tab !== 'all') {
                  setGroupBy('none')
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? `${config.bgColor} ${config.textColor} shadow-sm`
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? config.color : undefined }} />
              <span>{config.label}</span>
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className={cn(
                  'text-xs px-1.5 py-0 h-5',
                  isActive && config.textColor
                )}
              >
                {count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        {/* 현재 필터 상태 */}
        <div className="flex items-center gap-2 text-sm">
          {activeTab !== 'all' && (
            <Badge className={cn('gap-1', statusTabs[activeTab].bgColor, statusTabs[activeTab].textColor, 'border-0')}>
              {(() => {
                const Icon = statusTabs[activeTab].icon
                return <Icon className="h-3 w-3" />
              })()}
              {statusTabs[activeTab].label} 결정
            </Badge>
          )}
          <span className="text-muted-foreground">
            {filteredDecisions.length}건 표시
          </span>
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center gap-2">
          {/* 그룹핑 (전체 탭에서만 표시) */}
          {activeTab === 'all' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" />
                  {groupByConfig[groupBy].label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>그룹 기준</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(groupByConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={groupBy === key}
                    onCheckedChange={() => setGroupBy(key as DecisionGroupBy)}
                  >
                    <config.icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 추가 필터 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                필터
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>표시 옵션</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter.showDisabled}
                onCheckedChange={(checked) => setFilter({ ...filter, showDisabled: checked })}
              >
                {filter.showDisabled ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                비활성 결정 표시
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.showSuperseded}
                onCheckedChange={(checked) => setFilter({ ...filter, showSuperseded: checked })}
              >
                {filter.showSuperseded ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                대체된 결정 표시
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 결정 목록 */}
      <div className="space-y-3">
        {sortedGroupKeys.map((key) => {
          const group = groupedDecisions[key]
          const isExpanded = expandedGroups.has(key)
          const showGroupHeader = groupBy !== 'none' && groupBy !== 'status'

          if (!showGroupHeader) {
            // 그룹 없이 리스트로 표시
            return (
              <div key={key} className="space-y-2">
                {group.decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    isSelected={selectedDecisionId === decision.id}
                    onSelect={onSelectDecision}
                    showRevisions
                    showHierarchy
                  />
                ))}
              </div>
            )
          }

          // 그룹 헤더와 함께 표시
          return (
            <div key={key} className="border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(key)}
                className={cn(
                  'w-full flex items-center justify-between p-3 transition-colors',
                  isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{group.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {group.decisions.length}
                  </Badge>
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2 bg-background">
                  {group.decisions.map((decision) => (
                    <DecisionCard
                      key={decision.id}
                      decision={decision}
                      isSelected={selectedDecisionId === decision.id}
                      onSelect={onSelectDecision}
                      showRevisions
                      showHierarchy
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 빈 상태 */}
      {filteredDecisions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>표시할 결정이 없습니다</p>
          <p className="text-sm mt-1">
            {activeTab !== 'all' ? '다른 상태 탭을 선택하거나 ' : ''}필터 조건을 변경해보세요
          </p>
        </div>
      )}
    </div>
  )
}
