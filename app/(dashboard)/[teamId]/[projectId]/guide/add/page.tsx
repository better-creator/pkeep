'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Link2,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  Palette,
  Camera,
  Type,
  PenTool,
  ShieldCheck,
  ShieldX,
  MonitorSmartphone,
  Globe,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReferenceSidebar } from '@/components/references/ReferenceSidebar'

type AddMode = 'document' | 'manual' | 'url'

const CATEGORY_OPTIONS = [
  { id: 'color', label: '컬러', icon: Palette },
  { id: 'typography', label: '타이포그래피', icon: Type },
  { id: 'photography', label: '촬영 가이드', icon: Camera },
  { id: 'tone', label: '톤 & 보이스', icon: PenTool },
  { id: 'channel', label: '채널 규정', icon: MonitorSmartphone },
  { id: 'do', label: 'DO (해야 할 것)', icon: ShieldCheck },
  { id: 'dont', label: "DON'T (하면 안 되는 것)", icon: ShieldX },
  { id: 'logo', label: '로고 규정', icon: Image },
  { id: 'layout', label: '레이아웃', icon: Globe },
]

// Mock analysis results for document upload
const mockAnalysis = {
  extracted: [
    { category: '컬러', rule: 'Sub Color: Warm Beige(#F5E6D3) 추가 확인', confidence: 88, source: '브랜드가이드_v4.pdf p.8' },
    { category: '촬영 가이드', rule: '패키지 클로즈업 시 매크로 렌즈 필수, 최소 초점거리 50mm', confidence: 92, source: '브랜드가이드_v4.pdf p.22' },
    { category: '타이포그래피', rule: '캡션 최소 사이즈 12pt, 행간 150% 이상', confidence: 85, source: '브랜드가이드_v4.pdf p.14' },
    { category: "DON'T", rule: '제품 이미지에 텍스트 오버레이 금지 (별도 배너 영역 사용)', confidence: 90, source: '브랜드가이드_v4.pdf p.26' },
  ],
  conflicts: [
    { issue: '기존 DON\'T "과도한 보정 금지"와 신규 "매크로 렌즈 필수" 간 보정 범위 모호', severity: 'medium' },
  ],
}

