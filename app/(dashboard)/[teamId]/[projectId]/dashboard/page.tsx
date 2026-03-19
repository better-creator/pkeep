'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch, AlertTriangle, ListChecks, Mic,
  CheckCircle, Clock, AlertCircle, MessageSquare,
  BookOpen, Phone, Mail, ChevronRight, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask, StoredRejected } from '@/lib/store/types'
import { detectConflicts, type Conflict } from '@/lib/conflicts'
import { PkeepLogo } from '@/components/brand/Logo'

const sourceTypeCfg: Record<string, { icon: typeof Mic; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-orange-50', text: 'text-orange-600' },
  slack: { icon: MessageSquare, label: 'Slack', bg: 'bg-purple-50', text: 'text-purple-600' },
  notion: { icon: BookOpen, label: 'Notion', bg: 'bg-stone-100', text: 'text-stone-600' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-50', text: 'text-green-600' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-50', text: 'text-rose-600' },
}

const statusBar: Record<string, string> = {
  confirmed: 'bg-emerald-500', changed: 'bg-amber-500', pending: 'bg-stone-300', hold: 'bg-stone-300',
}
const statusLabel: Record<string, string> = {
  confirmed: '확정', changed: '변경', pending: '보류', hold: '보류',
}

export default function DashboardPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [meetings, setMeetings] = useState<StoredMeeting[]>([])
  const [decisions, setDecisions] = useState<StoredDecision[]>([])
  const [tasks, setTasks] = useState<StoredTask[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [botReview, setBotReview] = useState<string | null>(null)
  const [botLoading, setBotLoading] = useState(false)

  useEffect(() => {
    const m = JSON.parse(localStorage.getItem('pkeep-meetings') || '[]')
    const d: StoredDecision[] = JSON.parse(localStorage.getItem('pkeep-decisions') || '[]')
    const t = JSON.parse(localStorage.getItem('pkeep-tasks') || '[]')
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
  const tasksTotal = tasks.length
  const unresolvedConflicts = conflicts.filter(c => !c.resolved && c.type !== 'rejected_alternative')
  const changedDecisions = decisions.filter(d => d.status === 'changed')
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'hold')
  const getMeeting = (id: string) => meetings.find(m => m.id === id)

  const requestBotReview = useCallback(async () => {
    if (botLoading || (meetings.length === 0 && decisions.length === 0)) return
    setBotLoading(true); setBotReview(null)
    try {
      const rejected: StoredRejected[] = JSON.parse(localStorage.getItem('pkeep-rejected') || '[]')
      const res = await fetch('/api/ai/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetings: meetings.slice(0, 10).map(m => ({ code: m.code, title: m.title, date: m.date, summary: m.summary, issues: m.issues })),
          decisions: decisions.slice(0, 20).map(d => ({ code: d.code, title: d.title, status: d.status, area: d.area, rationale: d.rationale })),
          tasks: tasks.slice(0, 20).map(t => ({ title: t.title, done: t.done, assignee: t.assignee })),
          rejected: rejected.slice(0, 10).map(r => ({ title: r.title, reason: r.reason })),
        }),
      })
      if (res.ok) { setBotReview((await res.json()).review) }
      else { setBotReview('리뷰 생성에 실패했습니다.') }
    } catch { setBotReview('리뷰 생성에 실패했습니다.') }
    finally { setBotLoading(false) }
  }, [meetings, decisions, tasks, botLoading])

  // 주의 필요
  type AttentionItem = { label: string; title: string; color: string; dot: string; link: string }
  const attentionItems: AttentionItem[] = []
  unresolvedConflicts.forEach(c => attentionItems.push({ label: '충돌', color: 'text-red-600', dot: 'bg-red-500', title: `${c.newDecision.code} vs ${c.existingDecision.code}`, link: `/${teamId}/${projectId}/conflicts` }))
  changedDecisions.forEach(d => attentionItems.push({ label: '변경', color: 'text-amber-600', dot: 'bg-amber-500', title: `${d.code} ${d.title}`, link: `/${teamId}/${projectId}/decisions` }))
  meetings.forEach(m => (m.issues || []).forEach(issue => attentionItems.push({ label: '이슈', color: 'text-orange-600', dot: 'bg-orange-500', title: issue.title, link: `/${teamId}/${projectId}/meetings` })))
  pendingDecisions.forEach(d => attentionItems.push({ label: '보류', color: 'text-stone-500', dot: 'bg-stone-400', title: `${d.code} ${d.title}`, link: `/${teamId}/${projectId}/decisions` }))

  const hasData = meetings.length > 0 || decisions.length > 0

  // ─── 빈 상태: 온보딩 ───
  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md space-y-8">
          <PkeepLogo size={56} className="mx-auto" />
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-stone-900">회의만 하세요.</h1>
            <p className="text-stone-500 leading-relaxed">
              결정과 맥락은 AI가 정리합니다.<br />
              첫 회의를 녹음하고 결과를 확인해보세요.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href={`/${teamId}/${projectId}/meetings`}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Mic className="h-5 w-5" />
              첫 회의 녹음하기
            </Link>
            <p className="text-xs text-stone-400">3분이면 됩니다</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── 데이터 있는 대시보드: 3섹션 ───
  return (
    <div className="max-w-3xl space-y-10">
      {/* ─── 섹션 1: PKEEP Bot ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PkeepLogo size={32} />
            <div>
              <h1 className="text-lg font-bold text-stone-900">프로젝트 현황</h1>
              <p className="text-xs text-stone-400">
                미팅 {meetings.length} · 결정 {decisions.length} · 할일 {tasksDone}/{tasksTotal}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg gap-1.5"
            onClick={requestBotReview}
            disabled={botLoading}
          >
            {botLoading ? (
              <>
                <span className="h-3 w-3 border-2 border-stone-300 border-t-orange-500 rounded-full animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI 리뷰
              </>
            )}
          </Button>
        </div>

        {botReview && (
          <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-orange-50/50 border border-orange-100 rounded-xl px-5 py-4">
            {botReview}
          </div>
        )}

        {/* 태스크 진행률 — 인라인 */}
        {tasksTotal > 0 && (
          <Link href={`/${teamId}/${projectId}/tasks`} className="flex items-center gap-4 group">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-stone-700 group-hover:text-orange-600 transition-colors">
              {Math.round((tasksDone / tasksTotal) * 100)}%
            </span>
          </Link>
        )}
      </div>

      {/* ─── 섹션 2: 최근 미팅 ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">최근 미팅</h2>
          <Link href={`/${teamId}/${projectId}/meetings`} className="text-xs text-stone-400 hover:text-orange-600 transition-colors">
            모두 보기 →
          </Link>
        </div>
        <div className="space-y-3">
          {meetings.slice(0, 3).map(mtg => {
            const st = (mtg as any).sourceType || 'meeting'
            const cfg = sourceTypeCfg[st] || sourceTypeCfg.meeting
            const SrcIcon = cfg.icon
            const mtgDecs = decisions.filter(d => d.meetingId === mtg.id)
            const mtgTasks = tasks.filter(t => t.meetingId === mtg.id)

            return (
              <Link key={mtg.id} href={`/${teamId}/${projectId}/meetings`}
                className="block card-soft p-4 hover:border-stone-300 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cfg.bg}`}>
                    <SrcIcon className={`h-5 w-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-500">{mtg.code}</span>
                      <span className="text-sm font-semibold text-stone-900 truncate">{mtg.title}</span>
                      <span className="text-xs text-stone-400 ml-auto shrink-0">{mtg.date}</span>
                    </div>
                    {mtg.summary && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-1">{mtg.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                      {mtgDecs.length > 0 && <span>결정 {mtgDecs.length}</span>}
                      {mtgTasks.length > 0 && <span>할일 {mtgTasks.length}</span>}
                      {(mtg.issues?.length || 0) > 0 && <span className="text-amber-500">이슈 {mtg.issues.length}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ─── 섹션 3: 주의 필요 + 최근 결정 ─── */}
      <div className="space-y-6">
        {/* 주의 필요 */}
        {attentionItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-stone-900 mb-3">
              주의 필요 <span className="text-orange-500 font-bold">{attentionItems.length}</span>
            </h2>
            <div className="space-y-1.5">
              {attentionItems.slice(0, 5).map((item, i) => (
                <Link key={i} href={item.link}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                  <span className={`text-xs font-semibold w-8 shrink-0 ${item.color}`}>{item.label}</span>
                  <span className="text-sm text-stone-700 flex-1 truncate">{item.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-stone-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 최근 결정 — 심플 */}
        {decisions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-900">최근 결정</h2>
              <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-stone-400 hover:text-orange-600 transition-colors">
                모두 보기 →
              </Link>
            </div>
            <div className="space-y-2">
              {decisions.slice(0, 4).map(d => {
                const meeting = getMeeting(d.meetingId)
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-xl card-soft">
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${statusBar[d.status] || 'bg-stone-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-stone-400">{d.code}</span>
                        <span className="text-xs text-stone-400">{statusLabel[d.status] || d.status}</span>
                      </div>
                      <p className="text-sm font-medium text-stone-900 truncate">{d.title}</p>
                    </div>
                    {meeting && (
                      <span className="text-xs text-stone-400 shrink-0">{meeting.code}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
