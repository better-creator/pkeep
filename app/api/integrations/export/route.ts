import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ExportFormat = 'linear' | 'jira' | 'notion' | 'markdown' | 'json'

interface ExportRequestBody {
  projectId: string
  format: ExportFormat
  filter?: {
    status?: string
    area?: string
  }
}

// POST /api/integrations/export
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  let body: ExportRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { projectId, format, filter } = body

  if (!projectId || !format) {
    return NextResponse.json(
      { error: 'projectId and format are required' },
      { status: 400 }
    )
  }

  const validFormats: ExportFormat[] = ['linear', 'jira', 'notion', 'markdown', 'json']
  if (!validFormats.includes(format)) {
    return NextResponse.json(
      { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
      { status: 400 }
    )
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

  // Fetch decisions with optional filters
  let decisionsQuery = supabase
    .from('decisions')
    .select(`
      *,
      decision_links (id, link_type, link_id),
      decision_sources (id, source_type, source_id, source_url)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (filter?.status) {
    decisionsQuery = decisionsQuery.eq('status', filter.status)
  }
  if (filter?.area) {
    decisionsQuery = decisionsQuery.eq('area', filter.area)
  }

  // Fetch tasks with optional filters
  let tasksQuery = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (filter?.status) {
    tasksQuery = tasksQuery.eq('status', filter.status)
  }

  // Fetch meetings
  const meetingsQuery = supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })

  const [
    { data: decisions, error: decisionsError },
    { data: tasks, error: tasksError },
    { data: meetings, error: meetingsError },
  ] = await Promise.all([decisionsQuery, tasksQuery, meetingsQuery])

  if (decisionsError || tasksError || meetingsError) {
    return NextResponse.json(
      { error: 'Failed to fetch project data' },
      { status: 500 }
    )
  }

  const decisionsList = decisions || []
  const tasksList = tasks || []
  const meetingsList = meetings || []

  switch (format) {
    case 'linear':
      return NextResponse.json(formatLinear(decisionsList, tasksList))
    case 'jira':
      return NextResponse.json(formatJira(decisionsList, tasksList))
    case 'notion':
      return NextResponse.json(formatNotion(decisionsList, tasksList, meetingsList))
    case 'markdown':
      return formatMarkdown(project, decisionsList, tasksList, meetingsList)
    case 'json':
      return NextResponse.json({
        format: 'json',
        project,
        decisions: decisionsList,
        tasks: tasksList,
        meetings: meetingsList,
      })
    default:
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function mapStatusToLinearState(status: string): string {
  switch (status) {
    case 'confirmed': return 'Done'
    case 'changed': return 'Cancelled'
    case 'pending': return 'In Progress'
    case 'done': return 'Done'
    case 'in_progress': return 'In Progress'
    default: return 'Backlog'
  }
}

function mapAreaToLabels(area: string | null): string[] {
  const labels: string[] = []
  if (area) labels.push(area)
  return labels
}

function mapPriorityToNumber(status: string): number {
  // Linear priority: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low
  switch (status) {
    case 'confirmed': return 2
    case 'pending': return 3
    case 'changed': return 4
    default: return 0
  }
}

function mapPriorityToJiraName(status: string): string {
  switch (status) {
    case 'confirmed': return 'High'
    case 'pending': return 'Medium'
    case 'changed': return 'Low'
    default: return 'Medium'
  }
}

function buildDecisionDescription(d: any): string {
  const parts: string[] = []
  parts.push(`## 결정\n${d.title}`)
  if (d.content) parts.push(`## 내용\n${d.content}`)
  if (d.reason) parts.push(`## 근거\n${d.reason}`)
  parts.push(`## 상태\n${d.status === 'confirmed' ? '확정' : d.status === 'changed' ? '변경됨' : '검토중'}`)
  if (d.area) parts.push(`## 영역\n${d.area}`)
  parts.push('---\n_Auto-created by PKEEP_')
  return parts.join('\n\n')
}

function buildTaskDescription(t: any): string {
  const parts: string[] = []
  if (t.decision_id) parts.push(`관련 결정: ${t.decision_id}`)
  if (t.meeting_id) parts.push(`관련 회의: ${t.meeting_id}`)
  if (t.assignee_name) parts.push(`담당: ${t.assignee_name}`)
  parts.push('\n---\n_Auto-created by PKEEP_')
  return parts.join('\n')
}

// --- Linear ---

function formatLinear(decisions: any[], tasks: any[]) {
  return {
    format: 'linear' as const,
    issues: decisions.map(d => ({
      title: `${d.code}: ${d.title}`,
      description: buildDecisionDescription(d),
      priority: mapPriorityToNumber(d.status),
      labels: ['decision', ...mapAreaToLabels(d.area)],
      state: mapStatusToLinearState(d.status),
    })),
    tasks: tasks.map(t => ({
      title: `TASK: ${t.title}`,
      description: buildTaskDescription(t),
      assignee: t.assignee_name || null,
      state: mapStatusToLinearState(t.status),
    })),
  }
}

// --- Jira ---

function formatJira(decisions: any[], tasks: any[]) {
  return {
    format: 'jira' as const,
    issues: [
      ...decisions.map(d => ({
        fields: {
          summary: `${d.code}: ${d.title}`,
          description: buildDecisionDescription(d),
          issuetype: { name: 'Decision' },
          priority: { name: mapPriorityToJiraName(d.status) },
          labels: ['pkeep-decision', ...mapAreaToLabels(d.area)],
          status: { name: mapStatusToLinearState(d.status) },
        },
      })),
      ...tasks.map(t => ({
        fields: {
          summary: `TASK: ${t.title}`,
          description: buildTaskDescription(t),
          issuetype: { name: 'Task' },
          priority: { name: 'Medium' },
          labels: ['pkeep-task'],
          status: { name: mapStatusToLinearState(t.status) },
          ...(t.assignee_name ? { assignee: { displayName: t.assignee_name } } : {}),
        },
      })),
    ],
  }
}

// --- Notion ---

function formatNotion(decisions: any[], tasks: any[], meetings: any[]) {
  return {
    format: 'notion' as const,
    databases: [
      {
        name: 'Decisions',
        pages: decisions.map(d => ({
          properties: {
            Name: { title: [{ text: { content: `${d.code}: ${d.title}` } }] },
            Status: { select: { name: d.status === 'confirmed' ? '확정' : d.status === 'changed' ? '변경됨' : '검토중' } },
            Area: d.area ? { select: { name: d.area } } : undefined,
            Content: d.content ? { rich_text: [{ text: { content: d.content } }] } : undefined,
            Reason: d.reason ? { rich_text: [{ text: { content: d.reason } }] } : undefined,
          },
        })),
      },
      {
        name: 'Tasks',
        pages: tasks.map(t => ({
          properties: {
            Name: { title: [{ text: { content: t.title } }] },
            Status: { select: { name: t.status === 'done' ? '완료' : t.status === 'in_progress' ? '진행중' : '대기' } },
            Assignee: t.assignee_name ? { rich_text: [{ text: { content: t.assignee_name } }] } : undefined,
          },
        })),
      },
      {
        name: 'Meetings',
        pages: meetings.map(m => ({
          properties: {
            Name: { title: [{ text: { content: `${m.code}: ${m.title}` } }] },
            Date: { date: { start: m.date } },
            Attendees: m.attendees ? { multi_select: m.attendees.map((a: string) => ({ name: a })) } : undefined,
          },
        })),
      },
    ],
  }
}

// --- Markdown ---

function formatMarkdown(project: any, decisions: any[], tasks: any[], meetings: any[]) {
  const lines: string[] = []

  lines.push(`# ${project.name} - Export`)
  lines.push('')
  if (project.description) {
    lines.push(project.description)
    lines.push('')
  }
  lines.push(`_Exported by PKEEP on ${new Date().toISOString().split('T')[0]}_`)
  lines.push('')

  // Group decisions by area
  const areas = Array.from(new Set(decisions.map(d => d.area || 'general')))

  lines.push('---')
  lines.push('')
  lines.push('## Decisions')
  lines.push('')

  for (const area of areas) {
    lines.push(`### ${area.charAt(0).toUpperCase() + area.slice(1)}`)
    lines.push('')
    const areaDecisions = decisions.filter(d => (d.area || 'general') === area)
    for (const d of areaDecisions) {
      const statusEmoji = d.status === 'confirmed' ? '[확정]' : d.status === 'changed' ? '[변경]' : '[검토중]'
      lines.push(`#### ${d.code}: ${d.title} ${statusEmoji}`)
      lines.push('')
      if (d.content) {
        lines.push(d.content)
        lines.push('')
      }
      if (d.reason) {
        lines.push(`> **근거**: ${d.reason}`)
        lines.push('')
      }
    }
  }

  lines.push('---')
  lines.push('')
  lines.push('## Tasks')
  lines.push('')
  lines.push('| Task | Assignee | Status |')
  lines.push('|------|----------|--------|')
  for (const t of tasks) {
    const statusLabel = t.status === 'done' ? '완료' : t.status === 'in_progress' ? '진행중' : '대기'
    lines.push(`| ${t.title} | ${t.assignee_name || '-'} | ${statusLabel} |`)
  }
  lines.push('')

  // Meetings section
  if (meetings.length > 0) {
    lines.push('---')
    lines.push('')
    lines.push('## Meetings')
    lines.push('')
    for (const m of meetings) {
      lines.push(`### ${m.code}: ${m.title} (${m.date})`)
      lines.push('')
      if (m.attendees && m.attendees.length > 0) {
        lines.push(`**참석자**: ${m.attendees.join(', ')}`)
        lines.push('')
      }
      if (m.ai_summary) {
        const summary = m.ai_summary as { decisions?: string[]; todos?: { task: string; assignee: string | null }[] }
        if (summary.decisions && summary.decisions.length > 0) {
          lines.push('**주요 결정:**')
          for (const dec of summary.decisions) {
            lines.push(`- ${dec}`)
          }
          lines.push('')
        }
        if (summary.todos && summary.todos.length > 0) {
          lines.push('**Action Items:**')
          for (const todo of summary.todos) {
            lines.push(`- ${todo.task}${todo.assignee ? ` (@${todo.assignee})` : ''}`)
          }
          lines.push('')
        }
      } else if (m.content) {
        lines.push(m.content.substring(0, 500))
        lines.push('')
      }
    }
  }

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_export.md"`,
    },
  })
}
