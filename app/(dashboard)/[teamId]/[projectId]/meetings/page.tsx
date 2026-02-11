'use client'

import { useState } from "react"
import { Plus, Calendar, Users, FileText, Sparkles, ChevronDown, ChevronRight, CheckCircle2, X, Link2, Mic, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

// 서비스 로고 SVG 컴포넌트들
const SlackLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

const NotionLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.224-.186zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.457.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
)

const GoogleMeetLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#00832d" d="M12.5 11.25v-4.5L16.25 3h-12.5A1.75 1.75 0 0 0 2 4.75v14.5c0 .966.784 1.75 1.75 1.75h12.5l-3.75-3.75v-4.5l5.5 4.125V7.125L12.5 11.25z"/>
    <path fill="#0066da" d="M12.5 11.25v1.5h9.75V9.75H12.5v1.5z"/>
    <path fill="#e94235" d="M22.25 9.75h-9.75v-3L16.25 3h4.25c.966 0 1.75.784 1.75 1.75v5z"/>
    <path fill="#2684fc" d="M12.5 12.75v3l3.75 3.75h4.25a1.75 1.75 0 0 0 1.75-1.75v-5h-9.75z"/>
    <path fill="#00ac47" d="M6.75 6.75l3.75 3.75-3.75 3.75V6.75z"/>
  </svg>
)

const ZoomLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#2D8CFF" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm4.685 14.018l-3.401-2.267v2.267c0 .368-.298.667-.667.667H7.333c-.368 0-.667-.298-.667-.667V9.333c0-.368.298-.667.667-.667h5.284c.368 0 .667.298.667.667v2.267l3.401-2.267c.368-.245.815.061.815.491v5.743c0 .43-.447.736-.815.491z"/>
  </svg>
)

// Mock data for meetings
const mockMeetings = [
  {
    id: "1",
    code: "MTG-001",
    title: "프로젝트 킥오프",
    date: "2024-01-14",
    attendees: ["Kim", "Lee", "Park"],
    content: `프로젝트 킥오프 미팅

- 프로젝트 목표 설정
- 기술 스택 논의 (Next.js, Supabase)
- MVP 범위 정의

결정사항:
1. Next.js 14 App Router 사용
2. 결정 중심 접근 방식 채택
3. 다크 테마 기본 설정`,
    ai_summary: {
      decisions: [
        "Next.js 14 App Router 사용",
        "결정 중심 접근 방식 채택",
        "다크 테마 기본 설정"
      ],
      todos: [
        { task: "Supabase 프로젝트 생성", assignee: "Park" },
        { task: "Figma 디자인 시스템 셋업", assignee: "Lee" },
        { task: "프로젝트 구조 설계", assignee: "Kim" }
      ],
      keywords: ["Next.js", "Supabase", "MVP", "다크테마"]
    }
  },
  {
    id: "2",
    code: "MTG-002",
    title: "UI/UX 리뷰",
    date: "2024-01-17",
    attendees: ["Lee", "Park"],
    content: `UI/UX 리뷰 미팅

- 타임라인 뷰 vs 칸반 보드 논의
- 사이드바 네비게이션 구조 검토
- 다크 모드 색상 팔레트 확정`,
    ai_summary: {
      decisions: [
        "타임라인 뷰를 메인 대시보드로 사용",
        "사이드바에 프로젝트 선택기 배치"
      ],
      todos: [
        { task: "타임라인 컴포넌트 구현", assignee: "Lee" },
        { task: "사이드바 레이아웃 구현", assignee: "Park" }
      ],
      keywords: ["타임라인", "사이드바", "다크모드"]
    }
  },
]

