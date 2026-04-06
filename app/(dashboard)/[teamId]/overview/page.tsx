'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
  Users,
  MessageSquare,
  Image,
  Palette,
  CircleDot,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'

// --- Mock Project Data ---
const projects = [
  {
    id: 'proj-1',
    name: '글로우업 S/S 캠페인',
    client: '글로우업 코스메틱',
    thumbnail: null,
    brandColor: '#E8734A',
    progress: 72,
    status: 'active' as const,
    dday: 14,
    blockers: 2,
    warnings: 0,
    decisions: { total: 34, pending: 5 },
    teamCount: 4,
    channels: ['인스타', '유튜브', '옥외'],
    recentActivity: '인스타 시안 3차 피드백 대기',
    guideHealth: 92,
  },
  {
    id: 'proj-2',
    name: '글로우업 x 던전히어로 콜라보',
    client: '글로우업 코스메틱',
    thumbnail: null,
    brandColor: '#6C3EC1',
    progress: 45,
    status: 'active' as const,
    dday: 28,
    blockers: 0,
    warnings: 3,
    decisions: { total: 18, pending: 8 },
    teamCount: 3,
    channels: ['인게임', '웹', '인스타'],
    recentActivity: '인게임 아이템 디자인 방향 결정 필요',
    guideHealth: 67,
  },
  {
    id: 'proj-3',
    name: '글로우업 D2C앱 리뉴얼',
    client: '글로우업 코스메틱',
    thumbnail: null,
    brandColor: '#0EA5E9',
    progress: 23,
    status: 'active' as const,
    dday: 45,
    blockers: 1,
    warnings: 0,
    decisions: { total: 12, pending: 4 },
    teamCount: 2,
    channels: ['앱', '웹'],
    recentActivity: '기존 앱 UX 감사 보고서 충돌 감지됨',
    guideHealth: 78,
  },
  {
    id: 'proj-4',
    name: '루미에르 FW 룩북',
    client: '루미에르(패션)',
    thumbnail: null,
    brandColor: '#1B1D1F',
    progress: 88,
    status: 'review' as const,
    dday: 5,
    blockers: 0,
    warnings: 0,
    decisions: { total: 52, pending: 2 },
    teamCount: 6,
    channels: ['인스타', '웹', '카탈로그'],
    recentActivity: '최종 납품 검수 중',
    guideHealth: 96,
  },
  {
    id: 'proj-5',
    name: '프레시가든 론칭 캠페인',
    client: '프레시가든(식품)',
    thumbnail: null,
    brandColor: '#22C55E',
    progress: 10,
    status: 'onboarding' as const,
    dday: 60,
    blockers: 0,
    warnings: 0,
    decisions: { total: 3, pending: 3 },
    teamCount: 2,
    channels: ['전체'],
    recentActivity: '온보딩 — 기존 문서 분석 중',
    guideHealth: 15,
  },
]

const urgentItems = [
  { type: 'blocker', project: '글로우업 S/S 캠페인', message: '클라이언트 피드백 7일 미응답 — 옥외 제작 블로킹', dday: 'D-14' },
  { type: 'blocker', project: '글로우업 S/S 캠페인', message: '인스타 릴스 BGM 저작권 미확인', dday: 'D-14' },
  { type: 'blocker', project: '글로우업 D2C앱 리뉴얼', message: '기존 앱 UX 감사 보고서와 신규 디자인 방향 충돌', dday: 'D-45' },
  { type: 'warning', project: '글로우업 x 던전히어로 콜라보', message: '인게임 아이템 디자인 방향 미확정 — 개발 일정 영향', dday: 'D-28' },
  { type: 'feedback', project: '루미에르 FW 룩북', message: '클라이언트 최종 확인 필요 (D-5)', dday: 'D-5' },
]

const statusConfig = {
  active: { label: '진행중', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  review: { label: '검수중', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  onboarding: { label: '온보딩', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  paused: { label: '일시중지', color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default function OverviewPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const totalBlockers = projects.reduce((sum, p) => sum + p.blockers, 0)
  const totalWarnings = projects.reduce((sum, p) => sum + p.warnings, 0)
  const totalPending = projects.reduce((sum, p) => sum + p.decisions.pending, 0)
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">프로젝트 조감</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {projects.length}개 프로젝트 · {projects.reduce((s, p) => s + p.teamCount, 0)}개 팀 참여중
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">평균 진행률</span>
          </div>
          <p className="text-2xl font-bold">{avgProgress}%</p>
        </div>
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-xs text-muted-foreground">블로커</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{totalBlockers}</p>
        </div>
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground">주의</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalWarnings}</p>
        </div>
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <CircleDot className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-xs text-muted-foreground">대기 결정</span>
          </div>
          <p className="text-2xl font-bold">{totalPending}</p>
        </div>
      </div>

      {/* Urgent Issues Feed */}
      {urgentItems.length > 0 && (
        <div className="card-soft p-5 border-l-4 border-l-rose-500">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-500" />
            긴급 이슈
            <Badge variant="destructive" className="text-[10px] ml-1">{urgentItems.length}</Badge>
          </h2>
          <div className="space-y-2">
            {urgentItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                  item.type === 'blocker' ? 'bg-rose-500' :
                  item.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.project}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{item.dday}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">프로젝트</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card-soft p-5 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => router.push(`/${teamId}/${project.id}/dashboard`)}
            >
              {/* Project Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: project.brandColor }}
                >
                  {project.client[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    <Badge className={`text-[10px] border ${statusConfig[project.status].color}`}>
                      {statusConfig[project.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.client} · D-{project.dday}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>진행률</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.progress >= 80 ? 'hsl(160, 84%, 39%)' :
                        project.progress >= 50 ? 'hsl(275, 50%, 48%)' : 'hsl(38, 92%, 50%)',
                    }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <CircleDot className="h-3.5 w-3.5 text-primary" />
                  <span>{project.decisions.total}건</span>
                  {project.decisions.pending > 0 && (
                    <span className="text-amber-600">({project.decisions.pending} 대기)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{project.teamCount}팀</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>가이드 {project.guideHealth}%</span>
                </div>
              </div>

              {/* Blocker/Warning indicators */}
              {(project.blockers > 0 || project.warnings > 0) && (
                <div className="flex gap-2 mb-3">
                  {project.blockers > 0 && (
                    <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-600 bg-rose-50">
                      <Flame className="h-3 w-3 mr-1" />
                      블로커 {project.blockers}
                    </Badge>
                  )}
                  {project.warnings > 0 && (
                    <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      주의 {project.warnings}
                    </Badge>
                  )}
                </div>
              )}

              {/* Channels */}
              <div className="flex items-center gap-2">
                {project.channels.map((ch, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">{ch}</Badge>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" />
                  {project.recentActivity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
