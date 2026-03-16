'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const seed = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()

      localStorage.setItem('pkeep-meetings', JSON.stringify(data.meetings))
      localStorage.setItem('pkeep-decisions', JSON.stringify(data.decisions))
      localStorage.setItem('pkeep-tasks', JSON.stringify(data.tasks))
      localStorage.setItem('pkeep-rejected', JSON.stringify(data.rejected))

      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <h1 className="text-2xl font-semibold">데모 데이터 시드</h1>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        3명이 5회 회의한 PKEEP MVP 개발 미팅 데이터를 생성합니다.<br />
        회의 5건, 결정 13건, 할 일 17건, 기각 5건
      </p>
      <Button onClick={seed} disabled={status === 'loading'} size="lg">
        {status === 'loading' ? '생성 중...' : status === 'done' ? '완료! 소스 페이지로 이동하세요' : '시드 데이터 생성'}
      </Button>
      {status === 'done' && (
        <a href="/team-1/proj-1/meetings" className="text-primary underline text-sm">
          → 소스 페이지로 이동
        </a>
      )}
    </div>
  )
}
