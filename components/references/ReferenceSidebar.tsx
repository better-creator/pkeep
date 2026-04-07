'use client'

import { useState } from 'react'
import {
  Search,
  Image,
  FileText,
  Link2,
  Palette,
  X,
  ChevronRight,
  ExternalLink,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const unsplash = (id: string, w = 200, h = 200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`

interface Reference {
  id: string
  title: string
  type: 'image' | 'document' | 'url' | 'color'
  category: string
  tags: string[]
  source: string
  thumbnail?: string
  color?: string
}

const allReferences: Reference[] = [
  { id: 'ref-1', title: '무드보드 A — 자연스러운 데일리', type: 'image', category: '무드보드', tags: ['톤앤매너', '라이프스타일'], source: 'M-001', thumbnail: unsplash('1596462502278-27bfdc403348') },
  { id: 'ref-2', title: '무드보드 B — 깔끔한 프로덕트', type: 'image', category: '무드보드', tags: ['미니멀', '프로덕트'], source: 'M-001', thumbnail: unsplash('1522335789203-aabd1fc54bc9') },
  { id: 'ref-3', title: '제품 촬영 레퍼런스 — 화이트 배경', type: 'image', category: '촬영', tags: ['제품', '화이트배경'], source: 'M-002', thumbnail: unsplash('1611930022073-b7a4ba5fcccd') },
  { id: 'ref-4', title: '모델 촬영 레퍼런스 — 내추럴', type: 'image', category: '촬영', tags: ['모델', '내추럴'], source: 'M-002', thumbnail: unsplash('1616394584738-fc6e612e71b9') },
  { id: 'ref-5', title: '인스타 피드 벤치마킹', type: 'image', category: '채널', tags: ['인스타', '레이아웃'], source: 'M-003', thumbnail: unsplash('1596462502278-27bfdc403348') },
  { id: 'ref-6', title: '코랄 오렌지', type: 'color', category: '컬러', tags: ['메인컬러'], source: 'DEC-001', color: '#E8734A' },
  { id: 'ref-7', title: 'Warm White', type: 'color', category: '컬러', tags: ['서브컬러'], source: 'DEC-001', color: '#FFF8F0' },
  { id: 'ref-8', title: '글로우업 브랜드 가이드 v3', type: 'document', category: '문서', tags: ['브랜드가이드'], source: '온보딩' },
  { id: 'ref-9', title: 'S/S 캠페인 RFP', type: 'document', category: '문서', tags: ['RFP'], source: '온보딩' },
  { id: 'ref-10', title: '옥외광고 벤치마킹', type: 'url', category: '벤치마킹', tags: ['옥외', '경쟁사'], source: 'M-003' },
]

const typeIcon: Record<string, React.ElementType> = {
  image: Image, document: FileText, url: Link2, color: Palette,
}

interface ReferenceSidebarProps {
  open: boolean
  onClose: () => void
  /** Pre-filter by tags, source codes, or categories */
  filterTags?: string[]
  filterSource?: string
  title?: string
}

export function ReferenceSidebar({ open, onClose, filterTags, filterSource, title }: ReferenceSidebarProps) {
  const [search, setSearch] = useState('')

  if (!open) return null

  const filtered = allReferences.filter(ref => {
    // Pre-filter
    if (filterSource && ref.source !== filterSource) {
      // Also check if source partially matches
      if (!ref.source.toLowerCase().includes(filterSource.toLowerCase())) return false
    }
    if (filterTags && filterTags.length > 0) {
      const hasMatch = filterTags.some(ft =>
        ref.tags.some(t => t.toLowerCase().includes(ft.toLowerCase())) ||
        ref.category.toLowerCase().includes(ft.toLowerCase()) ||
        ref.title.toLowerCase().includes(ft.toLowerCase())
      )
      if (!hasMatch) return false
    }
    // Search
    if (search) {
      const q = search.toLowerCase()
      return ref.title.toLowerCase().includes(q) ||
        ref.tags.some(t => t.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{title || '관련 레퍼런스'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>
        {(filterTags || filterSource) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filterSource && <Badge variant="outline" className="text-xs">{filterSource}</Badge>}
            {filterTags?.map(t => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">관련 레퍼런스가 없습니다.</p>
          </div>
        ) : (
          filtered.map(ref => {
            const Icon = typeIcon[ref.type] || Image
            return (
              <div key={ref.id} className="rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-all cursor-pointer">
                {ref.type === 'image' && ref.thumbnail ? (
                  <div className="h-32 bg-muted/30 overflow-hidden">
                    <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : ref.type === 'color' && ref.color ? (
                  <div className="h-16 flex items-center justify-center" style={{ backgroundColor: ref.color }}>
                    <span className="text-white font-mono text-sm font-bold drop-shadow">{ref.color}</span>
                  </div>
                ) : (
                  <div className="h-16 bg-secondary/30 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-sm font-medium line-clamp-1">{ref.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-xs py-0">{ref.category}</Badge>
                    <span className="text-xs text-muted-foreground">{ref.source}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 shrink-0">
        <p className="text-xs text-muted-foreground text-center">{filtered.length}개 레퍼런스</p>
      </div>
    </div>
  )
}
