'use client'

import { Mic } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

export function HeaderRecordButton() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  if (!teamId || !projectId) return null

  return (
    <button
      onClick={() => router.push(`/${teamId}/${projectId}/meetings?record=1`)}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      <Mic className="h-3.5 w-3.5" />
      <span>녹음</span>
    </button>
  )
}
