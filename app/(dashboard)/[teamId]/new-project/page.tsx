'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Image,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Users,
  Target,
  Megaphone,
  Building2,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveProject, type StoredProject } from '@/lib/store'

type Step = 1 | 2 | 3 | 4

const CHANNEL_OPTIONS = [
  '인스타그램', '유튜브', '틱톡', '옥외광고', '웹/앱', '카탈로그',
  '인게임', '네이버', '카카오', '이메일', '오프라인 매장', '기타',
]

const INDUSTRY_OPTIONS = [
  '뷰티/화장품', '패션/의류', '식품/음료', '게임', '테크/IT',
  '금융', '자동차', '엔터테인먼트', '교육', '기타',
]

export default function NewProjectPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string

  const [step, setStep] = useState<Step>(1)
  const [isCreating, setIsCreating] = useState(false)

  // Step 1: 프로젝트 개요
  const [projectName, setProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')

  // Step 2: 타겟 & 목표
  const [targetAudience, setTargetAudience] = useState('')
  const [objective, setObjective] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')

  // Step 3: 채널 & 외주사
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [vendors, setVendors] = useState<{ name: string; role: string }[]>([])
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorRole, setNewVendorRole] = useState('')

  // Step 4: 문서 업로드
  const [files, setFiles] = useState<{ name: string; size: string; type: string }[]>([])
  const [dragOver, setDragOver] = useState(false)

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  const addVendor = () => {
    if (!newVendorName.trim()) return
    setVendors(prev => [...prev, { name: newVendorName.trim(), role: newVendorRole.trim() || '외주' }])
    setNewVendorName('')
    setNewVendorRole('')
  }

  const removeVendor = (idx: number) => {
    setVendors(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDemoDocs = () => {
    setFiles([
      { name: '글로우업_브랜드가이드_v3.pdf', size: '4.2MB', type: 'pdf' },
      { name: 'SS_캠페인_RFP.docx', size: '1.8MB', type: 'doc' },
      { name: '지난시즌_캠페인_보고서.pdf', size: '8.1MB', type: 'pdf' },
      { name: '로고_가이드라인.png', size: '2.1MB', type: 'image' },
      { name: '톤앤매너_레퍼런스.zip', size: '15.3MB', type: 'archive' },
    ])
  }

  const handleCreate = () => {
    if (isCreating) return
    setIsCreating(true)

    const id = `proj-${Date.now()}`
    const project: StoredProject = {
      id,
      name: projectName || '새 프로젝트',
      createdAt: new Date().toISOString(),
    }
    saveProject(project)

    // Simulate brief delay then redirect
    setTimeout(() => {
      if (files.length > 0) {
        router.push(`/${teamId}/${id}/onboarding`)
      } else {
        router.push(`/${teamId}/${id}/dashboard`)
      }
    }, 800)
  }

  const canProceed = (s: Step) => {
    if (s === 1) return projectName.trim().length > 0
    if (s === 2) return true
    if (s === 3) return true
    return true
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="rounded-xl mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          돌아가기
        </Button>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
        <p className="text-muted-foreground text-sm mt-1">프로젝트 정보를 입력하면 AI가 자동으로 세팅합니다.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: '프로젝트 개요', icon: FileText },
          { n: 2, label: '타겟 · 목표', icon: Target },
          { n: 3, label: '채널 · 외주사', icon: Megaphone },
          { n: 4, label: '문서 업로드', icon: Upload },
        ].map((s, i) => {
          const isActive = s.n === step
          const isDone = s.n < step
          return (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-6 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
              <button
                onClick={() => isDone ? setStep(s.n as Step) : null}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' :
                  isDone ? 'bg-primary/10 text-primary cursor-pointer' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                {s.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* Step 1: 프로젝트 개요 */}
      {step === 1 && (
        <div className="card-soft p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">프로젝트 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 글로우업 S/S 캠페인"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="rounded-xl h-12 text-base"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium">클라이언트 / 브랜드</Label>
            <Input
              id="client"
              placeholder="예: 글로우업 코스메틱"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="rounded-xl h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">업종</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndustry(industry === ind ? '' : ind)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    industry === ind ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-sm font-medium">프로젝트 설명</Label>
            <textarea
              id="desc"
              placeholder="프로젝트 목적과 범위를 간단히 설명해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* Step 2: 타겟 & 목표 */}
      {step === 2 && (
        <div className="card-soft p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target" className="text-sm font-medium">타겟 오디언스</Label>
            <Input
              id="target"
              placeholder="예: 2030 여성, 뷰티 트렌드에 민감한 도시 거주자"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="rounded-xl h-12 text-base"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objective" className="text-sm font-medium">캠페인 목표</Label>
            <textarea
              id="objective"
              placeholder="예: S/S 신제품 인지도 확보 + D2C 앱 다운로드 전환"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">납품 / 런칭일</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium">예산 규모</Label>
              <Input
                id="budget"
                placeholder="예: 5,000만원"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="rounded-xl h-12 text-base"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: 채널 & 외주사 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card-soft p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">채널 선택</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedChannels.includes(ch)
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {selectedChannels.includes(ch) && <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />}
                  {ch}
                </button>
              ))}
            </div>
            {selectedChannels.length > 0 && (
              <p className="text-sm text-muted-foreground">{selectedChannels.length}개 채널 선택됨</p>
            )}
          </div>

          <div className="card-soft p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">외주사 · 협력사</h2>
            </div>

            {vendors.length > 0 && (
              <div className="space-y-2">
                {vendors.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">{v.name}</span>
                    <Badge variant="outline" className="text-xs">{v.role}</Badge>
                    <button onClick={() => removeVendor(i)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="업체명"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="rounded-xl h-11 text-sm flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addVendor() }}
              />
              <Input
                placeholder="역할 (예: 촬영)"
                value={newVendorRole}
                onChange={(e) => setNewVendorRole(e.target.value)}
                className="rounded-xl h-11 text-sm w-40"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addVendor() }}
              />
              <Button variant="outline" className="rounded-xl h-11" onClick={addVendor}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: 문서 업로드 */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="card-soft p-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">기존 문서 업로드 (선택)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              브랜드 가이드, RFP, 과거 보고서, 레퍼런스 이미지를 업로드하면 AI가 분석하여 프로젝트를 자동 세팅합니다.
            </p>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDemoDocs() }}
            >
              <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, PPT, 이미지, URL · 최대 100MB</p>
              <Button variant="outline" className="mt-3 rounded-xl text-sm" onClick={handleDemoDocs}>
                데모 파일로 체험
              </Button>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      file.type === 'pdf' ? 'bg-rose-100 text-rose-600' :
                      file.type === 'doc' ? 'bg-blue-100 text-blue-600' :
                      file.type === 'image' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {file.type === 'image' ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card-soft p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-sm mb-3">프로젝트 요약</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">이름:</span> {projectName || '-'}</div>
              <div><span className="text-muted-foreground">클라이언트:</span> {clientName || '-'}</div>
              <div><span className="text-muted-foreground">업종:</span> {industry || '-'}</div>
              <div><span className="text-muted-foreground">타겟:</span> {targetAudience || '-'}</div>
              <div><span className="text-muted-foreground">납품일:</span> {deadline || '-'}</div>
              <div><span className="text-muted-foreground">예산:</span> {budget || '-'}</div>
              <div className="col-span-2">
                <span className="text-muted-foreground">채널:</span>{' '}
                {selectedChannels.length > 0 ? selectedChannels.join(', ') : '-'}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">외주사:</span>{' '}
                {vendors.length > 0 ? vendors.map(v => `${v.name}(${v.role})`).join(', ') : '-'}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">문서:</span>{' '}
                {files.length > 0 ? `${files.length}개 파일` : '없음'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setStep((step - 1) as Step)}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          이전
        </Button>

        {step < 4 ? (
          <Button
            className="rounded-xl bg-primary hover:bg-primary/90"
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed(step)}
          >
            다음
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            className="rounded-xl bg-primary hover:bg-primary/90"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                생성 중...
              </>
            ) : files.length > 0 ? (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                프로젝트 생성 + AI 분석 시작
              </>
            ) : (
              <>
                프로젝트 생성
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
