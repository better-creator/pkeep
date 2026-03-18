'use client'

import * as React from "react"
import {
  Mic,
  CircleDot,
  ListChecks,
  LayoutDashboard,
  FolderOutput,
  Bot,
  Settings,
  FolderKanban,
  ChevronDown,
  Plus,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { StoredDecision, StoredRejected } from "@/lib/store/types"
import { detectConflicts, countUnresolved, type Conflict } from "@/lib/conflicts"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  const [unresolvedCount, setUnresolvedCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  // Load projects from localStorage
  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  // Load conflict count
  useEffect(() => {
    try {
      const decisions: StoredDecision[] = JSON.parse(localStorage.getItem('pkeep-decisions') || '[]')
      const rejected: StoredRejected[] = JSON.parse(localStorage.getItem('pkeep-rejected') || '[]')
      const detected = detectConflicts(decisions, rejected)
      const saved: Conflict[] | null = JSON.parse(localStorage.getItem('pkeep-conflicts') || 'null')
      if (saved) {
        for (const d of detected) {
          const s = saved.find(
            sv => sv.newDecision.id === d.newDecision.id && sv.existingDecision.id === d.existingDecision.id && sv.type === d.type
          )
          if (s?.resolved) { d.resolved = true; d.resolution = s.resolution }
        }
      }
      setUnresolvedCount(countUnresolved(detected))
    } catch {
      // localStorage may not be available during SSR
    }
  }, [])

  const handleCreateProject = () => {
    const name = newProjectName.trim()
    if (!name) return

    const id = `proj-${Date.now()}`
    const project: StoredProject = {
      id,
      name,
      createdAt: new Date().toISOString(),
    }
    saveProject(project)
    setProjects(loadProjects())
    setNewProjectName("")
    setDialogOpen(false)
    router.push(`/${teamId}/${id}/meetings`)
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
      title: "충돌",
      icon: AlertTriangle,
      href: `/${teamId}/${projectId}/conflicts`,
      badge: unresolvedCount,
    },
    {
      title: "할 일",
      icon: ListChecks,
      href: `/${teamId}/${projectId}/tasks`,
    },
    {
      title: "결과물",
      icon: FolderOutput,
      href: `/${teamId}/${projectId}/outputs`,
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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm shadow-md">
              PK
            </div>
            <div>
              <span className="font-semibold text-sm bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">PKEEP</span>
              <p className="text-[10px] text-muted-foreground">AI 프로젝트 매니저</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          {/* Team & Project Selector */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-1">프로젝트</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between h-10 rounded-xl bg-secondary/50 hover:bg-secondary px-3">
                        <span className="flex items-center gap-2.5">
                          <FolderKanban className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-sm truncate">
                            {currentProject?.name || "프로젝트 선택"}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl">
                      {projects.map((project) => (
                        <DropdownMenuItem key={project.id} asChild className="rounded-lg">
                          <Link href={`/${teamId}/${project.id}/meetings`}>
                            {project.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {projects.length === 0 && (
                        <DropdownMenuItem disabled className="rounded-lg text-muted-foreground text-sm">
                          프로젝트가 없습니다
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="rounded-lg text-orange-600"
                        onSelect={() => setDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        새 프로젝트
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Navigation */}
          {projectId && (
            <SidebarGroup className="mt-4">
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
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'hover:bg-secondary/50'
                          } ${'accent' in item && item.accent && !isActive ? 'text-orange-500' : ''}`}
                        >
                          <Link href={item.href} className="flex items-center gap-2.5">
                            <item.icon className={`h-4 w-4 ${isActive ? 'text-orange-500' : 'accent' in item && item.accent ? 'text-orange-500' : ''}`} />
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
            <SidebarMenuItem>
              <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
                <Avatar className="h-7 w-7 ring-2 ring-orange-500/20">
                  <AvatarFallback className="text-xs bg-orange-500/10 text-orange-600">게</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">게스트</span>
                  <span className="text-[10px] text-muted-foreground">무료 플랜</span>
                </div>
              </div>
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
                if (e.key === 'Enter') handleCreateProject()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
