'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Upload,
  Image,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  Palette,
  Type,
  Camera,
  ShieldCheck,
  ShieldX,
  ArrowRight,
  Eye,
  Send,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type VerifyStatus = 'idle' | 'uploading' | 'verifying' | 'done'

interface VerifyResult {
  item: string
  status: 'pass' | 'warn' | 'fail'
  rule: string
  detail: string
  guideRef: string
}

const mockResults: VerifyResult[] = [
  { item: '컬러 코드 일치', status: 'pass', rule: '메인 컬러 #E8734A 사용', detail: '메인 CTA와 로고에 코랄 오렌지 정확히 적용됨', guideRef: 'DEC-001' },
  { item: '로고 여백 규정', status: 'pass', rule: '로고 높이의 100% 여백 확보', detail: '좌우 여백 48px / 로고 높이 42px — 규정 준수', guideRef: '마스터 가이드 · 로고' },
  { item: '타이포그래피', status: 'pass', rule: 'Pretendard 서체, 본문 16px 이상', detail: '본문 Pretendard 18px, 캡션 14px — 준수', guideRef: '마스터 가이드 · 타이포' },
  { item: '제품 이미지 배경', status: 'warn', rule: '화이트 배경 + 좌측 45도 라이팅', detail: '배경은 화이트이나, 라이팅 각도가 약 50도로 추정됨 (가이드: 45도)', guideRef: 'DEC-002' },
  { item: '컬러 톤 일관성', status: 'warn', rule: '따뜻한 톤 유지', detail: '좌측 하단 제품 이미지의 색온도가 다소 차가운 톤 (6200K). 가이드: 5500K 이하 권장', guideRef: 'DEC-007' },
  { item: '텍스트 오버레이', status: 'fail', rule: '제품 이미지에 텍스트 오버레이 금지', detail: '제품 이미지 위에 가격 텍스트가 직접 오버레이되어 있음. DON\'T 규정 위반.', guideRef: '마스터 가이드 · DON\'T' },
  { item: '인스타 비율', status: 'pass', rule: '정사각형 1:1, 여백 8%', detail: '1080x1080px, 상하좌우 여백 약 9% — 준수', guideRef: 'DEC-003' },
]

const uploadedFiles = [
  { name: '인스타_피드_시안_3차_01.png', size: '2.4MB', type: 'image' },
  { name: '인스타_피드_시안_3차_02.png', size: '2.1MB', type: 'image' },
  { name: '인스타_피드_시안_3차_03.png', size: '2.8MB', type: 'image' },
]

const statusConfig = {
  pass: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '준수' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '주의' },
  fail: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: '위반' },
}

