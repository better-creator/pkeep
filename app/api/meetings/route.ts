import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/meetings - List meetings for a project
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { project_id, title, date, attendees, content } = body

  if (!project_id || !title || !date) {
    return NextResponse.json(
      { error: 'project_id, title, and date are required' },
      { status: 400 }
    )
  }

  // Generate next code
  const { data: existingMeetings } = await supabase
    .from('meetings')
    .select('code')
    .eq('project_id', project_id)
    .order('code', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (existingMeetings && existingMeetings.length > 0) {
    const lastCode = existingMeetings[0].code
    const match = lastCode.match(/MTG-(\d+)/)
    if (match) {
      nextNum = parseInt(match[1]) + 1
    }
  }
  const code = `MTG-${nextNum.toString().padStart(3, '0')}`

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      project_id,
      code,
      title,
      date,
      attendees,
      content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
