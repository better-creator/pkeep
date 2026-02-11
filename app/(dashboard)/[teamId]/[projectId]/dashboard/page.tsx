'use client'

import { useParams } from 'next/navigation'
import {
  GitBranch,
  AlertTriangle,
  Users,
  Calendar,
  MessageSquarePlus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Mock 데이터
const projectData = {
  name: 'E-Commerce MVP',
  goal: '2024 Q1 런칭',
  teamCount: 5,
  progress: 72,
  dDay: 38,
}

const kpiData = [
  {
    label: '전체 결정',
    value: 24,
    icon: GitBranch,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    trend: '+3 이번 주'
  },
  {
    label: '이슈·충돌',
    value: 2,
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    trend: '해결 필요'
  },
  {
    label: '팀 활동',
    value: 5,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    trend: '오늘 활성'
  },
  {
    label: 'D-Day',
    value: `D-${projectData.dDay}`,
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    trend: '2024.03.20'
  },
]

const aiDiagnosis = {
  type: 'warning' as const,
  title: '로그인 방식 결정이 3주째 보류 중입니다',
  description: 'DEC-007 소셜 로그인 vs 이메일 로그인 결정이 필요합니다. 관련 화면 3개가 대기 중입니다.',
  actionLabel: '결정 바로가기',
  actionHref: '/team-1/proj-1/nodeview',
}

const recentActivities = [
  {
    id: 1,
    type: 'confirmed',
    code: 'DEC-012',
    title: '결제 수단 - 카드/간편결제 우선',
    user: '김철수',
    time: '2시간 전',
  },
  {
    id: 2,
    type: 'changed',
    code: 'DEC-004',
    title: '타임라인 뷰로 변경',
    user: '이영희',
    time: '5시간 전',
  },
  {
    id: 3,
    type: 'pending',
    code: 'DEC-015',
    title: '배송 추적 API 연동 방식',
    user: '박지민',
    time: '1일 전',
  },
  {
    id: 4,
    type: 'confirmed',
    code: 'DEC-011',
    title: '상품 상세 레이아웃 확정',
    user: '최수연',
    time: '2일 전',
  },
]

const mindmapClusters = [
  { id: 'auth', name: '인증', count: 4, color: 'bg-blue-500' },
  { id: 'order', name: '주문', count: 6, color: 'bg-emerald-500' },
  { id: 'product', name: '상품', count: 5, color: 'bg-purple-500' },
  { id: 'mypage', name: '마이', count: 3, color: 'bg-amber-500' },
]

const activityTypeConfig = {
  confirmed: { icon: CheckCircle, color: 'text-emerald-500', label: '확정' },
  changed: { icon: AlertCircle, color: 'text-amber-500', label: '변경' },
  pending: { icon: Clock, color: 'text-gray-400', label: '검토중' },
}

export default function DashboardPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent">{projectData.name}</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                목표: {projectData.goal} · 팀원 {projectData.teamCount}명
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Team Avatars */}
            <div className="flex -space-x-2">
              {['김', '이', '박', '최', '정'].map((initial, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-stone-100 to-stone-200 text-stone-600">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">전체 진척률</span>
            <span className="text-sm font-bold text-orange-600">{projectData.progress}%</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${projectData.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className="card-soft p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-stone-800 to-stone-600 bg-clip-text text-transparent">{kpi.value}</p>
                  <p className="text-xs text-stone-400 mt-1">{kpi.trend}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bgColor} shadow-sm`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Diagnosis Banner */}
        <div className="pastel-amber rounded-2xl border border-amber-200/50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl shadow-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">{aiDiagnosis.title}</h3>
              <p className="text-sm text-amber-700/80 mt-1">{aiDiagnosis.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300/60 text-amber-700 hover:bg-amber-100/50 rounded-xl"
              asChild
            >
              <Link href={aiDiagnosis.actionHref}>
                {aiDiagnosis.actionLabel}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="col-span-2 glass-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800">최근 활동</h2>
              <Button variant="ghost" size="sm" className="text-stone-500 hover:text-orange-600" asChild>
                <Link href={`/${teamId}/${projectId}/nodeview`}>
                  전체 보기
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-stone-100/50">
              {recentActivities.map((activity) => {
                const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig]
                const Icon = config.icon
                return (
                  <div key={activity.id} className="px-5 py-4 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono rounded-lg border-stone-200/60">
                            {activity.code}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs rounded-lg ${
                              activity.type === 'confirmed' ? 'status-confirmed' :
                              activity.type === 'changed' ? 'status-changed' :
                              'status-pending'
                            }`}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-stone-800 mt-1 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {activity.user} · {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mini Mindmap */}
          <div className="glass-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/50">
              <h2 className="font-semibold text-stone-800">프로젝트 & 팀</h2>
              <Button variant="ghost" size="sm" className="text-stone-500 hover:text-orange-600" asChild>
                <Link href={`/${teamId}/${projectId}/mindmap`}>
                  자세히
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="p-5">
              {/* Mini Mindmap Visualization */}
              <div className="relative h-48 mb-4">
                <svg viewBox="0 0 200 150" className="w-full h-full">
                  {/* Center node */}
                  <defs>
                    <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(30, 10%, 25%)" />
                      <stop offset="100%" stopColor="hsl(30, 10%, 35%)" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="75" r="20" fill="url(#centerGrad)" />
                  <text x="100" y="79" textAnchor="middle" className="fill-white text-[8px] font-medium">
                    프로젝트
                  </text>

                  {/* Cluster nodes */}
                  {mindmapClusters.map((cluster, i) => {
                    const angle = (i * 90 - 45) * (Math.PI / 180)
                    const x = 100 + Math.cos(angle) * 55
                    const y = 75 + Math.sin(angle) * 45
                    return (
                      <g key={cluster.id}>
                        <line
                          x1="100" y1="75" x2={x} y2={y}
                          className="stroke-stone-300"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={x} cy={y} r="18"
                          className={cluster.color}
                        />
                        <text
                          x={x} y={y - 3}
                          textAnchor="middle"
                          className="fill-white text-[7px] font-medium"
                        >
                          {cluster.name}
                        </text>
                        <text
                          x={x} y={y + 7}
                          textAnchor="middle"
                          className="fill-white/80 text-[6px]"
                        >
                          {cluster.count}건
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Cluster Stats */}
              <div className="grid grid-cols-2 gap-2">
                {mindmapClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50/80 border border-stone-100/50"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${cluster.color} shadow-sm`} />
                    <span className="text-xs text-stone-600">{cluster.name}</span>
                    <span className="text-xs font-medium text-stone-800 ml-auto">{cluster.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          <Link
            href={`/${teamId}/${projectId}/nodeview`}
            className="flex items-center gap-3 p-4 card-soft hover:border-orange-300/60 group"
          >
            <div className="p-2.5 rounded-xl pastel-mint group-hover:shadow-sm transition-all">
              <GitBranch className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">새 결정 추가</p>
              <p className="text-xs text-stone-500">노드뷰에서 결정 생성</p>
            </div>
          </Link>

          <Link
            href={`/${teamId}/${projectId}/meetings`}
            className="flex items-center gap-3 p-4 card-soft hover:border-blue-300/60 group"
          >
            <div className="p-2.5 rounded-xl pastel-blue group-hover:shadow-sm transition-all">
              <MessageSquarePlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">맥락 추가</p>
              <p className="text-xs text-stone-500">미팅, 슬랙, 문서 연결</p>
            </div>
          </Link>

          <Link
            href={`/${teamId}/${projectId}/mindmap`}
            className="flex items-center gap-3 p-4 card-soft hover:border-purple-300/60 group"
          >
            <div className="p-2.5 rounded-xl pastel-purple group-hover:shadow-sm transition-all">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">프로젝트 & 팀</p>
              <p className="text-xs text-stone-500">팀 현황 보기</p>
            </div>
          </Link>

          <Link
            href={`/${teamId}/${projectId}/ai`}
            className="flex items-center gap-3 p-4 card-soft hover:border-amber-300/60 group"
          >
            <div className="p-2.5 rounded-xl pastel-amber group-hover:shadow-sm transition-all">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">AI 진단</p>
              <p className="text-xs text-stone-500">프로젝트 분석 보기</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
