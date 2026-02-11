// 기각된 대안 관련 타입 정의

export interface RejectedAlternative {
  id: string
  projectId: string
  decisionId?: string        // 어떤 결정에서 기각됐는지
  meetingId?: string         // 어떤 미팅에서 논의됐는지
  title: string              // 기각된 안건 제목
  description?: string       // 상세 내용
  rejectionReason: string    // 기각 사유
  proposedBy?: string        // 누가 제안했는지
  rejectedAt: string         // 기각 날짜
  keywords?: string[]        // 유사도 검색용 키워드
  createdAt: string

  // 연결된 정보 (조인)
  decision?: {
    id: string
    code: string
    title: string
  }
  meeting?: {
    id: string
    code: string
    title: string
  }
}

export interface RejectedAlternativeFormData {
  title: string
  description?: string
  rejectionReason: string
  proposedBy?: string
  rejectedAt?: string
  decisionId?: string
  meetingId?: string
  keywords?: string[]
}

export interface ConflictCheckResult {
  hasConflict: boolean
  similarity: number         // 0-100
  rejectedAlternative?: RejectedAlternative
}

export type ConflictWarningAction = 'ignore' | 'review' | 'cancel'
