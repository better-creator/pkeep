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
        name: 'COSMETIC PROJECT',
        description: 'OTV 스튜디오 — 글로우업 코스메틱 S/S 시즌 캠페인',
        createdAt: new Date().toISOString(),
      }]
      localStorage.setItem('pkeep-projects', JSON.stringify(projects))

      // Seed team members
      const team = [
        { id: 'member-1', name: '금민주', role: 'CD' },
        { id: 'member-2', name: '박서연', role: '디자이너' },
        { id: 'member-3', name: '정하은', role: '브랜드매니저' },
        { id: 'member-4', name: '한지우', role: '포토그래퍼' },
        { id: 'member-5', name: '오태현', role: '영상감독' },
        { id: 'member-6', name: '최예린', role: '카피라이터' },
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
        글로우업 코스메틱 S/S 시즌 캠페인 (OTV 스튜디오).<br />
        회의 4건, 결정 10건, 할 일 12건, 기각 3건, 팀원 6명
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
