'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch, AlertTriangle, ListChecks, Mic,
  CheckCircle, Clock, AlertCircle,
  Phone, Mail, ChevronRight, Sparkles,
  Zap, Target, BarChart3, Shield, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask, StoredRejected } from '@/lib/store/types'
import { detectConflicts, type Conflict } from '@/lib/conflicts'
import { PkeepLogo } from '@/components/brand/Logo'
import { SlackIcon, NotionIcon, LinearIcon, JiraIcon, GitHubIcon } from '@/components/brand/ServiceIcons'

const sourceTypeCfg: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-primary/5', text: 'text-primary' },
  slack: { icon: SlackIcon, label: 'Slack', bg: 'bg-purple-50', text: 'text-purple-600' },
  notion: { icon: NotionIcon, label: 'Notion', bg: 'bg-stone-100', text: 'text-stone-600' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-50', text: 'text-green-600' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-50', text: 'text-rose-600' },
}

const statusBar: Record<string, string> = {
  confirmed: 'bg-emerald-500', changed: 'bg-amber-500', pending: 'bg-stone-300', hold: 'bg-stone-300',
}
const statusLabel: Record<string, string> = {
  confirmed: '확정', changed: '변경', pending: '보류', hold: '보류',
}

/* ─── Circular progress ring ─── */
function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score > 70 ? 'stroke-emerald-500' : score > 40 ? 'stroke-amber-500' : 'stroke-red-500'
  const textColor = score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          strokeWidth={strokeWidth} className="stroke-stone-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={`${color} transition-all duration-700`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${textColor}`}>{score}</span>
        <span className="text-[10px] text-stone-400 -mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

