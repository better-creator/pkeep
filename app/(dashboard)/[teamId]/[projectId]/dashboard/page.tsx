'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GitBranch, AlertTriangle, ListChecks, Mic, ArrowRight,
  CheckCircle, Clock, AlertCircle, CircleDot, MessageSquare,
  BookOpen, Figma, FolderOpen, Phone, Mail, ChevronRight,
  Circle, CheckCircle2, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { StoredMeeting, StoredDecision, StoredTask, StoredRejected } from '@/lib/store/types'
import { detectConflicts, getSeverityConfig, getConflictTypeLabel, type Conflict } from '@/lib/conflicts'

// ─── Config (이전과 동일) ───
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
  const [conflicts, setConflicts] = useState<Conflict[]>([])

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

  const totalDecisions = decisions.length
  const tasksDone = tasks.filter(t => t.done).length
  const tasksTotal = tasks.length
  const unresolvedConflicts = conflicts.filter(c => !c.resolved && c.type !== 'rejected_alternative')
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || d.status === 'hold')
  const changedDecisions = decisions.filter(d => d.status === 'changed')

  const areaCounts = decisions.reduce<Record<string, number>>((acc, d) => {
    const area = d.area || 'planning'
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {})

  const getMeeting = (meetingId: string) => meetings.find(m => m.id === meetingId)

  // 주의 필요 아이템 빌드
  type AttentionItem = { type: string; label: string; title: string; color: string; link: string; dot: string }
  const attentionItems: AttentionItem[] = []
  unresolvedConflicts.forEach(c => attentionItems.push({
    type: 'conflict', label: '충돌', color: 'text-red-600', dot: 'bg-red-500',
    title: `${c.newDecision.code} vs ${c.existingDecision.code}`,
    link: `/${teamId}/${projectId}/conflicts`,
  }))
  changedDecisions.forEach(d => attentionItems.push({
    type: 'changed', label: '변경', color: 'text-amber-600', dot: 'bg-amber-500',
    title: `${d.code} ${d.title}`,
    link: `/${teamId}/${projectId}/decisions`,
  }))
  meetings.forEach(m => (m.issues || []).forEach(issue => attentionItems.push({
    type: 'issue', label: '이슈', color: 'text-orange-600', dot: 'bg-orange-500',
    title: issue.title,
    link: `/${teamId}/${projectId}/meetings`,
  })))
  pendingDecisions.forEach(d => attentionItems.push({
    type: 'pending', label: '보류', color: 'text-stone-500', dot: 'bg-stone-400',
    title: `${d.code} ${d.title}`,
    link: `/${teamId}/${projectId}/decisions`,
  }))

  return (
    <div className="space-y-6">
      {/* Header + Integration strip (이전과 동일) */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">대시보드</h1>
          <p className="text-sm text-stone-500 mt-1">프로젝트 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-1.5">
          {integrations.map(tool => (
            <div key={tool.name}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                tool.connected ? 'bg-white border border-stone-200 text-stone-600' : 'bg-stone-50 border border-dashed border-stone-200 text-stone-400'
              }`}>
              <tool.icon className={`h-3 w-3 ${tool.connected ? tool.color : 'text-stone-400'}`} />
              {tool.name}
              {tool.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* 태스크 진행률 (상단 배치) */}
      {tasksTotal > 0 && (
        <Link href={`/${teamId}/${projectId}/tasks`} className="block card-soft p-4 hover:bg-stone-50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-stone-800">태스크 진행률</h3>
            <span className="text-sm font-bold text-stone-800">{tasksDone}/{tasksTotal} ({tasksTotal > 0 ? Math.round(tasksDone / tasksTotal * 100) : 0}%)</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0}%` }} />
          </div>
        </Link>
      )}

      {/* KPI Cards — 클릭 시 상세 페이지 이동 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '결정', value: totalDecisions, icon: GitBranch, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: `확정 ${decisions.filter(d => d.status === 'confirmed').length}건`, href: `/${teamId}/${projectId}/decisions` },
          { label: '이슈', value: unresolvedConflicts.length + changedDecisions.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', sub: attentionItems.length > 0 ? '확인 필요' : '없음', href: `/${teamId}/${projectId}/conflicts` },
          { label: '할 일', value: `${tasksDone}/${tasksTotal}`, icon: ListChecks, color: 'text-blue-500', bg: 'bg-blue-50', sub: tasksTotal > 0 ? `${Math.round(tasksDone / tasksTotal * 100)}%` : '-', href: `/${teamId}/${projectId}/tasks` },
          { label: '미팅', value: meetings.length, icon: Mic, color: 'text-purple-500', bg: 'bg-purple-50', sub: `최근 ${meetings.slice(0, 1).map(m => m.code).join('')}`, href: `/${teamId}/${projectId}/meetings` },
        ].map(kpi => (
          <Link key={kpi.label} href={kpi.href} className="card-soft p-4 hover:bg-stone-50 transition-colors">
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
          </Link>
        ))}
      </div>

      {/* 주의 필요 (새로 추가) */}
      {attentionItems.length > 0 && (
        <div className="card-soft p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">주의 필요</h3>
              <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">
                {attentionItems.length}건
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            {attentionItems.slice(0, 6).map((item, i) => (
              <Link key={`${item.type}-${i}`} href={item.link}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                <span className={`text-[10px] font-semibold w-7 flex-shrink-0 ${item.color}`}>{item.label}</span>
                <span className="text-sm text-stone-700 flex-1 truncate">{item.title}</span>
                <ChevronRight className="h-3 w-3 text-stone-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 충돌 감지 (이전과 동일) */}
      {(() => {
        if (unresolvedConflicts.length === 0) return null
        return (
          <div className="card-soft p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-stone-800">충돌 감지</h3>
                <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">{unresolvedConflicts.length}건</Badge>
              </div>
              <Link href={`/${teamId}/${projectId}/conflicts`} className="text-xs text-orange-600 font-medium hover:underline">모두 보기 →</Link>
            </div>
            <div className="space-y-1.5">
              {unresolvedConflicts.slice(0, 4).map(conflict => {
                const sev = getSeverityConfig(conflict.severity)
                return (
                  <div key={conflict.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-[3px] ${sev.border} ${sev.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{conflict.newDecision.code}</Badge>
                      <span className="text-[10px] text-stone-400">vs</span>
                      <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{conflict.existingDecision.code}</Badge>
                      <span className="text-[10px] text-stone-500 truncate">{getConflictTypeLabel(conflict.type)}</span>
                    </div>
                    <Link href={`/${teamId}/${projectId}/conflicts`} className="text-[10px] text-orange-600 font-medium hover:underline flex-shrink-0">해결하기 →</Link>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 보류 경고 (이전과 동일) */}
      {pendingDecisions.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/50">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-medium">{pendingDecisions.length}건</span> 보류 중 — {pendingDecisions.slice(0, 2).map(d => d.code).join(', ')}
          </p>
          <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-amber-700 font-medium hover:underline flex-shrink-0">확인 →</Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* 최근 미팅 (새로 추가 — 이전 activity feed 대체) */}
        <div className="col-span-2 space-y-5">
          {/* 최근 미팅 섹션 */}
          <div className="glass-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">최근 미팅</h2>
              <Link href={`/${teamId}/${projectId}/meetings`} className="text-xs text-stone-400 hover:text-orange-600">모두 보기 →</Link>
            </div>
            {meetings.length === 0 ? (
              <div className="px-5 py-10 text-center text-stone-400 text-sm">
                <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-30" />
                회의를 녹음하면 AI가 자동으로 결정과 할 일을 추출합니다.
              </div>
            ) : (
              <div className="divide-y divide-stone-100/50">
                {meetings.slice(0, 4).map(mtg => {
                  const st = (mtg as any).sourceType || 'meeting'
                  const srcCfg = sourceTypeCfg[st] || sourceTypeCfg.meeting
                  const SrcIcon = srcCfg.icon
                  const mtgDecs = decisions.filter(d => d.meetingId === mtg.id)
                  const mtgTasks = tasks.filter(t => t.meetingId === mtg.id)
                  const issueCount = (mtg.issues || []).length

                  return (
                    <Link key={mtg.id} href={`/${teamId}/${projectId}/meetings`}
                      className="block px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${srcCfg.bg} mt-0.5`}>
                          <SrcIcon className={`h-3.5 w-3.5 ${srcCfg.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono rounded-md border-stone-200/60 px-1.5 py-0">{mtg.code}</Badge>
                            <span className="text-sm font-medium text-stone-800 truncate">{mtg.title}</span>
                            <span className="text-[11px] text-stone-400 ml-auto flex-shrink-0">{mtg.date}</span>
                          </div>
                          {mtg.summary && (
                            <p className="text-xs text-stone-500 mt-1 line-clamp-1">{mtg.summary}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400">
                            {mtgDecs.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <GitBranch className="h-3 w-3" /> 결정 {mtgDecs.length}
                              </span>
                            )}
                            {mtgTasks.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <ListChecks className="h-3 w-3" /> 할일 {mtgTasks.length}
                              </span>
                            )}
                            {issueCount > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <AlertTriangle className="h-3 w-3" /> 이슈 {issueCount}
                              </span>
                            )}
                            {mtg.keywords?.length > 0 && (
                              <span className="ml-auto flex gap-1">
                                {mtg.keywords.slice(0, 3).map(kw => (
                                  <Badge key={kw} variant="secondary" className="text-[9px] px-1 py-0 bg-stone-100">{kw}</Badge>
                                ))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* 최근 결정 (새로 추가) */}
          <div className="glass-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">최근 결정</h2>
              <Link href={`/${teamId}/${projectId}/decisions`} className="text-xs text-stone-400 hover:text-orange-600">모두 보기 →</Link>
            </div>
            <div className="divide-y divide-stone-100/50">
              {decisions.length === 0 ? (
                <div className="px-5 py-8 text-center text-stone-400 text-sm">추출된 결정이 없습니다.</div>
              ) : (
                decisions.slice(0, 5).map(d => {
                  const st = statusConfig[d.status as string] || statusConfig.pending
                  const StIcon = st.icon
                  const meeting = getMeeting(d.meetingId)
                  const meetingSt = (meeting as any)?.sourceType || 'meeting'
                  const srcCfg = sourceTypeCfg[meetingSt] || sourceTypeCfg.meeting
                  const SrcIcon = srcCfg.icon

                  return (
                    <div key={d.id} className="px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <StIcon className={`h-4 w-4 mt-0.5 ${st.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono rounded-md border-stone-200/60 px-1.5 py-0">{d.code}</Badge>
                            <Badge className={`text-[10px] rounded-md px-1.5 py-0 ${areaColor[d.area || ''] || ''}`}>{areaLabel[d.area || ''] || d.area}</Badge>
                            <Badge variant="secondary" className={`text-[10px] rounded-md px-1.5 py-0 ${st.bg}`}>{st.label}</Badge>
                          </div>
                          <p className="text-sm font-medium text-stone-800 mt-1 truncate">{d.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${srcCfg.bg} ${srcCfg.text}`}>
                              <SrcIcon className="h-2 w-2" />
                              {meeting?.code}
                            </span>
                            {d.proposedBy && <span className="text-[11px] text-stone-400">{d.proposedBy}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (이전과 동일 구조) */}
        <div className="space-y-5">
          {/* 영역별 (이전과 동일) */}
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
                      <div className={`h-full rounded-full ${area === 'dev' ? 'bg-sky-400' : area === 'design' ? 'bg-pink-400' : 'bg-violet-400'}`}
                        style={{ width: `${totalDecisions > 0 ? (count / totalDecisions) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-medium text-stone-700 w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 바로가기 (이전과 동일) */}
          <div className="glass-card">
            <div className="px-4 py-3 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800 text-sm">바로가기</h2>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { href: `/${teamId}/${projectId}/meetings`, icon: Mic, label: '회의 녹음', iconBg: 'bg-red-100', iconColor: 'text-red-600', hoverBg: 'hover:bg-red-50' },
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
