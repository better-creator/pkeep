'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

// 서비스 로고 SVG 컴포넌트들
const GoogleDriveLogo = () => (
  <svg viewBox="0 0 87.3 78" className="h-7 w-7">
    <path fill="#0066DA" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z"/>
    <path fill="#00AC47" d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 38.45c-.8 1.4-1.2 2.95-1.2 4.55h27.5l16.15-18z"/>
    <path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z"/>
    <path fill="#00832D" d="M43.65 25L57.4 1.2c-1.35-.8-2.9-1.2-4.5-1.2H34.25c-1.55 0-3.1.45-4.5 1.2L43.65 25z"/>
    <path fill="#2684FC" d="M59.85 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.85c1.55 0 3.1-.45 4.5-1.2L59.85 53z"/>
    <path fill="#FFBA00" d="M73.4 26.5L57.4 1.2c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 28h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z"/>
  </svg>
)

const GoogleCalendarLogo = () => (
  <svg viewBox="0 0 200 200" className="h-7 w-7">
    <path fill="#fff" d="M152.637 200H47.363C21.171 200 0 178.829 0 152.637V47.363C0 21.171 21.171 0 47.363 0h105.274C178.829 0 200 21.171 200 47.363v105.274C200 178.829 178.829 200 152.637 200z"/>
    <path fill="#1a73e8" d="M152.637 200H47.363C21.171 200 0 178.829 0 152.637V47.363C0 21.171 21.171 0 47.363 0h105.274C178.829 0 200 21.171 200 47.363v105.274C200 178.829 178.829 200 152.637 200z"/>
    <path fill="#fff" d="M57.746 141.035h19.082v-76.07H57.746z"/>
    <path fill="#fff" d="M57.746 141.035h84.508V64.965H57.746z" fillOpacity=".2"/>
    <path fill="#ea4335" d="M152.637 0H47.363C21.171 0 0 21.171 0 47.363v.909h200v-.909C200 21.171 178.829 0 152.637 0z" fillOpacity=".2"/>
    <path fill="#1a73e8" d="M133.027 91.27H66.973v9.46h66.054z"/>
    <path fill="#1a73e8" d="M133.027 110.73H66.973v9.46h66.054z"/>
    <path fill="#1a73e8" d="M95.541 72.973h9.459v57.054h-9.459z"/>
  </svg>
)

const NotionLogo = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7">
    <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.224-.186zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.457.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
)

const SlackLogo = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

const FigmaLogo = () => (
  <svg viewBox="0 0 38 57" className="h-7 w-7">
    <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
    <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
    <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
    <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
    <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
  </svg>
)

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7">
    <path fill="currentColor" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)

interface Integration {
  id: string
  name: string
  description: string
  logo: React.ReactNode
  connected: boolean
  status?: 'active' | 'error' | 'pending'
  lastSync?: string
}

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: '문서와 파일을 자동으로 동기화합니다',
      logo: <GoogleDriveLogo />,
      connected: true,
      status: 'active',
      lastSync: '5분 전',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: '미팅 일정을 자동으로 불러옵니다',
      logo: <GoogleCalendarLogo />,
      connected: true,
      status: 'active',
      lastSync: '방금',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: '노션 페이지와 데이터베이스를 연동합니다',
      logo: <NotionLogo />,
      connected: false,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: '슬랙 채널과 스레드를 가져옵니다',
      logo: <SlackLogo />,
      connected: true,
      status: 'active',
      lastSync: '1시간 전',
    },
    {
      id: 'figma',
      name: 'Figma',
      description: '디자인 화면을 자동으로 연결합니다',
      logo: <FigmaLogo />,
      connected: false,
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'PR과 커밋을 결정에 연결합니다',
      logo: <GitHubLogo />,
      connected: true,
      status: 'error',
      lastSync: '동기화 오류',
    },
  ])

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? {
              ...integration,
              connected: !integration.connected,
              status: !integration.connected ? 'pending' : undefined,
              lastSync: !integration.connected ? '연결 중...' : undefined,
            }
          : integration
      )
    )
  }

  const getStatusBadge = (integration: Integration) => {
    if (!integration.connected) return null

    switch (integration.status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            연결됨
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="secondary" className="bg-red-50 text-red-700 gap-1">
            <AlertCircle className="h-3 w-3" />
            오류
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
            연결 중...
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">설정</h1>
        <p className="text-sm text-slate-500 mt-1">
          외부 서비스 연동 및 프로젝트 설정을 관리합니다
        </p>
      </div>

      {/* Integrations Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">서비스 연동</h2>
          <p className="text-sm text-slate-500">
            외부 서비스를 연결하여 자동으로 데이터를 동기화하세요
          </p>
        </div>

        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${
                integration.connected
                  ? 'border-slate-200 shadow-sm'
                  : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50">
                  {integration.logo}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{integration.name}</h3>
                    {getStatusBadge(integration)}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {integration.description}
                  </p>
                  {integration.connected && integration.lastSync && (
                    <p className="text-xs text-slate-400 mt-1">
                      마지막 동기화: {integration.lastSync}
                    </p>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-3">
                {integration.connected && (
                  <Button variant="ghost" size="sm" className="text-slate-500">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Switch
                  checked={integration.connected}
                  onCheckedChange={() => toggleIntegration(integration.id)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Help Text */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-600">
            <strong>💡 팁:</strong> 서비스를 연동하면 미팅 노트, 디자인 파일, 코드 변경사항이
            자동으로 프로젝트 결정과 연결됩니다.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">위험 구역</h2>
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">프로젝트 삭제</h3>
              <p className="text-sm text-red-600 mt-0.5">
                모든 결정, 미팅, 연결이 영구적으로 삭제됩니다
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
              프로젝트 삭제
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
