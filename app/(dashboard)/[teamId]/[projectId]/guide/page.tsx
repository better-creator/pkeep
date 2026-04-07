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
  Sparkles,
  Clock,
  GitBranch,
  Eye,
  Camera,
  PenTool,
  Volume2,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Unsplash beauty/cosmetics images
const unsplash = (query: string, w = 400, h = 300) => `https://images.unsplash.com/photo-${query}?w=${w}&h=${h}&fit=crop&q=80`

// Pre-selected beauty/cosmetics image IDs
const IMGS = {
  moodA: unsplash('1596462502278-27bfdc403348', 400, 300),    // skincare flatlay
  moodB: unsplash('1522335789203-aabd1fc54bc9', 400, 300),    // minimal beauty
  moodC: unsplash('1571781926291-c477ebfd024b', 400, 300),     // lifestyle beauty
  moodD: unsplash('1556228578-8c89e6adf883', 400, 300),       // warm textures
  productShot1: unsplash('1611930022073-b7a4ba5fcccd', 300, 300), // cosmetic product
  productShot2: unsplash('1631729371254-42c2892f0e6e', 300, 300), // skincare bottle
  productShot3: unsplash('1596462502278-27bfdc403348', 300, 300), // flatlay
  model1: unsplash('1616394584738-fc6e612e71b9', 300, 300),    // beauty model
  model2: unsplash('1594744803329-e58b31de8bf5', 300, 300),    // natural makeup
  model3: unsplash('1487412912498-0447578fcca8', 300, 300),    // portrait
  doImg1: unsplash('1571781926291-c477ebfd024b', 200, 200),
  doImg2: unsplash('1611930022073-b7a4ba5fcccd', 200, 200),
  dontImg1: unsplash('1526045478516-99145907023c', 200, 200),  // overly filtered
  dontImg2: unsplash('1522335789203-aabd1fc54bc9', 200, 200),
  igSample1: unsplash('1596462502278-27bfdc403348', 200, 200),
  igSample2: unsplash('1631729371254-42c2892f0e6e', 200, 200),
  igSample3: unsplash('1571781926291-c477ebfd024b', 200, 200),
  ytThumb: unsplash('1616394584738-fc6e612e71b9', 600, 400),
  igThumb: unsplash('1596462502278-27bfdc403348', 600, 400),
  oohThumb: unsplash('1441986300917-64674bd600d8', 600, 400),  // billboard/outdoor
  webThumb: unsplash('1611930022073-b7a4ba5fcccd', 600, 400),
}

// --- Brand Guide Data (Content-Production Focused) ---
const brandEssence = {
  target: '2030 여성, 뷰티에 관심 많고 트렌드에 민감한 도시 거주자',
  positioning: '매일의 뷰티 루틴을 특별하게 — 합리적 가격의 프리미엄 경험',
  tone: '친근하지만 세련된. 전문적이되 딱딱하지 않은. 발견의 즐거움.',
  keywords: ['데일리 뷰티', '합리적 프리미엄', '트렌드 큐레이션', '자기관리'],
}

const visualSystem = {
  colors: [
    { name: 'Olive Green', hex: '#2D8C3C', usage: '브랜드 메인' },
    { name: 'Warm White', hex: '#FFF8F0', usage: '배경' },
    { name: 'Coral Pink', hex: '#E8734A', usage: '포인트, CTA' },
    { name: 'Charcoal', hex: '#1B1D1F', usage: '본문 텍스트' },
    { name: 'Soft Gray', hex: '#F2F0ED', usage: '카드, 구분선' },
    { name: 'Gold', hex: '#C9A96E', usage: '프리미엄 라인' },
  ],
  fonts: {
    korean: 'Pretendard',
    english: 'Satoshi',
    body: '16px / 행간 160%',
  },
  logoRules: '최소 여백: 로고 높이의 100%. 배경: 흰색 또는 올리브 그린만 허용.',
}

const moodboards = [
  { src: IMGS.moodA, label: '무드 A — 자연스러운 데일리' },
  { src: IMGS.moodB, label: '무드 B — 깔끔한 프로덕트' },
  { src: IMGS.moodC, label: '무드 C — 감성 라이프스타일' },
  { src: IMGS.moodD, label: '무드 D — 따뜻한 톤 & 텍스처' },
]

const shootingGuide = {
  product: {
    title: '제품 촬영',
    rules: [
      '화이트 배경 + 좌측 45도 자연광 라이팅',
      '제품 그림자: 소프트, 바닥에 자연스럽게',
      '소품 사용 시 브랜드 컬러 톤에 맞출 것',
    ],
    references: [IMGS.productShot1, IMGS.productShot2, IMGS.productShot3],
  },
  model: {
    title: '모델 촬영',
    rules: [
      '피부 톤 따뜻하게, 과도한 보정 금지',
      '자연스러운 표정, 포즈는 릴렉스',
      '배경: 화이트, 베이지, 올리브 톤 허용',
    ],
    references: [IMGS.model1, IMGS.model2, IMGS.model3],
  },
}

