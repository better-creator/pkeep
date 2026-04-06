'use client'

import { useState } from 'react'
import {
  Palette,
  Type,
  Image,
  ShieldCheck,
  ShieldX,
  Instagram,
  Youtube,
  MonitorSmartphone,
  Megaphone,
  ChevronRight,
  Sparkles,
  Clock,
  GitBranch,
  Eye,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// --- Mock Brand Data ---
const brandColors = [
  { name: 'Primary', hex: '#7B3FA3', hsl: '275, 50%, 48%', usage: '주요 CTA, 헤더, 강조 요소' },
  { name: 'Accent', hex: '#E8734A', hsl: '24, 78%, 58%', usage: '보조 CTA, 알림, 배지' },
  { name: 'Dark', hex: '#1A1625', hsl: '260, 28%, 12%', usage: '본문 텍스트, 다크 배경' },
  { name: 'Light BG', hex: '#FAF8F5', hsl: '30, 25%, 97%', usage: '배경, 카드 베이스' },
  { name: 'Mint', hex: '#34D399', hsl: '160, 84%, 39%', usage: '성공, 확정 상태' },
  { name: 'Warm Gray', hex: '#A8A3B3', hsl: '260, 10%, 67%', usage: '보조 텍스트, 비활성' },
]

const typography = [
  { name: 'Heading 1', font: 'Satoshi Bold', size: '32px / 2rem', weight: '700', sample: '브랜드 가이드 타이틀' },
  { name: 'Heading 2', font: 'Satoshi SemiBold', size: '24px / 1.5rem', weight: '600', sample: '섹션 헤딩' },
  { name: 'Heading 3', font: 'Pretendard SemiBold', size: '18px / 1.125rem', weight: '600', sample: '서브 헤딩 한글' },
  { name: 'Body', font: 'Pretendard Regular', size: '16px / 1rem', weight: '400', sample: '본문 텍스트입니다. 가독성을 최우선으로 합니다.' },
  { name: 'Caption', font: 'Pretendard Regular', size: '13px / 0.8125rem', weight: '400', sample: '보조 설명, 메타 정보' },
  { name: 'Code', font: 'JetBrains Mono', size: '14px / 0.875rem', weight: '500', sample: 'const brand = "PKEEP"' },
]

const doList = [
  { rule: '보라-코랄 그라데이션은 브랜드 핵심 포인트에만 사용', image: 'https://i.pinimg.com/736x/8d/6e/f5/8d6ef5c5a3e8b2f9a1c5d7e4f6a8b9c0.jpg', from: 'M-001 킥오프 회의' },
  { rule: '한글은 프리텐다드, 영문은 Satoshi 서체 조합', image: null, from: 'M-003 디자인 리뷰' },
  { rule: '제품 이미지는 화이트 배경 + 좌측 45도 라이팅', image: 'https://i.pinimg.com/736x/a1/b2/c3/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.jpg', from: 'M-005 촬영 가이드' },
  { rule: '인스타그램: 정사각형 비율 유지, 여백 최소 8%', image: null, from: 'M-008 채널 전략' },
  { rule: 'CTA 버튼은 Accent(코랄) 색상, 라운드 14px', image: null, from: 'D-012 UI 결정' },
]

const dontList = [
  { rule: '로고 주변 여백 미확보 (최소 로고 높이의 50%)', image: 'https://i.pinimg.com/736x/f1/e2/d3/f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6.jpg', from: 'M-001 킥오프 회의', reason: '가독성 저하, 브랜드 인지도 훼손' },
  { rule: '네온 컬러·형광색 사용 금지', image: null, from: 'M-003 디자인 리뷰', reason: '브랜드 톤 불일치 — 따뜻하고 차분한 톤 유지' },
  { rule: '검정 배경 위 보라색 텍스트 사용 금지', image: null, from: 'D-007 접근성 검토', reason: '명도 대비 부족, WCAG AA 미달' },
  { rule: '제품 사진 과도한 필터/보정 금지', image: 'https://i.pinimg.com/736x/b1/c2/d3/b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6.jpg', from: 'M-005 촬영 가이드', reason: '실물과 괴리 — 소비자 신뢰 저하' },
]

const channels = [
  {
    name: '인스타그램',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    specs: ['정사각형 1:1 비율', 'Reels: 9:16', '캡션 2,200자 이내'],
    toneNote: '캐주얼 + 감성. 이모지 사용 허용. 해시태그 15개 이내.',
    thumbnail: 'https://i.pinimg.com/736x/d4/e5/f6/d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9.jpg',
  },
  {
    name: '유튜브',
    icon: Youtube,
    color: 'bg-red-600',
    specs: ['썸네일 1280x720', '영상 16:9', '설명 5,000자 이내'],
    toneNote: '정보 전달 + 친근함. 자막 필수. "~입니다"체 사용.',
    thumbnail: 'https://i.pinimg.com/736x/e5/f6/a7/e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.jpg',
  },
  {
    name: '옥외광고',
    icon: Megaphone,
    color: 'bg-amber-600',
    specs: ['해상도 300dpi', '시인성 거리 3m 기준', 'CMYK 모드'],
    toneNote: '간결. 핵심 메시지 7단어 이내. 로고 면적 15% 이상.',
    thumbnail: 'https://i.pinimg.com/736x/c3/d4/e5/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.jpg',
  },
  {
    name: '웹/앱',
    icon: MonitorSmartphone,
    color: 'bg-sky-600',
    specs: ['반응형 필수', '최소 터치 영역 44px', '웹 폰트 Pretendard'],
    toneNote: '명확하고 간결. UX 라이팅 가이드 준수. "~해요"체.',
    thumbnail: 'https://i.pinimg.com/736x/a9/b0/c1/a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4.jpg',
  },
]

const recentUpdates = [
  { date: '2026-04-05', change: 'Accent 컬러 채도 5% 상향 조정', from: 'M-012 시즌2 킥오프', type: '비주얼' },
  { date: '2026-04-03', change: '인스타 릴스 자막 위치 규정 추가', from: 'D-023 채널 가이드', type: '채널' },
  { date: '2026-04-01', change: '제품 촬영 라이팅 각도 40도→45도', from: 'M-011 포토 리뷰', type: '촬영' },
  { date: '2026-03-28', change: 'DON\'T 목록에 "검정 배경 보라 텍스트" 추가', from: 'D-007 접근성', type: '접근성' },
]

// Placeholder images for visual references
const visualReferences = [
  { url: 'https://i.pinimg.com/736x/1a/2b/3c/1a2b3cd4e5f6a7b8c9d0e1f2a3b4c5d6.jpg', label: '무드보드 A — 따뜻한 톤' },
  { url: 'https://i.pinimg.com/736x/4d/5e/6f/4d5e6fa7b8c9d0e1f2a3b4c5d6e7f8a9.jpg', label: '무드보드 B — 미니멀' },
  { url: 'https://i.pinimg.com/736x/7g/8h/9i/7g8h9ia0b1c2d3e4f5a6b7c8d9e0f1a2.jpg', label: '키 비주얼 레퍼런스' },
  { url: 'https://i.pinimg.com/736x/0a/1b/2c/0a1b2cd3e4f5a6b7c8d9e0f1a2b3c4d5.jpg', label: '타이포 레퍼런스' },
]

export default function BrandGuidePage() {
  const [activeChannel, setActiveChannel] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1" />
              자동 생성
            </Badge>
            <Badge variant="outline" className="text-xs font-normal border-emerald-300 text-emerald-700 bg-emerald-50">
              <Clock className="h-3 w-3 mr-1" />
              2시간 전 업데이트
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">브랜드 가이드</h1>
          <p className="text-muted-foreground text-sm mt-1">
            12건의 결정에서 자동 생성 · 마지막 업데이트 2026.04.05
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-sm">
            <Eye className="h-4 w-4 mr-1.5" />
            외주사 공유용
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-sm">
            <GitBranch className="h-4 w-4 mr-1.5" />
            채널별 분기
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg text-sm">마스터 가이드</TabsTrigger>
          <TabsTrigger value="channels" className="rounded-lg text-sm">채널별 가이드</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-sm">변경 이력</TabsTrigger>
        </TabsList>

        {/* === MASTER GUIDE === */}
        <TabsContent value="overview" className="space-y-8">

          {/* Color System */}
          <section className="card-soft p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">컬러 시스템</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {brandColors.map((color) => (
                <div key={color.name} className="space-y-2">
                  <div
                    className="h-20 rounded-xl shadow-inner border border-black/5"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="text-sm font-medium">{color.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{color.hex}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="card-soft p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Type className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">타이포그래피</h2>
            </div>
            <div className="space-y-4">
              {typography.map((t) => (
                <div key={t.name} className="flex items-baseline gap-6 py-3 border-b border-border/30 last:border-0">
                  <div className="w-28 shrink-0">
                    <p className="text-xs font-medium text-muted-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground/70">{t.font} · {t.size}</p>
                  </div>
                  <p
                    className="flex-1"
                    style={{
                      fontFamily: t.font.includes('JetBrains') ? "'JetBrains Mono', monospace" :
                        t.font.includes('Satoshi') ? "'Satoshi', sans-serif" : "'Pretendard Variable', sans-serif",
                      fontWeight: parseInt(t.weight),
                      fontSize: t.size.split(' / ')[0],
                    }}
                  >
                    {t.sample}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Visual References */}
          <section className="card-soft p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">비주얼 레퍼런스</h2>
              <Badge variant="outline" className="text-[10px] ml-2">M-001에서 등록</Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {visualReferences.map((ref, i) => (
                <div key={i} className="group relative">
                  <div className="aspect-[4/3] rounded-xl bg-muted/50 border border-border/30 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{ref.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DO / DON'T */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DO */}
            <section className="card-soft p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-700">DO</h2>
                <span className="text-xs text-muted-foreground ml-auto">{doList.length}건</span>
              </div>
              <div className="space-y-3">
                {doList.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                    {item.image ? (
                      <div className="w-16 h-16 rounded-lg bg-emerald-100/50 border border-emerald-200/30 shrink-0 flex items-center justify-center overflow-hidden">
                        <Image className="h-5 w-5 text-emerald-300" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.rule}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.from}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DON'T */}
            <section className="card-soft p-6 border-l-4 border-l-rose-500">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <ShieldX className="h-4 w-4 text-rose-600" />
                </div>
                <h2 className="text-lg font-semibold text-rose-700">DON&apos;T</h2>
                <span className="text-xs text-muted-foreground ml-auto">{dontList.length}건</span>
              </div>
              <div className="space-y-3">
                {dontList.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100/50">
                    {item.image ? (
                      <div className="w-16 h-16 rounded-lg bg-rose-100/50 border border-rose-200/30 shrink-0 flex items-center justify-center overflow-hidden">
                        <Image className="h-5 w-5 text-rose-300" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.rule}</p>
                      <p className="text-xs text-rose-600/70 mt-0.5">{item.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.from}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* === CHANNEL GUIDES === */}
        <TabsContent value="channels" className="space-y-6">
          <div className="card-soft p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-primary">
              <GitBranch className="h-4 w-4 inline mr-1.5" />
              채널별 가이드는 마스터 가이드를 상속받아 자동 생성됩니다. 마스터 가이드가 변경되면 모든 채널에 자동 반영됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {channels.map((ch) => (
              <div
                key={ch.name}
                className={`card-soft p-5 cursor-pointer transition-all ${
                  activeChannel === ch.name ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => setActiveChannel(activeChannel === ch.name ? null : ch.name)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl ${ch.color} flex items-center justify-center text-white`}>
                    <ch.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{ch.name}</h3>
                    <p className="text-xs text-muted-foreground">마스터 가이드 + {ch.specs.length}개 채널 규정</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                    activeChannel === ch.name ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Thumbnail placeholder */}
                <div className="aspect-video rounded-xl bg-muted/30 border border-border/30 mb-4 flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <Image className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/50">{ch.name} 채널 프리뷰</p>
                  </div>
                </div>

                {/* Expanded details */}
                {activeChannel === ch.name && (
                  <div className="space-y-4 pt-3 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">사양 규정</p>
                      <div className="flex flex-wrap gap-2">
                        {ch.specs.map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-normal">{spec}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">톤 & 보이스</p>
                      <p className="text-sm">{ch.toneNote}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1">
                        전체 가이드 보기
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1">
                        외주사 전달용 PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* === CHANGE HISTORY === */}
        <TabsContent value="history" className="space-y-4">
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">가이드 변경 이력</h2>
              <span className="text-xs text-muted-foreground ml-auto">결정이 바뀌면 자동 반영</span>
            </div>
            <div className="space-y-3">
              {recentUpdates.map((update, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5 font-mono">
                    {update.date}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{update.change}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{update.type}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{update.from}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
