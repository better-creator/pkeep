'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Sparkles, Mic, MicOff, Square, Loader2, AlertTriangle, Clock,
  ChevronRight, Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TranscriptSegment } from '@/lib/store/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveSegment {
  text: string
  start: number
  end: number
  isFinal: boolean
}

interface LiveMeetingProps {
  onComplete: (transcript: string, segments: TranscriptSegment[]) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiveMeeting({ onComplete, onCancel }: LiveMeetingProps) {
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'recording' | 'stopped' | 'error' | 'permission_denied'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [segments, setSegments] = useState<LiveSegment[]>([])
  const [partialText, setPartialText] = useState('')
  const [previousDecisions, setPreviousDecisions] = useState<
    { title: string; code?: string }[]
  >([])

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  // Load previous decisions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pkeep-decisions')
      if (raw) {
        const all = JSON.parse(raw) as { title: string; code?: string }[]
        setPreviousDecisions(all.slice(-5))
      }
    } catch {
      // ignore
    }
  }, [])

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments, partialText])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        // Send terminate_session message
        wsRef.current.send(JSON.stringify({ terminate_session: true }))
      }
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // -----------------------------------------------------------------------
  // Downsample float32 audio from source rate to 16kHz and return Int16Array
  // -----------------------------------------------------------------------

  const downsampleTo16kPCM16 = (
    float32: Float32Array,
    sourceSampleRate: number,
  ): Int16Array => {
    const ratio = sourceSampleRate / 16000
    const newLength = Math.round(float32.length / ratio)
    const result = new Int16Array(newLength)
    for (let i = 0; i < newLength; i++) {
      const idx = Math.round(i * ratio)
      const sample = Math.max(-1, Math.min(1, float32[idx]))
      result[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
    return result
  }

  // Convert Int16Array to base64
  const int16ToBase64 = (int16: Int16Array): string => {
    const bytes = new Uint8Array(int16.buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  // -----------------------------------------------------------------------
  // Start session
  // -----------------------------------------------------------------------

  const startSession = async () => {
    setError(null)
    setStatus('connecting')

    // 1. Get temporary token from server
    let token: string
    try {
      const res = await fetch('/api/meetings/realtime-token', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Token request failed')
      }
      const data = await res.json()
      token = data.token
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token')
      setStatus('error')
      return
    }

    // 2. Get microphone access
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch {
      setStatus('permission_denied')
      return
    }

    // 3. Connect WebSocket (v3 — token + multilingual model)
    const ws = new WebSocket(
      `wss://streaming.assemblyai.com/v3/ws?speech_model=universal-streaming-multilingual&sample_rate=16000&token=${token}`
    )
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('recording')
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 200)

      // 4. Setup audio processing
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)

      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return

        const inputData = e.inputBuffer.getChannelData(0)
        const pcm16 = downsampleTo16kPCM16(inputData, audioContext.sampleRate)

        // v3: 바이너리 PCM16 데이터 직접 전송
        ws.send(pcm16.buffer)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        // v3 메시지 형식 처리
        if (msg.type === 'Turn') {
          // Turn 메시지: transcript 텍스트 + end_of_turn 플래그
          const text = msg.transcript || ''
          if (!text.trim()) return

          if (msg.end_of_turn) {
            // 최종 턴 — 확정 세그먼트로 추가
            setSegments((prev) => [
              ...prev,
              {
                text: text.trim(),
                start: elapsed,
                end: elapsed,
                isFinal: true,
              },
            ])
            setPartialText('')
          } else {
            // 진행 중인 턴
            setPartialText(text)
          }
        } else if (msg.type === 'Begin') {
          // 세션 시작 확인
          console.log('[LiveMeeting] Session started:', msg.id)
        } else if (msg.type === 'Termination') {
          // 세션 종료
          console.log('[LiveMeeting] Session terminated')
        }
        // v2 호환 (fallback)
        else if (msg.message_type === 'PartialTranscript' && msg.text) {
          setPartialText(msg.text)
        } else if (msg.message_type === 'FinalTranscript' && msg.text) {
          setSegments((prev) => [
            ...prev,
            {
              text: msg.text,
              start: (msg.audio_start || 0) / 1000,
              end: (msg.audio_end || 0) / 1000,
              isFinal: true,
            },
          ])
          setPartialText('')
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      setError('WebSocket 연결 오류. AssemblyAI 서비스를 확인하세요.')
      setStatus('error')
      cleanup()
    }

    ws.onclose = (event) => {
      if (event.code !== 1000) {
        console.error('[LiveMeeting] WebSocket closed:', event.code, event.reason)
      }
      setStatus((prev) => (prev === 'recording' ? 'stopped' : prev))
    }
  }

  // -----------------------------------------------------------------------
  // Stop session
  // -----------------------------------------------------------------------

  const stopSession = useCallback(() => {
    cleanup()
    setStatus('stopped')
  }, [cleanup])

  // -----------------------------------------------------------------------
  // Handle analysis request
  // -----------------------------------------------------------------------

  const handleAnalyze = () => {
    const fullText = segments.map((s) => s.text).join(' ')
    const transcriptSegments: TranscriptSegment[] = segments.map((s) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    }))
    onComplete(fullText, transcriptSegments)
  }

  // -----------------------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------------------

  const handleCancel = () => {
    cleanup()
    onCancel()
  }

  // -----------------------------------------------------------------------
  // Render: Permission denied
  // -----------------------------------------------------------------------

  if (status === 'permission_denied') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <MicOff className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <p className="font-medium">마이크 접근이 차단되었습니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              브라우저 설정에서 마이크 권한을 허용해주세요.
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Error
  // -----------------------------------------------------------------------

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <p className="font-medium text-destructive">
            {error || '연결 중 오류가 발생했습니다'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleCancel}>
              돌아가기
            </Button>
            <Button onClick={startSession}>다시 시도</Button>
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Idle / Connecting
  // -----------------------------------------------------------------------

  if (status === 'idle' || status === 'connecting') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          {status === 'connecting' ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="font-medium">실시간 연결 중...</p>
            </>
          ) : (
            <>
              <button
                onClick={startSession}
                className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center mx-auto shadow-lg hover:shadow-xl"
              >
                <Mic className="h-10 w-10 text-white" />
              </button>
              <div>
                <p className="font-medium">실시간 회의 모드</p>
                <p className="text-sm text-muted-foreground mt-1">
                  버튼을 눌러 실시간 녹음 + 텍스트 변환을 시작하세요
                </p>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground"
          >
            취소
          </Button>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Stopped (review transcript)
  // -----------------------------------------------------------------------

  if (status === 'stopped') {
    const fullText = segments.map((s) => s.text).join(' ')

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold">녹음 완료</h2>
            <p className="text-sm text-muted-foreground">
              {formatTime(elapsed)} 녹음 | {segments.length}개 구간
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-orange-600 hover:opacity-90 text-white"
              onClick={handleAnalyze}
              disabled={!fullText.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              분석 시작
            </Button>
          </div>
        </div>

        {/* Transcript review */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              전체 스크립트
            </h3>
            {segments.length > 0 ? (
              <div className="space-y-2">
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg border bg-card"
                  >
                    <span className="text-xs font-mono text-muted-foreground shrink-0 pt-0.5 w-12 text-right tabular-nums">
                      {formatTime(Math.floor(seg.start))}
                    </span>
                    <p className="text-sm leading-relaxed flex-1">{seg.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>녹음된 텍스트가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Recording (main two-panel layout)
  // -----------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header bar */}
      <div className="border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-600">
              실시간 녹음 중
            </span>
          </span>
          <span className="text-sm font-mono tabular-nums text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsed)}
          </span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={stopSession}
          className="gap-2"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          녹음 종료
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Live Transcript */}
        <div className="flex-1 flex flex-col border-r">
          <div className="px-5 py-3 border-b bg-secondary/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4 text-red-500" />
              실시간 스크립트
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {segments.length === 0 && !partialText && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                음성이 감지되면 여기에 텍스트가 표시됩니다...
              </div>
            )}

            {/* Final segments */}
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground shrink-0 pt-0.5 w-12 text-right tabular-nums">
                  {formatTime(Math.floor(seg.start))}
                </span>
                <p className="text-sm leading-relaxed flex-1">{seg.text}</p>
              </div>
            ))}

            {/* Partial (in-progress) text */}
            {partialText && (
              <div className="flex gap-3 p-2.5 rounded-lg">
                <span className="text-xs font-mono text-muted-foreground/50 shrink-0 pt-0.5 w-12 text-right tabular-nums">
                  ...
                </span>
                <p className="text-sm leading-relaxed flex-1 text-muted-foreground/60 italic">
                  {partialText}
                </p>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Right panel: AI Insights (placeholder) */}
        <div className="w-80 flex flex-col bg-secondary/10">
          <div className="px-5 py-3 border-b bg-secondary/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 인사이트
            </h3>
          </div>

          <div className="flex-1 flex items-center justify-center p-5">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                AI 인사이트가 여기에 표시됩니다
              </p>
              <p className="text-xs text-muted-foreground/60">
                Stage 2에서 구현 예정
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar: Previous decisions context */}
      {previousDecisions.length > 0 && (
        <div className="border-t px-6 py-3 bg-secondary/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              이전 맥락
            </span>
            <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-none">
              {previousDecisions.map((dec, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs whitespace-nowrap shrink-0"
                >
                  {dec.code && (
                    <span className="text-primary mr-1">{dec.code}</span>
                  )}
                  {dec.title}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
