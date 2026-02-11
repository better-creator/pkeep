'use client'

import { useState } from "react"
import { Send, Sparkles, FileText, Lightbulb, AlertTriangle, TrendingUp, Download, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

// Mock chat history
const mockChatHistory: Message[] = [
  {
    id: "1",
    role: "user",
    content: "인증 시스템에 대해 어떤 결정을 했나요?",
  },
  {
    id: "2",
    role: "assistant",
    content: `프로젝트 맥락을 기반으로 인증 관련 결정 사항입니다:

1. **DEC-001**: Next.js 14 App Router 사용 - 인증 미들웨어 구조에 영향을 줍니다
2. **DEC-005**: Supabase Auth를 사용자 인증에 사용 (MTG-001에서 결정)

관련 화면:
- SCR-008: 로그인 페이지
- SCR-009: 회원가입 페이지

Next.js App Router와 Supabase Auth의 일반적인 패턴을 제안해 드릴까요?`,
    sources: ["DEC-001", "DEC-005", "MTG-001"],
  },
]

// Mock AI suggestions
const mockSuggestions = [
  {
    type: "conflict",
    title: "충돌 가능성",
    description: "DEC-004 (타임라인 뷰)가 MTG-001의 이전 논의와 충돌할 수 있습니다.",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    type: "trend",
    title: "트렌드 알림",
    description: "서버 컴포넌트 채택이 증가 중입니다. DEC-001이 이 트렌드와 일치합니다.",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    type: "missing",
    title: "누락된 결정",
    description: "에러 처리 전략에 대한 결정이 없습니다. 문서화를 고려하세요.",
    icon: Lightbulb,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
]

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>(mockChatHistory)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "프로젝트 맥락을 분석하여 질문에 답변하고 있습니다. 이것은 데모 응답입니다 - 프로덕션에서는 OpenAI API와 프로젝트 맥락이 연결됩니다.",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI 어드바이저</h1>
            <p className="text-muted-foreground text-sm">프로젝트 맥락에 대해 질문하세요</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="card-soft flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">AI와 대화하기</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI가 프로젝트의 결정, 화면, 미팅 노트를 이해합니다
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {'sources' in message && message.sources && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/30">
                          {message.sources.map((source) => (
                            <Badge
                              key={source}
                              variant="outline"
                              className="text-xs bg-background/50 hover:bg-primary/10 cursor-pointer"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border/50 p-4 bg-secondary/20">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="프로젝트 결정, 화면, 미팅에 대해 질문하세요..."
                  className="min-h-[56px] resize-none rounded-xl bg-background border-border/50 focus-visible:ring-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-14 w-14 rounded-xl bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-lg h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setInput("검토가 필요한 결정은?")}
                >
                  결정 검토
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-lg h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setInput("최근 미팅 요약해줘")}
                >
                  미팅 요약
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-lg h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setInput("Cursor용 맥락 내보내기")}
                >
                  AI용 내보내기
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h3 className="font-medium text-sm">AI 인사이트</h3>
            </div>
            <div className="space-y-3">
              {mockSuggestions.map((suggestion, i) => {
                const Icon = suggestion.icon
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${suggestion.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${suggestion.color}`} />
                      </div>
                      <span className="font-medium text-sm">{suggestion.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">{suggestion.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Context Export */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">맥락 내보내기</h3>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm rounded-xl border-border/50 hover:bg-secondary/50 h-10">
                <Download className="h-4 w-4 mr-2" />
                Cursor용 내보내기
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm rounded-xl border-border/50 hover:bg-secondary/50 h-10">
                <Download className="h-4 w-4 mr-2" />
                Claude용 내보내기
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm rounded-xl border-border/50 hover:bg-secondary/50 h-10">
                <Download className="h-4 w-4 mr-2" />
                마크다운으로 내보내기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