/* ─── Integration icons ─── */
const integrationList: { name: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { name: 'Linear', Icon: LinearIcon },
  { name: 'Jira', Icon: JiraIcon },
  { name: 'Notion', Icon: NotionIcon },
  { name: 'Slack', Icon: SlackIcon },
  { name: 'GitHub', Icon: GitHubIcon },
]

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
  const [integrationDialog, setIntegrationDialog] = useState<string | null>(null)

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
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'hold')
  const confirmedDecisions = decisions.filter(d => d.status === 'confirmed')
  const getMeeting = (id: string) => meetings.find(m => m.id === id)

  // ─── 지연된 할 일 (7일 이상) ───
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const overdueTasks = tasks.filter(t => !t.done && (now - new Date(t.createdAt).getTime()) > sevenDaysMs)

  // ─── 프로젝트 건강 점수 계산 ───
  const decisionFollowRate = decisions.length > 0
    ? (confirmedDecisions.length / decisions.length) * 100 : 100
  const taskCompletionRate = tasksTotal > 0
    ? (tasksDone / tasksTotal) * 100 : 100
  const conflictPenalty = Math.min(unresolvedConflicts.length * 15, 40)
  const healthScore = Math.max(0, Math.min(100,
    Math.round((decisionFollowRate * 0.35) + (taskCompletionRate * 0.45) + ((100 - conflictPenalty) * 0.20))
  ))

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
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold shadow-md hover:shadow-lg transition-all"
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

  // ─── 데이터 있는 대시보드 ───
  return (
    <div className="max-w-3xl space-y-10">

      {/* ═══════════════════════════════════════════════════════
          섹션 1: Project Health Score
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PkeepLogo size={32} />
            <div>
              <h1 className="text-lg font-bold text-stone-900">프로젝트 현황</h1>
              <p className="text-xs text-stone-400">
                프로젝트 건강도를 한눈에 확인하세요
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
                <span className="h-3 w-3 border-2 border-stone-300 border-t-primary rounded-full animate-spin" />
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
          <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-primary/5 border border-primary/10 rounded-xl px-5 py-4">
            {botReview}
          </div>
        )}

        {/* Health score card */}
        <div className="card-soft p-6">
          <div className="flex items-center gap-8">
            <HealthRing score={healthScore} />
            <div className="flex-1 grid grid-cols-3 gap-4 tabular-nums">
              {/* 결정 이행률 */}
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-stone-900">
                  {Math.round(decisionFollowRate)}%
                </div>
                <div className="text-xs text-stone-500">결정 이행률</div>
                <div className="text-[10px] text-stone-400">
                  {confirmedDecisions.length}/{decisions.length}
                </div>
              </div>
              {/* 할일 완료율 */}
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-stone-900">
                  {tasksTotal > 0 ? Math.round(taskCompletionRate) : '-'}%
                </div>
                <div className="text-xs text-stone-500">할일 완료율</div>
                <div className="text-[10px] text-stone-400">
                  {tasksDone}/{tasksTotal}
                </div>
              </div>
              {/* 미해결 이슈 */}
              <div className="text-center space-y-1">
                <div className={`text-2xl font-bold ${unresolvedConflicts.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {unresolvedConflicts.length}
                </div>
                <div className="text-xs text-stone-500">미해결 이슈</div>
                <div className="text-[10px] text-stone-400">
                  충돌 건수
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <Link href={`/${teamId}/${projectId}/meetings`}
            className="card-soft p-3 text-center hover:border-primary/30 transition-colors">
            <div className="text-lg font-bold text-primary">{meetings.length}</div>
            <div className="text-[11px] text-stone-500">미팅</div>
          </Link>
          <Link href={`/${teamId}/${projectId}/decisions`}
            className="card-soft p-3 text-center hover:border-primary/30 transition-colors">
            <div className="text-lg font-bold text-primary">{decisions.length}</div>
            <div className="text-[11px] text-stone-500">결정</div>
          </Link>
          <Link href={`/${teamId}/${projectId}/tasks`}
            className="card-soft p-3 text-center hover:border-primary/30 transition-colors">
            <div className="text-lg font-bold text-primary">
              {tasksTotal > 0 ? `${Math.round(taskCompletionRate)}%` : '-'}
            </div>
            <div className="text-[11px] text-stone-500">할일 완료</div>
          </Link>
          <Link href={`/${teamId}/${projectId}/conflicts`}
            className="card-soft p-3 text-center hover:border-primary/30 transition-colors">
            <div className={`text-lg font-bold ${unresolvedConflicts.length > 0 ? 'text-accent' : 'text-primary'}`}>
              {unresolvedConflicts.length}
            </div>
            <div className="text-[11px] text-stone-500">활성 충돌</div>
          </Link>
        </div>

        {/* 태스크 진행률 — 인라인 */}
        {tasksTotal > 0 && (
          <Link href={`/${teamId}/${projectId}/tasks`} className="flex items-center gap-4 group">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-stone-700 group-hover:text-primary transition-colors">
              {Math.round((tasksDone / tasksTotal) * 100)}%
            </span>
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          섹션 2: 오늘의 액션
          ═══════════════════════════════════════════════════════ */}
      {(overdueTasks.length > 0 || pendingDecisions.length > 0 || unresolvedConflicts.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            오늘의 액션
            <span className="text-accent font-bold text-xs">
              {overdueTasks.length + pendingDecisions.length + unresolvedConflicts.length}
            </span>
          </h2>
          <div className="space-y-3">
            {/* 지연된 할 일 */}
            {overdueTasks.length > 0 && (
              <div className="card-soft border-l-4 border-l-red-500 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-stone-900">지연된 할 일</span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{overdueTasks.length}</span>
                  </div>
                  <Link href={`/${teamId}/${projectId}/tasks`} className="text-xs text-stone-400 hover:text-primary transition-colors">
                    보기 →
                  </Link>
                </div>
                <div className="space-y-1">
                  {overdueTasks.slice(0, 3).map(t => {
                    const daysSince = Math.floor((now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={t.id} className="flex items-center gap-3 text-sm">
                        <span className="text-stone-600 flex-1 truncate">{t.title}</span>
                        {t.assignee && <span className="text-xs text-stone-400 shrink-0">{t.assignee}</span>}
                        <span className="text-xs text-red-500 shrink-0">{daysSince}일 경과</span>
                      </div>
                    )
                  })}
                  {overdueTasks.length > 3 && (
                    <p className="text-xs text-stone-400">외 {overdueTasks.length - 3}건</p>
                  )}
                </div>
              </div>
            )}

            {/* 보류 중인 결정 */}
            {pendingDecisions.length > 0 && (
              <div className="card-soft border-l-4 border-l-amber-500 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-stone-900">보류 중인 결정</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{pendingDecisions.length}</span>
                  </div>
                  <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-stone-400 hover:text-primary transition-colors">
                    보기 →
                  </Link>
                </div>
                <div className="space-y-1">
                  {pendingDecisions.slice(0, 3).map(d => (
                    <div key={d.id} className="flex items-center gap-3 text-sm">
                      <span className="text-xs font-mono text-stone-400">{d.code}</span>
                      <span className="text-stone-600 flex-1 truncate">{d.title}</span>
                      <span className="text-xs text-amber-500 shrink-0">{statusLabel[d.status]}</span>
                    </div>
                  ))}
                  {pendingDecisions.length > 3 && (
                    <p className="text-xs text-stone-400">외 {pendingDecisions.length - 3}건</p>
                  )}
                </div>
              </div>
            )}

            {/* 미해결 충돌 */}
            {unresolvedConflicts.length > 0 && (
              <div className="card-soft border-l-4 border-l-red-500 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-stone-900">미해결 충돌</span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{unresolvedConflicts.length}</span>
                  </div>
                  <Link href={`/${teamId}/${projectId}/conflicts`} className="text-xs text-stone-400 hover:text-primary transition-colors">
                    해결하기 →
                  </Link>
                </div>
                <div className="space-y-2">
                  {unresolvedConflicts.slice(0, 3).map(c => (
                    <Link key={c.id} href={`/${teamId}/${projectId}/conflicts`}
                      className="block hover:bg-stone-50 rounded-lg px-2 py-1.5 -mx-1 transition-colors">
                      <div className="flex items-center gap-2 text-xs text-stone-400 mb-0.5">
                        <span className="font-mono">{c.newDecision.code}</span>
                        <span>vs</span>
                        <span className="font-mono">{c.existingDecision.code}</span>
                        <span className={`ml-auto shrink-0 font-semibold ${c.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`}>
                          {c.severity === 'high' ? '높음' : '보통'}
                        </span>
                      </div>
                      <div className="text-sm text-stone-700 truncate">
                        &ldquo;{c.newDecision.title}&rdquo; ↔ &ldquo;{c.existingDecision.title}&rdquo;
                      </div>
                    </Link>
                  ))}
                  {unresolvedConflicts.length > 3 && (
                    <p className="text-xs text-stone-400">외 {unresolvedConflicts.length - 3}건</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          섹션 3: 최근 미팅 (Enhanced)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-900">최근 미팅</h2>
          <Link href={`/${teamId}/${projectId}/meetings`} className="text-xs text-stone-400 hover:text-primary transition-colors">
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
                  <div className={`p-2 rounded-lg bg-primary/5`}>
                    <SrcIcon className={`h-5 w-5 text-primary`} />
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
                    <div className="flex items-center gap-3 mt-2">
                      {mtgDecs.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Target className="h-3 w-3" />
                          결정 {mtgDecs.length}
                        </span>
                      )}
                      {mtgTasks.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          할일 {mtgTasks.length}
                        </span>
                      )}
                      {(mtg.issues?.length || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-3 w-3" />
                          이슈 {mtg.issues.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          섹션 4: 최근 결정
          ═══════════════════════════════════════════════════════ */}
      {decisions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">최근 결정</h2>
            <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-stone-400 hover:text-primary transition-colors">
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

      {/* ═══════════════════════════════════════════════════════
          섹션 5: 외부 연동
          ═══════════════════════════════════════════════════════ */}
      <div className="border-t border-stone-100 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-stone-400" />
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">연동</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {integrationList.map(intg => (
            <button
              key={intg.name}
              onClick={() => setIntegrationDialog(intg.name)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50/50 hover:bg-primary/5 hover:border-primary/20 transition-all text-sm text-stone-500 hover:text-primary"
            >
              <intg.Icon size={16} />
              <span className="text-xs font-medium">{intg.name}</span>
              <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full">연동 가능</span>
            </button>
          ))}
        </div>
      </div>

      {/* Integration dialog overlay */}
      {integrationDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setIntegrationDialog(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">{integrationDialog} 연동</h3>
              <button onClick={() => setIntegrationDialog(null)}
                className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                <strong className="text-stone-900">{integrationDialog}</strong> 연동은<br />
                곧 지원 예정입니다.
              </p>
              <p className="text-xs text-stone-400">
                관심을 가져주셔서 감사합니다!
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setIntegrationDialog(null)}
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
