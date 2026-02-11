import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Screen = {
  id: string
  code: string
  name: string
  parent_id: string | null
  description?: string | null
}

type ScreenNode = Screen & { children: Screen[] }

// GET /api/ai/export - Export project context for AI coding tools
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const screenId = searchParams.get('screenId')
  const format = searchParams.get('format') || 'markdown'

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Fetch related data
  const [
    { data: decisionsData },
    { data: screensData },
    { data: meetingsData },
  ] = await Promise.all([
    supabase.from('decisions').select('*').eq('project_id', projectId).eq('status', 'confirmed').order('created_at', { ascending: false }),
    supabase.from('screens').select('*').eq('project_id', projectId),
    supabase.from('meetings').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(5),
  ])

  let filteredDecisions = (decisionsData || []) as any[]
  let filteredScreens = (screensData || []) as any[]
  const meetings = (meetingsData || []) as any[]

  if (screenId) {
    // Get decision links for this screen
    const { data: links } = await supabase
      .from('decision_links')
      .select('decision_id')
      .eq('link_type', 'screen')
      .eq('link_id', screenId)

    const linkData = (links || []) as { decision_id: string }[]
    const linkedDecisionIds = new Set(linkData.map(l => l.decision_id))
    filteredDecisions = filteredDecisions.filter((d: any) => linkedDecisionIds.has(d.id))
    filteredScreens = filteredScreens.filter((s: any) => s.id === screenId)
  }

  // Build markdown export
  const markdown = `# ${project.name}

${project.description || ''}

---

## Project Context for AI

This document contains the project context for use with AI coding assistants like Cursor or Claude.

### Screens (Information Architecture)

\`\`\`
${buildScreenTree(filteredScreens)}
\`\`\`

### Active Decisions

${filteredDecisions.map((d: any) => `
#### ${d.code}: ${d.title}
- **Area**: ${d.area || 'general'}
- **Status**: ${d.status}
${d.content ? `\n${d.content}\n` : ''}
${d.reason ? `**Reason**: ${d.reason}\n` : ''}
`).join('\n')}

### Recent Meeting Summaries

${meetings.map((m: any) => `
#### ${m.code}: ${m.title} (${m.date})
${m.ai_summary ? `
**Key Decisions:**
${(m.ai_summary as { decisions?: string[] }).decisions?.map((d: string) => `- ${d}`).join('\n') || 'None'}

**Action Items:**
${(m.ai_summary as { todos?: { task: string; assignee: string | null }[] }).todos?.map((t: { task: string; assignee: string | null }) => `- ${t.task}${t.assignee ? ` (@${t.assignee})` : ''}`).join('\n') || 'None'}
` : m.content ? m.content.substring(0, 500) : 'No summary available'}
`).join('\n') || 'No meetings yet'}

---

## Code Guidelines (from decisions)

${filteredDecisions
  .filter((d: any) => d.area === 'dev')
  .map((d: any) => `- ${d.title}: ${d.content || d.reason || ''}`)
  .join('\n') || 'No development guidelines yet'}

## Design Guidelines (from decisions)

${filteredDecisions
  .filter((d: any) => d.area === 'design')
  .map((d: any) => `- ${d.title}: ${d.content || d.reason || ''}`)
  .join('\n') || 'No design guidelines yet'}
`

  if (format === 'json') {
    return NextResponse.json({
      project,
      screens: filteredScreens,
      decisions: filteredDecisions,
      meetings,
    })
  }

  // Return as markdown file
  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_context.md"`,
    },
  })
}

function buildScreenTree(screens: Screen[]): string {
  const screenMap = new Map<string, ScreenNode>()
  const roots: ScreenNode[] = []

  screens.forEach(s => screenMap.set(s.id, { ...s, children: [] }))
  screens.forEach(s => {
    const node = screenMap.get(s.id)!
    if (s.parent_id && screenMap.has(s.parent_id)) {
      screenMap.get(s.parent_id)!.children.push(s)
    } else {
      roots.push(node)
    }
  })

  function printTree(nodes: ScreenNode[], indent = ''): string {
    return nodes.map((node, i) => {
      const isLast = i === nodes.length - 1
      const prefix = indent + (isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ')
      const childIndent = indent + (isLast ? '    ' : '\u2502   ')
      const line = `${prefix}${node.code}: ${node.name}`
      const nodeWithChildren = screenMap.get(node.id)
      const children = nodeWithChildren ? printTree(nodeWithChildren.children as ScreenNode[], childIndent) : ''
      return line + (children ? '\n' + children : '')
    }).join('\n')
  }

  return printTree(roots) || 'No screens defined'
}
