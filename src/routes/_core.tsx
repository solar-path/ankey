import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { CoreSidebar } from '@/components/CoreSidebar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Loader2 } from 'lucide-react'

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
  const { openDrawer } = useDrawer()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Show login form if not authenticated
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ankey Admin</h1>
              <p className="text-gray-600">Sign in to access the admin dashboard</p>
            </div>
            <LoginForm isTenant={false} />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function CoreLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <CoreSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
