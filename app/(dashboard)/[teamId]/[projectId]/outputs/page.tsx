'use client'

import { useState } from 'react'
import {
  FileText,
  Palette,
  Code,
  FileSpreadsheet,
  ExternalLink,
  Filter,
  Plus,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// 결과물 타입
type OutputType = 'plan' | 'design' | 'code' | 'doc'

interface Output {
  id: string
  code: string
  title: string
  type: OutputType
  description?: string
  url?: string
  decisions: string[]
  createdAt: string
  updatedAt: string
  owner: string
}

const outputTypeConfig: Record<OutputType, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}> = {
  plan: {
    label: '기획서',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  design: {
    label: '디자인',
    icon: Palette,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  code: {
    label: 'PR·코드',
    icon: Code,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  doc: {
    label: '문서',
    icon: FileSpreadsheet,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
}

// Mock 데이터
const mockOutputs: Output[] = [
  {
    id: 'out-001',
    code: 'PLN-001',
    title: '상품 상세 기획서',
    type: 'plan',
    description: '상품 상세 페이지 기획 및 사양 정의',
    url: 'https://notion.so/...',
    decisions: ['DEC-001', 'DEC-003'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
    owner: '김철수',
  },
  {
    id: 'out-002',
    code: 'DSN-001',
    title: '상품 상세 디자인',
    type: 'design',
    description: 'Figma 디자인 시안',
    url: 'https://figma.com/...',
    decisions: ['DEC-001'],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-19',
    owner: '이영희',
  },
  {
    id: 'out-003',
    code: 'PR-031',
    title: '상품 상세 페이지 구현',
    type: 'code',
    description: 'feat: 상품 상세 페이지 구현',
    url: 'https://github.com/...',
    decisions: ['DEC-001', 'DEC-002'],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
    owner: '박지민',
  },
  {
    id: 'out-004',
    code: 'DOC-001',
    title: 'API 설계 문서',
    type: 'doc',
    description: 'RESTful API 엔드포인트 설계',
    url: 'https://notion.so/...',
    decisions: ['DEC-002'],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-17',
    owner: '최수연',
  },
  {
    id: 'out-005',
    code: 'PLN-002',
    title: '주문 프로세스 기획서',
    type: 'plan',
    description: '주문 결제 흐름 정의',
    url: 'https://notion.so/...',
    decisions: ['DEC-004'],
    createdAt: '2024-01-17',
    updatedAt: '2024-01-20',
    owner: '김철수',
  },
  {
    id: 'out-006',
    code: 'DSN-002',
    title: '로그인 화면 디자인',
    type: 'design',
    description: '소셜 로그인 UI 디자인',
    url: 'https://figma.com/...',
    decisions: ['DEC-003'],
    createdAt: '2024-01-14',
    updatedAt: '2024-01-15',
    owner: '이영희',
  },
  {
    id: 'out-007',
    code: 'PR-028',
    title: '사이드바 레이아웃 구현',
    type: 'code',
    description: 'feat: 사이드바 레이아웃 구현',
    url: 'https://github.com/...',
    decisions: ['DEC-001'],
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
    owner: '박지민',
  },
  {
    id: 'out-008',
    code: 'DOC-002',
    title: '데이터 모델 문서',
    type: 'doc',
    description: 'DB 스키마 및 엔티티 정의',
    url: 'https://notion.so/...',
    decisions: ['DEC-002', 'DEC-005'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
    owner: '최수연',
  },
]

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | OutputType

export default function OutputsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOutputs = mockOutputs.filter((output) => {
    if (filterType !== 'all' && output.type !== filterType) return false
    if (searchQuery && !output.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = {
    plan: mockOutputs.filter((o) => o.type === 'plan').length,
    design: mockOutputs.filter((o) => o.type === 'design').length,
    code: mockOutputs.filter((o) => o.type === 'code').length,
    doc: mockOutputs.filter((o) => o.type === 'doc').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">결과물</h1>
            <p className="text-muted-foreground mt-1">
              프로젝트에서 생산된 기획서, 디자인, 코드, 문서
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            새 결과물
          </Button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <div className="flex gap-1">
              <Button
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                className={filterType === 'all' ? 'bg-slate-800' : ''}
                onClick={() => setFilterType('all')}
              >
                전체 ({mockOutputs.length})
              </Button>
              {(Object.keys(outputTypeConfig) as OutputType[]).map((type) => {
                const config = outputTypeConfig[type]
                const Icon = config.icon
                return (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'ghost'}
                    size="sm"
                    className={filterType === type ? 'bg-slate-800' : ''}
                    onClick={() => setFilterType(type)}
                  >
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {config.label} ({stats[type]})
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="검색..."
                className="pl-9 w-48 h-9 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none ${viewMode === 'list' ? 'bg-slate-100' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filteredOutputs.map((output) => {
              const config = outputTypeConfig[output.type]
              const Icon = config.icon
              return (
                <div
                  key={output.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    {output.url && (
                      <a
                        href={output.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </a>
                    )}
                  </div>

                  <Badge variant="outline" className="text-xs font-mono mb-2">
                    {output.code}
                  </Badge>
                  <h3 className="font-medium text-slate-900 mb-1 line-clamp-1">{output.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{output.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{output.owner}</span>
                    <span>{output.decisions.length}개 결정 연결</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">코드</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">타입</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">담당자</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">연결된 결정</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">수정일</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOutputs.map((output) => {
                  const config = outputTypeConfig[output.type]
                  const Icon = config.icon
                  return (
                    <tr key={output.id} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs font-mono">
                          {output.code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{output.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${config.bgColor}`}>
                            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                          </div>
                          <span className="text-sm text-slate-600">{config.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{output.owner}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{output.decisions.length}개</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{output.updatedAt}</td>
                      <td className="px-4 py-3">
                        {output.url && (
                          <a
                            href={output.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100"
                          >
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
