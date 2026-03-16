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
  Link2,
  Phone,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask } from '@/lib/store/types'

const statusConfig = {
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
  const meetingsCount = meetings.length

  // Area breakdown
  const areaCounts = decisions.reduce<Record<string, number>>((acc, d) => {
    const area = d.area || 'planning'
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {})

  // Recent decisions (sorted by date desc)
  const recentDecisions = [...decisions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Pending/hold decisions for AI warning
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'hold')

  const getMeetingCode = (meetingId: string) => {
    const m = meetings.find(m => m.id === meetingId)
    return m?.code || meetingId
  }

  const kpiData = [
    { label: '전체 결정', value: totalDecisions, icon: GitBranch, color: 'text-emerald-500', bgColor: 'bg-emerald-50', sub: `확정 ${decisions.filter(d => d.status === 'confirmed').length}건` },
    { label: '이슈·변경', value: issueCount, icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-50', sub: issueCount > 0 ? '확인 필요' : '이슈 없음' },
    { label: '할 일 진행률', value: `${tasksDone}/${tasksTotal}`, icon: ListChecks, color: 'text-blue-500', bgColor: 'bg-blue-50', sub: tasksTotal > 0 ? `${Math.round(tasksDone / tasksTotal * 100)}% 완료` : '-' },
    { label: '녹음·소스', value: meetingsCount, icon: Mic, color: 'text-purple-500', bgColor: 'bg-purple-50', sub: `회의 ${meetings.filter(m => m.sourceType === 'meeting').length}건` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
        <p className="text-sm text-stone-500 mt-1">프로젝트 현황을 한눈에 확인하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="card-soft p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-stone-500 mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-stone-800">{kpi.value}</p>
                <p className="text-xs text-stone-400 mt-1">{kpi.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bgColor}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Warning Banner */}
      {pendingDecisions.length > 0 && (
        <div className="pastel-amber rounded-2xl border border-amber-200/50 p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {pendingDecisions.length}건의 결정이 보류/미확정 상태입니다
              </h3>
              <p className="text-sm text-amber-700/80 mt-1">
                {pendingDecisions.slice(0, 2).map(d => d.code).join(', ')} 등 — 빠른 결정이 필요합니다.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300/60 text-amber-700 hover:bg-amber-100/50 rounded-xl" asChild>
              <Link href={`/${teamId}/${projectId}/decisions`}>
                확인하기 <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* 연동 현황 */}
      <div className="glass-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/50">
          <h2 className="font-semibold text-stone-800">연동 현황</h2>
          <span className="text-xs text-stone-400">실시간 동기화</span>
        </div>
        <div className="px-5 py-4 flex gap-3 overflow-x-auto">
          {[
            { name: 'Notion', icon: BookOpen, status: 'connected', color: 'text-stone-700', bg: 'bg-stone-100', count: 4, desc: '회의록 4건 동기화' },
            { name: 'Slack', icon: MessageSquare, status: 'connected', color: 'text-purple-600', bg: 'bg-purple-100', count: 12, desc: '#dev 채널 12건 반영' },
            { name: 'Figma', icon: Figma, status: 'connected', color: 'text-pink-600', bg: 'bg-pink-100', count: 3, desc: '디자인 결정 3건 연결' },
            { name: 'Google Drive', icon: FolderOpen, status: 'pending', color: 'text-blue-600', bg: 'bg-blue-100', count: 0, desc: '연동 대기중' },
          ].map((tool) => (
            <div
              key={tool.name}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                tool.status === 'connected'
                  ? 'border-stone-200 bg-white hover:border-stone-300'
                  : 'border-dashed border-stone-200 bg-stone-50/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${tool.bg}`}>
                <tool.icon className={`h-4 w-4 ${tool.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-700">{tool.name}</span>
                  {tool.status === 'connected' ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      연동됨
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">대기</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Decisions */}
        <div className="col-span-2 glass-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/50">
            <h2 className="font-semibold text-stone-800">최근 결정</h2>
            <Button variant="ghost" size="sm" className="text-stone-500 hover:text-orange-600" asChild>
              <Link href={`/${teamId}/${projectId}/decisions`}>
                전체 보기 <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-stone-100/50">
            {recentDecisions.length === 0 ? (
              <div className="px-5 py-10 text-center text-stone-400 text-sm">
                아직 결정이 없습니다. 회의를 녹음하면 AI가 자동으로 추출합니다.
              </div>
            ) : (
              recentDecisions.map((dec) => {
                const st = statusConfig[dec.status as keyof typeof statusConfig] || statusConfig.pending
                const Icon = st.icon
                return (
                  <div key={dec.id} className="px-5 py-4 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${st.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-mono rounded-lg border-stone-200/60">{dec.code}</Badge>
                          <Badge className={`text-xs rounded-lg ${areaColor[dec.area || ''] || ''}`}>{areaLabel[dec.area || ''] || dec.area}</Badge>
                          <Badge variant="secondary" className={`text-xs rounded-lg ${st.bg}`}>{st.label}</Badge>
                        </div>
                        <p className="text-sm font-medium text-stone-800 mt-1.5 truncate">{dec.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <SourceBadge meetingId={dec.meetingId} meetings={meetings} />
                          <span className="text-xs text-stone-400">{dec.proposedBy} · {dec.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column — Area Breakdown + Quick Actions */}
        <div className="space-y-6">
          {/* Area Breakdown */}
          <div className="glass-card">
            <div className="px-5 py-4 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800">영역별 결정</h2>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(areaCounts).length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">데이터 없음</p>
              ) : (
                Object.entries(areaCounts).map(([area, count]) => (
                  <div key={area} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleDot className={`h-4 w-4 ${area === 'dev' ? 'text-sky-500' : area === 'design' ? 'text-pink-500' : 'text-violet-500'}`} />
                      <span className="text-sm text-stone-600">{areaLabel[area] || area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${area === 'dev' ? 'bg-sky-400' : area === 'design' ? 'bg-pink-400' : 'bg-violet-400'}`}
                          style={{ width: `${totalDecisions > 0 ? (count / totalDecisions) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-stone-700 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 연동 출처 요약 */}
          <div className="glass-card">
            <div className="px-5 py-4 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800">출처별 현황</h2>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { icon: Mic, label: '회의 녹음', count: meetings.filter(m => (m as any).sourceType === 'meeting').length, color: 'text-red-500', bg: 'bg-red-50' },
                { icon: MessageSquare, label: 'Slack', count: meetings.filter(m => (m as any).sourceType === 'slack').length, color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: BookOpen, label: 'Notion', count: meetings.filter(m => (m as any).sourceType === 'notion').length, color: 'text-stone-600', bg: 'bg-stone-100' },
                { icon: Phone, label: '통화', count: meetings.filter(m => (m as any).sourceType === 'call').length, color: 'text-green-500', bg: 'bg-green-50' },
                { icon: Mail, label: '이메일', count: meetings.filter(m => (m as any).sourceType === 'email').length, color: 'text-rose-500', bg: 'bg-rose-50' },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${s.bg}`}>
                      <s.icon className={`h-3 w-3 ${s.color}`} />
                    </div>
                    <span className="text-sm text-stone-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-medium text-stone-700">{s.count}건</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card">
            <div className="px-5 py-4 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800">바로가기</h2>
            </div>
            <div className="p-3 space-y-1">
              <Link
                href={`/${teamId}/${projectId}/meetings?record=1`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                  <Mic className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">회의 녹음하기</span>
              </Link>
              <Link
                href={`/${teamId}/${projectId}/decisions`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <GitBranch className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">결정 관리</span>
              </Link>
              <Link
                href={`/${teamId}/${projectId}/tasks`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <ListChecks className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-stone-700">할 일 보기</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 출처 뱃지 — 소스 타입에 따라 색상 아이콘 표시
const sourceTypeBadgeConfig: Record<string, { icon: typeof Mic; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-red-50', text: 'text-red-600' },
  slack: { icon: MessageSquare, label: 'Slack', bg: 'bg-purple-50', text: 'text-purple-600' },
  notion: { icon: BookOpen, label: 'Notion', bg: 'bg-stone-100', text: 'text-stone-600' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-50', text: 'text-green-600' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-50', text: 'text-rose-600' },
}

function SourceBadge({ meetingId, meetings }: { meetingId: string; meetings: StoredMeeting[] }) {
  const meeting = meetings.find(m => m.id === meetingId)
  const st = (meeting as any)?.sourceType || 'meeting'
  const cfg = sourceTypeBadgeConfig[st] || sourceTypeBadgeConfig.meeting
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}