const doList = [
  { rule: '보라-코랄 그라데이션은 브랜드 핵심 포인트에만 사용', image: IMGS.doImg1, from: 'M-001 킥오프' },
  { rule: '제품 이미지는 화이트 배경 + 좌측 45도 라이팅', image: IMGS.doImg2, from: 'M-005 촬영 가이드' },
  { rule: '인스타 피드: 정사각형 1:1 비율, 여백 최소 8%', image: null, from: 'M-008 채널 전략' },
  { rule: 'CTA 버튼은 코랄(#E8734A), 라운드 14px', image: null, from: 'D-012 UI 결정' },
  { rule: '한글 프리텐다드 + 영문 Satoshi 조합', image: null, from: 'M-003 디자인 리뷰' },
]

const dontList = [
  { rule: '로고 주변 여백 미확보 (최소 로고 높이의 100%)', image: IMGS.dontImg1, from: 'M-001 킥오프', reason: '가독성 저하, 브랜드 인지도 훼손' },
  { rule: '네온·형광색 사용 금지', image: null, from: 'M-003 디자인 리뷰', reason: '브랜드 톤 불일치 — 따뜻하고 차분한 톤 유지' },
  { rule: '제품 사진 과도한 필터/보정 금지', image: IMGS.dontImg2, from: 'M-005 촬영 가이드', reason: '실물 괴리 → 소비자 신뢰 저하' },
  { rule: '검정 배경 위 올리브 텍스트 사용 금지', image: null, from: 'D-007 접근성', reason: 'WCAG AA 명도 대비 미달' },
]

const channels = [
  {
    id: 'instagram',
    name: '인스타그램',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    thumbnail: IMGS.igThumb,
    specs: '피드 1:1 · 릴스 9:16 · 캡션 2,200자',
    tone: '캐주얼 + 감성. 이모지 허용. 해시태그 15개 이내.',
    samples: [IMGS.igSample1, IMGS.igSample2, IMGS.igSample3],
    decisions: 8,
  },
  {
    id: 'youtube',
    name: '유튜브',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    thumbnail: IMGS.ytThumb,
    specs: '썸네일 1280x720 · 영상 16:9 · 설명 5,000자',
    tone: '정보 전달 + 친근함. 자막 필수. "~입니다"체.',
    samples: [IMGS.model1, IMGS.model2, IMGS.productShot1],
    decisions: 5,
  },
  {
    id: 'outdoor',
    name: '옥외광고',
    icon: Megaphone,
    color: 'from-amber-500 to-amber-600',
    thumbnail: IMGS.oohThumb,
    specs: '300dpi · 시인성 3m 기준 · CMYK',
    tone: '간결. 핵심 메시지 7단어 이내. 로고 면적 15% 이상.',
    samples: [IMGS.productShot2, IMGS.moodB, IMGS.moodD],
    decisions: 3,
  },
  {
    id: 'web',
    name: '웹/앱',
    icon: MonitorSmartphone,
    color: 'from-sky-500 to-sky-600',
    thumbnail: IMGS.webThumb,
    specs: '반응형 · 최소 터치 44px · Pretendard',
    tone: '명확하고 간결. UX 라이팅 가이드 준수. "~해요"체.',
    samples: [IMGS.productShot1, IMGS.moodA, IMGS.moodC],
    decisions: 6,
  },
]

const recentUpdates = [
  { date: '04.05', change: 'Accent 컬러 채도 5% 상향', from: 'M-012 시즌2 킥오프', type: '비주얼' },
  { date: '04.03', change: '인스타 릴스 자막 위치 규정 추가', from: 'D-023 채널 가이드', type: '채널' },
  { date: '04.01', change: '제품 촬영 라이팅 각도 40°→45°', from: 'M-011 포토 리뷰', type: '촬영' },
  { date: '03.28', change: 'DON\'T: "검정 배경 올리브 텍스트" 추가', from: 'D-007 접근성', type: '접근성' },
  { date: '03.25', change: '모델 촬영: 피부 보정 기준 명시', from: 'M-010 촬영 기준', type: '촬영' },
]

