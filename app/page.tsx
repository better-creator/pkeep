import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass, Link2, Bot, ArrowRight, CheckCircle, Play } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              PK
            </div>
            <span className="font-semibold text-slate-900">PKEEP</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900">
              기능
            </Link>
            <Link href="#how" className="text-sm text-slate-600 hover:text-slate-900">
              작동 방식
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/team-1/proj-1/dashboard">무료 시작</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            프로젝트 맥락 관리 도구
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
            프로젝트의 방향을<br />
            <span className="text-emerald-500">잃어본 적 있으신가요?</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            &quot;이거 왜 이렇게 결정했더라?&quot; &quot;그 디자인 누가 만들었지?&quot;<br />
            흩어진 결정과 맥락을 하나로 연결해 드립니다.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 h-12 px-8">
              <Link href="/team-1/proj-1/dashboard">
                데모 대시보드 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="#how">
                <Play className="mr-2 h-4 w-4" />
                3분 소개 영상
              </Link>
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl overflow-hidden border border-slate-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-3 opacity-40 scale-90">
                  {/* Mini Dashboard Preview */}
                  <div className="col-span-4 h-10 bg-slate-700 rounded-lg" />
                  <div className="h-24 bg-emerald-500/30 rounded-lg" />
                  <div className="h-24 bg-amber-500/30 rounded-lg" />
                  <div className="h-24 bg-blue-500/30 rounded-lg" />
                  <div className="h-24 bg-purple-500/30 rounded-lg" />
                  <div className="col-span-2 h-32 bg-slate-700 rounded-lg" />
                  <div className="col-span-2 h-32 bg-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <div className="text-xs text-slate-400">라이브 데모</div>
                <div className="text-sm text-white">E-Commerce MVP 프로젝트</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">핵심 3가지</h2>
            <p className="text-slate-600">프로젝트 맥락을 놓치지 않는 방법</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Compass className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">방향</h3>
              <p className="text-slate-600">
                프로젝트의 모든 결정을 시각화.<br />
                어디서 시작해서 어디로 가는지 한눈에.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Link2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">연결</h3>
              <p className="text-slate-600">
                Figma, Github, Notion, Slack.<br />
                흩어진 도구의 맥락을 하나로.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-orange-50 transition-colors group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Bot className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">자동</h3>
              <p className="text-slate-600">
                AI가 보류된 결정, 충돌 사항을<br />
                자동으로 진단하고 알려줍니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">이런 분들께 딱입니다</h2>
          </div>

          <div className="space-y-4">
            {[
              "3주 전 미팅에서 왜 그렇게 결정했는지 기억이 안 나는 분",
              "새 팀원에게 프로젝트 맥락을 설명하느라 하루가 가는 분",
              "Cursor, Claude에 매번 프로젝트 설명을 복붙하는 분",
              "기획서, 디자인, 코드가 따로 노는 것 같은 분",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 transition-colors"
              >
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-slate-400 mb-8">
            무료로 시작하고, 팀 전체가 맥락을 공유하세요.
          </p>
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 h-12 px-8">
            <Link href="/team-1/proj-1/dashboard">
              데모 대시보드 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-slate-200">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              PK
            </div>
            <span className="text-sm text-slate-600">PKEEP © 2024</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-900">이용약관</Link>
            <Link href="#" className="hover:text-slate-900">개인정보처리방침</Link>
            <Link href="#" className="hover:text-slate-900">문의하기</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