export default function OutputUploadPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [files, setFiles] = useState<typeof uploadedFiles>([])
  const [dragOver, setDragOver] = useState(false)
  const [notifyClient, setNotifyClient] = useState(false)

  const handleDemo = () => {
    setFiles(uploadedFiles)
  }

  const handleVerify = () => {
    setStatus('uploading')
    setTimeout(() => setStatus('verifying'), 800)
    setTimeout(() => setStatus('done'), 2500)
  }

  const passCount = mockResults.filter(r => r.status === 'pass').length
  const warnCount = mockResults.filter(r => r.status === 'warn').length
  const failCount = mockResults.filter(r => r.status === 'fail').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">산출물 검증</h1>
        <p className="text-muted-foreground text-sm mt-1">
          산출물을 업로드하면 마스터 가이드 규정과 자동 대조하여 정합성을 검증합니다.
        </p>
      </div>

      {/* Upload */}
      {status === 'idle' && (
        <div className="space-y-5">
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDemo() }}
          >
            <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">시안, 편집본, 촬영본을 업로드하세요</p>
            <p className="text-xs text-muted-foreground">이미지, PDF, 영상 파일 지원 · 마스터 가이드와 자동 대조</p>
            <Button variant="outline" className="mt-3 rounded-xl text-sm" onClick={handleDemo}>
              데모 파일로 체험
            </Button>
          </div>

          {files.length > 0 && (
            <div className="card-soft p-5 space-y-3">
              <h3 className="text-sm font-semibold">{files.length}개 파일</h3>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Image className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.size}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}

              {/* Vendor info */}
              <div className="p-3 rounded-xl bg-secondary/20 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">업로드 주체:</span>
                <Badge variant="outline" className="text-xs">OTV 스튜디오 · 박서연</Badge>
              </div>

              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={handleVerify}>
                <Sparkles className="h-4 w-4 mr-2" />
                가이드 정합성 검증 시작
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Verifying */}
      {(status === 'uploading' || status === 'verifying') && (
        <div className="card-soft p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold mb-2">
            {status === 'uploading' ? '파일 분석 중...' : '마스터 가이드와 대조 중...'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {status === 'uploading' ? '이미지 요소를 추출하고 있습니다.' : '컬러, 로고, 타이포, 레이아웃 규정을 확인합니다.'}
          </p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">검증 결과</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">{passCount}</p>
                <p className="text-xs text-emerald-700">준수</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{warnCount}</p>
                <p className="text-xs text-amber-700">주의</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-rose-50">
                <p className="text-2xl font-bold text-rose-600">{failCount}</p>
                <p className="text-xs text-rose-700">위반</p>
              </div>
            </div>

            {failCount > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/50 text-sm text-rose-700">
                <AlertTriangle className="h-4 w-4 inline mr-1.5" />
                {failCount}건의 가이드 위반이 발견되었습니다. 수정 후 재검증을 권장합니다.
              </div>
            )}
          </div>

          {/* Detail Results */}
          <div className="card-soft p-5 space-y-3">
            <h3 className="text-sm font-semibold mb-3">상세 검증 항목</h3>
            {mockResults.map((result, i) => {
              const cfg = statusConfig[result.status]
              const StatusIcon = cfg.icon
              return (
                <div key={i} className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`h-5 w-5 ${cfg.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{result.item}</span>
                        <Badge className={`text-xs border-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm mb-1">{result.detail}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>규정: {result.rule}</span>
                        <span>·</span>
                        <span className="font-mono">{result.guideRef}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="card-soft p-5 space-y-4">
            {/* Notify client */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex-1">
                <p className="text-sm font-semibold">클라이언트에게 확인 요청</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  검증 결과와 함께 산출물을 클라이언트 담당자(정하은)에게 전달합니다.
                  {failCount > 0 && ' 위반 항목은 수정 사항으로 표시됩니다.'}
                </p>
              </div>
              <Button
                className="rounded-xl bg-primary hover:bg-primary/90 shrink-0"
                onClick={() => setNotifyClient(true)}
              >
                <Send className="h-4 w-4 mr-1.5" />
                확인 요청 보내기
              </Button>
            </div>

            {notifyClient && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/50 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">확인 요청 전송 완료</p>
                  <p className="text-xs text-emerald-600">정하은(글로우업 코스메틱)에게 알림이 전송되었습니다. 대시보드 "확인이 필요합니다"에 표시됩니다.</p>
                </div>
              </div>
            )}

            {/* Link to flow */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30">
              <div className="flex-1">
                <p className="text-sm font-semibold">콘텐츠 플로우에 검증 결과 연결</p>
                <p className="text-xs text-muted-foreground mt-0.5">이 검증 결과가 관련 결정 노드에 자동으로 연결됩니다.</p>
              </div>
              <Button variant="outline" className="rounded-xl shrink-0"
                onClick={() => router.push(`/${teamId}/${projectId}/nodeview`)}>
                <Eye className="h-4 w-4 mr-1.5" />
                플로우 보기
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setStatus('idle'); setFiles([]); setNotifyClient(false) }}>
                다른 산출물 검증
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl"
                onClick={() => router.push(`/${teamId}/${projectId}/guide`)}>
                마스터 가이드 보기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
