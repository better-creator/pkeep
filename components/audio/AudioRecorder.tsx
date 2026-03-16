'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void
  onCancel: () => void
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'paused' | 'permission_denied'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState<number[]>(Array(40).fill(0))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedElapsedRef = useRef<number>(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything()
    }
  }, [])

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio context for visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000) // collect data every second
      setState('recording')
      startTimeRef.current = Date.now()
      pausedElapsedRef.current = 0

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed(pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 200)

      // Visualizer
      visualize()
    } catch (err) {
      console.error('Microphone access denied:', err)
      setState('permission_denied')
    }
  }

  const visualize = () => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const draw = () => {
      analyserRef.current!.getByteFrequencyData(dataArray)
      // Sample 40 bars from frequency data
      const bars = 40
      const step = Math.floor(dataArray.length / bars)
      const newLevels: number[] = []
      for (let i = 0; i < bars; i++) {
        const val = dataArray[i * step] / 255
        newLevels.push(val)
      }
      setLevels(newLevels)
      animationRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      pausedElapsedRef.current = elapsed
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      setLevels(Array(40).fill(0))
      setState('paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 200)
      visualize()
      setState('recording')
    }
  }

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
      onRecordingComplete(file)
    }

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) clearInterval(timerRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (audioContextRef.current) audioContextRef.current.close()
  }, [onRecordingComplete])

  const handleCancel = () => {
    stopEverything()
    onCancel()
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Permission denied
  if (state === 'permission_denied') {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <MicOff className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="font-medium">마이크 접근이 차단되었습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            브라우저 설정에서 마이크 권한을 허용해주세요.
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>돌아가기</Button>
      </div>
    )
  }

  // Idle — start button
  if (state === 'idle') {
    return (
      <div className="py-8 text-center space-y-6">
        <button
          onClick={startRecording}
          className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center mx-auto shadow-lg hover:shadow-xl"
        >
          <Mic className="h-10 w-10 text-white" />
        </button>
        <div>
          <p className="font-medium">녹음 시작</p>
          <p className="text-sm text-muted-foreground mt-1">
            버튼을 눌러 회의 녹음을 시작하세요
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="text-muted-foreground">
          취소
        </Button>
      </div>
    )
  }

  // Recording / Paused
  return (
    <div className="py-6 space-y-6">
      {/* Status indicator */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {state === 'recording' && (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
          {state === 'paused' && (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {state === 'recording' ? '녹음 중' : '일시정지'}
          </span>
        </div>
        <p className="text-4xl font-mono font-light tracking-wider tabular-nums">
          {formatTime(elapsed)}
        </p>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-[3px] h-16 px-4">
        {levels.map((level, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-primary/80 transition-[height] duration-75"
            style={{
              height: `${Math.max(4, level * 64)}px`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={handleCancel}
        >
          <MicOff className="h-5 w-5" />
        </Button>

        {state === 'recording' ? (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={pauseRecording}
          >
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={resumeRecording}
          >
            <Play className="h-5 w-5" />
          </Button>
        )}

        <button
          onClick={stopRecording}
          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg"
        >
          <Square className="h-5 w-5 text-white fill-white" />
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        녹음을 종료하면 자동으로 AI 분석이 시작됩니다
      </p>
    </div>
  )
}
