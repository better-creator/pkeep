import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mic, Search, ShieldAlert, ArrowRight, CheckCircle, Zap } from "lucide-react"
import { PkeepLogo, PkeepLogoFull } from '@/components/brand/Logo'

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <PkeepLogoFull size={28} />
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-stone-600 hover:text-stone-900">
              기능
            </Link>
            <Link href="#for-who" className="text-sm text-stone-600 hover:text-stone-900">
              대상
            </Link>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-sm">
              <Link href="/team-1/proj-1/meetings">무료 시작</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm mb-6 border border-orange-100">
            <Zap className="h-3.5 w-3.5" />
            PM 없는 스타트업을 위한 AI 프로젝트 매니저
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-stone-900 leading-tight mb-6">
            회의만 하세요.<br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">할 일은 AI가 만들어 드릴게요.</span>
          </h1>

          <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-10">
            회의 녹음, Slack, Notion에서 결정사항과 할 일을 자동 추출.<br />
            누가, 왜, 언제 결정했는지 3초면 찾을 수 있습니다.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 px-8 rounded-xl shadow-md">
              <Link href="/team-1/proj-1/meetings">
                3분 만에 체험하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl border-stone-300">
              <Link href="#features">
                어떻게 작동하나요?
              </Link>
            </Button>
          </div>

          {/* Hero Visual — 핵심 플로우 시각화 */}
          <div className="mt-16 relative">
            <div className="rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 shadow-2xl overflow-hidden border border-stone-700 p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <Mic className="h-7 w-7 text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-white">회의</span>
                  <span className="text-xs text-stone-400">녹음 · Slack · 문서</span>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center">
                  <div className="w-12 h-[2px] bg-gradient-to-r from-orange-500/60 to-amber-500/60" />
                  <ArrowRight className="h-4 w-4 text-orange-400 -ml-1" />
                </div>
                <div className="sm:hidden">
                  <ArrowRight className="h-4 w-4 text-orange-400 rotate-90" />
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-white">AI 추출</span>
                  <span className="text-xs text-stone-400">결정 · 근거 · 할 일</span>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center">
                  <div className="w-12 h-[2px] bg-gradient-to-r from-amber-500/60 to-emerald-500/60" />
                  <ArrowRight className="h-4 w-4 text-amber-400 -ml-1" />
                </div>
                <div className="sm:hidden">
                  <ArrowRight className="h-4 w-4 text-amber-400 rotate-90" />
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-white">티켓 생성</span>
                  <span className="text-xs text-stone-400">자동 보드 반영</span>
                </div>
              </div>

              {/* Bottom caption */}
              <div className="mt-8 pt-6 border-t border-stone-700/50 flex items-center justify-between">
                <div className="text-xs text-stone-500">Zero-input — 별도 입력 없이 자동으로 동작합니다</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-stone-400">Live Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">핵심 3가지</h2>
            <p className="text-stone-500">입력은 제로, 관리는 AI가</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: 자동 기록 */}
            <div className="text-center p-8 rounded-2xl bg-stone-50 hover:bg-orange-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Mic className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">자동 기록</h3>
              <p className="text-stone-600">
                회의, Slack, Notion에서<br />
                결정과 할 일이 자동으로 추출됩니다.
              </p>
            </div>

            {/* Feature 2: 3초 검색 */}
            <div className="text-center p-8 rounded-2xl bg-stone-50 hover:bg-blue-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">3초 검색</h3>
              <p className="text-stone-600">
                &quot;그때 왜 그렇게 했지?&quot;<br />
                3초면 찾을 수 있습니다.
              </p>
            </div>

            {/* Feature 3: 충돌 방지 */}
            <div className="text-center p-8 rounded-2xl bg-stone-50 hover:bg-rose-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <ShieldAlert className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">충돌 방지</h3>
              <p className="text-stone-600">
                새 결정이 과거와 충돌하면<br />
                AI가 먼저 알려줍니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section id="for-who" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">이런 팀이라면</h2>
          </div>

          <div className="space-y-4">
            {[
              "회의 끝나고 30분씩 Notion에 정리하는 사람이 있는 팀",
              "Slack에서 결정됐는데 아무도 티켓을 안 만드는 팀",
              "PM 뽑을 여유는 없는데 PM이 필요한 팀",
              "Cursor한테 매번 프로젝트 설명을 복붙하는 개발자가 있는 팀",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 rounded-xl bg-white border border-stone-200 hover:border-orange-300 transition-colors"
              >
                <CheckCircle className="h-5 w-5 text-orange-500 shrink-0" />
                <span className="text-stone-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-6 bg-white border-y border-stone-100">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">11개사</div>
              <p className="text-sm text-stone-500 mt-1">도입 파트너</p>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">54.8h</div>
              <p className="text-sm text-stone-500 mt-1">월 절감 시간</p>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">3초</div>
              <p className="text-sm text-stone-500 mt-1">맥락 검색 시간</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-stone-900">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            회의만 하세요. 나머진 저희가 할게요.
          </h2>
          <p className="text-stone-400 mb-8">
            지금 바로 체험하고, 팀의 모든 결정을 지키세요.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 px-8 rounded-xl shadow-md">
            <Link href="/team-1/proj-1/meetings">
              3분 만에 체험하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-stone-200">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PkeepLogoFull size={24} />
            <span className="text-sm text-stone-600">© 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <Link href="#" className="hover:text-stone-900">이용약관</Link>
            <Link href="#" className="hover:text-stone-900">개인정보처리방침</Link>
            <Link href="#" className="hover:text-stone-900">문의하기</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
