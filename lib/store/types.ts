export type SourceType = 'meeting' | 'text' | 'slack' | 'notion' | 'document' | 'call' | 'email' | 'manual'

export interface TeamMember {
  id: string
  name: string
  role?: 'planning' | 'design' | 'dev'
}

export interface StoredDecision {
  id: string
  meetingId: string
  code: string
  title: string
  rationale: string
  area?: 'planning' | 'design' | 'dev'
  status: 'pending' | 'confirmed' | 'changed' | 'rejected' | 'hold' | 'disabled'
  proposedBy?: string
  createdAt: string
}

export interface StoredTask {
  id: string
  meetingId: string
  decisionId?: string
  title: string
  assignee?: string
  done: boolean
  createdAt: string
}

export interface StoredRejected {
  id: string
  meetingId: string
  title: string
  reason: string
  relatedDecision?: string
  proposedBy?: string
}

export interface TranscriptSegment {
  speaker?: string
  text: string
  start: number
  end: number
}

export interface StoredMeeting {
  id: string
  code: string
  title: string
  date: string
  duration_seconds: number
  source: 'recording' | 'upload' | 'text'
  sourceType?: SourceType
  sourceUrl?: string
  language?: string
  transcriptText: string
  transcriptSegments: TranscriptSegment[]
  summary: string
  keywords: string[]
  issues: { title: string; description?: string }[]
}
