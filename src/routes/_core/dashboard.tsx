import { SiteHeader } from '@/components/QSideBar/site-header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_core/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="flex-1 overflow-hidden">
      <SiteHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Core Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your multi-tenant platform
          </p>
        </div>
      </div>
    </div>
  )
}
