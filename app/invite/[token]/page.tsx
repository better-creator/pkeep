import { redirect } from 'next/navigation'
import { getInvitationByToken } from '@/lib/modules/invitation'
import { getUser } from '@/lib/modules/auth'
import { InviteAcceptClient } from './invite-accept-client'

interface Props {
  params: { token: string }
}

export default async function InvitePage({ params }: Props) {
  const { token } = params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold">초대를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">
            초대가 만료되었거나 유효하지 않은 링크입니다.
          </p>
        </div>
      </div>
    )
  }

  const user = await getUser()

  // 미인증 → 회원가입으로 (토큰 유지)
  if (!user) {
    redirect(`/signup?invite=${token}`)
  }

  const orgName = (invitation.organization as any)?.name ?? '조직'
  const teamName = (invitation.team as any)?.name

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <InviteAcceptClient
          token={token}
          orgName={orgName}
          teamName={teamName}
          role={invitation.team_role || 'contributor'}
        />
      </div>
    </div>
  )
}