export default function AddGuidePage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [mode, setMode] = useState<AddMode>('document')
  const [dragOver, setDragOver] = useState(false)
  const [refOpen, setRefOpen] = useState(false)

  // Document upload state
  const [files, setFiles] = useState<{ name: string; size: string; type: string }[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [acceptedRules, setAcceptedRules] = useState<Set<number>>(new Set())

  // Manual input state
  const [manualCategory, setManualCategory] = useState('')
  const [manualRule, setManualRule] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [manualType, setManualType] = useState<'do' | 'dont' | 'rule'>('rule')
  const [manualImage, setManualImage] = useState<string | null>(null)
  const [manualColor, setManualColor] = useState('')
  const [addedRules, setAddedRules] = useState<{ category: string; rule: string; type: string }[]>([])

  // URL state
  const [urlInput, setUrlInput] = useState('')
  const [urls, setUrls] = useState<string[]>([])

  const handleDemoFiles = () => {
    setFiles([
      { name: '브랜드가이드_v4.pdf', size: '5.8MB', type: 'pdf' },
      { name: '채널운영_매뉴얼.docx', size: '2.3MB', type: 'doc' },
      { name: '촬영_레퍼런스_추가.zip', size: '12.4MB', type: 'archive' },
    ])
  }

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setAnalyzed(true)
    }, 2000)
  }

  const toggleAccept = (idx: number) => {
    setAcceptedRules(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const acceptAll = () => {
    setAcceptedRules(new Set(mockAnalysis.extracted.map((_, i) => i)))
  }

  const addManualRule = () => {
    if (!manualRule.trim() || !manualCategory) return
    setAddedRules(prev => [...prev, { category: manualCategory, rule: manualRule.trim(), type: manualType }])
    setManualRule('')
    setManualReason('')
    setManualColor('')
  }

  const addUrl = () => {
    if (!urlInput.trim()) return
    setUrls(prev => [...prev, urlInput.trim()])
    setUrlInput('')
  }

  const totalAdded = acceptedRules.size + addedRules.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl mb-3"
          onClick={() => router.push(`/${teamId}/${projectId}/guide`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          마스터 가이드
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">브랜드 콘텐츠 지침 추가</h1>
            <p className="text-muted-foreground text-sm mt-1">
              문서 업로드, 직접 입력, URL 참조 — 세 가지 방법으로 가이드를 확장할 수 있습니다.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => setRefOpen(!refOpen)}>
            <Image className="h-4 w-4 mr-1.5" />
            레퍼런스 {refOpen ? '닫기' : '보기'}
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as AddMode)} className="space-y-6">
        <TabsList className="bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="document" className="rounded-lg text-sm gap-2">
            <Upload className="h-4 w-4" />
            문서 업로드
          </TabsTrigger>
          <TabsTrigger value="manual" className="rounded-lg text-sm gap-2">
            <PenTool className="h-4 w-4" />
            직접 입력
          </TabsTrigger>
          <TabsTrigger value="url" className="rounded-lg text-sm gap-2">
            <Link2 className="h-4 w-4" />
            URL 참조
          </TabsTrigger>
        </TabsList>

        {/* === DOCUMENT UPLOAD === */}
        <TabsContent value="document" className="space-y-6">
          {!analyzed ? (
            <>
              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDemoFiles() }}
              >
                <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">브랜드 가이드, 매뉴얼, 레퍼런스를 업로드하세요</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, PPT, 이미지 · 기존 가이드에 자동 병합됩니다</p>
                <Button variant="outline" className="mt-3 rounded-xl text-sm" onClick={handleDemoFiles}>
                  데모 파일로 체험
                </Button>
              </div>

              {/* Files */}
              {files.length > 0 && (
                <div className="card-soft p-5 space-y-3">
                  <h3 className="text-sm font-semibold">{files.length}개 파일 준비됨</h3>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        f.type === 'pdf' ? 'bg-rose-100 text-rose-600' :
                        f.type === 'doc' ? 'bg-blue-100 text-blue-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.size}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  ))}
                  <Button
                    className="w-full rounded-xl bg-primary hover:bg-primary/90"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI 분석 중...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />AI로 지침 추출</>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Analysis Results */
            <div className="space-y-5">
              <div className="card-soft p-4 bg-primary/5 border-primary/20">
                <p className="text-sm">
                  <Sparkles className="h-4 w-4 inline mr-1.5 text-primary" />
                  3개 문서에서 <strong>{mockAnalysis.extracted.length}개 지침</strong>을 추출했습니다. 가이드에 추가할 항목을 선택하세요.
                </p>
              </div>

              {/* Extracted Rules */}
              <div className="card-soft p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">추출된 지침</h3>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={acceptAll}>
                    전체 선택
                  </Button>
                </div>
                {mockAnalysis.extracted.map((rule, i) => (
                  <div
                    key={i}
                    onClick={() => toggleAccept(i)}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      acceptedRules.has(i)
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      acceptedRules.has(i) ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {acceptedRules.has(i) && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                        <span className="text-xs text-muted-foreground">신뢰도 {rule.confidence}%</span>
                      </div>
                      <p className="text-sm">{rule.rule}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{rule.source}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conflicts */}
              {mockAnalysis.conflicts.length > 0 && (
                <div className="card-soft p-5 border-l-4 border-l-amber-400">
                  <h3 className="text-sm font-semibold mb-2 text-amber-700">기존 가이드와 충돌 감지</h3>
                  {mockAnalysis.conflicts.map((c, i) => (
                    <p key={i} className="text-sm text-amber-800/80">{c.issue}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => { setAnalyzed(false); setFiles([]) }}>
                  다시 업로드
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={acceptedRules.size === 0}
                  onClick={() => router.push(`/${teamId}/${projectId}/guide`)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {acceptedRules.size}개 지침을 가이드에 추가
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* === MANUAL INPUT === */}
        <TabsContent value="manual" className="space-y-6">
          <div className="card-soft p-6 space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">카테고리</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setManualCategory(cat.id === manualCategory ? '' : cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      manualCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type (DO / DON'T / 규정) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">유형</Label>
              <div className="flex gap-2">
                {[
                  { id: 'rule' as const, label: '규정', color: 'bg-sky-100 text-sky-700' },
                  { id: 'do' as const, label: 'DO (해야 할 것)', color: 'bg-emerald-100 text-emerald-700' },
                  { id: 'dont' as const, label: "DON'T (금지)", color: 'bg-rose-100 text-rose-700' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setManualType(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      manualType === t.id ? t.color + ' ring-2 ring-offset-1 ring-current/20' : 'bg-secondary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rule Content */}
            <div className="space-y-2">
              <Label htmlFor="rule" className="text-sm font-medium">지침 내용 *</Label>
              <textarea
                id="rule"
                placeholder="예: 제품 이미지는 항상 화이트 배경, 좌측 45도 라이팅으로 촬영한다."
                value={manualRule}
                onChange={(e) => setManualRule(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">이유 (선택)</Label>
              <Input
                id="reason"
                placeholder="왜 이 지침이 필요한가?"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="rounded-xl h-11 text-sm"
              />
            </div>

            {/* Color input (if color category) */}
            {manualCategory === 'color' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">컬러 코드</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    placeholder="#E8734A"
                    value={manualColor}
                    onChange={(e) => setManualColor(e.target.value)}
                    className="rounded-xl h-11 text-sm w-40 font-mono"
                  />
                  {manualColor && /^#[0-9A-Fa-f]{6}$/.test(manualColor) && (
                    <div className="h-11 w-11 rounded-xl border border-black/10 shadow-inner" style={{ backgroundColor: manualColor }} />
                  )}
                </div>
              </div>
            )}

            {/* Image upload placeholder */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">레퍼런스 이미지 (선택)</Label>
              <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Image className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">이미지를 드래그하거나 클릭</p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl bg-primary hover:bg-primary/90"
              disabled={!manualRule.trim() || !manualCategory}
              onClick={addManualRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              지침 추가
            </Button>
          </div>

          {/* Added Rules List */}
          {addedRules.length > 0 && (
            <div className="card-soft p-5">
              <h3 className="text-sm font-semibold mb-3">추가된 지침 ({addedRules.length})</h3>
              <div className="space-y-2">
                {addedRules.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    r.type === 'do' ? 'bg-emerald-50/50 border border-emerald-100/50' :
                    r.type === 'dont' ? 'bg-rose-50/50 border border-rose-100/50' :
                    'bg-secondary/30'
                  }`}>
                    {r.type === 'do' ? <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> :
                     r.type === 'dont' ? <ShieldX className="h-4 w-4 text-rose-500 shrink-0" /> :
                     <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm">{r.rule}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{CATEGORY_OPTIONS.find(c => c.id === r.category)?.label || r.category}</Badge>
                    <button onClick={() => setAddedRules(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/90"
                onClick={() => router.push(`/${teamId}/${projectId}/guide`)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {addedRules.length}개 지침을 가이드에 반영
              </Button>
            </div>
          )}
        </TabsContent>

        {/* === URL REFERENCE === */}
        <TabsContent value="url" className="space-y-6">
          <div className="card-soft p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">URL로 레퍼런스 추가</h3>
              <p className="text-xs text-muted-foreground">웹페이지, 핀터레스트 보드, 비핸스 프로젝트 등의 URL을 입력하면 AI가 분석합니다.</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="https://www.pinterest.com/pin/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="rounded-xl h-11 text-sm flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addUrl() }}
              />
              <Button variant="outline" className="rounded-xl h-11" onClick={addUrl}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2">
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm flex-1 truncate font-mono">{url}</p>
                    <button onClick={() => setUrls(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
                <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {urls.length}개 URL 분석하기
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom status */}
      {totalAdded > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-foreground text-background px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium">{totalAdded}개 지침 추가 준비됨</span>
            <Button
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary/90 text-sm ml-2"
              onClick={() => router.push(`/${teamId}/${projectId}/guide`)}
            >
              가이드에 반영
            </Button>
          </div>
        </div>
      )}

      {/* Reference Sidebar */}
      <ReferenceSidebar
        open={refOpen}
        onClose={() => setRefOpen(false)}
        filterTags={manualCategory ? [manualCategory === 'color' ? '컬러' : manualCategory === 'photography' ? '촬영' : manualCategory === 'channel' ? '채널' : manualCategory === 'tone' ? '톤앤매너' : ''] : undefined}
        title="관련 레퍼런스"
      />
    </div>
  )
}
