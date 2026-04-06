'use client'

import { useState } from 'react'
import {
  Users,
  Building2,
  UserCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Mail,
  Phone,
  ExternalLink,
  CircleDot,
  Flame,
  Eye,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// --- Mock Teams & Vendors ---
const teams = [
  {
    id: 'team-client',
    name: '올리브영 마케팅팀',
    type: 'client' as const,
    role: '발주사',
    color: '#2D8C3C',
    members: [
      { name: '정하은', role: '브랜드 매니저', avatar: '정', isLead: true, status: 'active' },
      { name: '윤서진', role: '마케팅 담당', avatar: '윤', isLead: false, status: 'active' },
      { name: '김도현', role: '법무 검토', avatar: '김', isLead: false, status: 'inactive' },
    ],
    permissions: ['결정 확정', '피드백 제출', '가이드 열람'],
    stats: { decisions: 12, pending: 3, avgResponseDays: 2.4 },
    lastActivity: '인스타 시안 3차 피드백 제출',
    lastActivityDate: '2시간 전',
  },
  {
    id: 'team-agency',
    name: 'OTV 스튜디오',
    type: 'agency' as const,
    role: '메인 에이전시',
    color: '#7B3FA3',
    members: [
      { name: '금민주', role: 'PM / 크리에이티브 디렉터', avatar: '금', isLead: true, status: 'active' },
      { name: '박서연', role: '시니어 디자이너', avatar: '박', isLead: false, status: 'active' },
      { name: '이준혁', role: '모션 디자이너', avatar: '이', isLead: false, status: 'active' },
      { name: '최예린', role: '카피라이터', avatar: '최', isLead: false, status: 'active' },
    ],
    permissions: ['결정 생성', '결정 확정', '가이드 편집', '외주 관리'],
    stats: { decisions: 28, pending: 5, avgResponseDays: 0.5 },
    lastActivity: '유튜브 썸네일 A/B안 등록',
    lastActivityDate: '30분 전',
  },
  {
    id: 'team-photo',
    name: '스튜디오 블랑',
    type: 'vendor' as const,
    role: '촬영 외주',
    color: '#E8734A',
    members: [
      { name: '한지우', role: '포토그래퍼', avatar: '한', isLead: true, status: 'active' },
      { name: '송민재', role: '어시스턴트', avatar: '송', isLead: false, status: 'active' },
    ],
    permissions: ['촬영 가이드 열람', '촬영본 업로드', '결정 코멘트'],
    stats: { decisions: 5, pending: 1, avgResponseDays: 1.2 },
    lastActivity: '제품 촬영본 1차 업로드',
    lastActivityDate: '1일 전',
    scope: '제품 촬영 + 모델 촬영 (S/S 룩북)',
  },
  {
    id: 'team-video',
    name: '모션랩',
    type: 'vendor' as const,
    role: '영상 외주',
    color: '#0064FF',
    members: [
      { name: '오태현', role: '영상 감독', avatar: '오', isLead: true, status: 'active' },
      { name: '강서윤', role: '편집자', avatar: '강', isLead: false, status: 'active' },
      { name: '임채원', role: '모션 그래픽', avatar: '임', isLead: false, status: 'away' },
    ],
    permissions: ['영상 가이드 열람', '편집본 업로드', '결정 코멘트'],
    stats: { decisions: 8, pending: 2, avgResponseDays: 1.8 },
    lastActivity: '유튜브 15초 컷 1차 편집본 전달',
    lastActivityDate: '3시간 전',
    scope: '유튜브 본편 + 15초 컷 + 인스타 릴스',
  },
  {
    id: 'team-ooh',
    name: '프린트웍스',
    type: 'vendor' as const,
    role: '옥외광고 제작',
    color: '#F59E0B',
    members: [
      { name: '문준혁', role: '제작 담당', avatar: '문', isLead: true, status: 'active' },
    ],
    permissions: ['옥외 가이드 열람', '시안 업로드'],
    stats: { decisions: 3, pending: 1, avgResponseDays: 3.0 },
    lastActivity: '버스 쉘터 시안 사이즈 확인 요청',
    lastActivityDate: '2일 전',
    scope: '버스 쉘터 + 지하철 스크린도어',
  },
]

const typeConfig = {
  client: { label: '발주사', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Building2 },
  agency: { label: '에이전시', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Users },
  vendor: { label: '외주사', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: UserCircle },
}

// Responsibility matrix
const responsibilityMatrix = [
  { area: '브랜드 전략', client: 'A', agency: 'R', photo: '-', video: '-', ooh: '-' },
  { area: '크리에이티브 디렉션', client: 'C', agency: 'R', photo: 'I', video: 'I', ooh: 'I' },
  { area: '인스타그램 시안', client: 'A', agency: 'R', photo: '-', video: '-', ooh: '-' },
  { area: '유튜브 영상', client: 'A', agency: 'C', photo: '-', video: 'R', ooh: '-' },
  { area: '제품 촬영', client: 'I', agency: 'C', photo: 'R', video: '-', ooh: '-' },
  { area: '모델 촬영', client: 'A', agency: 'C', photo: 'R', video: 'I', ooh: '-' },
  { area: '옥외 시안', client: 'A', agency: 'R', photo: '-', video: '-', ooh: 'C' },
  { area: '옥외 제작', client: 'I', agency: 'C', photo: '-', video: '-', ooh: 'R' },
  { area: '브랜드 가이드', client: 'C', agency: 'R', photo: 'I', video: 'I', ooh: 'I' },
  { area: '최종 검수', client: 'A', agency: 'R', photo: 'I', video: 'I', ooh: 'I' },
]

const raciConfig: Record<string, { label: string; color: string }> = {
  R: { label: 'R', color: 'bg-primary text-white' },
  A: { label: 'A', color: 'bg-accent text-white' },
  C: { label: 'C', color: 'bg-sky-100 text-sky-700' },
  I: { label: 'I', color: 'bg-muted text-muted-foreground' },
  '-': { label: '-', color: 'text-muted-foreground/30' },
}

// Pending items per team
const pendingByTeam = [
  { team: '올리브영', item: '인스타 피드 시안 3차 확정', days: 3, blocker: true },
  { team: '올리브영', item: '유튜브 썸네일 A/B 선택', days: 1, blocker: false },
  { team: '올리브영', item: '옥외 카피 최종안 확정', days: 0, blocker: false },
  { team: '스튜디오 블랑', item: '모델 촬영 일정 확정', days: 2, blocker: false },
  { team: '모션랩', item: '인스타 릴스 BGM 방향 확인', days: 1, blocker: true },
  { team: '프린트웍스', item: '버스 쉘터 사이즈 최종 확인', days: 2, blocker: false },
]

export default function TeamsPage() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">팀 · 외주사 협업</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {teams.length}개 팀 · {teams.reduce((s, t) => s + t.members.length, 0)}명 참여중
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg text-sm">팀 현황</TabsTrigger>
          <TabsTrigger value="raci" className="rounded-lg text-sm">역할 매트릭스</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg text-sm">
            대기 항목
            <Badge className="ml-1.5 h-5 min-w-5 bg-accent text-white text-[10px]">{pendingByTeam.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* === TEAM OVERVIEW === */}
        <TabsContent value="overview" className="space-y-4">
          {teams.map((team) => {
            const config = typeConfig[team.type]
            const TypeIcon = config.icon
            const isExpanded = selectedTeam === team.id

            return (
              <div
                key={team.id}
                className={`card-soft p-5 cursor-pointer transition-all ${isExpanded ? 'ring-1 ring-primary/30 shadow-md' : ''}`}
                onClick={() => setSelectedTeam(isExpanded ? null : team.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Team Avatar */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    <TypeIcon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Team Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{team.name}</h3>
                      <Badge className={`text-[10px] border ${config.color}`}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">{team.role}</span>
                    </div>

                    {/* Members */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-2">
                        {team.members.map((m, i) => (
                          <div
                            key={i}
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-white ${
                              m.status === 'active' ? 'bg-primary/10 text-primary' :
                              m.status === 'away' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                            }`}
                            title={`${m.name} · ${m.role}`}
                          >
                            {m.avatar}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{team.members.length}명</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <CircleDot className="h-3.5 w-3.5 text-primary" />
                        결정 {team.stats.decisions}건
                      </span>
                      {team.stats.pending > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          대기 {team.stats.pending}건
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        평균 응답 {team.stats.avgResponseDays}일
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-border/30 space-y-4">
                    {/* Members Detail */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">멤버</p>
                      <div className="space-y-2">
                        {team.members.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/20">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                m.status === 'active' ? 'bg-primary/10 text-primary' :
                                m.status === 'away' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {m.avatar}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium flex items-center gap-1.5">
                                {m.name}
                                {m.isLead && <Badge variant="outline" className="text-[9px]">리드</Badge>}
                              </p>
                              <p className="text-xs text-muted-foreground">{m.role}</p>
                            </div>
                            <div className={`h-2 w-2 rounded-full ${
                              m.status === 'active' ? 'bg-emerald-500' :
                              m.status === 'away' ? 'bg-amber-500' : 'bg-muted-foreground/30'
                            }`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> 접근 권한
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {team.permissions.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">{p}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Scope (for vendors) */}
                    {'scope' in team && team.scope && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">담당 범위</p>
                        <p className="text-sm">{team.scope}</p>
                      </div>
                    )}

                    {/* Last Activity */}
                    <div className="p-3 rounded-xl bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">최근 활동</p>
                      <p className="text-sm">{team.lastActivity}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{team.lastActivityDate}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>

        {/* === RACI MATRIX === */}
        <TabsContent value="raci" className="space-y-4">
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-sm">역할 매트릭스 (RACI)</h3>
              <div className="flex gap-2 ml-auto">
                {Object.entries(raciConfig).filter(([k]) => k !== '-').map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center ${cfg.color}`}>{key}</div>
                    <span className="text-[10px] text-muted-foreground">
                      {key === 'R' ? '담당' : key === 'A' ? '승인' : key === 'C' ? '협의' : '통보'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-40">업무 영역</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">올리브영</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">OTV</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">스튜디오 블랑</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">모션랩</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">프린트웍스</th>
                  </tr>
                </thead>
                <tbody>
                  {responsibilityMatrix.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20">
                      <td className="py-2.5 px-3 text-sm font-medium">{row.area}</td>
                      {[row.client, row.agency, row.photo, row.video, row.ooh].map((val, j) => (
                        <td key={j} className="text-center py-2.5 px-2">
                          {val !== '-' ? (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${raciConfig[val].color}`}>
                              {val}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/20">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* === PENDING ITEMS === */}
        <TabsContent value="pending" className="space-y-3">
          <div className="card-soft p-5">
            <h3 className="font-semibold text-sm mb-4">팀별 대기 항목</h3>
            <div className="space-y-2">
              {pendingByTeam.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                  item.blocker ? 'bg-rose-50/50 border border-rose-100/50' : 'hover:bg-secondary/30'
                } transition-colors`}>
                  {item.blocker ? (
                    <Flame className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.item}</p>
                    <p className="text-[10px] text-muted-foreground">{item.team}</p>
                  </div>
                  {item.days > 0 && (
                    <Badge variant="outline" className={`text-[10px] ${
                      item.days >= 3 ? 'border-rose-200 text-rose-600' : 'border-amber-200 text-amber-600'
                    }`}>
                      {item.days}일 대기
                    </Badge>
                  )}
                  {item.blocker && (
                    <Badge className="text-[10px] bg-rose-100 text-rose-700 border-rose-200">블로커</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
