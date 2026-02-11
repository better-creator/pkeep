'use client'

import { useState } from "react"
import { Plus, ChevronRight, ChevronDown, ExternalLink, MoreHorizontal, MonitorSmartphone, Link2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for screens (IA structure)
interface Screen {
  id: string
  code: string
  name: string
  description?: string
  figma_url?: string
  children?: Screen[]
  decisions?: string[]
}

const mockScreens: Screen[] = [
  {
    id: "1",
    code: "SCR-001",
    name: "홈",
    description: "프로젝트 개요가 표시되는 메인 랜딩 페이지",
    figma_url: "https://figma.com/...",
    decisions: ["DEC-001", "DEC-002"],
    children: [
      {
        id: "1-1",
        code: "SCR-002",
        name: "대시보드",
        description: "최근 활동이 표시되는 사용자 대시보드",
        decisions: ["DEC-001"],
      },
      {
        id: "1-2",
        code: "SCR-003",
        name: "프로젝트 목록",
        description: "모든 프로젝트 목록",
        children: [
          {
            id: "1-2-1",
            code: "SCR-004",
            name: "프로젝트 상세",
            description: "개별 프로젝트 상세 보기",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    code: "SCR-005",
    name: "설정",
    description: "사용자 및 팀 설정",
    children: [
      {
        id: "2-1",
        code: "SCR-006",
        name: "프로필 설정",
        description: "사용자 프로필 관리",
      },
      {
        id: "2-2",
        code: "SCR-007",
        name: "팀 설정",
        description: "팀 구성 및 멤버 관리",
      },
    ],
  },
]

function ScreenTreeItem({ screen, level = 0 }: { screen: Screen; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = screen.children && screen.children.length > 0

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-primary font-medium shrink-0">{screen.code}</span>
          <span className="font-medium truncate">{screen.name}</span>
          {screen.decisions && screen.decisions.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 shrink-0">
              {screen.decisions.length}개 결정
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {screen.figma_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem className="rounded-lg">수정</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">하위 화면 추가</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">타임라인 보기</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg text-destructive">삭제</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {screen.children!.map((child) => (
            <ScreenTreeItem key={child.id} screen={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ScreensPage() {
  const isEmpty = mockScreens.length === 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">화면</h1>
          <p className="text-muted-foreground mt-1">프로젝트의 정보 구조(IA)</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-soft">
          <Plus className="h-4 w-4 mr-2" />
          새 화면
        </Button>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="empty-state rounded-2xl bg-secondary/30">
          <MonitorSmartphone className="empty-state-icon" />
          <h3 className="text-lg font-medium mb-2">정의된 화면이 없습니다</h3>
          <p className="text-muted-foreground max-w-sm">
            화면을 추가하여 정보 구조를 정의하세요. 결정 및 Figma 디자인과 연결할 수 있습니다.
          </p>
          <Button className="mt-6 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            첫 번째 화면 추가
          </Button>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Screen Tree */}
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="font-medium">화면 계층 구조</h2>
            </div>
            <div className="space-y-1">
              {mockScreens.map((screen) => (
                <ScreenTreeItem key={screen.id} screen={screen} />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-soft p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <MonitorSmartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">7</div>
                  <p className="text-sm text-muted-foreground">전체 화면</p>
                </div>
              </div>
            </div>
            <div className="card-soft p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <ExternalLink className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">3</div>
                  <p className="text-sm text-muted-foreground">Figma 연결됨</p>
                </div>
              </div>
            </div>
            <div className="card-soft p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <Link2 className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">4</div>
                  <p className="text-sm text-muted-foreground">연결된 결정</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
