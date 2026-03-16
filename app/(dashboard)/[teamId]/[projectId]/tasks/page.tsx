'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ListChecks, CheckCircle2, Circle, FileText } from 'lucide-react'

interface Task {
  id: string
  meetingId: string
  decisionId?: string
  title: string
  assignee?: string
  done: boolean
  createdAt: string
}

type FilterType = 'all' | 'incomplete' | 'complete'

function getMeetingCode(meetingId: string): string {
  if (meetingId.startsWith('mtg-')) {
    const num = meetingId.replace('mtg-', '')
    return `MTG-${num.padStart(3, '0')}`
  }
  return `MTG-${meetingId}`
}

export default function TasksPage() {
  const params = useParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<FilterType>('all')

  // Load tasks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pkeep-tasks')
      if (stored) {
        setTasks(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage:', e)
    }
  }, [])

  const saveTasks = useCallback((updated: Task[]) => {
    setTasks(updated)
    try {
      localStorage.setItem('pkeep-tasks', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e)
    }
  }, [])

  const toggleDone = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
    saveTasks(updated)
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'incomplete') return !t.done
    if (filter === 'complete') return t.done
    return true
  })

  const doneCount = tasks.filter((t) => t.done).length

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'incomplete', label: '미완료' },
    { value: 'complete', label: '완료' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-semibold">할 일</h1>
          {tasks.length > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {tasks.length}건 중 {doneCount}건 완료
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border/30 bg-muted/20">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 text-xs rounded-lg ${
                filter === opt.value
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              {opt.value === 'incomplete' && (
                <span className="ml-1 tabular-nums">
                  {tasks.filter((t) => !t.done).length}
                </span>
              )}
              {opt.value === 'complete' && (
                <span className="ml-1 tabular-nums">{doneCount}</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">
              아직 할 일이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground/70">
              소스 페이지에서 회의를 분석하세요.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <p className="text-muted-foreground">
              선택한 필터에 해당하는 할 일이 없습니다.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-2">
            {filtered.map((task) => (
              <Card
                key={task.id}
                className={`border-border/50 transition-colors ${
                  task.done ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleDone(task.id)}
                    className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-full"
                    aria-label={task.done ? '완료 취소' : '완료 처리'}
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-orange-500 transition-colors" />
                    )}
                  </button>

                  {/* Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        task.done ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {getMeetingCode(task.meetingId)}
                      </span>
                    </div>
                  </div>

                  {/* Assignee */}
                  {task.assignee && (
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0.5 bg-muted/50 flex-shrink-0"
                    >
                      {task.assignee}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
