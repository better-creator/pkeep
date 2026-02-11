import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

// POST /api/ai/chat - Chat with AI about project context
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { project_id, query } = body

  if (!project_id || !query) {
    return NextResponse.json(
      { error: 'project_id and query are required' },
      { status: 400 }
    )
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const [
    { data: decisions },
    { data: screens },
    { data: meetings },
  ] = await Promise.all([
    supabase.from('decisions').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(20),
    supabase.from('screens').select('*').eq('project_id', project_id),
    supabase.from('meetings').select('*').eq('project_id', project_id).order('date', { ascending: false }).limit(10),
  ])

  const decisionsList = decisions || []
  const screensList = screens || []
  const meetingsList = meetings || []

  // Build context string
  const context = `
# Project: ${project.name}
${project.description || ''}

## Screens (${screensList.length})
${screensList.map((s: any) => `- ${s.code}: ${s.name}${s.description ? ` - ${s.description}` : ''}`).join('\n') || 'No screens'}

## Recent Decisions (${decisionsList.length})
${decisionsList.map((d: any) => `- ${d.code}: ${d.title} [${d.status}] (${d.area})
  ${d.content || ''}
  ${d.reason ? `Reason: ${d.reason}` : ''}`).join('\n') || 'No decisions'}

## Recent Meetings (${meetingsList.length})
${meetingsList.map((m: any) => `- ${m.code}: ${m.title} (${m.date})
  ${m.content ? m.content.substring(0, 500) + '...' : ''}`).join('\n') || 'No meetings'}
`

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a project advisor AI. You have access to the following project context and can answer questions about it.
Help users understand their project decisions, suggest improvements, identify conflicts, and provide insights.
Always reference specific codes (like DEC-001, SCR-002, MTG-001) when discussing items from the context.
Respond in the same language as the user's query.

${context}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
    })

    const response = completion.choices[0].message.content

    // Log the query (ignore errors for logging)
    try {
      await supabase.from('ai_queries').insert({
        project_id,
        query,
        context: { decisions: decisionsList.length, screens: screensList.length, meetings: meetingsList.length },
        response,
      })
    } catch {
      // Logging failure should not break the response
    }

    return NextResponse.json({
      response,
      sources_used: {
        decisions: decisionsList.map((d: any) => d.code),
        screens: screensList.map((s: any) => s.code),
        meetings: meetingsList.map((m: any) => m.code),
      },
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
}
