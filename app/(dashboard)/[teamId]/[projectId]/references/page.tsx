'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Image,
  FileText,
  Link2,
  Palette,
  Camera,
  Type,
  MonitorSmartphone,
  Download,
  Eye,
  Calendar,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const unsplash = (id: string, w = 300, h = 300) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`

type RefType = 'image' | 'document' | 'url' | 'color'

interface Reference {
  id: string
  title: string
  type: RefType
  category: string
  tags: string[]
  source: string
  date: string
  thumbnail?: string
  color?: string
  url?: string
}

const references: Reference[] = [
  { id: 'ref-1', title: '무드보드 A — 자연스러운 데일리', type: 'image', category: '무드보드', tags: ['톤앤매너', '라이프스타일'], source: 'M-001 킥오프', date: '03.01', thumbnail: unsplash('1596462502278-27bfdc403348') },
  { id: 'ref-2', title: '무드보드 B — 깔끔한 프로덕트', type: 'image', category: '무드보드', tags: ['미니멀', '프로덕트'], source: 'M-001 킥오프', date: '03.01', thumbnail: unsplash('1522335789203-aabd1fc54bc9') },
  { id: 'ref-3', title: '무드보드 C — 감성 라이프스타일', type: 'image', category: '무드보드', tags: ['감성', '라이프스타일'], source: 'M-001 킥오프', date: '03.01', thumbnail: unsplash('1571781926291-c477ebfd024b') },
  { id: 'ref-4', title: '제품 촬영 레퍼런스 — 화이트 배경', type: 'image', category: '촬영', tags: ['제품', '화이트배경', '라이팅'], source: 'M-002 디자인 리뷰', date: '03.10', thumbnail: unsplash('1611930022073-b7a4ba5fcccd') },
  { id: 'ref-5', title: '모델 촬영 레퍼런스 — 내추럴 메이크업', type: 'image', category: '촬영', tags: ['모델', '내추럴', '뷰티'], source: 'M-002 디자인 리뷰', date: '03.10', thumbnail: unsplash('1616394584738-fc6e612e71b9') },
  { id: 'ref-6', title: '인스타 피드 레이아웃 벤치마킹', type: 'image', category: '채널', tags: ['인스타그램', '레이아웃', '피드'], source: 'M-003 채널 전략', date: '03.18', thumbnail: unsplash('1596462502278-27bfdc403348', 300, 300) },
  { id: 'ref-7', title: '메인 컬러 — 코랄 오렌지', type: 'color', category: '컬러', tags: ['메인컬러', 'primary'], source: 'DEC-001', date: '03.10', color: '#E8734A' },
  { id: 'ref-8', title: '서브 컬러 — Warm White', type: 'color', category: '컬러', tags: ['서브컬러', '배경'], source: 'DEC-001', date: '03.10', color: '#FFF8F0' },
  { id: 'ref-9', title: '글로우업 브랜드 가이드 v3', type: 'document', category: '문서', tags: ['브랜드가이드', '공식'], source: '온보딩', date: '03.01' },
  { id: 'ref-10', title: 'S/S 캠페인 RFP', type: 'document', category: '문서', tags: ['RFP', '요구사항'], source: '온보딩', date: '03.01' },
  { id: 'ref-11', title: '옥외광고 벤치마킹 — 아모레퍼시픽', type: 'url', category: '벤치마킹', tags: ['옥외', '경쟁사'], source: 'M-003 채널 전략', date: '03.18', url: 'https://example.com' },
  { id: 'ref-12', title: '유튜브 썸네일 트렌드 2026', type: 'url', category: '벤치마킹', tags: ['유튜브', '썸네일', '트렌드'], source: 'M-003 채널 전략', date: '03.18', url: 'https://example.com' },
]

const CATEGORIES = ['전체', '무드보드', '촬영', '채널', '컬러', '문서', '벤치마킹']

const typeIcon: Record<RefType, React.ElementType> = {
  image: Image, document: FileText, url: Link2, color: Palette,
}

export default function ReferencesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = references.filter(ref => {
    if (category !== '전체' && ref.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return ref.title.toLowerCase().includes(q) ||
        ref.tags.some(t => t.toLowerCase().includes(q)) ||
        ref.source.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">레퍼런스 라이브러리</h1>
        <p className="text-muted-foreground text-sm mt-1">{references.length}개 자료 · 회의와 결정에서 자동 수집</p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="레퍼런스 검색 (이름, 태그, 출처)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-11"
          />
        </div>
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-colors ${
              category === cat ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
            }`}>
            {cat}
            {cat !== '전체' && (
              <span className="ml-1.5 opacity-60">
                {references.filter(r => r.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(ref => {
            const Icon = typeIcon[ref.type]
            return (
              <div key={ref.id} className="card-soft overflow-hidden group cursor-pointer">
                {/* Thumbnail */}
                {ref.type === 'image' && ref.thumbnail ? (
                  <div className="aspect-square bg-muted/30 overflow-hidden">
                    <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                ) : ref.type === 'color' && ref.color ? (
                  <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: ref.color }}>
                    <span className="text-white font-mono text-lg font-bold drop-shadow">{ref.color}</span>
                  </div>
                ) : (
                  <div className="aspect-square bg-secondary/30 flex items-center justify-center">
                    <Icon className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-2">{ref.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{ref.category}</Badge>
                    <span className="text-xs text-muted-foreground">{ref.source}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filtered.map(ref => {
            const Icon = typeIcon[ref.type]
            return (
              <div key={ref.id} className="card-soft p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                {ref.type === 'image' && ref.thumbnail ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={ref.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : ref.type === 'color' && ref.color ? (
                  <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: ref.color }}>
                    <span className="text-white text-xs font-mono font-bold">{ref.color}</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ref.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{ref.category}</Badge>
                    {ref.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{ref.source}</p>
                  <p className="text-xs text-muted-foreground">{ref.date}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