export default function MeetingsPage() {
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)
  const [showNewMeetingSheet, setShowNewMeetingSheet] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingContent, setMeetingContent] = useState("")
  const [linkInputs, setLinkInputs] = useState<{ type: string; url: string }[]>([])
  const isEmpty = mockMeetings.length === 0

  const addLinkInput = (type: string) => {
    setLinkInputs([...linkInputs, { type, url: "" }])
  }

  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index))
  }

  const updateLinkUrl = (index: number, url: string) => {
    const updated = [...linkInputs]
    updated[index].url = url
    setLinkInputs(updated)
  }

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'slack': return <SlackLogo />
      case 'notion': return <NotionLogo />
      case 'meet': return <GoogleMeetLogo />
      case 'zoom': return <ZoomLogo />
      default: return <Link2 className="h-5 w-5" />
    }
  }

  const getLinkLabel = (type: string) => {
    switch (type) {
      case 'slack': return 'Slack 스레드'
      case 'notion': return 'Notion 페이지'
      case 'meet': return 'Google Meet'
      case 'zoom': return 'Zoom 녹화'
      case 'tts': return '음성 녹음 (TTS)'
      default: return '링크'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">맥락 추가</h1>
          <p className="text-muted-foreground mt-1">미팅, 슬랙, 문서에서 결정 맥락을 추출합니다</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 shadow-soft"
          onClick={() => setShowNewMeetingSheet(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          새 맥락
        </Button>
      </div>

      {/* New Context Sheet */}
      <Sheet open={showNewMeetingSheet} onOpenChange={setShowNewMeetingSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>새 맥락 추가</SheetTitle>
            <SheetDescription>
              미팅, 슬랙 스레드, 노션 문서 등을 연결하세요. AI가 결정 사항을 자동으로 추출합니다.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* 맥락 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="예: 주간 스프린트 리뷰, 로그인 방식 논의"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>

            {/* 외부 서비스 연동 */}
            <div className="space-y-3">
              <Label>외부 서비스 연동</Label>
              <p className="text-xs text-muted-foreground">
                연동된 서비스의 링크를 추가하면 AI가 내용을 자동으로 분석합니다.
              </p>

              {/* 서비스 버튼들 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => addLinkInput('slack')}
                >
                  <SlackLogo />
                  Slack
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => addLinkInput('notion')}
                >
                  <NotionLogo />
                  Notion
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => addLinkInput('meet')}
                >
                  <GoogleMeetLogo />
                  Meet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => addLinkInput('zoom')}
                >
                  <ZoomLogo />
                  Zoom
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => addLinkInput('tts')}
                >
                  <Mic className="h-4 w-4" />
                  음성
                </Button>
              </div>

              {/* 추가된 링크 입력 필드들 */}
              {linkInputs.length > 0 && (
                <div className="space-y-2 mt-3">
                  {linkInputs.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg min-w-[120px]">
                        {getLinkIcon(link.type)}
                        <span className="text-sm">{getLinkLabel(link.type)}</span>
                      </div>
                      <Input
                        placeholder="URL을 붙여넣으세요"
                        value={link.url}
                        onChange={(e) => updateLinkUrl(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeLinkInput(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-2">
              <Label>파일 업로드</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">음성 파일 또는 문서를 드래그하거나 클릭하세요</p>
                <p className="text-xs text-slate-400 mt-1">MP3, WAV, PDF, DOCX 지원</p>
              </div>
            </div>

            {/* 내용 직접 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용 직접 입력</Label>
              <Textarea
                id="content"
                placeholder="미팅 내용, 논의 사항 등을 직접 입력하거나 복사-붙여넣기 하세요..."
                value={meetingContent}
                onChange={(e) => setMeetingContent(e.target.value)}
                rows={6}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewMeetingSheet(false)}
              >
                취소
              </Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                <Sparkles className="h-4 w-4 mr-2" />
                AI 분석 시작
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Empty State */}
      {isEmpty && (
        <div className="empty-state rounded-2xl bg-secondary/30">
          <Calendar className="empty-state-icon" />
          <h3 className="text-lg font-medium mb-2">아직 맥락이 없습니다</h3>
          <p className="text-muted-foreground max-w-sm">
            미팅, 슬랙, 문서를 추가하면 AI가 결정 사항과 액션 아이템을 자동으로 추출합니다.
          </p>
          <Button
            className="mt-6 bg-primary hover:bg-primary/90"
            onClick={() => setShowNewMeetingSheet(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 번째 맥락 추가
          </Button>
        </div>
      )}

      {/* Meeting List */}
      {!isEmpty && (
        <div className="space-y-4">
          {mockMeetings.map((meeting) => {
            const isExpanded = expandedMeeting === meeting.id

            return (
              <div
                key={meeting.id}
                className={`card-soft overflow-hidden transition-all duration-200 ${
                  isExpanded ? "ring-1 ring-primary/30" : ""
                }`}
              >
                {/* Header */}
                <div
                  className="p-5 cursor-pointer group"
                  onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Expand icon */}
                      <div className="p-1 mt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-primary font-medium">
                            {meeting.code}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                          {meeting.title}
                        </h3>

                        {/* Info */}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {meeting.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {meeting.attendees.length}명 참석
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Badge */}
                    {meeting.ai_summary && (
                      <Badge className="bg-accent/10 text-accent border-0 gap-1.5 shrink-0">
                        <Sparkles className="h-3 w-3" />
                        AI 요약
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-5 bg-secondary/20">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Original Content */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          미팅 노트
                        </h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background/50 p-4 rounded-xl border border-border/50">
                          {meeting.content}
                        </div>
                      </div>

                      {/* AI Summary */}
                      {meeting.ai_summary && (
                        <div className="space-y-5">
                          {/* Decisions */}
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-accent" />
                              추출된 결정 사항
                            </h4>
                            <ul className="space-y-2">
                              {meeting.ai_summary.decisions.map((decision, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                  {decision}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Items */}
                          <div>
                            <h4 className="font-medium mb-3 text-sm">액션 아이템</h4>
                            <ul className="space-y-2">
                              {meeting.ai_summary.todos.map((todo, i) => (
                                <li key={i} className="flex items-center justify-between gap-3 text-sm p-2 rounded-lg bg-background/50">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{todo.task}</span>
                                  </div>
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {todo.assignee}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Keywords */}
                          <div>
                            <h4 className="font-medium mb-3 text-sm">키워드</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {meeting.ai_summary.keywords.map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-secondary/80">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button variant="outline" className="w-full mt-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Plus className="h-4 w-4 mr-2" />
                            요약에서 결정 만들기
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
