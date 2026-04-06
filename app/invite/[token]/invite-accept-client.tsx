'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
  orgName: string
  teamName: string | null
  role: string
}

const ROLE_LABELS: Record<string, string> = {
  lead: '팀 리더',
  contributor: '기여자',
  viewer: '뷰어',
}

export function InviteAcceptClient({ token, orgName, teamName, role }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAccept() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '합류에 실패했습니다.')
        setLoading(false)
        return
      }

      router.push(data.redirectTo)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">초대받았습니다</h1>
        <p className="text-sm text-muted-foreground">
          아래 조직에 합류하시겠습니까?
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground">조직</div>
          <div className="font-semibold text-lg">{orgName}</div>
        </div>
        {teamName && (
          <div>
            <div className="text-xs text-muted-foreground">팀</div>
            <div className="font-medium">{teamName}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground">역할</div>
          <div className="font-medium">{ROLE_LABELS[role] || role}</div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        className="w-full"
        onClick={handleAccept}
        disabled={loading}
      >
        {loading ? '합류 중...' : '합류하기'}
      </Button>
    </div>
  )
}
