'use client'

import * as React from "react"
import {
  Mic,
  CircleDot,
  ListChecks,
  LayoutDashboard,
  Bot,
  Settings,
  ChevronDown,
  Plus,
  BookOpen,
  Layers,
  Upload,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { loadProjects, saveProject, type StoredProject } from "@/lib/store"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PkeepLogo } from '@/components/brand/Logo'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DEFAULT_TEAM_ID = "team-1"

export function AppSidebar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const teamId = params.teamId as string || DEFAULT_TEAM_ID
  const projectId = params.projectId as string

  const [projects, setProjects] = useState<StoredProject[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  // Load projects from localStorage
  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateProject = () => {
    if (isCreating) return // 중복 호출 방지
    const name = newProjectName.trim()
    if (!name) return

    setIsCreating(true)
    const id = `proj-${Date.now()}`
    const project: StoredProject = {
      id,
      name,
      createdAt: new Date().toISOString(),
    }
    saveProject(project)
    setNewProjectName("")
    setDialogOpen(false)
    window.location.href = `/${teamId}/${id}/dashboard`
  }

  const currentProject = projects.find(p => p.id === projectId)

  const navItems = [
    {
      title: "대시보드",
      icon: LayoutDashboard,
      href: `/${teamId}/${projectId}/dashboard`,
    },
    {
      title: "녹음",
      icon: Mic,
      href: `/${teamId}/${projectId}/meetings`,
    },
    {
      title: "결정",
      icon: CircleDot,
      href: `/${teamId}/${projectId}/decisions`,
    },
    {
      title: "브랜드 가이드",
      icon: BookOpen,
      href: `/${teamId}/${projectId}/guide`,
    },
    {
      title: "할 일",
      icon: ListChecks,
      href: `/${teamId}/${projectId}/tasks`,
    },
    {
      title: "클라이언트 포털",
      icon: Users,
      href: `/${teamId}/${projectId}/client-portal`,
    },
    {
      title: "AI 진단",
      icon: Bot,
      href: `/${teamId}/${projectId}/ai`,
      accent: true,
    },
  ]

  return (
    <>
      <Sidebar className="border-r border-sidebar-border/30 sidebar-glass">
        <SidebarHeader className="border-b border-sidebar-border/30 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 w-full hover:bg-secondary/50 rounded-xl px-1 py-1 transition-colors text-left">
                <PkeepLogo size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {currentProject?.name || "프로젝트 선택"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">게스트 · 무료 플랜</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl">
                      {projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          className="rounded-lg cursor-pointer"
                          onSelect={() => {
                            window.location.href = `/${teamId}/${project.id}/dashboard`
                          }}
                        >
                          {project.name}
                        </DropdownMenuItem>
                      ))}
                      {projects.length === 0 && (
                        <DropdownMenuItem disabled className="rounded-lg text-muted-foreground text-sm">
                          프로젝트가 없습니다
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="rounded-lg text-primary"
                        onSelect={() => setDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 프로젝트
                      </DropdownMenuItem>
                    </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        <SidebarContent className="p-2">

          {/* 녹음 버튼 — accent (coral) */}
          {projectId && (
            <SidebarGroup className="mt-2">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="h-11 rounded-xl px-3 bg-accent hover:bg-accent-hover text-white font-semibold shadow-sm"
                    >
                      <Link href={`/${teamId}/${projectId}/meetings`} className="flex items-center gap-2.5">
                        <Mic className="h-5 w-5" />
                        <span className="text-sm">새 녹음</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Navigation */}
          {projectId && (
            <SidebarGroup className="mt-2">
              <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-1">메뉴</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`h-10 rounded-xl px-3 ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-secondary/50'
                          } ${'accent' in item && item.accent && !isActive ? 'text-primary' : ''}`}
                        >
                          <Link href={item.href} className="flex items-center gap-2.5">
                            <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'accent' in item && item.accent ? 'text-primary' : ''}`} />
                            <span className="font-medium text-sm">{item.title}</span>
                            {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                              <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/30 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 rounded-xl px-3 hover:bg-secondary/50">
                <Link href={`/${teamId}/settings`} className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium text-sm">설정</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>새 프로젝트</DialogTitle>
            <DialogDescription>프로젝트 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="project-name">프로젝트 이름</Label>
            <Input
              id="project-name"
              placeholder="예: 신규 앱 MVP"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCreateProject()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
