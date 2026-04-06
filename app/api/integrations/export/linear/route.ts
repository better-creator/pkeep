import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LinearPushRequestBody {
  projectId: string
  linearApiKey: string
  teamId: string
  decisionIds?: string[]
  taskIds?: string[]
}

interface LinearCreateIssueResult {
  sourceId: string
  sourceType: 'decision' | 'task'
  linearIssueId: string | null
  linearIssueUrl: string | null
  error: string | null
}

// POST /api/integrations/export/linear
export async function POST(request: NextRequest) {
  let body: LinearPushRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { projectId, linearApiKey, teamId, decisionIds, taskIds } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  if (!linearApiKey) {
    return NextResponse.json(
      {
        error: 'linearApiKey is required',
        instructions: [
          '1. Go to Linear Settings > API > Personal API Keys',
          '2. Click "Create key" and give it a name (e.g., "PKEEP Integration")',
          '3. Copy the generated key and pass it as linearApiKey in the request body',
          '4. The key should start with "lin_api_"',
        ],
      },
      { status: 400 }
    )
  }

  if (!teamId) {
    return NextResponse.json(
      {
        error: 'teamId is required',
        instructions: [
          'To find your Linear team ID:',
          '1. Use the Linear API: POST https://api.linear.app/graphql',
          '2. Query: { teams { nodes { id name } } }',
          '3. Pass the desired team id as teamId',
        ],
      },
      { status: 400 }
    )
  }

  // Verify Linear API key is valid
  const verifyRes = await linearGraphQL(linearApiKey, '{ viewer { id name } }')
  if (verifyRes.error) {
    return NextResponse.json(
      {
        error: 'Invalid Linear API key or Linear API unreachable',
        detail: verifyRes.error,
      },
      { status: 401 }
    )
  }

  // Fetch available labels and states for the team
  const teamMetaRes = await linearGraphQL(
    linearApiKey,
    `{
      team(id: "${teamId}") {
        id
        name
        labels { nodes { id name } }
        states { nodes { id name type } }
      }
    }`
  )

  if (teamMetaRes.error || !teamMetaRes.data?.team) {
    return NextResponse.json(
      {
        error: 'Failed to fetch Linear team metadata. Check that teamId is correct.',
        detail: teamMetaRes.error || 'Team not found',
      },
      { status: 400 }
    )
  }

  const teamMeta = teamMetaRes.data.team
  const labelMap = new Map<string, string>()
  for (const label of teamMeta.labels?.nodes || []) {
    labelMap.set(label.name.toLowerCase(), label.id)
  }
  const stateMap = new Map<string, string>()
  for (const state of teamMeta.states?.nodes || []) {
    // Map by state type (backlog, unstarted, started, completed, cancelled)
    stateMap.set(state.type, state.id)
    stateMap.set(state.name.toLowerCase(), state.id)
  }

  // Fetch PKEEP data
  const supabase = await createClient()

  const [{ data: decisions }, { data: tasks }] = await Promise.all([
    decisionIds && decisionIds.length > 0
      ? supabase.from('decisions').select('*').eq('project_id', projectId).in('id', decisionIds)
      : supabase.from('decisions').select('*').eq('project_id', projectId),
    taskIds && taskIds.length > 0
      ? supabase.from('tasks').select('*').eq('project_id', projectId).in('id', taskIds)
      : supabase.from('tasks').select('*').eq('project_id', projectId),
  ])

  const decisionsList = decisions || []
  const tasksList = tasks || []

  if (decisionsList.length === 0 && tasksList.length === 0) {
    return NextResponse.json(
      { error: 'No decisions or tasks found for the given project and filters' },
      { status: 404 }
    )
  }

  // Push each item to Linear
  const results: LinearCreateIssueResult[] = []

  // Create decision issues
  for (const d of decisionsList) {
    const description = [
      `## 결정`,
      d.title,
      '',
      d.content ? `## 내용\n${d.content}` : '',
      d.reason ? `## 근거\n${d.reason}` : '',
      `## 상태\n${d.status === 'confirmed' ? '확정' : d.status === 'changed' ? '변경됨' : '검토중'}`,
      d.area ? `## 영역\n${d.area}` : '',
      '',
      '---',
      '_Auto-created by PKEEP_',
    ].filter(Boolean).join('\n\n')

    const stateId = resolveLinearState(d.status, stateMap)
    const priority = d.status === 'confirmed' ? 2 : d.status === 'pending' ? 3 : 4
    const labelIds = resolveLinearLabels(['decision', d.area].filter(Boolean) as string[], labelMap)

    const mutation = `
      mutation {
        issueCreate(input: {
          teamId: "${teamId}"
          title: "${escapeGraphQL(`${d.code}: ${d.title}`)}"
          description: "${escapeGraphQL(description)}"
          priority: ${priority}
          ${stateId ? `stateId: "${stateId}"` : ''}
          ${labelIds.length > 0 ? `labelIds: [${labelIds.map(id => `"${id}"`).join(', ')}]` : ''}
        }) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `

    const res = await linearGraphQL(linearApiKey, mutation)

    if (res.error || !res.data?.issueCreate?.success) {
      results.push({
        sourceId: d.id,
        sourceType: 'decision',
        linearIssueId: null,
        linearIssueUrl: null,
        error: res.error || 'Issue creation failed',
      })
    } else {
      results.push({
        sourceId: d.id,
        sourceType: 'decision',
        linearIssueId: res.data.issueCreate.issue.identifier,
        linearIssueUrl: res.data.issueCreate.issue.url,
        error: null,
      })
    }
  }

  // Create task issues
  for (const t of tasksList) {
    const description = [
      t.decision_id ? `관련 결정: ${t.decision_id}` : '',
      t.meeting_id ? `관련 회의: ${t.meeting_id}` : '',
      t.assignee_name ? `담당: ${t.assignee_name}` : '',
      '',
      '---',
      '_Auto-created by PKEEP_',
    ].filter(Boolean).join('\n')

    const stateId = resolveLinearState(t.status, stateMap)

    const mutation = `
      mutation {
        issueCreate(input: {
          teamId: "${teamId}"
          title: "${escapeGraphQL(`TASK: ${t.title}`)}"
          description: "${escapeGraphQL(description)}"
          priority: 3
          ${stateId ? `stateId: "${stateId}"` : ''}
        }) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `

    const res = await linearGraphQL(linearApiKey, mutation)

    if (res.error || !res.data?.issueCreate?.success) {
      results.push({
        sourceId: t.id,
        sourceType: 'task',
        linearIssueId: null,
        linearIssueUrl: null,
        error: res.error || 'Issue creation failed',
      })
    } else {
      results.push({
        sourceId: t.id,
        sourceType: 'task',
        linearIssueId: res.data.issueCreate.issue.identifier,
        linearIssueUrl: res.data.issueCreate.issue.url,
        error: null,
      })
    }
  }

  const succeeded = results.filter(r => r.error === null)
  const failed = results.filter(r => r.error !== null)

  return NextResponse.json({
    summary: {
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
    },
    results,
  }, {
    status: failed.length > 0 && succeeded.length > 0 ? 207 : failed.length === results.length ? 502 : 200,
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLinearState(pkeepStatus: string, stateMap: Map<string, string>): string | null {
  // Map PKEEP status to Linear workflow state type
  switch (pkeepStatus) {
    case 'confirmed':
    case 'done':
      return stateMap.get('completed') || stateMap.get('done') || null
    case 'changed':
      return stateMap.get('cancelled') || stateMap.get('completed') || null
    case 'pending':
      return stateMap.get('unstarted') || stateMap.get('backlog') || null
    case 'in_progress':
      return stateMap.get('started') || stateMap.get('in progress') || null
    default:
      return stateMap.get('backlog') || null
  }
}

function resolveLinearLabels(names: string[], labelMap: Map<string, string>): string[] {
  const ids: string[] = []
  for (const name of names) {
    const id = labelMap.get(name.toLowerCase())
    if (id) ids.push(id)
  }
  return ids
}

function escapeGraphQL(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')
}

async function linearGraphQL(
  apiKey: string,
  query: string
): Promise<{ data: any; error: string | null }> {
  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        data: null,
        error: `Linear API returned ${response.status}: ${text}`,
      }
    }

    const json = await response.json()

    if (json.errors && json.errors.length > 0) {
      return {
        data: json.data || null,
        error: json.errors.map((e: any) => e.message).join('; '),
      }
    }

    return { data: json.data, error: null }
  } catch (err: any) {
    return {
      data: null,
      error: `Linear API request failed: ${err.message || String(err)}`,
    }
  }
}
