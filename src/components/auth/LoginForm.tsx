import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { client, handleApiResponse } from '@/lib/rpc'
import { loginSchema, type LoginData } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { LetMeInForm } from './LetMeInForm'

interface LoginFormProps {
  onSubmit?: (data: LoginData) => Promise<void>
  isLoading?: boolean
  isTenant?: boolean
}

export function LoginForm({
  onSubmit,
  isLoading: externalLoading = false,
  isTenant = false,
}: LoginFormProps) {
  const { closeDrawer, openDrawer } = useDrawer()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // Auto-detect tenant context from URL
  const detectTenantContext = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]
      // Check if we're on a tenant subdomain (not localhost, www, or core domains)
      return !['localhost', 'www', 'api', 'core'].includes(subdomain) && subdomain !== hostname
    }
    return false
  }

  const isActuallyTenant = isTenant || detectTenantContext()

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  })

  const handleFormSubmit = async (data: LoginData) => {
    console.log('Submitting login form with data:', data)
    console.log('Tenant context detected:', isActuallyTenant)
    console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side')
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log(data)
        // Use RPC client for login
        const authClient = isActuallyTenant ? client['tenant-auth'] : client.auth
        console.log('Using auth client:', isActuallyTenant ? 'tenant-auth' : 'core-auth')
        const response = await authClient.login.$post({
          json: data,
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Login failed')
        }

        console.log('Login successful:', result.data)

        // Show success toast
        toast.success('Welcome back!', {
          description: 'You have been successfully logged in.',
        })

        // Handle successful login
        if (result.data && !(result.data as any).requiresTwoFactor) {
          form.reset()
          closeDrawer() // Close drawer before navigation

          // Navigate to appropriate dashboard based on user type
          if (isActuallyTenant) {
            // For tenant users, navigate to tenant dashboard
            navigate({ to: '/tenantDashboard' })
          } else {
            // For core admin users, navigate to core dashboard
            navigate({ to: '/dashboard' })
          }
          return
        }
      }

      form.reset()
      closeDrawer()
    } catch (error) {
      console.error('Login error:', error)

      // Show error toast
      toast.error('Login failed', {
        description:
          error instanceof Error ? error.message : 'Please check your credentials and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="twoFactorCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Two-Factor Code (if enabled)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter 6-digit code" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => openDrawer(<ForgotPasswordForm />)}
            >
              Forgot Password?
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
            {isSubmitting || externalLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          {isActuallyTenant && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() =>
                  openDrawer(
                    <LetMeInForm
                      onSubmit={async data => {
                        // TODO: Implement actual API call for access request
                        console.log('Access request submitted:', data)
                        // This would typically call a tenant API endpoint
                        // await tenantAuth.requestAccess.$post({ json: data })
                      }}
                    />
                  )
                }
              >
                Don't have access? Request Access
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

// Add metadata for QDrawer
;(LoginForm as any).defaultTitle = 'Sign In'
;(LoginForm as any).defaultDescription = 'Enter your credentials to access your account'