export default function BrandGuidePage() {
  const [expandedChannel, setExpandedChannel] = useState<string | null>('instagram')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1" />
              결정 기반 자동 생성
            </Badge>
            <Badge variant="outline" className="text-xs font-normal border-emerald-300 text-emerald-700 bg-emerald-50">
              <Clock className="h-3 w-3 mr-1" />
              2시간 전 업데이트
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">브랜드 가이드</h1>
          <p className="text-muted-foreground text-sm mt-1">
            34건의 결정에서 자동 생성 · 4개 채널 분기
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-sm">
            <Eye className="h-4 w-4 mr-1.5" />
            외주사 공유용
          </Button>
        </div>
      </div>

      {/* Brand Essence */}
      <section className="card-soft p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <PenTool className="h-4 w-4 text-primary" />
          브랜드 에센스
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">타겟</p>
            <p className="text-sm">{brandEssence.target}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">포지셔닝</p>
            <p className="text-sm">{brandEssence.positioning}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">톤 & 보이스</p>
            <p className="text-sm">{brandEssence.tone}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">키워드</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {brandEssence.keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">{kw}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Visual System — Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors + Typo */}
        <section className="card-soft p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            비주얼 시스템
          </h2>
          <div className="flex gap-2 mb-4">
            {visualSystem.colors.map((c) => (
              <div key={c.name} className="flex-1 text-center">
                <div className="h-12 rounded-lg border border-black/5 shadow-inner mb-1" style={{ backgroundColor: c.hex }} />
                <p className="text-xs font-mono text-muted-foreground">{c.hex}</p>
                <p className="text-xs text-muted-foreground">{c.usage}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-border/30 space-y-1">
            <p className="text-xs"><span className="text-muted-foreground">한글:</span> {visualSystem.fonts.korean}</p>
            <p className="text-xs"><span className="text-muted-foreground">영문:</span> {visualSystem.fonts.english}</p>
            <p className="text-xs"><span className="text-muted-foreground">본문:</span> {visualSystem.fonts.body}</p>
            <p className="text-xs"><span className="text-muted-foreground">로고:</span> {visualSystem.logoRules}</p>
          </div>
        </section>

        {/* Moodboard */}
        <section className="card-soft p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            무드보드
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {moodboards.map((m, i) => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted/30 border border-border/30">
                  <img src={m.src} alt={m.label} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Shooting Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.values(shootingGuide).map((guide) => (
          <section key={guide.title} className="card-soft p-6">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              {guide.title} 가이드
            </h2>
            <ul className="space-y-1.5 mb-4">
              {guide.rules.map((rule, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              {guide.references.map((src, i) => (
                <div key={i} className="flex-1 aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/30">
                  <img src={src} alt={`${guide.title} 레퍼런스 ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* DO / DON'T */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card-soft p-6 border-l-4 border-l-emerald-500">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            DO
            <span className="text-xs text-muted-foreground font-normal ml-auto">{doList.length}건</span>
          </h2>
          <div className="space-y-2.5">
            {doList.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                {item.image && (
                  <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden">
                    <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.rule}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.from}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-soft p-6 border-l-4 border-l-rose-500">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-rose-700">
            <ShieldX className="h-4 w-4" />
            DON&apos;T
            <span className="text-xs text-muted-foreground font-normal ml-auto">{dontList.length}건</span>
          </h2>
          <div className="space-y-2.5">
            {dontList.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100/50">
                {item.image && (
                  <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden">
                    <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.rule}</p>
                  <p className="text-xs text-rose-600/70 mt-0.5">{item.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.from}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Channel Guides */}
      <section>
        <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          채널별 가이드
        </h2>
        <p className="text-xs text-muted-foreground mb-4">마스터 가이드를 상속받아 자동 생성. 마스터 변경 시 모든 채널에 반영.</p>

        <div className="space-y-4">
          {channels.map((ch) => {
            const isExpanded = expandedChannel === ch.id
            return (
              <div key={ch.id} className="card-soft overflow-hidden">
                {/* Channel Header — always visible */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedChannel(isExpanded ? null : ch.id)}
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center text-white shrink-0`}>
                    <ch.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{ch.name}</h3>
                    <p className="text-xs text-muted-foreground">{ch.specs}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{ch.decisions}건 결정</Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Channel Detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                    {/* Thumbnail + Tone */}
                    <div className="flex gap-5">
                      <div className="w-1/2 aspect-video rounded-xl overflow-hidden bg-muted/30">
                        <img src={ch.thumbnail} alt={ch.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="w-1/2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">톤 & 보이스</p>
                        <p className="text-sm mb-3">{ch.tone}</p>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">사양</p>
                        <p className="text-sm">{ch.specs}</p>
                      </div>
                    </div>
                    {/* Sample Images */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">레퍼런스 · 샘플</p>
                      <div className="flex gap-3">
                        {ch.samples.map((src, i) => (
                          <div key={i} className="flex-1 aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/30">
                            <img src={src} alt={`${ch.name} 샘플 ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1">전체 가이드 보기</Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs flex-1">외주사 전달용 PDF</Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Change History */}
      <section className="card-soft p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          변경 이력
          <span className="text-xs text-muted-foreground font-normal ml-2">결정이 바뀌면 자동 반영</span>
        </h2>
        <div className="space-y-2">
          {recentUpdates.map((u, i) => (
            <div key={i} className="flex items-start gap-4 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
              <span className="text-xs text-muted-foreground w-12 shrink-0 font-mono pt-0.5">{u.date}</span>
              <div className="flex-1">
                <p className="text-sm">{u.change}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">{u.type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">{u.from}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
