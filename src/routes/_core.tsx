import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { LoginForm } from '@/components/auth/LoginForm'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Settings, User, Bell, Search } from 'lucide-react'

export const Route = createFileRoute('/_core')({
  component: CoreLayout,
})

function CoreLayout() {
  const { openDrawer } = useDrawer()

  const handleSignIn = () => {
    openDrawer(
      <LoginForm
        isTenant={false}
        onSubmit={async data => {
          // TODO: Implement admin login logic
          console.log('Admin Login:', data)
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-gray-900">
                <Link to="/dashboard">Solo Admin</Link>
              </h1>
              <nav className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium [&.active]:bg-gray-100 [&.active]:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/pricing-admin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium [&.active]:bg-gray-100 [&.active]:text-gray-900"
                >
                  Pricing Admin
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignIn}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>© 2024 Solo Platform. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link to="/" className="hover:text-gray-900">
                Public Site
              </Link>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
