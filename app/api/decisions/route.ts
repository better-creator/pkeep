import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/decisions - List decisions for a project
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const area = searchParams.get('area')
  const status = searchParams.get('status')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  let query = supabase
    .from('decisions')
    .select(`
      *,
      decision_links (
        id,
        link_type,
        link_id
      ),
      decision_sources (
        id,
        source_type,
        source_id,
        source_url
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (area) {
    query = query.eq('area', area)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/decisions - Create a new decision
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { project_id, title, content, reason, area, screen_ids, feature_ids, source } = body

  if (!project_id || !title) {
    return NextResponse.json(
      { error: 'project_id and title are required' },
      { status: 400 }
    )
  }

  // Generate next code
  const { data: existingDecisions } = await supabase
    .from('decisions')
    .select('code')
    .eq('project_id', project_id)
    .order('code', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (existingDecisions && existingDecisions.length > 0) {
    const lastCode = existingDecisions[0].code
    const match = lastCode.match(/DEC-(\d+)/)
    if (match) {
      nextNum = parseInt(match[1]) + 1
    }
  }
  const code = `DEC-${nextNum.toString().padStart(3, '0')}`

  // Insert decision
  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      project_id,
      code,
      title,
      content,
      reason,
      area,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Link to screens
  if (screen_ids && screen_ids.length > 0) {
    const links = screen_ids.map((screenId: string) => ({
      decision_id: decision.id,
      link_type: 'screen',
      link_id: screenId,
    }))
    await supabase.from('decision_links').insert(links)
  }

  // Link to features
  if (feature_ids && feature_ids.length > 0) {
    const links = feature_ids.map((featureId: string) => ({
      decision_id: decision.id,
      link_type: 'feature',
      link_id: featureId,
    }))
    await supabase.from('decision_links').insert(links)
  }

  // Add source if provided
  if (source) {
    await supabase.from('decision_sources').insert({
      decision_id: decision.id,
      source_type: source.type,
      source_id: source.id,
      source_url: source.url,
    })
  }

  return NextResponse.json(decision, { status: 201 })
}
