import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ExportButton'
import { FileUpload } from '@/components/FileUpload'
import type { ImportResult } from '@/lib/import.service'
import {
  Users,
  Building,
  Activity,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Shield,
  Database,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { dashboardApi, handleApiResponse } from '@/lib/rpc'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/dashboard')({
  component: Dashboard,
})

// Types for dashboard data
type DashboardStats = {
  totalUsers: { value: string; change: string; trend: 'up' | 'down' }
  activeTenants: { value: string; change: string; trend: 'up' | 'down' }
  monthlyRevenue: { value: string; change: string; trend: 'up' | 'down' }
  systemHealth: { value: string; change: string; trend: 'up' | 'down' }
}

type RecentTenant = {
  id: string
  name: string
  subdomain: string
  userCount: number
  status: string
  createdAt: Date
}

type SystemActivity = {
  id: string
  action: string
  details: string
  user: string
  timeAgo: string
}

const importColumns = [
  { key: 'name', label: 'Name', required: true, type: 'string' as const },
  { key: 'email', label: 'Email', required: true, type: 'string' as const },
  { key: 'role', label: 'Role', required: false, type: 'string' as const },
  { key: 'status', label: 'Status', required: false, type: 'string' as const },
]

function Dashboard() {
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([])
  const [systemActivity, setSystemActivity] = useState<SystemActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Try to load real data from API, fallback to demo data if it fails
      try {
        // Load dashboard stats
        const statsResponse = await dashboardApi.getStats()
        const statsResult = await handleApiResponse(statsResponse)

        if (statsResult.success) {
          setDashboardStats(statsResult.data as DashboardStats)
        } else {
          // Fallback to demo data
          console.warn('Using demo data for dashboard stats')
          setDashboardStats({
            totalUsers: { value: '12', change: '+12%', trend: 'up' },
            activeTenants: { value: '4', change: '+1', trend: 'up' },
            monthlyRevenue: { value: '$1,200', change: '+18%', trend: 'up' },
            systemHealth: { value: '99.9%', change: '+0.1%', trend: 'up' },
          })
        }
      } catch {
        // Fallback to demo data on error
        setDashboardStats({
          totalUsers: { value: '12', change: '+12%', trend: 'up' },
          activeTenants: { value: '4', change: '+1', trend: 'up' },
          monthlyRevenue: { value: '$1,200', change: '+18%', trend: 'up' },
          systemHealth: { value: '99.9%', change: '+0.1%', trend: 'up' },
        })
      }

      // Try to load recent tenants
      try {
        const tenantsResponse = await dashboardApi.getRecentTenants(3)
        const tenantsResult = await handleApiResponse(tenantsResponse)

        if (tenantsResult.success) {
          setRecentTenants(tenantsResult.data as RecentTenant[])
        } else {
          // Fallback to demo data
          console.warn('Using demo data for recent tenants')
          setRecentTenants([
            {
              id: '1',
              name: 'Demo Corp',
              subdomain: 'demo.ankey.app',
              userCount: 8,
              status: 'Active',
              createdAt: new Date(),
            },
            {
              id: '2',
              name: 'Test Startup',
              subdomain: 'test.ankey.app',
              userCount: 3,
              status: 'Active',
              createdAt: new Date(),
            },
          ])
        }
      } catch {
        // Fallback to demo data
        setRecentTenants([
          {
            id: '1',
            name: 'Demo Corp',
            subdomain: 'demo.ankey.app',
            userCount: 8,
            status: 'Active',
            createdAt: new Date(),
          },
          {
            id: '2',
            name: 'Test Startup',
            subdomain: 'test.ankey.app',
            userCount: 3,
            status: 'Active',
            createdAt: new Date(),
          },
        ])
      }

      // Try to load system activity
      try {
        const activityResponse = await dashboardApi.getSystemActivity(4)
        const activityResult = await handleApiResponse(activityResponse)

        if (activityResult.success) {
          setSystemActivity(activityResult.data as SystemActivity[])
        } else {
          // Fallback to demo data
          console.warn('Using demo data for system activity')
          setSystemActivity([
            {
              id: '1',
              action: 'New tenant created',
              details: 'demo.ankey.app',
              user: 'System',
              timeAgo: '2 hours ago',
            },
            {
              id: '2',
              action: 'User registered',
              details: 'john@demo.com',
              user: 'System',
              timeAgo: '4 hours ago',
            },
          ])
        }
      } catch {
        // Fallback to demo data
        setSystemActivity([
          {
            id: '1',
            action: 'New tenant created',
            details: 'demo.ankey.app',
            user: 'System',
            timeAgo: '2 hours ago',
          },
          {
            id: '2',
            action: 'User registered',
            details: 'john@demo.com',
            user: 'System',
            timeAgo: '4 hours ago',
          },
        ])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data', {
        description: 'Using demo data instead.',
      })

      // Set demo data as final fallback
      setDashboardStats({
        totalUsers: { value: '12', change: '+12%', trend: 'up' },
        activeTenants: { value: '4', change: '+1', trend: 'up' },
        monthlyRevenue: { value: '$1,200', change: '+18%', trend: 'up' },
        systemHealth: { value: '99.9%', change: '+0.1%', trend: 'up' },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result)
    console.log('Import completed:', result)
    // TODO: Process the imported data
  }

  // Create stats array from backend data with fallbacks
  const stats = dashboardStats
    ? [
        {
          title: 'Total Users',
          value: dashboardStats.totalUsers?.value || '0',
          change: dashboardStats.totalUsers?.change || '+0%',
          trend: dashboardStats.totalUsers?.trend || 'up',
          icon: Users,
          color: 'text-blue-600',
        },
        {
          title: 'Active Tenants',
          value: dashboardStats.activeTenants?.value || '0',
          change: dashboardStats.activeTenants?.change || '+0%',
          trend: dashboardStats.activeTenants?.trend || 'up',
          icon: Building,
          color: 'text-green-600',
        },
        {
          title: 'Monthly Revenue',
          value: dashboardStats.monthlyRevenue?.value || '$0',
          change: dashboardStats.monthlyRevenue?.change || '+0%',
          trend: dashboardStats.monthlyRevenue?.trend || 'up',
          icon: DollarSign,
          color: 'text-purple-600',
        },
        {
          title: 'System Health',
          value: dashboardStats.systemHealth?.value || '99.9%',
          change: dashboardStats.systemHealth?.change || '+0%',
          trend: dashboardStats.systemHealth?.trend || 'up',
          icon: Activity,
          color: 'text-emerald-600',
        },
      ]
    : [
        // Fallback data when loading or error
        {
          title: 'Total Users',
          value: '0',
          change: '+0%',
          trend: 'up' as const,
          icon: Users,
          color: 'text-blue-600',
        },
        {
          title: 'Active Tenants',
          value: '0',
          change: '+0%',
          trend: 'up' as const,
          icon: Building,
          color: 'text-green-600',
        },
        {
          title: 'Monthly Revenue',
          value: '$0',
          change: '+0%',
          trend: 'up' as const,
          icon: DollarSign,
          color: 'text-purple-600',
        },
        {
          title: 'System Health',
          value: '99.9%',
          change: '+0%',
          trend: 'up' as const,
          icon: Activity,
          color: 'text-emerald-600',
        },
      ]

  return (
    <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Core Dashboard</h1>
              <p className="text-gray-600">Overview of your multi-tenant platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowImport(!showImport)}>
                <Database className="h-4 w-4 mr-2" />
                {showImport ? 'Hide Import' : 'Import Data'}
              </Button>
              <ExportButton
                data={recentTenants}
                columns={[
                  { key: 'id', label: 'ID', width: 20 },
                  { key: 'name', label: 'Name', width: 25 },
                  { key: 'subdomain', label: 'Subdomain', width: 30 },
                  { key: 'userCount', label: 'User Count', width: 15 },
                  { key: 'status', label: 'Status', width: 15 },
                ]}
                title="Recent Tenants Export"
                metadata={{
                  company: 'Ankey Platform',
                  description: 'Recent tenants data export from core dashboard',
                  exportedBy: 'System Administrator',
                }}
              />
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Import Section */}
        {showImport && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Import User Data</h2>
            <FileUpload
              onImportComplete={handleImportComplete}
              columns={importColumns}
              className="mb-4"
            />
            {importResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Import Summary:</h3>
                <p>Total rows: {importResult.summary.totalRows}</p>
                <p>Valid rows: {importResult.summary.validRows}</p>
                <p>Errors: {importResult.summary.errorRows}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading
            ? // Loading placeholders
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            : stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        {stat.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-red-500 mr-1 rotate-180" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`${stat.color}`}>
                      <stat.icon className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tenants */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Tenants</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {isLoading ? (
                  // Loading placeholders
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : recentTenants.length > 0 ? (
                  recentTenants.map((tenant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{tenant.name}</h3>
                        <p className="text-sm text-gray-600">{tenant.subdomain}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tenant.userCount} users</p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tenant.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent tenants found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">System Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* System status is kept as static for now as it requires different monitoring infrastructure */}
                {[
                  { component: 'API Service', status: 'Operational', uptime: '99.9%' },
                  { component: 'Database', status: 'Operational', uptime: '99.8%' },
                  { component: 'File Storage', status: 'Operational', uptime: '100%' },
                  { component: 'Email Service', status: 'Operational', uptime: '98.5%' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          item.status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="font-medium">{item.component}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.uptime}</p>
                      <p
                        className={`text-xs ${
                          item.status === 'Operational' ? 'text-green-600' : 'text-yellow-600'
                        }`}
                      >
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Building className="h-6 w-6 mb-2" />
                  <span>Create Tenant</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Security</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Reports</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {isLoading ? (
                  // Loading placeholders
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center animate-pulse">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))
                ) : systemActivity.length > 0 ? (
                  systemActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.timeAgo}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
