import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { client, handleApiResponse } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { Activity, AlertTriangle, Clock, Key, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

export const Route = createFileRoute('/_core/account/security')({
  component: SecurityPage,
})

const passwordExpirySchema = z.object({
  passwordExpiryDays: z.number().min(0).max(365),
})

type PasswordExpiryFormData = z.infer<typeof passwordExpirySchema>

function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  const [passwordStatus, setPasswordStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [activeSessions] = useState(1)

  const passwordExpiryForm = useForm<PasswordExpiryFormData>({
    resolver: zodResolver(passwordExpirySchema),
    defaultValues: {
      passwordExpiryDays: user?.passwordExpiryDays || 45,
    },
  })

  // Update form default values when user data is loaded
  useEffect(() => {
    if (user?.passwordExpiryDays !== undefined) {
      passwordExpiryForm.reset({
        passwordExpiryDays: user.passwordExpiryDays,
      })
    }
  }, [user?.passwordExpiryDays, passwordExpiryForm])

  // Derived security stats from real data
  const securityStats = {
    lastLogin: loginHistory.length > 0 ? loginHistory[0]?.date : null,
    failedAttempts: loginHistory.filter(login => !login.success).length,
    activeSessions,
    apiKeys: 0, // No API key system implemented yet
  }

  // Fetch user data and security information
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data, login history, and password status in parallel
        const [userResponse, historyResponse, passwordStatusResponse] = await Promise.all([
          client.auth.me.$get(),
          client.auth['login-history'].$get(),
          client.auth['password-status'].$get(),
        ])

        const userResult = await handleApiResponse(userResponse)
        const historyResult = await handleApiResponse(historyResponse)
        const passwordStatusResult = await handleApiResponse(passwordStatusResponse)

        if (userResult.success) {
          setUser(userResult.data)
        }

        if (historyResult.success && Array.isArray(historyResult.data)) {
          setLoginHistory(historyResult.data)
        } else {
          setLoginHistory([])
        }

        if (passwordStatusResult.success) {
          setPasswordStatus(passwordStatusResult.data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
        setHistoryLoading(false)
      }
    }

    fetchData()
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

  const onUpdatePasswordExpiry: SubmitHandler<PasswordExpiryFormData> = async (data) => {
    try {
      const response = await client.auth['password-expiry-settings'].$post({ json: data })
      const result = await handleApiResponse(response)

      if (result.success) {
        // Refresh user data and password status
        const [userResponse, passwordStatusResponse] = await Promise.all([
          client.auth.me.$get(),
          client.auth['password-status'].$get(),
        ])

        const userResult = await handleApiResponse(userResponse)
        const passwordStatusResult = await handleApiResponse(passwordStatusResponse)

        if (userResult.success) {
          setUser(userResult.data)
        }

        if (passwordStatusResult.success) {
          setPasswordStatus(passwordStatusResult.data)
        }
      }
    } catch (error) {
      console.error('Failed to update password expiry settings:', error)
    }
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
                <span className="text-sm text-gray-600 dark:text-gray-400">2FA Status</span>
                <Badge
                  variant={user.twoFactorEnabled ? 'default' : 'secondary'}
                  className={
                    user.twoFactorEnabled
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }
                >
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Password</span>
                <div className="flex items-center space-x-2">
                  {passwordStatus?.showWarning && (
                    <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Expires in {passwordStatus.daysUntilExpiry} days
                    </Badge>
                  )}
                  {passwordStatus?.isExpired && (
                    <Badge variant="destructive" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Expired
                    </Badge>
                  )}
                  {!passwordStatus?.isExpired && !passwordStatus?.showWarning && (
                    <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {passwordStatus?.passwordExpiryDays === 0 ? 'Never Expires' : 'Strong'}
                    </Badge>
                  )}
                </div>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">API Keys</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {securityStats.apiKeys} active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sessions</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {securityStats.activeSessions} active
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {securityStats.lastLogin
                    ? new Date(securityStats.lastLogin).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed Attempts</span>
                <span
                  className={`text-sm font-medium ${securityStats.failedAttempts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  {securityStats.failedAttempts > 0
                    ? `${securityStats.failedAttempts} recent`
                    : 'None'}
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
          <CardTitle className="text-gray-900 dark:text-gray-100">Login History</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Recent sign-in activity for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loginHistory && loginHistory.length > 0 ? (
              loginHistory.map((login: any, index: number) => (
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
                        className={
                          login.success
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
                      <span>
                        {new Date(login.date).toLocaleDateString()}{' '}
                        {new Date(login.date).toLocaleTimeString()}
                      </span>
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

      {/* Password Expiration Settings */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Password Expiration Settings
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configure how often passwords must be updated (applies to all users)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordExpiryForm}>
            <form onSubmit={passwordExpiryForm.handleSubmit(onUpdatePasswordExpiry)} className="space-y-4">
              <FormField
                control={passwordExpiryForm.control}
                name="passwordExpiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">
                      Password Expiration (days)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        placeholder="45"
                        className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set to 0 for passwords that never expire. Users will receive warnings 7 days before expiration.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                disabled={passwordExpiryForm.formState.isSubmitting}
              >
                {passwordExpiryForm.formState.isSubmitting ? 'Updating...' : 'Update Settings'}
              </Button>
            </form>
          </Form>
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
            {user && !user.twoFactorEnabled && (
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

            {passwordStatus?.isExpired && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Password Expired
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Your password has expired. Please update it immediately to maintain account security.
                  </p>
                </div>
              </div>
            )}

            {passwordStatus?.showWarning && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Password Expires Soon
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your password expires in {passwordStatus.daysUntilExpiry} days. Consider updating it soon.
                  </p>
                </div>
              </div>
            )}

            {!passwordStatus?.isExpired && !passwordStatus?.showWarning && user?.twoFactorEnabled && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Key className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Strong Security ✓
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your account has strong security with 2FA enabled and a valid password.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
