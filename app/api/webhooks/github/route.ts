import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Code pattern: SCR-001, DEC-001, FT-001, MTG-001
const CODE_PATTERN = /\b(SCR|DEC|FT|MTG)-\d{3}\b/gi

// POST /api/webhooks/github - Handle Github webhooks
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Get webhook payload
  const event = request.headers.get('x-github-event')
  const body = await request.json()

  // Get project ID from webhook config (could be stored in external_links or config)
  // For now, we'll extract from repository name or require it in the webhook URL
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  let eventType: 'pr' | 'commit' | 'issue' | null = null
  let title = ''
  let url = ''
  let linkedCode: string | null = null

  switch (event) {
    case 'pull_request':
      eventType = 'pr'
      title = body.pull_request?.title || ''
      url = body.pull_request?.html_url || ''
      break

    case 'push':
      // Handle commits
      if (body.commits && body.commits.length > 0) {
        const commit = body.commits[0]
        eventType = 'commit'
        title = commit.message || ''
        url = commit.url || ''
      }
      break

    case 'issues':
      eventType = 'issue'
      title = body.issue?.title || ''
      url = body.issue?.html_url || ''
      break

    default:
      return NextResponse.json({ message: 'Event type not handled' })
  }

  if (!eventType || !title) {
    return NextResponse.json({ message: 'No relevant event data' })
  }

  // Extract codes from title
  const codes = title.match(CODE_PATTERN)
  if (codes && codes.length > 0) {
    linkedCode = codes[0].toUpperCase()
  }

  // Store the event
  const { data, error } = await supabase
    .from('github_events')
    .insert({
      project_id: projectId,
      event_type: eventType,
      title,
      url,
      linked_code: linkedCode,
      raw_data: body,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to store github event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If we found a code, link it to the appropriate entity
  if (linkedCode) {
    const codeType = linkedCode.split('-')[0]

    switch (codeType) {
      case 'SCR':
        const { data: screen } = await supabase
          .from('screens')
          .select('id')
          .eq('project_id', projectId)
          .eq('code', linkedCode)
          .single()

        if (screen) {
          await supabase.from('external_links').insert({
            project_id: projectId,
            entity_type: 'screen',
            entity_id: screen.id,
            platform: 'github',
            external_url: url,
          })
        }
        break

      case 'DEC':
        const { data: decision } = await supabase
          .from('decisions')
          .select('id')
          .eq('project_id', projectId)
          .eq('code', linkedCode)
          .single()

        if (decision) {
          await supabase.from('decision_sources').insert({
            decision_id: decision.id,
            source_type: 'github_pr',
            source_url: url,
          })
        }
        break

      case 'FT':
        const { data: feature } = await supabase
          .from('features')
          .select('id')
          .eq('project_id', projectId)
          .eq('code', linkedCode)
          .single()

        if (feature) {
          await supabase.from('external_links').insert({
            project_id: projectId,
            entity_type: 'feature',
            entity_id: feature.id,
            platform: 'github',
            external_url: url,
          })
        }
        break
    }
  }

  return NextResponse.json({
    success: true,
    event: data,
    linked_code: linkedCode,
  })
}
