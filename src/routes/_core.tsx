import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { CoreSidebar } from '@/components/QSideBar/QSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/_core')({
  component: CoreLayoutWrapper,
  beforeLoad: async () => {
    // Note: We check auth in the component instead of beforeLoad to avoid redirect loops
    // The actual auth check happens in the AuthChecker component
  },
})

function CoreLayoutWrapper() {
  return (
    <AuthProvider>
      <AuthChecker>
        <CoreLayout />
      </AuthChecker>
    </AuthProvider>
  )
}

function AuthChecker({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to home page where login is available via QDrawer
      navigate({ to: '/' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

function CoreLayout() {
  return (
    <SidebarProvider>
      <CoreSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
