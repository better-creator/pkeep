'use client'

import { useState } from 'react'
import { Calendar, FileText, MessageSquare, Tag, User, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RejectedAlternativeFormData } from './types'

interface Meeting {
  id: string
  code: string
  title: string
}

interface Decision {
  id: string
  code: string
  title: string
}

interface RejectedAlternativeFormProps {
  meetings: Meeting[]
  decisions: Decision[]
  onSubmit: (data: RejectedAlternativeFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function RejectedAlternativeForm({
  meetings,
  decisions,
  onSubmit,
  onCancel,
  isLoading = false,
}: RejectedAlternativeFormProps) {
  const [formData, setFormData] = useState<RejectedAlternativeFormData>({
    title: '',
    description: '',
    rejectionReason: '',
    proposedBy: '',
    rejectedAt: new Date().toISOString().split('T')[0],
    decisionId: '',
    meetingId: '',
    keywords: [],
  })
  const [keywordInput, setKeywordInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.rejectionReason) return
    onSubmit(formData)
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()],
      }))
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || [],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          기각된 안건 제목 *
        </Label>
        <Input
          id="title"
          placeholder="예: Remix 프레임워크 사용"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">상세 내용</Label>
        <Textarea
          id="description"
          placeholder="기각된 안건에 대한 상세 설명..."
          value={formData.description || ''}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      {/* 기각 사유 */}
      <div className="space-y-2">
        <Label htmlFor="rejectionReason" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-red-500" />
          기각 사유 *
        </Label>
        <Textarea
          id="rejectionReason"
          placeholder="왜 이 안건이 기각되었는지 자세히 기록해주세요..."
          value={formData.rejectionReason}
          onChange={e => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
          rows={3}
          required
          className="border-red-500/30 focus:border-red-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 제안자 */}
        <div className="space-y-2">
          <Label htmlFor="proposedBy" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            제안자
          </Label>
          <Input
            id="proposedBy"
            placeholder="누가 제안했는지"
            value={formData.proposedBy || ''}
            onChange={e => setFormData(prev => ({ ...prev, proposedBy: e.target.value }))}
          />
        </div>

        {/* 기각일 */}
        <div className="space-y-2">
          <Label htmlFor="rejectedAt" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            기각일
          </Label>
          <Input
            id="rejectedAt"
            type="date"
            value={formData.rejectedAt || ''}
            onChange={e => setFormData(prev => ({ ...prev, rejectedAt: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 관련 미팅 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            관련 미팅
          </Label>
          <Select
            value={formData.meetingId || ''}
            onValueChange={value => setFormData(prev => ({ ...prev, meetingId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="미팅 선택..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">선택 안함</SelectItem>
              {meetings.map(meeting => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.code}: {meeting.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 관련 결정 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            관련 결정
          </Label>
          <Select
            value={formData.decisionId || ''}
            onValueChange={value => setFormData(prev => ({ ...prev, decisionId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="결정 선택..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">선택 안함</SelectItem>
              {decisions.map(decision => (
                <SelectItem key={decision.id} value={decision.id}>
                  {decision.code}: {decision.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 키워드 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          키워드 (유사도 검색용)
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="키워드 입력 후 Enter"
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddKeyword()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddKeyword}>
            추가
          </Button>
        </div>
        {formData.keywords && formData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.keywords.map(keyword => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-sm"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.title || !formData.rejectionReason}
          className="bg-red-500 hover:bg-red-600"
        >
          {isLoading ? '저장 중...' : '기각 대안 등록'}
        </Button>
      </div>
    </form>
  )
}
