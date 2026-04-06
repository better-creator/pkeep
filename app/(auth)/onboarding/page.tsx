'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step = 'loading' | 'choice' | 'create-org' | 'create-team' | 'create-project' | 'invite-code'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">준비 중...</div>}>
      <OnboardingForm />
    </Suspense>
  )
}

function OnboardingForm() {
  const [step, setStep] = useState<Step>('loading')
  const [orgName, setOrgName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // 이미 조직이 있는 유저는 대시보드로 리다이렉트
  // 초대 토큰이 있으면 자동으로 초대 코드 스텝으로
  useEffect(() => {
    async function checkState() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { count } = await supabase
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) > 0) {
        router.push('/dashboard')
        return
      }

      // 초대 토큰이 URL에 있으면 자동 세팅
      const invite = searchParams.get('invite')
      if (invite) {
        setInviteCode(invite)
        setStep('invite-code')
        return
      }

      setStep('choice')
    }
    checkState()
  }, [router, searchParams])

  // --- 조직 생성 플로우 ---
  async function handleCreateAll() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, teamName, projectName }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '생성에 실패했습니다.')
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

  // --- 초대 코드 플로우 ---
  async function handleJoinByCode() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/onboarding/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteCode.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '초대 코드가 유효하지 않습니다.')
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

  // 로딩 중
  if (step === 'loading') {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">준비 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">시작하기</h1>
        <p className="text-sm text-muted-foreground">
          {step === 'choice' && '조직을 만들거나, 초대받은 조직에 합류하세요'}
          {step === 'create-org' && '조직 이름을 입력하세요'}
          {step === 'create-team' && '첫 번째 팀을 만드세요'}
          {step === 'create-project' && '첫 번째 프로젝트를 만드세요'}
          {step === 'invite-code' && '초대 코드를 입력하세요'}
        </p>
      </div>

      {/* Step: 선택 */}
      {step === 'choice' && (
        <div className="space-y-3">
          <Button
            className="w-full h-20 text-base"
            onClick={() => setStep('create-org')}
          >
            <div className="text-left">
              <div className="font-semibold">조직 만들기</div>
              <div className="text-xs opacity-80 mt-0.5">새 조직을 만들고 팀원을 초대하세요</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-20 text-base"
            onClick={() => setStep('invite-code')}
          >
            <div className="text-left">
              <div className="font-semibold">초대 코드로 합류</div>
              <div className="text-xs opacity-80 mt-0.5">이미 초대받은 조직에 참여하세요</div>
            </div>
          </Button>
        </div>
      )}

      {/* Step: 조직 생성 */}
      {step === 'create-org' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">조직 이름</Label>
            <Input
              id="orgName"
              placeholder="예: 우리 회사"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              회사명이나 팀 이름을 입력하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('choice')}
            >
              이전
            </Button>
            <Button
              className="flex-1"
              disabled={!orgName.trim() || orgName.trim().length < 2}
              onClick={() => setStep('create-team')}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step: 팀 생성 */}
      {step === 'create-team' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">첫 번째 팀 이름</Label>
            <Input
              id="teamName"
              placeholder="예: 기획팀, 개발팀, 프로덕트팀"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              나중에 팀을 추가하거나 이름을 바꿀 수 있습니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('create-org')}
            >
              이전
            </Button>
            <Button
              className="flex-1"
              disabled={!teamName.trim() || teamName.trim().length < 2}
              onClick={() => setStep('create-project')}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* Step: 프로젝트 생성 */}
      {step === 'create-project' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">첫 번째 프로젝트</Label>
            <Input
              id="projectName"
              placeholder="예: 앱 리뉴얼, MVP 개발"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              프로젝트 안에서 회의, 결정, 할일을 관리합니다
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('create-team')}
              disabled={loading}
            >
              이전
            </Button>
            <Button
              className="flex-1"
              disabled={!projectName.trim() || projectName.trim().length < 2 || loading}
              onClick={handleCreateAll}
            >
              {loading ? '생성 중...' : '시작하기'}
            </Button>
          </div>
        </div>
      )}

      {/* Step: 초대 코드 */}
      {step === 'invite-code' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
            <Input
              id="inviteCode"
              placeholder="받으신 초대 코드를 붙여넣으세요"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setStep('choice'); setError(null) }}
              disabled={loading}
            >
              이전
            </Button>
            <Button
              className="flex-1"
              disabled={!inviteCode.trim() || loading}
              onClick={handleJoinByCode}
            >
              {loading ? '합류 중...' : '합류하기'}
            </Button>
          </div>
        </div>
      )}

      {/* 스텝 인디케이터 (조직 생성 플로우만) */}
      {['create-org', 'create-team', 'create-project'].includes(step) && (
        <div className="flex justify-center gap-1.5">
          {['create-org', 'create-team', 'create-project'].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
