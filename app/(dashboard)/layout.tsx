import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { HeaderRecordButton } from "@/components/header-record-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // [임시 비활성화] 로그인 없이 접근 허용
  // await requireUser()
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-6">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-secondary/50" />
          <HeaderRecordButton />
        </header>
        <main className="flex-1 p-8 bg-gradient-to-br from-background via-background to-secondary/20">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
