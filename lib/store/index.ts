import type {
  StoredMeeting,
  StoredDecision,
  StoredTask,
  TeamMember,
  StoredRejected,
  StoredProject,
} from './types'

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const KEYS = {
  projects: 'pkeep-projects',
  meetings: 'pkeep-meetings',
  decisions: 'pkeep-decisions',
  tasks: 'pkeep-tasks',
  team: 'pkeep-team',
  rejected: 'pkeep-rejected',
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable – silent fail
  }
}

function parseCode(prefix: string, code: string): number {
  const match = code.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? parseInt(match[1], 10) : 0
}

function padCode(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function loadProjects(): StoredProject[] {
  return read<StoredProject>(KEYS.projects)
}

export function saveProject(project: StoredProject): void {
  const projects = loadProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }
  write(KEYS.projects, projects)
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id)
  write(KEYS.projects, projects)
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export function loadMeetings(): StoredMeeting[] {
  return read<StoredMeeting>(KEYS.meetings)
}

export function saveMeeting(meeting: StoredMeeting): void {
  const meetings = loadMeetings()
  const idx = meetings.findIndex((m) => m.id === meeting.id)
  if (idx >= 0) {
    meetings[idx] = meeting
  } else {
    meetings.push(meeting)
  }
  write(KEYS.meetings, meetings)
}

export function deleteMeeting(id: string): void {
  const meetings = loadMeetings().filter((m) => m.id !== id)
  write(KEYS.meetings, meetings)

  // Cascade delete related entities
  const decisions = loadDecisions().filter((d) => d.meetingId !== id)
  write(KEYS.decisions, decisions)

  const tasks = loadTasks().filter((t) => t.meetingId !== id)
  write(KEYS.tasks, tasks)

  const rejected = loadRejected().filter((r) => r.meetingId !== id)
  write(KEYS.rejected, rejected)
}

export function searchMeetings(query: string): StoredMeeting[] {
  const q = query.toLowerCase()
  return loadMeetings().filter((m) => {
    if (m.title.toLowerCase().includes(q)) return true
    if (m.summary.toLowerCase().includes(q)) return true
    if (m.keywords.some((k) => k.toLowerCase().includes(q))) return true
    return false
  })
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export function loadDecisions(): StoredDecision[] {
  return read<StoredDecision>(KEYS.decisions)
}

export function saveDecision(decision: StoredDecision): void {
  const decisions = loadDecisions()
  const idx = decisions.findIndex((d) => d.id === decision.id)
  if (idx >= 0) {
    decisions[idx] = decision
  } else {
    decisions.push(decision)
  }
  write(KEYS.decisions, decisions)
}

export function updateDecision(
  id: string,
  partial: Partial<StoredDecision>,
): void {
  const decisions = loadDecisions()
  const idx = decisions.findIndex((d) => d.id === id)
  if (idx >= 0) {
    decisions[idx] = { ...decisions[idx], ...partial }
    write(KEYS.decisions, decisions)
  }
}

export function deleteDecision(id: string): void {
  const decisions = loadDecisions().filter((d) => d.id !== id)
  write(KEYS.decisions, decisions)
}

export function getDecisionsByMeeting(meetingId: string): StoredDecision[] {
  return loadDecisions().filter((d) => d.meetingId === meetingId)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function loadTasks(): StoredTask[] {
  return read<StoredTask>(KEYS.tasks)
}

export function saveTask(task: StoredTask): void {
  const tasks = loadTasks()
  const idx = tasks.findIndex((t) => t.id === task.id)
  if (idx >= 0) {
    tasks[idx] = task
  } else {
    tasks.push(task)
  }
  write(KEYS.tasks, tasks)
}

export function updateTask(id: string, partial: Partial<StoredTask>): void {
  const tasks = loadTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...partial }
    write(KEYS.tasks, tasks)
  }
}

export function deleteTask(id: string): void {
  const tasks = loadTasks().filter((t) => t.id !== id)
  write(KEYS.tasks, tasks)
}

export function getTasksByMeeting(meetingId: string): StoredTask[] {
  return loadTasks().filter((t) => t.meetingId === meetingId)
}

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

export function loadTeamMembers(): TeamMember[] {
  return read<TeamMember>(KEYS.team)
}

export function saveTeamMember(member: TeamMember): void {
  const members = loadTeamMembers()
  const idx = members.findIndex((m) => m.id === member.id)
  if (idx >= 0) {
    members[idx] = member
  } else {
    members.push(member)
  }
  write(KEYS.team, members)
}

export function deleteTeamMember(id: string): void {
  const members = loadTeamMembers().filter((m) => m.id !== id)
  write(KEYS.team, members)
}

// ---------------------------------------------------------------------------
// Rejected
// ---------------------------------------------------------------------------

export function loadRejected(): StoredRejected[] {
  return read<StoredRejected>(KEYS.rejected)
}

export function saveRejected(rejected: StoredRejected): void {
  const all = loadRejected()
  const idx = all.findIndex((r) => r.id === rejected.id)
  if (idx >= 0) {
    all[idx] = rejected
  } else {
    all.push(rejected)
  }
  write(KEYS.rejected, all)
}

export function deleteRejected(id: string): void {
  const all = loadRejected().filter((r) => r.id !== id)
  write(KEYS.rejected, all)
}

export function getRejectedByMeeting(meetingId: string): StoredRejected[] {
  return loadRejected().filter((r) => r.meetingId === meetingId)
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

export function nextMeetingCode(): string {
  const meetings = loadMeetings()
  const max = meetings.reduce(
    (acc, m) => Math.max(acc, parseCode('MTG', m.code)),
    0,
  )
  return padCode('MTG', max + 1)
}

export function nextDecisionCode(): string {
  const decisions = loadDecisions()
  const max = decisions.reduce(
    (acc, d) => Math.max(acc, parseCode('DEC', d.code)),
    0,
  )
  return padCode('DEC', max + 1)
}

// Re-export types for convenience
export type {
  StoredProject,
  StoredMeeting,
  StoredDecision,
  StoredTask,
  TeamMember,
  StoredRejected,
  TranscriptSegment,
  SourceType,
} from './types'
