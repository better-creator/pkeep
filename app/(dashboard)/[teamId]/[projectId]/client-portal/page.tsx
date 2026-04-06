'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Eye,
  Sparkles,
  Image,
  CircleDot,
  Calendar,
  ArrowRight,
  Users,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// --- Mock Client Portal Data ---
const projectInfo = {
  name: '글로우업 S/S 캠페인',
  agency: 'OTV 스튜디오',
  progress: 72,
  dday: 14,
  startDate: '2026.03.01',
  endDate: '2026.04.21',
}

const phases = [
  { name: '기획', progress: 100, status: 'done' as const },
  { name: '디자인', progress: 85, status: 'active' as const },
  { name: '제작', progress: 45, status: 'active' as const },
  { name: '검수', progress: 0, status: 'upcoming' as const },
  { name: '납품', progress: 0, status: 'upcoming' as const },
]

const feedbackRequests = [
  {
    id: 1,
    title: '인스타 피드 시안 3차',
    description: '컬러 톤 수정 반영본입니다. 핑크 계열을 빼고 코랄로 통일했습니다.',
    type: 'design',
    urgent: true,
    daysWaiting: 3,
    aiNote: '이 시안을 확정하시면 제작 일정이 3일 단축됩니다.',
    thumbnail: null,
    attachments: 4,
  },
  {
    id: 2,
    title: '유튜브 썸네일 방향 A/B',
    description: 'A안(인물 중심)과 B안(제품 중심) 중 선택이 필요합니다.',
    type: 'design',
    urgent: false,
    daysWaiting: 1,
    aiNote: '이전 캠페인에서 인물 중심 썸네일의 CTR이 23% 더 높았습니다.',
    thumbnail: null,
    attachments: 2,
  },
  {
    id: 3,
    title: '옥외광고 카피 최종안',
    description: '"매일이 빛나는 순간" vs "나를 위한 작은 사치" 중 최종 결정 필요.',
    type: 'copy',
    urgent: false,
    daysWaiting: 0,
    aiNote: null,
    thumbnail: null,
    attachments: 1,
  },
]

const recentDecisions = [
  { code: 'D-034', title: '메인 컬러: 코랄 오렌지(#E8734A)로 확정', status: 'confirmed', date: '04.03', area: '디자인' },
  { code: 'D-033', title: '인스타 캡션 톤: 캐주얼+감성, 이모지 허용', status: 'confirmed', date: '04.02', area: '채널' },
  { code: 'D-032', title: '제품 촬영: 좌측 45도 라이팅 + 화이트 배경', status: 'confirmed', date: '04.01', area: '촬영' },
  { code: 'D-031', title: '유튜브 자막: 흰색 + 반투명 배경, Pretendard', status: 'pending', date: '03.30', area: '채널' },
  { code: 'D-030', title: '옥외 로고 사이즈: 전체 면적 15% 이상', status: 'confirmed', date: '03.28', area: '디자인' },
]

const timeline = [
  { date: '04.07', event: '인스타 피드 시안 확정 (클라이언트 피드백 대기)', status: 'waiting' },
  { date: '04.10', event: '유튜브 영상 1차 편집본 전달', status: 'upcoming' },
  { date: '04.12', event: '옥외광고 인쇄 입고 마감', status: 'upcoming' },
  { date: '04.15', event: '전체 소재 최종 검수', status: 'upcoming' },
  { date: '04.21', event: '캠페인 런칭', status: 'upcoming' },
]

export default function ClientPortalPage() {
  return (
    <div className="space-y-8">
      {/* Portal Header */}
      <div className="card-soft p-6 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary bg-white">
            <Eye className="h-3 w-3 mr-1" />
            클라이언트 포털
          </Badge>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            읽기 전용
          </Badge>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{projectInfo.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectInfo.agency} · {projectInfo.startDate} ~ {projectInfo.endDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">D-{projectInfo.dday}</p>
            <p className="text-xs text-muted-foreground">납품까지</p>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="mt-6 flex gap-2">
          {phases.map((phase, i) => (
            <div key={i} className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-medium ${
                  phase.status === 'done' ? 'text-emerald-600' :
                  phase.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                }`}>{phase.name}</span>
                {phase.progress > 0 && (
                  <span className="text-[10px] text-muted-foreground">{phase.progress}%</span>
                )}
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    phase.status === 'done' ? 'bg-emerald-500' :
                    phase.status === 'active' ? 'bg-primary' : 'bg-transparent'
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Needed Banner */}
      {feedbackRequests.filter(f => f.urgent).length > 0 && (
        <div className="card-soft p-5 border-l-4 border-l-accent bg-accent/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h2 className="font-semibold text-sm">귀사의 확인이 필요합니다</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {feedbackRequests.filter(f => f.urgent).length}건의 피드백이 대기 중입니다.
            확정하시면 제작 일정이 단축됩니다.
          </p>
        </div>
      )}

      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="feedback" className="rounded-lg text-sm">
            피드백 요청
            <Badge className="ml-1.5 h-5 min-w-5 bg-accent text-white text-[10px]">{feedbackRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg text-sm">진행 상황</TabsTrigger>
          <TabsTrigger value="decisions" className="rounded-lg text-sm">결정 이력</TabsTrigger>
        </TabsList>

        {/* === FEEDBACK REQUESTS === */}
        <TabsContent value="feedback" className="space-y-4">
          {feedbackRequests.map((req) => (
            <div key={req.id} className={`card-soft p-5 ${req.urgent ? 'ring-1 ring-accent/30' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-xl bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/20" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{req.title}</h3>
                    {req.urgent && (
                      <Badge className="text-[10px] bg-accent/10 text-accent border-accent/30">
                        <Clock className="h-3 w-3 mr-1" />
                        {req.daysWaiting}일 대기
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{req.description}</p>

                  {/* AI Note */}
                  {req.aiNote && (
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                      <p className="text-xs text-primary flex items-start gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {req.aiNote}
                      </p>
                    </div>
                  )}

                  {/* Attachments & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">첨부 {req.attachments}건</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        코멘트
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50">
                        <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                        수정 요청
                      </Button>
                      <Button size="sm" className="rounded-xl text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                        확정
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* === PROGRESS === */}
        <TabsContent value="progress" className="space-y-6">
          {/* Overall Progress */}
          <div className="card-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">전체 진행률</h3>
              <span className="text-2xl font-bold text-primary">{projectInfo.progress}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${projectInfo.progress}%` }}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold">34</p>
                <p className="text-xs text-muted-foreground">총 결정</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold text-emerald-600">29</p>
                <p className="text-xs text-muted-foreground">확정됨</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold text-amber-600">5</p>
                <p className="text-xs text-muted-foreground">확인 대기</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card-soft p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              앞으로의 일정
            </h3>
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className={`h-2 w-2 rounded-full ${
                    item.status === 'waiting' ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30'
                  }`} />
                  <span className="text-xs text-muted-foreground w-14 shrink-0 font-mono">{item.date}</span>
                  <p className="text-sm flex-1">{item.event}</p>
                  {item.status === 'waiting' && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">피드백 대기</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* === DECISIONS === */}
        <TabsContent value="decisions" className="space-y-3">
          <div className="card-soft p-5">
            <h3 className="font-semibold text-sm mb-4">최근 결정 이력</h3>
            <div className="space-y-2">
              {recentDecisions.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  {d.status === 'confirmed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono w-12 shrink-0">{d.code}</span>
                  <p className="text-sm flex-1">{d.title}</p>
                  <Badge variant="outline" className="text-[10px]">{d.area}</Badge>
                  <span className="text-[10px] text-muted-foreground">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
