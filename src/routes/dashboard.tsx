import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ExportButton'
import { FileUpload } from '@/components/FileUpload'
import { ImportResult } from '@/lib/import.service'
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
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

// Mock data for demonstration
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'Inactive' },
]

const exportColumns = [
  { key: 'id', label: 'ID', width: 10 },
  { key: 'name', label: 'Name', width: 20 },
  { key: 'email', label: 'Email', width: 25 },
  { key: 'role', label: 'Role', width: 15 },
  { key: 'status', label: 'Status', width: 15 },
]

const importColumns = [
  { key: 'name', label: 'Name', required: true, type: 'string' as const },
  { key: 'email', label: 'Email', required: true, type: 'string' as const },
  { key: 'role', label: 'Role', required: false, type: 'string' as const },
  { key: 'status', label: 'Status', required: false, type: 'string' as const },
]

function Dashboard() {
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result)
    console.log('Import completed:', result)
    // TODO: Process the imported data
  }

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Tenants',
      value: '89',
      change: '+5%',
      trend: 'up',
      icon: Building,
      color: 'text-green-600',
    },
    {
      title: 'Monthly Revenue',
      value: '$24,500',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: '+0.1%',
      trend: 'up',
      icon: Activity,
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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
                data={mockUsers}
                columns={exportColumns}
                title="User Data Export"
                metadata={{
                  company: 'Ankey Platform',
                  description: 'User data export from core dashboard',
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
          {stats.map((stat, index) => (
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
                {[
                  { name: 'Acme Corp', subdomain: 'acme', users: 25, status: 'Active' },
                  { name: 'Tech Startup', subdomain: 'techco', users: 8, status: 'Trial' },
                  { name: 'Global Inc', subdomain: 'global', users: 150, status: 'Active' },
                ].map((tenant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-gray-600">{tenant.subdomain}.ankey.app</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{tenant.users} users</p>
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
                ))}
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
                {[
                  { component: 'API Service', status: 'Operational', uptime: '99.9%' },
                  { component: 'Database', status: 'Operational', uptime: '99.8%' },
                  { component: 'File Storage', status: 'Operational', uptime: '100%' },
                  { component: 'Email Service', status: 'Degraded', uptime: '97.2%' },
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
                {[
                  { action: 'New tenant created', details: 'acme.ankey.app', time: '2 hours ago' },
                  {
                    action: 'User permission updated',
                    details: 'john@example.com',
                    time: '4 hours ago',
                  },
                  {
                    action: 'System backup completed',
                    details: 'All databases',
                    time: '6 hours ago',
                  },
                  {
                    action: 'Security scan completed',
                    details: 'No issues found',
                    time: '1 day ago',
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
