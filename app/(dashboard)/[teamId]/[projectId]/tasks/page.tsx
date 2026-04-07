'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ListChecks, CheckCircle2, Circle, Mic,
  Phone, Mail, ChevronRight, FileText,
} from 'lucide-react'
import { SlackIcon, NotionIcon } from '@/components/brand/ServiceIcons'
import { ContextPanel } from '@/components/context-panel'

interface Task {
  id: string
  meetingId: string
  decisionId?: string
  title: string
  assignee?: string
  done: boolean
  createdAt: string
}

interface Meeting {
  id: string
  code: string
  title: string
  sourceType?: string
}

interface Decision {
  id: string
  meetingId: string
  code: string
  title: string
  area?: string
}

type FilterType = 'all' | 'incomplete' | 'complete'

const sourceTypeCfg: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-red-50', text: 'text-red-600' },
  slack: { icon: SlackIcon, label: 'Slack', bg: 'bg-purple-50', text: 'text-purple-600' },
  notion: { icon: NotionIcon, label: 'Notion', bg: 'bg-stone-100', text: 'text-stone-600' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-50', text: 'text-green-600' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-50', text: 'text-rose-600' },
  text: { icon: FileText, label: '텍스트', bg: 'bg-stone-100', text: 'text-stone-500' },
}

const areaLabel: Record<string, string> = { planning: '기획', design: '디자인', dev: '개발', '컬러': '컬러', '촬영': '촬영', '채널': '채널', '카피': '카피', '브랜딩': '브랜딩' }

export default function TasksPage() {
  const params = useParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelItem, setPanelItem] = useState<{ type: 'meeting' | 'decision' | 'task'; id: string } | null>(null)

  const openPanel = (type: 'meeting' | 'decision' | 'task', id: string) => {
    setPanelItem({ type, id })
    setPanelOpen(true)
  }

  useEffect(() => {
    try {
      setTasks(JSON.parse(localStorage.getItem('pkeep-tasks') || '[]'))
      setMeetings(JSON.parse(localStorage.getItem('pkeep-meetings') || '[]'))
      setDecisions(JSON.parse(localStorage.getItem('pkeep-decisions') || '[]'))
    } catch {}
  }, [])

  const saveTasks = useCallback((updated: Task[]) => {
    setTasks(updated)
    try { localStorage.setItem('pkeep-tasks', JSON.stringify(updated)) } catch {}
  }, [])

  const toggleDone = (taskId: string) => {
    saveTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'incomplete') return !t.done
    if (filter === 'complete') return t.done
    return true
  })

  const doneCount = tasks.filter(t => t.done).length

  const getMeeting = (meetingId: string) => meetings.find(m => m.id === meetingId)
  const getDecisionForTask = (task: Task) => decisions.find(d => d.meetingId === task.meetingId)

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'incomplete', label: '미완료' },
    { value: 'complete', label: '완료' },
  ]

  // Group tasks by meeting for better context
  const groupedByMeeting = filtered.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.meetingId
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">할 일</h1>
          {tasks.length > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {doneCount}/{tasks.length} 완료
            </span>
          )}
        </div>
        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(doneCount / tasks.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-stone-500">
              {Math.round((doneCount / tasks.length) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border/30 bg-muted/20">
          {FILTER_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 text-xs rounded-lg ${
                filter === opt.value
                  ? 'bg-primary hover:bg-primary/90 text-white'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              <span className="ml-1 tabular-nums">
                {opt.value === 'all' ? tasks.length : opt.value === 'incomplete' ? tasks.length - doneCount : doneCount}
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Content — grouped by meeting */}
      <div className="flex-1 overflow-auto p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">아직 할 일이 없습니다.</p>
            <p className="text-sm text-muted-foreground/70">회의를 녹음하면 AI가 자동 추출합니다.</p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {Object.entries(groupedByMeeting).map(([meetingId, meetingTasks]) => {
              const meeting = getMeeting(meetingId)
              const st = (meeting as any)?.sourceType || 'meeting'
              const srcCfg = sourceTypeCfg[st] || sourceTypeCfg.meeting
              const SrcIcon = srcCfg.icon
              // Get related decisions for this meeting
              const relatedDecs = decisions.filter(d => d.meetingId === meetingId)

              return (
                <div key={meetingId}>
                  {/* Meeting group header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${srcCfg.bg} ${srcCfg.text}`}>
                      <SrcIcon className="h-2.5 w-2.5" />
                      {srcCfg.label}
                    </span>
                    <span className="text-xs font-mono text-stone-500">{meeting?.code || meetingId}</span>
                    <span className="text-xs text-stone-400 truncate">{meeting?.title}</span>
                    {relatedDecs.length > 0 && (
                      <span className="text-xs text-stone-400 ml-auto">
                        결정 {relatedDecs.length}건
                      </span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1.5 ml-1 border-l-2 border-stone-100 pl-4">
                    {meetingTasks.map(task => {
                      const parentDec = getDecisionForTask(task)
                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-stone-50 transition-colors ${
                            task.done ? 'opacity-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleDone(task.id)}
                            className="flex-shrink-0 mt-0.5 focus:outline-none"
                          >
                            {task.done ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                            ) : (
                              <Circle className="h-4.5 w-4.5 text-stone-300 hover:text-primary transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm cursor-pointer hover:underline ${task.done ? 'line-through text-stone-400' : 'font-medium text-stone-800'}`}
                              onClick={() => openPanel('task', task.id)}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {parentDec && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-stone-400">
                                  <ChevronRight className="h-2.5 w-2.5" />
                                  <span className="font-mono">{parentDec.code}</span>
                                  {parentDec.area && (
                                    <Badge className={`text-xs px-1 py-0 rounded ${
                                      parentDec.area === 'dev' ? 'bg-sky-50 text-sky-600' :
                                      parentDec.area === 'design' ? 'bg-pink-50 text-pink-600' :
                                      parentDec.area === '컬러' ? 'bg-orange-50 text-orange-600' :
                                      parentDec.area === '촬영' ? 'bg-sky-50 text-sky-600' :
                                      parentDec.area === '채널' ? 'bg-purple-50 text-purple-600' :
                                      parentDec.area === '카피' ? 'bg-pink-50 text-pink-600' :
                                      parentDec.area === '브랜딩' ? 'bg-emerald-50 text-emerald-600' :
                                      'bg-violet-50 text-violet-600'
                                    }`}>
                                      {areaLabel[parentDec.area] || parentDec.area}
                                    </Badge>
                                  )}
                                  <span className="truncate max-w-[180px]">{parentDec.title}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {task.assignee && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-stone-50 flex-shrink-0 self-start">
                              {task.assignee.split(' ')[0]}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {panelItem && (
        <ContextPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          itemType={panelItem.type}
          itemId={panelItem.id}
        />
      )}
    </div>
  )
}
