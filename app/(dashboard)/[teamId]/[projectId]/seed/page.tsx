'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const router = useRouter()

  const seed = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()

      // Clear existing data
      localStorage.removeItem('pkeep-conflicts')

      // Seed project entry
      const projects = [{
        id: 'proj-1',
        name: '핏커넥트 MVP',
        description: '피트니스 트레이너 매칭 O2O 플랫폼',
        createdAt: new Date().toISOString(),
      }]
      localStorage.setItem('pkeep-projects', JSON.stringify(projects))

      // Seed team members
      const team = [
        { id: 'member-1', name: '정우진 CEO', role: 'planning' },
        { id: 'member-2', name: '박서연 CTO', role: 'dev' },
        { id: 'member-3', name: '김하늘 디자이너', role: 'design' },
        { id: 'member-4', name: '이민호 PM', role: 'planning' },
      ]
      localStorage.setItem('pkeep-team', JSON.stringify(team))

      // Seed core data
      localStorage.setItem('pkeep-meetings', JSON.stringify(data.meetings))
      localStorage.setItem('pkeep-decisions', JSON.stringify(data.decisions))
      localStorage.setItem('pkeep-tasks', JSON.stringify(data.tasks))
      localStorage.setItem('pkeep-rejected', JSON.stringify(data.rejected))

      setStatus('done')
      // Auto-navigate to dashboard
      setTimeout(() => router.push('/team-1/proj-1/dashboard'), 500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <h1 className="text-2xl font-semibold">데모 데이터 시드</h1>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        핏커넥트(FitConnect) 피트니스 O2O 플랫폼 MVP 개발 시나리오.<br />
        회의 10건, 결정 20건, 할 일 30+건, 기각 6건, 팀원 4명
      </p>
      <Button onClick={seed} disabled={status === 'loading'} size="lg">
        {status === 'loading' ? '생성 중...' : status === 'done' ? '완료! 이동 중...' : '데모 시나리오 생성'}
      </Button>
      {status === 'error' && (
        <p className="text-destructive text-sm">오류가 발생했습니다. 다시 시도하세요.</p>
      )}
    </div>
  )
}
