'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch, AlertTriangle, ListChecks, Mic, CheckCircle2,
  Clock, AlertCircle, CircleDot, MessageSquare, BookOpen, Phone, Mail,
  ChevronRight, Circle, ArrowRight, FileText, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask, StoredRejected } from '@/lib/store/types'
import { detectConflicts, type Conflict } from '@/lib/conflicts'

// ─── Config ───
const areaLabel: Record<string, string> = { planning: '기획', design: '디자인', dev: '개발' }
const areaColor: Record<string, string> = { planning: 'text-violet-600', design: 'text-pink-600', dev: 'text-sky-600' }
const areaDot: Record<string, string> = { planning: 'bg-violet-500', design: 'bg-pink-500', dev: 'bg-sky-500' }
const statusLabel: Record<string, string> = { confirmed: '확정', changed: '변경', pending: '보류', hold: '보류', rejected: '기각' }
const statusColor: Record<string, string> = { confirmed: 'text-emerald-600', changed: 'text-amber-600', pending: 'text-zinc-500', hold: 'text-zinc-500' }

const sourceIcon: Record<string, typeof Mic> = {
  meeting: Mic, slack: MessageSquare, notion: BookOpen, call: Phone, email: Mail, document: FileText, text: FileText,
}

export default function DashboardPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [meetings, setMeetings] = useState<StoredMeeting[]>([])
  const [decisions, setDecisions] = useState<StoredDecision[]>([])
  const [tasks, setTasks] = useState<StoredTask[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  useEffect(() => {
    const m: StoredMeeting[] = JSON.parse(localStorage.getItem('pkeep-meetings') || '[]')
    const d: StoredDecision[] = JSON.parse(localStorage.getItem('pkeep-decisions') || '[]')
    const t: StoredTask[] = JSON.parse(localStorage.getItem('pkeep-tasks') || '[]')
    const r: StoredRejected[] = JSON.parse(localStorage.getItem('pkeep-rejected') || '[]')
    setMeetings(m); setDecisions(d); setTasks(t)

    const detected = detectConflicts(d, r)
    const saved: Conflict[] | null = JSON.parse(localStorage.getItem('pkeep-conflicts') || 'null')
    if (saved) {
      for (const det of detected) {
        const s = saved.find(sv => sv.newDecision.id === det.newDecision.id && sv.existingDecision.id === det.existingDecision.id && sv.type === det.type)
        if (s?.resolved) { det.resolved = true; det.resolution = s.resolution }
      }
    }
    setConflicts(detected)
  }, [])

  const tasksDone = tasks.filter(t => t.done).length
  const unresolvedConflicts = conflicts.filter(c => !c.resolved)
  const getMeeting = (id: string) => meetings.find(m => m.id === id)

  // ─── 주의 필요 아이템 ───
  type AttentionItem = { type: string; label: string; title: string; color: string; link: string; priority: number }
  const attentionItems: AttentionItem[] = []

  // 충돌
  unresolvedConflicts.forEach(c => {
    attentionItems.push({
      type: 'conflict', label: '충돌', priority: 1, color: 'text-red-600',
      title: `${c.newDecision.code} vs ${c.existingDecision.code}`,
      link: `/${teamId}/${projectId}/conflicts`,
    })
  })
  // 변경된 결정
  decisions.filter(d => d.status === 'changed').forEach(d => {
    attentionItems.push({
      type: 'changed', label: '변경', priority: 2, color: 'text-amber-600',
      title: `${d.code} ${d.title}`,
      link: `/${teamId}/${projectId}/decisions`,
    })
  })
  // 미팅 이슈
  meetings.forEach(m => {
    (m.issues || []).forEach(issue => {
      attentionItems.push({
        type: 'issue', label: '이슈', priority: 3, color: 'text-orange-600',
        title: issue.title,
        link: `/${teamId}/${projectId}/meetings`,
      })
    })
  })
  // 미완료 태스크 (오래된 순)
  tasks.filter(t => !t.done).slice(0, 5).forEach(t => {
    attentionItems.push({
      type: 'task', label: '할일', priority: 4, color: 'text-blue-600',
      title: t.title,
      link: `/${teamId}/${projectId}/tasks`,
    })
  })
  // 보류 결정
  decisions.filter(d => d.status === 'pending' || d.status === 'hold').forEach(d => {
    attentionItems.push({
      type: 'pending', label: '보류', priority: 5, color: 'text-zinc-500',
      title: `${d.code} ${d.title}`,
      link: `/${teamId}/${projectId}/decisions`,
    })
  })

  attentionItems.sort((a, b) => a.priority - b.priority)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── 헤더 + 요약 스트립 ─── */}
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mic className="h-4 w-4" />
            미팅 <strong className="text-foreground">{meetings.length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-4 w-4" />
            결정 <strong className="text-foreground">{decisions.length}</strong>
            <span className="text-xs">({decisions.filter(d => d.status === 'confirmed').length} 확정)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            할 일 <strong className="text-foreground">{tasksDone}/{tasks.length}</strong>
          </span>
          {unresolvedConflicts.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              이슈 <strong>{unresolvedConflicts.length}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ─── 주의 필요 ─── */}
      {attentionItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            주의 필요
          </h2>
          <div className="space-y-1.5">
            {attentionItems.slice(0, 8).map((item, i) => (
              <Link
                key={`${item.type}-${i}`}
                href={item.link}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors"
              >
                <span className={`text-xs font-semibold w-8 ${item.color}`}>{item.label}</span>
                <span className="text-sm flex-1 truncate">{item.title}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── 최근 미팅 ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Mic className="h-4 w-4 text-blue-500" />
            최근 미팅
          </h2>
          <Link href={`/${teamId}/${projectId}/meetings`} className="text-xs text-muted-foreground hover:text-foreground">
            모두 보기 →
          </Link>
        </div>
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
              회의를 녹음하면 AI가 자동으로 결정과 할 일을 추출합니다.
            </div>
          ) : (
            meetings.slice(0, 5).map(mtg => {
              const SrcIcon = sourceIcon[(mtg as any).sourceType || 'meeting'] || Mic
              const mtgDecs = decisions.filter(d => d.meetingId === mtg.id)
              const mtgTasks = tasks.filter(t => t.meetingId === mtg.id)
              const issueCount = (mtg.issues || []).length

              return (
                <Link
                  key={mtg.id}
                  href={`/${teamId}/${projectId}/meetings`}
                  className="block rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <SrcIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-blue-600">{mtg.code}</span>
                        <span className="text-sm font-semibold truncate">{mtg.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">{mtg.date}</span>
                      </div>
                      {mtg.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{mtg.summary}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {mtgDecs.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            결정 {mtgDecs.length}
                          </span>
                        )}
                        {mtgTasks.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ListChecks className="h-3 w-3" />
                            할일 {mtgTasks.length}
                          </span>
                        )}
                        {issueCount > 0 && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <AlertTriangle className="h-3 w-3" />
                            이슈 {issueCount}
                          </span>
                        )}
                        {mtg.keywords?.length > 0 && (
                          <span className="flex items-center gap-1 ml-auto">
                            {mtg.keywords.slice(0, 3).map(kw => (
                              <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0">{kw}</Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* ─── 최근 결정 + 영역별 ─── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-500" />
              최근 결정
            </h2>
            <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-muted-foreground hover:text-foreground">
              모두 보기 →
            </Link>
          </div>
          <div className="space-y-2">
            {decisions.slice(0, 6).map(d => {
              const meeting = getMeeting(d.meetingId)
              return (
                <Link
                  key={d.id}
                  href={`/${teamId}/${projectId}/decisions`}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${
                    d.status === 'confirmed' ? 'bg-emerald-500' :
                    d.status === 'changed' ? 'bg-amber-500' :
                    d.status === 'pending' || d.status === 'hold' ? 'bg-zinc-400' : 'bg-zinc-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-bold text-foreground/60">{d.code}</span>
                      <span className={`text-xs font-semibold ${statusColor[d.status] || ''}`}>
                        {statusLabel[d.status] || d.status}
                      </span>
                      {d.area && (
                        <span className="flex items-center gap-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${areaDot[d.area] || ''}`} />
                          <span className="text-xs text-muted-foreground">{areaLabel[d.area] || d.area}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    {meeting && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <ArrowRight className="h-3 w-3" />{meeting.code}에서 추출
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 영역별 + 태스크 진행률 */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <h3 className="text-xs font-semibold mb-3">태스크 진행률</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${tasks.length > 0 ? (tasksDone / tasks.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-bold">{tasks.length > 0 ? Math.round(tasksDone / tasks.length * 100) : 0}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tasksDone}/{tasks.length} 완료</p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-4">
            <h3 className="text-xs font-semibold mb-3">영역별 결정</h3>
            <div className="space-y-2.5">
              {Object.entries(
                decisions.reduce<Record<string, number>>((acc, d) => {
                  const area = d.area || 'planning'
                  acc[area] = (acc[area] || 0) + 1
                  return acc
                }, {})
              ).map(([area, count]) => (
                <div key={area} className="flex items-center justify-between">
                  <span className={`text-xs flex items-center gap-1.5 ${areaColor[area] || 'text-muted-foreground'}`}>
                    <span className={`w-2 h-2 rounded-full ${areaDot[area] || 'bg-zinc-400'}`} />
                    {areaLabel[area] || area}
                  </span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
