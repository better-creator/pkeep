'use client'

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Plus, Calendar, Sparkles, ChevronDown, ChevronRight,
  CheckCircle2, X, Mic, Upload, Loader2, AlertTriangle, Ban,
  ListChecks, MessageSquareWarning, Check, Clock,
  MessageSquare, BookOpen, FileText, Phone, Mail, PenLine
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import AudioRecorder from "@/components/audio/AudioRecorder"
import LiveMeeting from "@/components/meeting/LiveMeeting"
import { useStore } from "@/hooks/use-store"
import type { TranscriptSegment, StoredMeeting, SourceType } from "@/lib/store/types"

// ============================================================
// API Response Types (analyze API가 반환하는 형태)
// ============================================================

interface AnalysisResponse {
  success: boolean
  analysis: {
    issues: { title: string; description?: string }[]
    decisions: { title: string; rationale: string; area?: string; proposed_by?: string }[]
    rejected_alternatives: { title: string; reason: string; related_decision: string; proposed_by?: string }[]
    tasks: { title: string; assignee?: string; related_decision?: string }[]
    context_relations: { previous_decision_title: string; relation: string; explanation: string }[]
    summary: string
    keywords: string[]
  }
  auto_created: {
    decisions: { id: string; code: string; title: string; reason: string; status: string }[]
    tasks: { id: string; title: string; assignee?: string }[]
    rejected_alternatives: any[]
  }
  conflicts: any[]
  summary: string
}

type AnalysisStep =
  | 'idle'
  | 'recording'
  | 'live_meeting'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'creating_tickets'
  | 'done'
  | 'error'

// ============================================================
// Page Component
// ============================================================

