'use client'

import { useState } from 'react'
import {
  Upload,
  FileText,
  Image,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  ShieldX,
  Palette,
  HelpCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Step = 'upload' | 'analyzing' | 'review' | 'complete'

// Mock analysis results
const analysisResults = {
  brandRules: [
    { category: '컬러', rule: 'Primary: #FF6F0F (당근 오렌지), Secondary: #1B1D1F (차콜)', confidence: 95 },
    { category: '컬러', rule: '배경은 #FFFFFF 또는 #F8F8F8만 사용', confidence: 88 },
    { category: '로고', rule: '로고 최소 여백: 로고 높이의 100%', confidence: 92 },
    { category: '로고', rule: '로고 배경: 흰색 또는 오렌지만 허용', confidence: 85 },
    { category: '톤앤매너', rule: '친근하고 따뜻한 톤. "~해요"체 사용. 이모지 허용.', confidence: 90 },
    { category: '타이포', rule: 'Pretendard 서체 사용, 본문 16px, 행간 160%', confidence: 87 },
  ],
  dontList: [
    { rule: '로고를 기울이거나 변형하지 않는다', source: 'brand_guide_v3.pdf p.12', confidence: 97 },
    { rule: '오렌지 위에 흰색 텍스트를 10pt 이하로 사용하지 않는다', source: 'brand_guide_v3.pdf p.18', confidence: 82 },
    { rule: '경쟁사(배민, 쿠팡이츠) 비교 표현 금지', source: 'RFP_2026.docx', confidence: 78 },
  ],
  discussionTopics: [
    { topic: '브랜드 가이드 p.15와 RFP의 서브 컬러 지정이 다름', source: 'brand_guide_v3.pdf vs RFP_2026.docx', severity: 'high' },
    { topic: '영문 서체 지정이 없음 — Satoshi 또는 Inter 중 결정 필요', source: 'brand_guide_v3.pdf', severity: 'medium' },
    { topic: '소셜 채널별 톤 가이드 부재 — 킥오프에서 논의 필요', source: '전체', severity: 'medium' },
  ],
  references: [
    { type: 'image', name: '로고 가이드.png', cluster: '로고 시스템' },
    { type: 'image', name: '컬러 팔레트.png', cluster: '컬러 시스템' },
    { type: 'image', name: '톤앤매너 레퍼런스 1.jpg', cluster: '비주얼 방향' },
    { type: 'image', name: '톤앤매너 레퍼런스 2.jpg', cluster: '비주얼 방향' },
    { type: 'image', name: '경쟁사 벤치마킹.png', cluster: '참고 자료' },
  ],
}

const uploadedFiles = [
  { name: 'brand_guide_v3.pdf', size: '4.2MB', type: 'pdf', pages: 32 },
  { name: 'RFP_2026.docx', size: '1.8MB', type: 'doc', pages: 12 },
  { name: '과거_캠페인_보고서.pdf', size: '8.1MB', type: 'pdf', pages: 45 },
  { name: '로고_가이드.png', size: '2.1MB', type: 'image' },
  { name: '톤앤매너_레퍼런스.zip', size: '15.3MB', type: 'archive', count: 8 },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<typeof uploadedFiles>([])
  const [analyzeProgress, setAnalyzeProgress] = useState(0)

  const handleStartAnalysis = () => {
    setStep('analyzing')
    // Simulate analysis progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => setStep('review'), 500)
      }
      setAnalyzeProgress(Math.min(progress, 100))
    }, 400)
  }

  const handleDemo = () => {
    setFiles(uploadedFiles)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50 mb-2">
          <Sparkles className="h-3 w-3 mr-1" />
          프로젝트 온보딩
        </Badge>
        <h1 className="text-2xl font-bold">기존 문서로 프로젝트 시작하기</h1>
        <p className="text-muted-foreground text-sm mt-1">
          브랜드 가이드, RFP, 보고서를 업로드하면 AI가 분석하여 프로젝트를 자동 세팅합니다.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        {[
          { key: 'upload', label: '문서 업로드' },
          { key: 'analyzing', label: 'AI 분석' },
          { key: 'review', label: '결과 검토' },
          { key: 'complete', label: '완료' },
        ].map((s, i) => {
          const isActive = s.key === step
          const isDone = ['upload', 'analyzing', 'review', 'complete'].indexOf(s.key) < ['upload', 'analyzing', 'review', 'complete'].indexOf(step)
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive ? 'bg-primary text-white' :
                isDone ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5 text-center">{i + 1}</span>}
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDemo() }}
          >
            <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-medium mb-1">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, PPT, 이미지, URL 지원 · 최대 100MB</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={handleDemo}>
              데모 파일로 체험하기
            </Button>
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="card-soft p-5">
              <h3 className="text-sm font-semibold mb-3">업로드된 파일 ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      file.type === 'pdf' ? 'bg-rose-100 text-rose-600' :
                      file.type === 'doc' ? 'bg-blue-100 text-blue-600' :
                      file.type === 'image' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {file.type === 'image' ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size}
                        {'pages' in file && ` · ${file.pages}페이지`}
                        {'count' in file && ` · ${file.count}개 파일`}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/90" onClick={handleStartAnalysis}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI 분석 시작
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="card-soft p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold mb-2">문서를 분석하고 있습니다</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {analyzeProgress < 30 ? '문서 구조 파악 중...' :
             analyzeProgress < 60 ? '브랜드 규정 추출 중...' :
             analyzeProgress < 85 ? '문서 간 불일치 검사 중...' :
             '레퍼런스 이미지 클러스터링 중...'}
          </p>
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${analyzeProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{Math.round(analyzeProgress)}%</p>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card-soft p-5 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">분석 완료</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              5개 문서에서 <strong className="text-foreground">{analysisResults.brandRules.length}개 브랜드 규정</strong>,{' '}
              <strong className="text-foreground">{analysisResults.dontList.length}개 금지 사항</strong>,{' '}
              <strong className="text-foreground">{analysisResults.discussionTopics.length}개 논의 안건</strong>,{' '}
              <strong className="text-foreground">{analysisResults.references.length}개 레퍼런스</strong>를 추출했습니다.
            </p>
          </div>

          {/* Extracted Brand Rules */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">추출된 브랜드 규정 → 초기 결정으로 등록</h3>
            </div>
            <div className="space-y-2">
              {analysisResults.brandRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <Badge variant="outline" className="text-xs shrink-0">{rule.category}</Badge>
                  <p className="text-sm flex-1">{rule.rule}</p>
                  <span className="text-xs text-muted-foreground shrink-0">신뢰도 {rule.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* DON'T List */}
          <div className="card-soft p-5 border-l-4 border-l-rose-400">
            <div className="flex items-center gap-2 mb-4">
              <ShieldX className="h-4 w-4 text-rose-500" />
              <h3 className="font-semibold text-sm">자동 생성된 DON&apos;T 목록</h3>
            </div>
            <div className="space-y-2">
              {analysisResults.dontList.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50">
                  <ShieldX className="h-4 w-4 text-rose-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{item.rule}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.source}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion Topics */}
          <div className="card-soft p-5 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm">킥오프 논의 안건 (문서 간 불일치·모호한 지점)</h3>
            </div>
            <div className="space-y-2">
              {analysisResults.discussionTopics.map((topic, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50">
                  <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                    topic.severity === 'high' ? 'text-rose-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{topic.source}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    topic.severity === 'high' ? 'border-rose-200 text-rose-600' : 'border-amber-200 text-amber-600'
                  }`}>
                    {topic.severity === 'high' ? '중요' : '참고'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* References */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <Image className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">레퍼런스 이미지 클러스터링</h3>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {analysisResults.references.map((ref, i) => (
                <div key={i} className="text-center">
                  <div className="aspect-square rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center mb-1">
                    <Image className="h-6 w-6 text-muted-foreground/20" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ref.name}</p>
                  <Badge variant="outline" className="text-xs mt-0.5">{ref.cluster}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('upload')}>
              다시 분석
            </Button>
            <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90" onClick={() => setStep('complete')}>
              결과 확정하고 프로젝트 시작
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="card-soft p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 세팅 완료</h2>
          <p className="text-sm text-muted-foreground mb-6">
            6개 브랜드 규정이 초기 결정으로 등록되고,<br />
            브랜드 가이드가 자동 생성되었습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="rounded-xl">
              <BookOpen className="h-4 w-4 mr-2" />
              브랜드 가이드 보기
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90">
              <MessageSquare className="h-4 w-4 mr-2" />
              논의 안건 확인하기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
