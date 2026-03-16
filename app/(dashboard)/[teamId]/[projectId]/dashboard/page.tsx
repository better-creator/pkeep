'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch,
  AlertTriangle,
  ListChecks,
  Mic,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  CircleDot,
  MessageSquare,
  BookOpen,
  Figma,
  FolderOpen,
  Phone,
  Mail,
  ChevronRight,
  Circle,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask } from '@/lib/store/types'

// ─── Config ───
const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  confirmed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'status-confirmed', label: '확정' },
  changed: { icon: AlertCircle, color: 'text-blue-500', bg: 'status-changed', label: '변경' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'status-pending', label: '보류' },
  hold: { icon: AlertTriangle, color: 'text-amber-500', bg: 'status-pending', label: '보류' },
}
const areaLabel: Record<string, string> = { planning: '기획', design: '디자인', dev: '개발' }
const areaColor: Record<string, string> = {
  planning: 'bg-violet-100 text-violet-700',
  design: 'bg-pink-100 text-pink-700',
  dev: 'bg-sky-100 text-sky-700',
}
const sourceTypeCfg: Record<string, { icon: typeof Mic; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-red-50', text: 'text-red-600' },
  slack: { icon: MessageSquare, label: 'Slack', bg: 'bg-purple-50', text: 'text-purple-600' },
  notion: { icon: BookOpen, label: 'Notion', bg: 'bg-stone-100', text: 'text-stone-600' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-50', text: 'text-green-600' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-50', text: 'text-rose-600' },
}
const integrations = [
  { name: 'Notion', icon: BookOpen, connected: true, color: 'text-stone-700', bg: 'bg-stone-100' },
  { name: 'Slack', icon: MessageSquare, connected: true, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Figma', icon: Figma, connected: true, color: 'text-pink-600', bg: 'bg-pink-100' },
  { name: 'Drive', icon: FolderOpen, connected: false, color: 'text-blue-600', bg: 'bg-blue-100' },
]

export default function DashboardPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [meetings, setMeetings] = useState<StoredMeeting[]>([])
  const [decisions, setDecisions] = useState<StoredDecision[]>([])
  const [tasks, setTasks] = useState<StoredTask[]>([])

  useEffect(() => {
    setMeetings(JSON.parse(localStorage.getItem('pkeep-meetings') || '[]'))
    setDecisions(JSON.parse(localStorage.getItem('pkeep-decisions') || '[]'))
    setTasks(JSON.parse(localStorage.getItem('pkeep-tasks') || '[]'))
  }, [])

  const totalDecisions = decisions.length
  const issueCount = decisions.filter(d => d.status === 'changed' || d.status === 'hold').length
  const tasksDone = tasks.filter(t => t.done).length
  const tasksTotal = tasks.length
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'hold')

  const areaCounts = decisions.reduce<Record<string, number>>((acc, d) => {
    const area = d.area || 'planning'
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {})

  // Build unified activity feed: decisions + tasks sorted by date
  const activityFeed = [
    ...decisions.map(d => ({
      type: 'decision' as const,
      id: d.id,
      code: d.code,
      title: d.title,
      status: d.status,
      area: d.area,
      meetingId: d.meetingId,
      proposedBy: d.proposedBy,
      date: d.createdAt,
    })),
    ...tasks.map(t => ({
      type: 'task' as const,
      id: t.id,
      code: '',
      title: t.title,
      status: t.done ? 'done' : 'todo',
      area: '' as string | undefined,
      meetingId: t.meetingId,
      proposedBy: t.assignee,
      date: t.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const getMeeting = (meetingId: string) => meetings.find(m => m.id === meetingId)
  const getDecisionForTask = (task: StoredTask) => {
    // Find decisions from same meeting
    return decisions.find(d => d.meetingId === task.meetingId)
  }

  return (
    <div className="space-y-6">
      {/* Header + Integration strip */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
          <p className="text-sm text-stone-500 mt-1">프로젝트 현황을 한눈에 확인하세요</p>
        </div>
        {/* Compact integration pills */}
        <div className="flex items-center gap-1.5">
          {integrations.map(tool => (
            <div
              key={tool.name}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                tool.connected
                  ? 'bg-white border border-stone-200 text-stone-600'
                  : 'bg-stone-50 border border-dashed border-stone-200 text-stone-400'
              }`}
            >
              <tool.icon className={`h-3 w-3 ${tool.connected ? tool.color : 'text-stone-400'}`} />
              {tool.name}
              {tool.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '결정', value: totalDecisions, icon: GitBranch, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: `확정 ${decisions.filter(d => d.status === 'confirmed').length}건` },
          { label: '이슈', value: issueCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', sub: issueCount > 0 ? '확인 필요' : '없음' },
          { label: '할 일', value: `${tasksDone}/${tasksTotal}`, icon: ListChecks, color: 'text-blue-500', bg: 'bg-blue-50', sub: tasksTotal > 0 ? `${Math.round(tasksDone / tasksTotal * 100)}%` : '-' },
          { label: '소스', value: meetings.length, icon: Mic, color: 'text-purple-500', bg: 'bg-purple-50', sub: `${meetings.filter(m => m.sourceType === 'meeting').length} 회의` },
        ].map(kpi => (
          <div key={kpi.label} className="card-soft p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-stone-800 mt-0.5">{kpi.value}</p>
                <p className="text-[11px] text-stone-400">{kpi.sub}</p>
              </div>
              <div className={`p-2 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Warning */}
      {pendingDecisions.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/50">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-medium">{pendingDecisions.length}건</span> 보류 중 — {pendingDecisions.slice(0, 2).map(d => d.code).join(', ')}
          </p>
          <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0">
            확인 →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main: Activity Feed */}
        <div className="col-span-2 glass-card">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100/50">
            <h2 className="font-semibold text-stone-800 text-sm">최근 활동</h2>
            <div className="flex gap-2">
              <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-stone-400 hover:text-orange-600">결정</Link>
              <Link href={`/${teamId}/${projectId}/tasks`} className="text-xs text-stone-400 hover:text-orange-600">할 일</Link>
            </div>
          </div>
          <div className="divide-y divide-stone-100/50">
            {activityFeed.length === 0 ? (
              <div className="px-5 py-10 text-center text-stone-400 text-sm">
                회의를 녹음하면 AI가 자동으로 결정과 할 일을 추출합니다.
              </div>
            ) : (
              activityFeed.map(item => {
                const meeting = getMeeting(item.meetingId)
                const meetingSt = (meeting as any)?.sourceType || 'meeting'
                const srcCfg = sourceTypeCfg[meetingSt] || sourceTypeCfg.meeting
                const SrcIcon = srcCfg.icon

                if (item.type === 'decision') {
                  const st = statusConfig[item.status as string] || statusConfig.pending
                  const StIcon = st.icon
                  return (
                    <div key={item.id} className="px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <StIcon className={`h-4 w-4 mt-0.5 ${st.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono rounded-md border-stone-200/60 px-1.5 py-0">{item.code}</Badge>
                            <Badge className={`text-[10px] rounded-md px-1.5 py-0 ${areaColor[item.area || ''] || ''}`}>{areaLabel[item.area || ''] || item.area}</Badge>
                            <Badge variant="secondary" className={`text-[10px] rounded-md px-1.5 py-0 ${st.bg}`}>{st.label}</Badge>
                          </div>
                          <p className="text-sm font-medium text-stone-800 mt-1 truncate">{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${srcCfg.bg} ${srcCfg.text}`}>
                              <SrcIcon className="h-2 w-2" />
                              {meeting?.code}
                            </span>
                            <span className="text-[11px] text-stone-400">{item.proposedBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  // Task item — show parent decision chain
                  const parentDec = decisions.find(d => d.meetingId === item.meetingId)
                  const isDone = item.status === 'done'
                  return (
                    <div key={item.id} className={`px-5 py-3.5 hover:bg-stone-50/50 transition-colors ${isDone ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 mt-0.5 text-stone-300" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm text-stone-800 ${isDone ? 'line-through' : 'font-medium'}`}>{item.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${srcCfg.bg} ${srcCfg.text}`}>
                              <SrcIcon className="h-2 w-2" />
                              {meeting?.code}
                            </span>
                            {parentDec && (
                              <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                                <ChevronRight className="h-2.5 w-2.5" />
                                {parentDec.code} {parentDec.title.slice(0, 20)}…
                              </span>
                            )}
                            {item.proposedBy && (
                              <span className="text-[11px] text-stone-400 ml-auto">{item.proposedBy}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Area Breakdown */}
          <div className="glass-card">
            <div className="px-4 py-3 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">영역별</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {Object.entries(areaCounts).map(([area, count]) => (
                <div key={area} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDot className={`h-3.5 w-3.5 ${area === 'dev' ? 'text-sky-500' : area === 'design' ? 'text-pink-500' : 'text-violet-500'}`} />
                    <span className="text-xs text-stone-600">{areaLabel[area] || area}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${area === 'dev' ? 'bg-sky-400' : area === 'design' ? 'bg-pink-400' : 'bg-violet-400'}`}
                        style={{ width: `${totalDecisions > 0 ? (count / totalDecisions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-700 w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source breakdown */}
          <div className="glass-card">
            <div className="px-4 py-3 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">출처별</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(sourceTypeCfg).map(([key, cfg]) => {
                const count = meetings.filter(m => (m as any).sourceType === key).length
                if (count === 0) return null
                const SIcon = cfg.icon
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${cfg.bg}`}>
                        <SIcon className={`h-3 w-3 ${cfg.text}`} />
                      </div>
                      <span className="text-xs text-stone-600">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-medium text-stone-700">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card">
            <div className="px-4 py-3 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">바로가기</h2>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { href: `/${teamId}/${projectId}/meetings?record=1`, icon: Mic, label: '회의 녹음', iconBg: 'bg-red-100', iconColor: 'text-red-600', hoverBg: 'hover:bg-red-50' },
                { href: `/${teamId}/${projectId}/decisions`, icon: GitBranch, label: '결정 관리', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', hoverBg: 'hover:bg-stone-50' },
                { href: `/${teamId}/${projectId}/tasks`, icon: ListChecks, label: '할 일', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', hoverBg: 'hover:bg-stone-50' },
              ].map(a => (
                <Link key={a.label} href={a.href} className={`flex items-center gap-2.5 p-2.5 rounded-lg ${a.hoverBg} transition-colors`}>
                  <div className={`p-1.5 rounded-md ${a.iconBg}`}>
                    <a.icon className={`h-3.5 w-3.5 ${a.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium text-stone-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
