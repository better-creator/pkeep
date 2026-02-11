// 맥락 카드 타입 정의

export type ItemCategory = 'decision' | 'meeting' | 'screen' | 'implementation'

export type ItemStatus = 'confirmed' | 'changed' | 'cancelled' | 'pending' | 'in_progress' | 'completed'

export interface Person {
  id: string
  name: string
  role?: string
  avatar?: string
}

export interface SourceMeeting {
  id: string
  code: string
  title: string
  date: string
  participants: Person[]
  relatedQuote?: string
  quotedBy?: string
}

export interface ConnectionItem {
  id: string
  code: string
  category: ItemCategory
  title: string
  description?: string
  status?: ItemStatus
  source?: 'figma' | 'github' | 'internal'
  url?: string
}

export interface ConflictItem {
  id: string
  code: string
  title: string
  date: string
  similarity: number
  type: 'similar' | 'conflict'
}

export interface HistoryEntry {
  id: string
  date: string
  action: string
  actor?: string
  details?: string
}

export interface ContextCardData {
  item: {
    id: string
    code: string
    category: ItemCategory
    title: string
    description?: string
    status: ItemStatus
    owner?: Person
    createdAt: string
    updatedAt?: string
  }
  context?: {
    sourceMeeting?: SourceMeeting
    reason?: string
  }
  connections: {
    precedents: ConnectionItem[]      // 선행 결정 (이것 때문에)
    implementations: ConnectionItem[] // 구현물 (이걸로 만들어짐)
    affected: ConnectionItem[]        // 영향받은 결정 (이것 때문에 바뀐 것)
    screens: ConnectionItem[]         // 연관 화면
  }
  conflicts: ConflictItem[]
  history: HistoryEntry[]
}

// 미팅 전용 맥락 데이터
export interface MeetingContextData {
  item: {
    id: string
    code: string
    category: 'meeting'
    title: string
    date: string
    startTime?: string
    endTime?: string
    status: ItemStatus
  }
  participants: Person[]
  decisions: ConnectionItem[]
  discussions: {
    topic: string
    summary?: string
  }[]
  meetingNotes?: string
}

// 화면 전용 맥락 데이터
export interface ScreenContextData {
  item: {
    id: string
    code: string
    category: 'screen'
    title: string
    status: ItemStatus
    source?: 'figma'
    url?: string
    thumbnail?: string
  }
  affectingDecisions: ConnectionItem[]
  implementations: ConnectionItem[]
}

// 구현 전용 맥락 데이터
export interface ImplementationContextData {
  item: {
    id: string
    code: string
    category: 'implementation'
    title: string
    status: ItemStatus
    source: 'github'
    url?: string
    author?: Person
  }
  relatedDecisions: ConnectionItem[]
  relatedScreens: ConnectionItem[]
  prInfo?: {
    additions: number
    deletions: number
    commits: number
  }
}

// 브레드크럼 아이템
export interface BreadcrumbItem {
  id: string
  code: string
  title: string
  category: ItemCategory
}
