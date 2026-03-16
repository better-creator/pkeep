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
        핏커넥트(FitConnect) 피트니스 O2O 플랫폼 MVP 개발 시나리오입니다.<br />
        회의 10건, 결정 20건, 할 일 25건, 기각 6건
      </p>
      <Button onClick={seed} disabled={status === 'loading'} size="lg">
        {status === 'loading' ? '생성 중...' : status === 'done' ? '완료! 대시보드로 이동하세요' : '시드 데이터 생성'}
      </Button>
      {status === 'done' && (
        <a href="/team-1/proj-1/dashboard" className="text-primary underline text-sm">
          → 대시보드로 이동
        </a>
      )}
    </div>
  )
}
