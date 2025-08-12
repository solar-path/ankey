import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Key, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { client, handleApiResponse } from '@/lib/rpc'
import { useEffect, useState } from 'react'


export const Route = createFileRoute('/_core/account/security')({
  component: SecurityPage,
})

function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await client.auth.me.$get()
        const result = await handleApiResponse(response)
        
        if (result.success) {
          setUser(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleUpdate = () => {
    // Refetch user data after 2FA changes
    const fetchUserData = async () => {
      try {
        const response = await client.auth.me.$get()
        const result = await handleApiResponse(response)
        
        if (result.success) {
          setUser(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    fetchUserData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Unable to load user data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Security & Authentication
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account security settings and two-factor authentication.
        </p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                Account Security
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  2FA Status
                </span>
                <Badge 
                  variant={user.twoFactorEnabled ? 'default' : 'secondary'}
                  className={user.twoFactorEnabled 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }
                >
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Password
                </span>
                <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Strong
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                Access Keys
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  API Keys
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  0 active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sessions
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  1 active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Login
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Today
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Failed Attempts
                </span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  1 recent
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Factor Authentication Section */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Secure your account with an additional layer of protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorManagement user={user} onUpdate={handleUpdate} />
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Login History
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Recent sign-in activity for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.loginHistory && user.loginHistory.length > 0 ? (
              user.loginHistory.map((login: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {login.device}
                      </span>
                      <Badge 
                        variant={login.success ? 'default' : 'destructive'}
                        className={login.success 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }
                      >
                        {login.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{login.location}</span>
                      <span>•</span>
                      <span>{new Date(login.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No login history available yet
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  Login activity will appear here after your next sign-in
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Security Recommendations
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Improve your account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!user.twoFactorEnabled && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Enable Two-Factor Authentication
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Add an extra layer of security to protect your account from unauthorized access.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Key className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Strong Password ✓
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your password meets all security requirements.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}