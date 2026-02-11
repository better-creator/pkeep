import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/screens - List screens for a project
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('screens')
    .select('*')
    .eq('project_id', projectId)
    .order('code', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Build tree structure
  const screenMap = new Map()
  const rootScreens: unknown[] = []

  // First pass: create map
  data.forEach((screen) => {
    screenMap.set(screen.id, { ...screen, children: [] })
  })

  // Second pass: build tree
  data.forEach((screen) => {
    const screenNode = screenMap.get(screen.id)
    if (screen.parent_id && screenMap.has(screen.parent_id)) {
      screenMap.get(screen.parent_id).children.push(screenNode)
    } else {
      rootScreens.push(screenNode)
    }
  })

  return NextResponse.json({
    flat: data,
    tree: rootScreens,
  })
}

// POST /api/screens - Create a new screen
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { project_id, name, description, parent_id, figma_url } = body

  if (!project_id || !name) {
    return NextResponse.json(
      { error: 'project_id and name are required' },
      { status: 400 }
    )
  }

  // Generate next code
  const { data: existingScreens } = await supabase
    .from('screens')
    .select('code')
    .eq('project_id', project_id)
    .order('code', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (existingScreens && existingScreens.length > 0) {
    const lastCode = existingScreens[0].code
    const match = lastCode.match(/SCR-(\d+)/)
    if (match) {
      nextNum = parseInt(match[1]) + 1
    }
  }
  const code = `SCR-${nextNum.toString().padStart(3, '0')}`

  const { data, error } = await supabase
    .from('screens')
    .insert({
      project_id,
      code,
      name,
      description,
      parent_id,
      figma_url,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
