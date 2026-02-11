'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  X,
  GripVertical,
  Edit2,
  Check,
  Calendar,
  ListTodo,
  User,
  Tag,
  FolderOpen,
  GitBranch,
  Layout,
  Code,
  FileText,
  Github,
  Figma,
  MessageSquare,
  HardDrive,
  BookOpen,
  Video,
  Edit3,
  LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimelineItem, ItemCategory, ItemSource, categoryConfig } from '@/components/timeline/types'

interface AffinityViewProps {
  items: TimelineItem[]
}

// 그룹핑 기준 타입
type GroupingMode = 'meeting' | 'task' | 'owner' | 'topic' | 'custom'

// 포스트잇 색상 (파스텔톤)
const stickyColors = [
  { bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-900', hex: '#fef08a' },
  { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-900', hex: '#fbcfe8' },
  { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900', hex: '#bfdbfe' },
  { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-900', hex: '#bbf7d0' },
  { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900', hex: '#e9d5ff' },
  { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-900', hex: '#fed7aa' },
]

// 발화/카드 타입
interface Utterance {
  id: string
  content: string
  speaker?: string
  source: string
  sourceCode: string
  sourceType: 'meeting' | 'decision' | 'github' | 'task'
  category?: ItemCategory
  itemSource?: ItemSource
  tags?: string[]
  itemId: string
  meetingId?: string
  taskId?: string
  ownerId?: string
  date?: string
}

// 그룹 타입
interface AffinityGroup {
  id: string
  title: string
  subtitle?: string
  colorIndex: number
  utterances: Utterance[]
  isCollapsed: boolean
}

// 아이템에서 발화 추출
function extractUtterances(items: TimelineItem[]): Utterance[] {
  const utterances: Utterance[] = []

  items.forEach(item => {
    // 미팅에서 발화 추출
    if (item.category === 'meeting' && item.description) {
      const parts = item.description.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0)
      parts.forEach((part, idx) => {
        utterances.push({
          id: `${item.id}-utt-${idx}`,
          content: part,
          speaker: item.owner?.name,
          source: categoryConfig.meeting.label,
          sourceCode: item.code,
          sourceType: 'meeting',
          category: item.category,
          itemSource: item.source,
          itemId: item.id,
          meetingId: item.id,
          ownerId: item.owner?.id,
          date: item.date,
        })
      })
    }

    // 결정에서 발화 추출
    if (item.category === 'decision') {
      // 결정 제목
      utterances.push({
        id: `${item.id}-dec`,
        content: item.title,
        speaker: item.owner?.name,
        source: categoryConfig.decision.label,
        sourceCode: item.code,
        sourceType: 'decision',
        category: item.category,
        itemSource: item.source,
        tags: item.status ? [item.status] : undefined,
        itemId: item.id,
        meetingId: item.connections.sources.find(s => s.type === 'meeting')?.id,
        ownerId: item.owner?.id,
        date: item.date,
      })

      // 결정 설명
      if (item.description) {
        utterances.push({
          id: `${item.id}-desc`,
          content: item.description,
          speaker: item.owner?.name,
          source: categoryConfig.decision.label,
          sourceCode: item.code,
          sourceType: 'decision',
          category: item.category,
          itemSource: item.source,
          itemId: item.id,
          meetingId: item.connections.sources.find(s => s.type === 'meeting')?.id,
          ownerId: item.owner?.id,
          date: item.date,
        })
      }

      // 태스크 발화
      if (item.tasks) {
        item.tasks.forEach(task => {
          utterances.push({
            id: `${item.id}-task-${task.id}`,
            content: task.title,
            speaker: task.assignee?.name,
            source: '태스크',
            sourceCode: item.code,
            sourceType: 'task',
            category: item.category,
            itemSource: item.source,
            tags: [task.status],
            itemId: item.id,
            taskId: task.id,
            ownerId: task.assignee?.id,
            date: item.date,
          })
        })
      }
    }

    // 구현(Github)에서 발화 추출
    if (item.category === 'implementation') {
      utterances.push({
        id: `${item.id}-gh`,
        content: item.title,
        speaker: item.owner?.name,
        source: categoryConfig.implementation.label,
        sourceCode: item.code,
        sourceType: 'github',
        category: item.category,
        itemSource: item.source,
        itemId: item.id,
        ownerId: item.owner?.id,
        date: item.date,
      })
    }

    // 화면에서 발화 추출
    if (item.category === 'screen') {
      utterances.push({
        id: `${item.id}-scr`,
        content: item.title + (item.description ? ` - ${item.description}` : ''),
        speaker: item.owner?.name,
        source: categoryConfig.screen.label,
        sourceCode: item.code,
        sourceType: 'decision',
        category: item.category,
        itemSource: item.source,
        itemId: item.id,
        ownerId: item.owner?.id,
        date: item.date,
      })
    }

    // 문서에서 발화 추출
    if (item.category === 'document') {
      utterances.push({
        id: `${item.id}-doc`,
        content: item.title + (item.description ? ` - ${item.description}` : ''),
        speaker: item.owner?.name,
        source: categoryConfig.document.label,
        sourceCode: item.code,
        sourceType: 'decision',
        category: item.category,
        itemSource: item.source,
        itemId: item.id,
        ownerId: item.owner?.id,
        date: item.date,
      })
    }
  })

  return utterances
}

// 그룹핑 모드에 따라 그룹 생성
function createGroups(utterances: Utterance[], mode: GroupingMode, items: TimelineItem[]): AffinityGroup[] {
  const groups: AffinityGroup[] = []

  switch (mode) {
    case 'meeting': {
      // 회의록별 그룹핑
      const meetings = items.filter(i => i.category === 'meeting')
      meetings.forEach((meeting, idx) => {
        const relatedUtterances = utterances.filter(u =>
          u.meetingId === meeting.id ||
          u.itemId === meeting.id
        )
        if (relatedUtterances.length > 0) {
          groups.push({
            id: `meeting-${meeting.id}`,
            title: meeting.title,
            subtitle: `${meeting.code} · ${new Date(meeting.date).toLocaleDateString('ko-KR')}`,
            colorIndex: idx % stickyColors.length,
            utterances: relatedUtterances,
            isCollapsed: false,
          })
        }
      })

      // 회의와 연결되지 않은 항목
      const unlinked = utterances.filter(u => !u.meetingId && u.sourceType !== 'meeting')
      if (unlinked.length > 0) {
        groups.push({
          id: 'unlinked',
          title: '기타',
          subtitle: '회의와 연결되지 않은 항목',
          colorIndex: groups.length % stickyColors.length,
          utterances: unlinked,
          isCollapsed: false,
        })
      }
      break
    }

    case 'task': {
      // 태스크 상태별 그룹핑
      const taskStatuses = [
        { id: 'todo', label: '할 일', subtitle: '아직 시작하지 않은 태스크' },
        { id: 'in_progress', label: '진행 중', subtitle: '현재 작업 중인 태스크' },
        { id: 'done', label: '완료', subtitle: '완료된 태스크' },
      ]

      taskStatuses.forEach((status, idx) => {
        const statusUtterances = utterances.filter(u =>
          u.sourceType === 'task' && u.tags?.includes(status.id)
        )
        if (statusUtterances.length > 0) {
          groups.push({
            id: `task-${status.id}`,
            title: status.label,
            subtitle: status.subtitle,
            colorIndex: idx,
            utterances: statusUtterances,
            isCollapsed: false,
          })
        }
      })

      // 태스크가 아닌 항목 (결정, 논의 등)
      const nonTasks = utterances.filter(u => u.sourceType !== 'task')
      if (nonTasks.length > 0) {
        groups.push({
          id: 'non-task',
          title: '논의/결정',
          subtitle: '태스크 외 항목',
          colorIndex: 3,
          utterances: nonTasks,
          isCollapsed: true,
        })
      }
      break
    }

    case 'owner': {
      // 담당자별 그룹핑
      const ownerMap = new Map<string, { name: string; utterances: Utterance[] }>()

      utterances.forEach(u => {
        const ownerId = u.ownerId || 'unknown'
        const ownerName = u.speaker || '미지정'
        if (!ownerMap.has(ownerId)) {
          ownerMap.set(ownerId, { name: ownerName, utterances: [] })
        }
        ownerMap.get(ownerId)!.utterances.push(u)
      })

      let idx = 0
      ownerMap.forEach((data, ownerId) => {
        groups.push({
          id: `owner-${ownerId}`,
          title: data.name,
          subtitle: `${data.utterances.length}개 항목`,
          colorIndex: idx % stickyColors.length,
          utterances: data.utterances,
          isCollapsed: false,
        })
        idx++
      })
      break
    }

    case 'topic': {
      // 주제별 자동 분류 (키워드 기반)
      const topics = [
        { id: 'ui', label: 'UI/UX', keywords: ['ui', 'ux', '디자인', '화면', '테마', '색상', '뷰', '타임라인', '레이아웃'] },
        { id: 'auth', label: '인증/로그인', keywords: ['로그인', '인증', 'oauth', '카카오', '구글', '소셜', '회원'] },
        { id: 'tech', label: '기술 스택', keywords: ['next', 'react', '프레임워크', '기술', '구현', '개발', '설정'] },
        { id: 'meeting', label: '회의/논의', keywords: ['회의', '논의', '리뷰', '검토', '미팅', '킥오프'] },
      ]

      const assigned = new Set<string>()

      topics.forEach((topic, idx) => {
        const topicUtterances = utterances.filter(u => {
          if (assigned.has(u.id)) return false
          const content = u.content.toLowerCase()
          const matches = topic.keywords.some(kw => content.includes(kw))
          if (matches) assigned.add(u.id)
          return matches
        })

        if (topicUtterances.length > 0) {
          groups.push({
            id: `topic-${topic.id}`,
            title: topic.label,
            subtitle: `${topicUtterances.length}개 항목`,
            colorIndex: idx % stickyColors.length,
            utterances: topicUtterances,
            isCollapsed: false,
          })
        }
      })

      // 분류되지 않은 항목
      const unassigned = utterances.filter(u => !assigned.has(u.id))
      if (unassigned.length > 0) {
        groups.push({
          id: 'topic-other',
          title: '기타',
          subtitle: '자동 분류되지 않은 항목',
          colorIndex: groups.length % stickyColors.length,
          utterances: unassigned,
          isCollapsed: false,
        })
      }
      break
    }

    case 'custom':
    default: {
      // 커스텀 모드 - 모두 미분류에 넣고 사용자가 직접 분류
      groups.push({
        id: 'uncategorized',
        title: '미분류',
        subtitle: '드래그하여 그룹을 만드세요',
        colorIndex: 0,
        utterances: utterances,
        isCollapsed: false,
      })
      break
    }
  }

  return groups
}

// 카테고리별 아이콘 매핑
const categoryIcons: Record<ItemCategory, LucideIcon> = {
  meeting: Calendar,
  decision: GitBranch,
  screen: Layout,
  implementation: Code,
  document: FileText,
}

// 소스별 아이콘 매핑
const sourceIcons: Record<ItemSource, LucideIcon> = {
  github: Github,
  figma: Figma,
  slack: MessageSquare,
  google_drive: HardDrive,
  notion: BookOpen,
  zoom: Video,
  manual: Edit3,
}

// 포스트잇 카드 컴포넌트
function StickyNote({
  utterance,
  colorIndex,
  onDragStart,
  isDragging,
}: {
  utterance: Utterance
  colorIndex: number
  onDragStart: (e: React.DragEvent, utterance: Utterance) => void
  isDragging: boolean
}) {
  const color = stickyColors[colorIndex % stickyColors.length]

  // 카테고리 아이콘 (주요 아이콘)
  const CategoryIcon = utterance.category
    ? categoryIcons[utterance.category]
    : {
        meeting: Calendar,
        decision: GitBranch,
        github: Code,
        task: ListTodo,
      }[utterance.sourceType] || Calendar

  // 소스 아이콘 (작은 뱃지)
  const SourceIcon = utterance.itemSource
    ? sourceIcons[utterance.itemSource]
    : Edit3

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, utterance)}
      className={`
        group relative p-3 rounded-lg shadow-md cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${color.bg} ${color.border} border-2 ${color.text}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
      style={{
        transform: `rotate(${(Math.random() * 2 - 1) * 0.5}deg)`,
      }}
    >
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4" />
      </div>

      <p className="text-sm font-medium leading-snug mb-2">{utterance.content}</p>

      <div className="flex items-center justify-between text-[10px] opacity-70">
        <div className="flex items-center gap-1.5">
          <CategoryIcon className="h-3 w-3" />
          <span>{utterance.sourceCode}</span>
          {utterance.itemSource && (
            <SourceIcon className="h-2.5 w-2.5 opacity-60" />
          )}
        </div>
        {utterance.speaker && (
          <span>{utterance.speaker}</span>
        )}
      </div>

      {utterance.tags && utterance.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {utterance.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-black/10">
              {tag === 'todo' ? '할 일' : tag === 'in_progress' ? '진행 중' : tag === 'done' ? '완료' : tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 그룹 컴포넌트
function AffinityCluster({
  group,
  onDrop,
  onDragOver,
  onDragStart,
  onTitleChange,
  onToggleCollapse,
  onRemove,
  onColorChange,
  draggingUtterance,
  canRemove,
}: {
  group: AffinityGroup
  onDrop: (e: React.DragEvent, groupId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (e: React.DragEvent, utterance: Utterance) => void
  onTitleChange: (groupId: string, title: string) => void
  onToggleCollapse: (groupId: string) => void
  onRemove: (groupId: string) => void
  onColorChange: (groupId: string) => void
  draggingUtterance: Utterance | null
  canRemove: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(group.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const color = stickyColors[group.colorIndex % stickyColors.length]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveTitle = () => {
    onTitleChange(group.id, editTitle)
    setIsEditing(false)
  }

  return (
    <div
      onDrop={(e) => onDrop(e, group.id)}
      onDragOver={onDragOver}
      className={`
        rounded-2xl p-4 min-h-[200px] transition-all
        ${color.bg}/30 border-2 ${color.border}/50
        ${draggingUtterance ? 'ring-2 ring-primary/30' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                className="h-7 text-sm font-semibold"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`font-semibold ${color.text} cursor-pointer hover:underline truncate`}
                  onClick={() => onToggleCollapse(group.id)}
                >
                  {group.title}
                </h3>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {group.utterances.length}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
              {group.subtitle && (
                <p className="text-[10px] text-muted-foreground truncate">{group.subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onColorChange(group.id)}
            title="색상 변경"
          >
            <div className={`w-3 h-3 rounded-full ${color.bg} ${color.border} border`} />
          </Button>
          {canRemove && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:text-destructive"
              onClick={() => onRemove(group.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {!group.isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {group.utterances.map(utt => (
            <StickyNote
              key={utt.id}
              utterance={utt}
              colorIndex={group.colorIndex}
              onDragStart={onDragStart}
              isDragging={draggingUtterance?.id === utt.id}
            />
          ))}
        </div>
      )}

      {group.isCollapsed && (
        <div
          className="text-sm text-muted-foreground text-center py-4 cursor-pointer hover:bg-secondary/30 rounded-lg"
          onClick={() => onToggleCollapse(group.id)}
        >
          {group.utterances.length}개 항목 (클릭하여 펼치기)
        </div>
      )}

      {!group.isCollapsed && group.utterances.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
          카드를 여기로 드래그하세요
        </div>
      )}
    </div>
  )
}

export function AffinityView({ items }: AffinityViewProps) {
  const allUtterances = useMemo(() => extractUtterances(items), [items])

  const [groupingMode, setGroupingMode] = useState<GroupingMode>('meeting')
  const [groups, setGroups] = useState<AffinityGroup[]>(() =>
    createGroups(allUtterances, 'meeting', items)
  )
  const [draggingUtterance, setDraggingUtterance] = useState<Utterance | null>(null)
  const [showAISuggestion, setShowAISuggestion] = useState(false)

  // 그룹핑 모드 변경 시 그룹 재생성
  const handleModeChange = useCallback((mode: GroupingMode) => {
    setGroupingMode(mode)
    setGroups(createGroups(allUtterances, mode, items))
  }, [allUtterances, items])

  const handleDragStart = useCallback((e: React.DragEvent, utterance: Utterance) => {
    e.dataTransfer.setData('utteranceId', utterance.id)
    setDraggingUtterance(utterance)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    const utteranceId = e.dataTransfer.getData('utteranceId')
    if (!utteranceId) return

    setGroups(prev => {
      let movedUtterance: Utterance | null = null
      const newGroups = prev.map(group => {
        const found = group.utterances.find(u => u.id === utteranceId)
        if (found) {
          movedUtterance = found
          return {
            ...group,
            utterances: group.utterances.filter(u => u.id !== utteranceId),
          }
        }
        return group
      })

      if (movedUtterance) {
        return newGroups.map(group => {
          if (group.id === targetGroupId) {
            return {
              ...group,
              utterances: [...group.utterances, movedUtterance!],
            }
          }
          return group
        })
      }

      return newGroups
    })

    setDraggingUtterance(null)
  }, [])

  const handleTitleChange = useCallback((groupId: string, title: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, title } : g
    ))
  }, [])

  const handleToggleCollapse = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
    ))
  }, [])

  const handleRemoveGroup = useCallback((groupId: string) => {
    setGroups(prev => {
      const removedGroup = prev.find(g => g.id === groupId)
      if (!removedGroup) return prev

      // 첫 번째 그룹으로 이동
      const firstGroup = prev[0]
      if (firstGroup.id === groupId && prev.length > 1) {
        return prev.slice(1).map((g, idx) => {
          if (idx === 0) {
            return { ...g, utterances: [...g.utterances, ...removedGroup.utterances] }
          }
          return g
        })
      }

      return prev
        .filter(g => g.id !== groupId)
        .map((g, idx) => {
          if (idx === 0) {
            return { ...g, utterances: [...g.utterances, ...removedGroup.utterances] }
          }
          return g
        })
    })
  }, [])

  const handleColorChange = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, colorIndex: (g.colorIndex + 1) % stickyColors.length } : g
    ))
  }, [])

  const handleAddGroup = useCallback(() => {
    const newId = `group-${Date.now()}`
    setGroups(prev => [...prev, {
      id: newId,
      title: '새 그룹',
      subtitle: '드래그하여 카드 추가',
      colorIndex: prev.length % stickyColors.length,
      utterances: [],
      isCollapsed: false,
    }])
  }, [])

  const handleApplyAIClustering = useCallback(() => {
    handleModeChange('topic')
    setShowAISuggestion(false)
  }, [handleModeChange])

  const groupingModes: { id: GroupingMode; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'meeting', label: '회의록별', icon: Calendar, description: '회의에서 나온 논의와 결정을 그룹화' },
    { id: 'task', label: '태스크별', icon: ListTodo, description: '태스크 상태별로 그룹화' },
    { id: 'owner', label: '담당자별', icon: User, description: '담당자별로 그룹화' },
    { id: 'topic', label: '주제별', icon: Tag, description: 'AI가 주제별로 자동 분류' },
    { id: 'custom', label: '직접 분류', icon: FolderOpen, description: '직접 드래그하여 분류' },
  ]

  return (
    <div className="space-y-6">
      {/* 그룹핑 모드 선택 */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-muted-foreground">그룹 기준:</span>
        <div className="flex gap-1 flex-wrap">
          {groupingModes.map(mode => {
            const Icon = mode.icon
            return (
              <Button
                key={mode.id}
                variant={groupingMode === mode.id ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => handleModeChange(mode.id)}
                title={mode.description}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* 현재 모드 설명 */}
      <div className="text-xs text-muted-foreground px-1">
        {groupingModes.find(m => m.id === groupingMode)?.description}
      </div>

      {/* 툴바 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleAddGroup}
          >
            <Plus className="h-4 w-4" />
            새 그룹
          </Button>
          {groupingMode !== 'topic' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowAISuggestion(true)}
            >
              <Sparkles className="h-4 w-4" />
              AI 분류
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={() => handleModeChange(groupingMode)}>
          초기화
        </Button>
      </div>

      {/* AI 제안 팝업 */}
      {showAISuggestion && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold">AI 주제별 분류</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            AI가 내용을 분석하여 UI/UX, 인증, 기술 스택 등 주제별로 자동 분류합니다.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApplyAIClustering}>
              적용하기
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAISuggestion(false)}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 그룹 그리드 */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group, idx) => (
          <AffinityCluster
            key={group.id}
            group={group}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onTitleChange={handleTitleChange}
            onToggleCollapse={handleToggleCollapse}
            onRemove={handleRemoveGroup}
            onColorChange={handleColorChange}
            draggingUtterance={draggingUtterance}
            canRemove={groups.length > 1 && idx > 0}
          />
        ))}
      </div>

      {/* 안내 */}
      <div className="text-center text-sm text-muted-foreground p-4 rounded-xl bg-secondary/30">
        <p>포스트잇 카드를 드래그하여 그룹 간 이동할 수 있습니다.</p>
        <p className="mt-1">그룹 제목을 클릭하여 접기/펼치기, 색상 버튼으로 색상 변경이 가능합니다.</p>
      </div>
    </div>
  )
}
