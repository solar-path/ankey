import { TenantSidebar } from '@/components/QSideBar/TenantSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/_tenant')({
  component: TenantLayoutWrapper,
  beforeLoad: async () => {
    // Note: We check auth in the component instead of beforeLoad to avoid redirect loops
    // The actual auth check happens in the AuthChecker component
  },
})

function TenantLayoutWrapper() {
  return (
    <AuthProvider>
      <AuthChecker>
        <TenantLayout />
      </AuthChecker>
    </AuthProvider>
  )
}

function AuthChecker({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to public page if not authenticated
      navigate({ to: '/' })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}

function TenantLayout() {
  return (
    <SidebarProvider>
      <TenantSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
