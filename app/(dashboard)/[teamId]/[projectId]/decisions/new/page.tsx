'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateDecisionForm } from '@/components/decisions'

export default function NewDecisionPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const handleSuccess = (decision: any) => {
    console.log('Decision created:', decision)
    // 결정 페이지로 이동
    router.push(`/${teamId}/${projectId}/decisions`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">새 결정 추가</h1>
          <p className="text-muted-foreground mt-1">
            프로젝트에 새로운 결정사항을 기록합니다
          </p>
        </div>
      </div>

      {/* 안내 */}
      <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
        <h3 className="font-medium text-teal-500 mb-2">충돌 감지 기능 데모</h3>
        <p className="text-sm text-muted-foreground">
          결정 제목을 입력하면 자동으로 유사한 과거 결정이 있는지 확인합니다.
          <br />
          예시: &quot;오렌지 컬러로 변경&quot;, &quot;칸반 보드 사용&quot;, &quot;다크 테마 적용&quot; 등을 입력해보세요.
        </p>
      </div>

      {/* 폼 */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <CreateDecisionForm
          projectId={projectId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
