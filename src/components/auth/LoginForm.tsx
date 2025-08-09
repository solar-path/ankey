import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  })

  const handleFormSubmit = async (data: LoginData) => {
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log(data)
        // Use RPC client for login
        const authClient = isTenant ? client['tenant-auth'] : client.auth
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
          reset()
          closeDrawer() // Close drawer before navigation

          // Navigate to appropriate dashboard based on user type
          if (isTenant) {
            // For tenant users, navigate to root - they'll be handled by tenant subdomain routing
            navigate({ to: '/' })
          } else {
            // For core admin users, navigate to core dashboard
            navigate({ to: '/dashboard' })
          }
          return
        }
      }

      reset()
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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
            Two-Factor Code (if enabled)
          </Label>
          <Input
            id="twoFactorCode"
            type="text"
            {...register('twoFactorCode')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          {errors.twoFactorCode && (
            <p className="text-red-500 text-sm mt-1">{errors.twoFactorCode.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => openDrawer(<ForgotPasswordForm />)}>
            Forgot Password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
          {isSubmitting || externalLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {isTenant && (
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
    </div>
  )
}

// Add metadata for QDrawer
;(LoginForm as any).defaultTitle = 'Sign In'
;(LoginForm as any).defaultDescription = 'Enter your credentials to access your account'
