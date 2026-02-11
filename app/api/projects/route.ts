import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/projects - List all projects for a team
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { team_id, name, description } = body

  if (!team_id || !name) {
    return NextResponse.json(
      { error: 'team_id and name are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      team_id,
      name,
      description,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
