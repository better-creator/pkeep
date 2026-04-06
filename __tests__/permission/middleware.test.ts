import { describe, it, expect } from 'vitest'
import { contextFromParams } from '@/lib/modules/permission/middleware'

// contextFromParams는 NextRequest를 받지만, URL 파싱 부분만 테스트

describe('contextFromParams', () => {
  function makeRequest(url: string) {
    return { url } as any
  }

  // ==========================================================
  // 시나리오 26: URL 쿼리에서 컨텍스트 추출
  // ==========================================================
  it('URL searchParams에서 orgId, teamId 추출', () => {
    const req = makeRequest('http://localhost/api/test?orgId=org-1&teamId=team-1')
    const ctx = contextFromParams(req, {})
    expect(ctx.orgId).toBe('org-1')
    expect(ctx.teamId).toBe('team-1')
  })

  it('params가 searchParams보다 우선', () => {
    const req = makeRequest('http://localhost/api/test?teamId=from-query')
    const ctx = contextFromParams(req, { teamId: 'from-params' })
    expect(ctx.teamId).toBe('from-params')
  })

  it('둘 다 없으면 undefined', () => {
    const req = makeRequest('http://localhost/api/test')
    const ctx = contextFromParams(req, {})
    expect(ctx.orgId).toBeUndefined()
    expect(ctx.teamId).toBeUndefined()
    expect(ctx.projectId).toBeUndefined()
  })

  it('projectId도 추출', () => {
    const req = makeRequest('http://localhost/api/test?projectId=proj-1')
    const ctx = contextFromParams(req, {})
    expect(ctx.projectId).toBe('proj-1')
  })
})