export default function MeetingsPage() {
  const store = useStore()
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary')
  const [showNewSheet, setShowNewSheet] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // New meeting form state
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingContent, setMeetingContent] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [recordingSource, setRecordingSource] = useState<'recording' | 'upload' | 'text'>('recording')
  const [sourceType, setSourceType] = useState<SourceType>('meeting')
  const [inputMode, setInputMode] = useState<'grid' | 'recording' | 'upload' | 'text'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis pipeline state
  const [step, setStep] = useState<AnalysisStep>('idle')
  const [stepMessage, setStepMessage] = useState("")
  const [transcription, setTranscription] = useState<{
    text: string
    language?: string
    segments: TranscriptSegment[]
    speakers?: string[]
    duration_seconds: number
  } | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)

  // ========== Live Meeting Handler ==========
  const handleLiveMeetingComplete = async (transcript: string, liveSegments: TranscriptSegment[]) => {
    setStep('analyzing')
    setStepMessage('5종 맥락 요소 추출 중...')
    setRecordingSource('recording')
    setShowNewSheet(true)

    // Store transcript data so saveMeetingToList can use it
    setTranscription({
      text: transcript,
      segments: liveSegments,
      duration_seconds: liveSegments.length > 0
        ? Math.round(liveSegments[liveSegments.length - 1].end)
        : 0,
    })

    try {
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      })

      if (!analyzeRes.ok) {
        const errText = await analyzeRes.text().catch(() => '')
        let errorMessage = 'Analysis failed'
        try { errorMessage = JSON.parse(errText).error || errorMessage } catch { errorMessage = errText || `Server error: ${analyzeRes.status}` }
        throw new Error(errorMessage)
      }

      setStep('creating_tickets')
      setStepMessage('티켓 자동 생성 + 충돌 감지 중...')

      const result = await analyzeRes.json()
      setAnalysisResult(result)
      setStep('done')
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Analysis failed')
    }
  }

  const handleLiveMeetingCancel = () => {
    setStep('idle')
  }

  // ========== Handlers ==========
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      setRecordingSource('upload')
      setError(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setAudioFile(file)
      setRecordingSource('upload')
      setError(null)
    }
  }, [])

  const startFullPipeline = async () => {
    setError(null)
    if (audioFile) {
      await runSTTAndAnalyze(audioFile)
    } else if (meetingContent.trim()) {
      setRecordingSource('text')
      await runTextPipeline()
    } else {
      setError('음성 파일을 업로드하거나 내용을 직접 입력하세요.')
    }
  }

  const runSTTAndAnalyze = async (file: File) => {
    try {
      setStep('transcribing')
      setStepMessage('음성 파일 업로드 중...')

      // Step 1: Stream audio to AssemblyAI via upload proxy (no body size limit)
      console.log('[PKEEP] Step 1: Uploading audio...', { size: file.size, type: file.type })
      const uploadRes = await fetch('/api/meetings/upload-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      })

      console.log('[PKEEP] Upload response:', { status: uploadRes.status, contentType: uploadRes.headers.get('content-type') })

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => 'Upload failed')
        console.error('[PKEEP] Upload failed:', errText)
        throw new Error(`음성 업로드 실패: ${errText}`)
      }

      const uploadData = await uploadRes.json()
      console.log('[PKEEP] Upload success:', uploadData)
      const audioUrl = uploadData.upload_url

      setStepMessage('음성 → 텍스트 변환 중... (다국어 자동 감지)')

      // Step 2: Request transcription using the uploaded URL (small JSON body)
      console.log('[PKEEP] Step 2: Requesting transcription...', { audioUrl })
      const transcribeRes = await fetch('/api/meetings/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }),
      })
      console.log('[PKEEP] Transcribe response:', { status: transcribeRes.status, contentType: transcribeRes.headers.get('content-type') })

      if (!transcribeRes.ok) {
        let errorMessage = 'Transcription failed'
        try {
          const contentType = transcribeRes.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const err = await transcribeRes.json()
            errorMessage = err.error || errorMessage
          } else {
            const text = await transcribeRes.text()
            errorMessage = text || `Server error: ${transcribeRes.status}`
          }
        } catch {
          errorMessage = `Server error: ${transcribeRes.status}`
        }
        throw new Error(errorMessage)
      }

      const transcribeData = await transcribeRes.json()
      const t = transcribeData.transcription
      setTranscription(t)

      setStep('analyzing')
      setStepMessage('5종 맥락 요소 추출 중...')

      // 화자 레이블이 있으면 "[Speaker A] 텍스트" 형식으로 구성
      let textForAnalysis = t.text
      if (t.segments?.length > 0 && t.segments[0].speaker) {
        textForAnalysis = t.segments
          .map((seg: TranscriptSegment) => `[${seg.speaker}] ${seg.text}`)
          .join('\n')
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textForAnalysis, language: t.language }),
      })

      if (!analyzeRes.ok) {
        const errText = await analyzeRes.text().catch(() => '')
        let errorMessage = 'Analysis failed'
        try { errorMessage = JSON.parse(errText).error || errorMessage } catch { errorMessage = errText || `Server error: ${analyzeRes.status}` }
        throw new Error(errorMessage)
      }

      setStep('creating_tickets')
      setStepMessage('티켓 자동 생성 + 충돌 감지 중...')

      const result = await analyzeRes.json()
      setAnalysisResult(result)
      setStep('done')
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Pipeline failed')
    }
  }

  const runTextPipeline = async () => {
    try {
      setStep('analyzing')
      setStepMessage('5종 맥락 요소 추출 중...')

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: meetingContent }),
      })

      if (!analyzeRes.ok) {
        const errText = await analyzeRes.text().catch(() => '')
        let errorMessage = 'Analysis failed'
        try { errorMessage = JSON.parse(errText).error || errorMessage } catch { errorMessage = errText || `Server error: ${analyzeRes.status}` }
        throw new Error(errorMessage)
      }

      setStep('creating_tickets')
      setStepMessage('티켓 자동 생성 + 충돌 감지 중...')

      const result = await analyzeRes.json()
      setAnalysisResult(result)
      setStep('done')
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Analysis failed')
    }
  }

  // 분석 완료 → 회의록 + 결정 + 할일 + 기각 모두 store에 저장
  const saveMeetingToList = () => {
    if (!analysisResult) return

    const code = store.getNextMeetingCode()
    const meetingId = `meeting-${Date.now()}`
    const now = new Date().toISOString()

    const title = meetingTitle.trim()
      || analysisResult.analysis.summary?.split('.')[0]?.slice(0, 40)
      || `회의 ${code}`

    // 1. 회의록 저장
    const newMeeting: StoredMeeting = {
      id: meetingId,
      code,
      title,
      date: (recordingStartTime || new Date()).toISOString().split('T')[0],
      duration_seconds: transcription?.duration_seconds || 0,
      source: recordingSource,
      sourceType,
      sourceUrl: sourceUrl.trim() || undefined,
      language: transcription?.language,
      transcriptText: transcription?.text || meetingContent,
      transcriptSegments: transcription?.segments || [],
      summary: analysisResult.analysis.summary || '',
      keywords: analysisResult.analysis.keywords || [],
      issues: analysisResult.analysis.issues || [],
    }
    store.addMeeting(newMeeting)

    // 2. 결정 저장
    for (const dec of analysisResult.auto_created.decisions) {
      store.addDecision({
        id: dec.id || `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        meetingId,
        code: dec.code || store.getNextDecisionCode(),
        title: dec.title,
        rationale: dec.reason || '',
        area: (analysisResult.analysis.decisions.find(d => d.title === dec.title)?.area as any) || undefined,
        status: (dec.status as any) || 'confirmed',
        proposedBy: analysisResult.analysis.decisions.find(d => d.title === dec.title)?.proposed_by,
        createdAt: now,
      })
    }

    // 3. 할 일 저장
    for (const task of analysisResult.auto_created.tasks) {
      store.addTask({
        id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        meetingId,
        title: task.title,
        assignee: task.assignee,
        done: false,
        createdAt: now,
      })
    }

    // 4. 기각된 대안 저장
    for (const rej of (analysisResult.analysis.rejected_alternatives || [])) {
      store.addRejected({
        id: `rej-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        meetingId,
        title: rej.title,
        reason: rej.reason,
        relatedDecision: rej.related_decision,
        proposedBy: rej.proposed_by,
      })
    }

    setExpandedMeeting(meetingId)
    resetForm()
  }

  const resetForm = () => {
    setStep('idle')
    setStepMessage('')
    setMeetingTitle('')
    setMeetingContent('')
    setSourceUrl('')
    setAudioFile(null)
    setTranscription(null)
    setAnalysisResult(null)
    setError(null)
    setRecordingStartTime(null)
    setShowNewSheet(false)
    setSourceType('meeting')
    setInputMode('grid')
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
  }

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const sourceLabel = (meeting: StoredMeeting) => {
    // Prefer sourceType if available, fall back to source
    const st = meeting.sourceType
    if (st) {
      switch (st) {
        case 'meeting': return '회의'
        case 'slack': return '슬랙'
        case 'notion': return '노션'
        case 'document': return '문서'
        case 'call': return '통화'
        case 'email': return '이메일'
        case 'text': return '텍스트'
        case 'manual': return '수동'
      }
    }
    switch (meeting.source) {
      case 'recording': return '녹음'
      case 'upload': return '업로드'
      case 'text': return '텍스트'
    }
  }

  const sourceIcon = (meeting: StoredMeeting) => {
    const st = meeting.sourceType
    switch (st) {
      case 'meeting': return Mic
      case 'slack': return MessageSquare
      case 'notion': return BookOpen
      case 'document': return FileText
      case 'call': return Phone
      case 'email': return Mail
      case 'text': return PenLine
      case 'manual': return Plus
      default:
        // Fallback based on source field
        switch (meeting.source) {
          case 'recording': return Mic
          case 'upload': return Upload
          case 'text': return PenLine
          default: return Mic
        }
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">녹음</h1>
          <p className="text-muted-foreground mt-1">
            회의를 녹음하거나 파일을 올리면 AI가 결정·근거·할 일을 자동 추출합니다
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 shadow-soft"
          onClick={() => { resetForm(); setShowNewSheet(true) }}
        >
          <Plus className="h-4 w-4 mr-2" />
          새 녹음
        </Button>
      </div>

      {/* ========== New Source Sheet ========== */}
      <Sheet open={showNewSheet} onOpenChange={setShowNewSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>새 녹음 추가</SheetTitle>
            <SheetDescription>
              회의를 녹음하거나 파일을 올리면 AI가 자동으로 분석합니다.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* ===== Step: Idle ===== */}
            {step === 'idle' && (
              <>
                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 <span className="text-muted-foreground font-normal">(선택)</span></Label>
                  <Input
                    id="title"
                    placeholder="비워두면 AI가 자동으로 생성합니다"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                  />
                </div>

                {/* 입력 방식 선택 — 오디오 중심 */}
                {inputMode === 'grid' && (
                  <>
                    <div className="space-y-3">
                      <Label>녹음 방식</Label>

                      {/* 회의 녹음 — 메인 CTA */}
                      <button
                        onClick={() => {
                          setSourceType('meeting')
                          setRecordingSource('recording')
                          setRecordingStartTime(new Date())
                          setStep('recording')
                        }}
                        className="w-full p-5 rounded-xl border-2 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 hover:border-red-400 transition-all group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-red-500/20">
                            <Mic className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-base">회의 녹음</p>
                            <p className="text-sm text-muted-foreground">마이크로 녹음하면 AI가 결정·근거·할 일을 자동 추출합니다</p>
                          </div>
                        </div>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        {/* 실시간 회의 */}
                        <button
                          onClick={() => {
                            setSourceType('meeting')
                            setRecordingStartTime(new Date())
                            setShowNewSheet(false)
                            setStep('live_meeting')
                          }}
                          className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm">실시간 회의</p>
                                <Badge className="text-[9px] bg-primary/10 text-primary border-0 px-1 py-0">LIVE</Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground">실시간 변환 + 분석</p>
                            </div>
                          </div>
                        </button>

                        {/* 파일 업로드 */}
                        <button
                          onClick={() => {
                            setSourceType('meeting')
                            setInputMode('upload')
                          }}
                          className="p-4 rounded-xl border-2 border-border hover:border-primary/30 bg-card transition-all group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Upload className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">파일 업로드</p>
                              <p className="text-[11px] text-muted-foreground">MP3, WAV, M4A 등</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 텍스트 메모 — 접힌 상태 */}
                    <div className="border-t border-border/50 pt-4">
                      <button
                        onClick={() => {
                          setSourceType('text')
                          setRecordingSource('text')
                          setInputMode('text')
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        <span>텍스트로 직접 입력하기</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="w-full" onClick={() => setShowNewSheet(false)}>
                        취소
                      </Button>
                    </div>
                  </>
                )}

                {/* 파일 업로드 모드 */}
                {inputMode === 'upload' && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setInputMode('grid'); setAudioFile(null) }}>
                        <ChevronRight className="h-3.5 w-3.5 rotate-180 mr-1" />
                        돌아가기
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>녹음 파일 업로드</Label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                          ${audioFile
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-primary/5'
                          }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        {audioFile ? (
                          <div className="space-y-2">
                            <Mic className="h-6 w-6 text-primary mx-auto" />
                            <p className="text-sm font-medium">{audioFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => { e.stopPropagation(); setAudioFile(null) }}
                            >
                              <X className="h-3 w-3 mr-1" /> 제거
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">파일을 드래그하거나 클릭</p>
                            <p className="text-xs text-muted-foreground/70">MP3, WAV, M4A, WebM · 최대 120분</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setShowNewSheet(false)}>
                        취소
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-orange-600 hover:opacity-90 text-white"
                        onClick={startFullPipeline}
                        disabled={!audioFile}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI 분석 시작
                      </Button>
                    </div>
                  </>
                )}

                {/* 텍스트 입력 모드 (텍스트, 슬랙, 노션, 통화, 이메일) */}
                {inputMode === 'text' && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setInputMode('grid'); setMeetingContent(''); setSourceUrl('') }}>
                        <ChevronRight className="h-3.5 w-3.5 rotate-180 mr-1" />
                        돌아가기
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        {sourceType === 'slack' && '슬랙 대화'}
                        {sourceType === 'text' && '텍스트 입력'}
                        {sourceType === 'notion' && '노션/문서'}
                        {sourceType === 'call' && '전화/통화'}
                        {sourceType === 'email' && '이메일'}
                      </Badge>
                    </div>

                    {/* 노션/문서일 때 URL 입력 */}
                    {sourceType === 'notion' && (
                      <div className="space-y-2">
                        <Label htmlFor="sourceUrl">문서 URL <span className="text-muted-foreground font-normal">(선택)</span></Label>
                        <Input
                          id="sourceUrl"
                          placeholder="https://notion.so/... 또는 문서 링크"
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="content">내용</Label>
                      <Textarea
                        id="content"
                        placeholder={
                          sourceType === 'slack' ? '슬랙 대화를 복사해서 붙여넣기하세요...' :
                          sourceType === 'notion' ? '노션/문서 내용을 붙여넣기하세요...' :
                          sourceType === 'call' ? '통화 내용을 요약해서 입력하세요...' :
                          sourceType === 'email' ? '이메일 내용을 붙여넣기하세요...' :
                          '회의 내용, 슬랙 대화, 노션 회의록 등을 붙여넣기하세요...'
                        }
                        value={meetingContent}
                        onChange={(e) => setMeetingContent(e.target.value)}
                        rows={8}
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setShowNewSheet(false)}>
                        취소
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-orange-600 hover:opacity-90 text-white"
                        onClick={startFullPipeline}
                        disabled={!meetingContent.trim()}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI 분석 시작
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ===== Step: Recording ===== */}
            {step === 'recording' && (
              <AudioRecorder
                onRecordingComplete={(file) => {
                  setAudioFile(file)
                  runSTTAndAnalyze(file)
                }}
                onCancel={() => setStep('idle')}
              />
            )}

            {/* ===== Step: Processing ===== */}
            {(step === 'uploading' || step === 'transcribing' || step === 'analyzing' || step === 'creating_tickets') && (
              <div className="py-8 space-y-6">
                <div className="text-center space-y-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                  <p className="font-medium">{stepMessage}</p>
                </div>
                <div className="space-y-3 max-w-sm mx-auto">
                  <ProgressStep
                    label="음성 → 텍스트 + 화자 분리 (다국어 자동 감지)"
                    status={step === 'uploading' || step === 'transcribing' ? 'active' : step === 'analyzing' || step === 'creating_tickets' ? 'done' : 'pending'}
                  />
                  <ProgressStep
                    label="5종 맥락 추출 + 화자 구분"
                    status={step === 'analyzing' ? 'active' : step === 'creating_tickets' ? 'done' : 'pending'}
                  />
                  <ProgressStep
                    label="티켓 자동 생성 + 충돌 감지"
                    status={step === 'creating_tickets' ? 'active' : 'pending'}
                  />
                </div>
              </div>
            )}

            {/* ===== Step: Done ===== */}
            {step === 'done' && analysisResult && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-medium">분석 완료</h3>
                  <p className="text-sm text-muted-foreground mt-1">{analysisResult.summary}</p>
                </div>

                {/* 추출 요약 카드 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-2xl font-semibold text-primary">{analysisResult.auto_created.decisions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">결정</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="text-2xl font-semibold text-emerald-600">{analysisResult.auto_created.tasks.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">할 일</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                    <p className="text-2xl font-semibold text-amber-600">{analysisResult.analysis.rejected_alternatives?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">기각</p>
                  </div>
                </div>

                {/* 추출된 결정 미리보기 */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">추출된 결정</h4>
                  <div className="space-y-3">
                    {analysisResult.auto_created.decisions.map((dec) => (
                      <div key={dec.id} className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Badge className="bg-primary/10 text-primary text-sm px-2.5 py-0.5 shrink-0">{dec.code}</Badge>
                            <span className="text-base font-medium">{dec.title}</span>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-sm px-2.5 py-0.5 shrink-0">
                            {dec.status === 'confirmed' ? '확정' : '보류'}
                          </Badge>
                        </div>
                        {dec.reason && (
                          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200/50 px-3 py-2.5">
                            <p className="text-xs font-semibold text-amber-600 mb-1">왜?</p>
                            <p className="text-sm text-amber-900/80 leading-relaxed">{dec.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 추출된 할 일 */}
                {analysisResult.auto_created.tasks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">할 일</h4>
                    <div className="space-y-2">
                      {analysisResult.auto_created.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between gap-3 p-3.5 rounded-lg border bg-card">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <span className="text-base">{task.title}</span>
                          </div>
                          {task.assignee && (
                            <Badge variant="outline" className="text-sm px-2.5 shrink-0">{task.assignee}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 이슈(안건) */}
                {analysisResult.analysis.issues?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                      <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                      이슈 ({analysisResult.analysis.issues.length}건)
                    </h4>
                    <div className="space-y-1.5">
                      {analysisResult.analysis.issues.map((issue, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-amber-200/50 bg-amber-50/50 text-sm">
                          <p className="font-medium text-amber-900">{issue.title}</p>
                          {issue.description && (
                            <p className="text-xs text-amber-700/70 mt-0.5">{issue.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 이전 결정과 충돌/유사 경고 */}
                {(() => {
                  // 기존 결정과 새 결정 비교
                  const existingDecs: { code: string; title: string; status: string }[] = (() => {
                    try { return JSON.parse(localStorage.getItem('pkeep-decisions') || '[]') } catch { return [] }
                  })()
                  const newDecs = analysisResult.auto_created.decisions
                  const warnings: { newDec: string; existDec: string; existCode: string; reason: string }[] = []

                  for (const nd of newDecs) {
                    for (const ed of existingDecs) {
                      // 제목이 유사하면 경고 (간단한 포함 관계 체크)
                      const ndLower = nd.title.toLowerCase()
                      const edLower = ed.title.toLowerCase()
                      if (ndLower === edLower || ndLower.includes(edLower) || edLower.includes(ndLower)) {
                        warnings.push({
                          newDec: nd.title,
                          existDec: ed.title,
                          existCode: ed.code,
                          reason: ed.status === 'confirmed' ? '기존 확정 결정과 유사' : `기존 ${ed.status} 결정과 유사`,
                        })
                      }
                    }
                  }

                  // API 충돌 + 클라이언트 유사도 경고 합산
                  const apiConflicts = analysisResult.conflicts.length
                  const totalWarnings = apiConflicts + warnings.length

                  if (totalWarnings === 0) return null

                  return (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200/50 space-y-2">
                      <h4 className="font-semibold text-red-700 flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        이전 결정과 {totalWarnings}건의 충돌/유사 항목
                      </h4>
                      {warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-800 bg-red-100/50 rounded-lg px-3 py-2">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">"{w.newDec}"</p>
                            <p className="text-red-600 mt-0.5">→ {w.existCode} "{w.existDec}" ({w.reason})</p>
                          </div>
                        </div>
                      ))}
                      {apiConflicts > 0 && (
                        <p className="text-xs text-red-600">+ AI 분석에서 {apiConflicts}건 추가 충돌 감지</p>
                      )}
                    </div>
                  )
                })()}

                {/* 키워드 */}
                {analysisResult.analysis.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.analysis.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}

                {/* 저장 버튼 */}
                <Button
                  className="w-full bg-gradient-to-r from-primary to-orange-600 hover:opacity-90 text-white"
                  onClick={saveMeetingToList}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  회의록 저장
                </Button>
              </div>
            )}

            {/* ===== Step: Error ===== */}
            {step === 'error' && (
              <div className="py-8 space-y-4 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                <p className="font-medium text-destructive">{error || '분석 중 오류 발생'}</p>
                <Button variant="outline" onClick={() => setStep('idle')}>
                  다시 시도
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ========== Live Meeting Overlay ========== */}
      {step === 'live_meeting' && (
        <LiveMeeting
          onComplete={handleLiveMeetingComplete}
          onCancel={handleLiveMeetingCancel}
        />
      )}

      {/* ========== Search + Meeting List ========== */}
      {store.meetings.length > 0 && (
        <div className="flex items-center gap-3">
          <Input
            placeholder="회의 검색 (제목, 키워드, 요약)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {(() => {
        const filtered = searchQuery
          ? store.meetings.filter(m =>
              m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : store.meetings
        return filtered
      })().length === 0 && !searchQuery ? (
        <div className="text-center py-16 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto">
            <Mic className="h-8 w-8 text-primary/40" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-1">아직 녹음가 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              회의를 녹음하거나 파일을 올려보세요.{'\n'}
              AI가 결정사항, 근거, 할 일을 자동으로 추출합니다.
            </p>
          </div>
          <Button
            className="mt-2 bg-primary hover:bg-primary/90"
            onClick={() => { resetForm(); setShowNewSheet(true) }}
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 번째 녹음 추가
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const filtered = searchQuery
              ? store.meetings.filter(m =>
                  m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
                )
              : store.meetings
            return filtered
          })().map((meeting) => {
            const isExpanded = expandedMeeting === meeting.id
            const meetingDecisions = store.decisions.filter(d => d.meetingId === meeting.id)
            const meetingTasks = store.tasks.filter(t => t.meetingId === meeting.id)
            const meetingRejected = store.rejected.filter(r => r.meetingId === meeting.id)
            const duration = formatDuration(meeting.duration_seconds)

            return (
              <div
                key={meeting.id}
                className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${
                  isExpanded ? "ring-1 ring-primary/30 shadow-sm" : "hover:border-primary/20"
                }`}
              >
                {/* Card Header */}
                <div
                  className="p-5 cursor-pointer group"
                  onClick={() => { setExpandedMeeting(isExpanded ? null : meeting.id); setActiveTab('summary') }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-1 mt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-primary font-medium">
                            {meeting.code}
                          </span>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            {(() => { const Icon = sourceIcon(meeting); return <Icon className="h-5 w-5" /> })()}
                            {sourceLabel(meeting)}
                          </Badge>
                          {meeting.language && meeting.language !== 'ko' && (
                            <Badge variant="outline" className="text-xs">
                              {meeting.language.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                          {meeting.title}
                        </h3>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {meeting.date}
                          </span>
                          {duration && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {duration}
                            </span>
                          )}
                          {(() => {
                            const speakerCount = new Set(meeting.transcriptSegments.map(s => s.speaker).filter(Boolean)).size
                            return speakerCount > 0 ? (
                              <span className="flex items-center gap-1.5">
                                <Mic className="h-3.5 w-3.5" />
                                {speakerCount}명
                              </span>
                            ) : null
                          })()}
                        </div>

                        <div className="flex items-center gap-3 mt-2.5">
                          <span className="text-xs text-muted-foreground">
                            결정 {meetingDecisions.length}건
                          </span>
                          {meetingRejected.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              · 기각 {meetingRejected.length}건
                            </span>
                          )}
                          {meetingTasks.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              · 할 일 {meetingTasks.length}건
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-accent/10 text-accent border-0 gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        5종 추출
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('이 회의록을 삭제하시겠습니까? 관련 결정, 할 일도 함께 삭제됩니다.')) {
                            store.removeMeeting(meeting.id)
                          }
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border/50">
                    {/* 탭 헤더 */}
                    <div className="flex border-b border-border/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveTab('summary') }}
                        className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                          activeTab === 'summary'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        요약 · 추출
                        {activeTab === 'summary' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveTab('transcript') }}
                        className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                          activeTab === 'transcript'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        스크립트 원본
                        {activeTab === 'transcript' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </button>
                    </div>

                    {/* 탭: 요약 · 추출 */}
                    {activeTab === 'summary' && (
                      <div className="p-5 bg-secondary/20 space-y-6">
                        {/* 요약 */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-sm">{meeting.summary}</p>
                        </div>

                        {/* 결정 + 근거 */}
                        {meetingDecisions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-primary" />
                              결정 ({meetingDecisions.length}건)
                            </h4>
                            <div className="space-y-3">
                              {meetingDecisions.map((dec) => (
                                  <div key={dec.id} className="p-4 rounded-xl border border-border/50 bg-card">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <h5 className="font-medium text-sm">{dec.title}</h5>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Badge className={`text-xs ${
                                          dec.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600' :
                                          dec.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                          dec.status === 'changed' ? 'bg-blue-500/10 text-blue-600' :
                                          'bg-destructive/10 text-destructive'
                                        }`}>
                                          {dec.code}
                                        </Badge>
                                        {dec.area && (
                                          <Badge variant="outline" className="text-xs">{dec.area}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10">
                                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                        왜? (자동 추출)
                                      </p>
                                      <p className="text-sm text-amber-900 dark:text-amber-300/90">
                                        {dec.rationale}
                                      </p>
                                    </div>
                                    {dec.proposedBy && (
                                      <p className="text-xs text-muted-foreground mt-2">제안: {dec.proposedBy}</p>
                                    )}
                                  </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 기각된 대안 */}
                        {meetingRejected.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <Ban className="h-4 w-4 text-muted-foreground" />
                              기각된 대안 ({meetingRejected.length}건)
                            </h4>
                            <div className="space-y-2">
                              {meetingRejected.map((rej) => (
                                <div key={rej.id} className="p-3 rounded-xl border border-border/50 bg-card/50">
                                  <p className="text-sm font-medium line-through text-muted-foreground">{rej.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">사유: {rej.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 할 일 */}
                        {meetingTasks.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                              <ListChecks className="h-4 w-4 text-emerald-500" />
                              할 일 ({meetingTasks.length}건)
                            </h4>
                            <div className="space-y-2">
                              {meetingTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); store.editTask(task.id, { done: !task.done }) }}
                                      className="shrink-0"
                                    >
                                      <CheckCircle2 className={`h-4 w-4 ${task.done ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                    </button>
                                    <span className={`text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                                  </div>
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {task.assignee || '미지정'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 키워드 */}
                        {meeting.keywords?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-sm">키워드</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {meeting.keywords.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 탭: 스크립트 원본 */}
                    {activeTab === 'transcript' && (
                      <div className="p-5 bg-secondary/20 space-y-4">
                        {/* 메타 정보 */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {meeting.language && (
                            <span>감지 언어: {meeting.language.toUpperCase()}</span>
                          )}
                          {meeting.duration_seconds > 0 && (
                            <span>길이: {formatDuration(meeting.duration_seconds)}</span>
                          )}
                        </div>

                        {/* 세그먼트가 있으면 타임스탬프와 함께 표시 */}
                        {meeting.transcriptSegments.length > 0 ? (
                          <div className="space-y-1">
                            {meeting.transcriptSegments.map((seg, i) => {
                              const prevSpeaker = i > 0 ? meeting.transcriptSegments[i - 1].speaker : null
                              const showSpeaker = seg.speaker && seg.speaker !== prevSpeaker

                              // 화자별 색상
                              const speakerColors: Record<string, string> = {
                                'Speaker A': 'text-blue-600 dark:text-blue-400',
                                'Speaker B': 'text-emerald-600 dark:text-emerald-400',
                                'Speaker C': 'text-purple-600 dark:text-purple-400',
                                'Speaker D': 'text-amber-600 dark:text-amber-400',
                                'Speaker E': 'text-pink-600 dark:text-pink-400',
                              }
                              const speakerColor = seg.speaker ? (speakerColors[seg.speaker] || 'text-primary') : ''

                              return (
                                <div key={i}>
                                  {showSpeaker && (
                                    <div className={`text-base font-semibold mt-4 mb-1.5 pl-16 ${speakerColor}`}>
                                      {seg.speaker}
                                    </div>
                                  )}
                                  <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                                    <span className="text-sm font-mono text-muted-foreground shrink-0 pt-0.5 w-14 text-right tabular-nums">
                                      {formatTimestamp(seg.start)}
                                    </span>
                                    <p className="text-lg leading-relaxed flex-1">
                                      {seg.text}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          /* 세그먼트 없으면 전체 텍스트 표시 */
                          <div className="p-4 rounded-xl border bg-card">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {meeting.transcriptText}
                            </p>
                          </div>
                        )}

                        {/* 범례 */}
                        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary" />
                            AI가 추출한 구간
                          </span>
                        </div>
                      </div>
                    )}
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

// ============================================================
// Sub-components
// ============================================================

function ProgressStep({ label, status }: { label: string; status: 'pending' | 'active' | 'done' }) {
  return (
    <div className="flex items-center gap-3">
      {status === 'done' && (
        <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      {status === 'active' && (
        <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        </div>
      )}
      {status === 'pending' && (
        <div className="h-6 w-6 rounded-full border-2 border-border" />
      )}
      <span className={`text-sm ${
        status === 'done' ? 'text-emerald-600 font-medium' :
        status === 'active' ? 'text-foreground font-medium' :
        'text-muted-foreground'
      }`}>
        {label}
      </span>
    </div>
  )
}
