'use client'

import { useEffect } from 'react'

export function AutoSeed() {
  useEffect(() => {
    // 이미 데이터가 있으면 스킵
    const existing = localStorage.getItem('pkeep-meetings')
    if (existing && JSON.parse(existing).length > 0) return

    // 기본 프로젝트가 없으면 등록
    const existingProjects = localStorage.getItem('pkeep-projects')
    if (!existingProjects || JSON.parse(existingProjects).length === 0) {
      const defaultProjects = [
        { id: 'proj-1', name: '핏커넥트 MVP', createdAt: '2025-12-01T00:00:00.000Z' },
      ]
      localStorage.setItem('pkeep-projects', JSON.stringify(defaultProjects))
    }

    // 자동으로 시드 데이터 로드
    fetch('/api/seed', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        localStorage.setItem('pkeep-meetings', JSON.stringify(data.meetings))
        localStorage.setItem('pkeep-decisions', JSON.stringify(data.decisions))
        localStorage.setItem('pkeep-tasks', JSON.stringify(data.tasks))
        localStorage.setItem('pkeep-rejected', JSON.stringify(data.rejected))
        // 데이터 로드 후 새로고침해서 대시보드에 반영
        window.location.reload()
      })
      .catch(() => {})
  }, [])

  return null
}
