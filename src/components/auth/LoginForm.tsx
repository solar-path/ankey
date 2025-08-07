import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { loginSchema, type LoginData } from '@/shared'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { LetMeInForm } from './LetMeInForm'
import { useState } from 'react'
import { coreAuth, tenantAuth, handleApiResponse } from '@/lib/rpc'

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
        // Use RPC client for login
        const authClient = isTenant ? tenantAuth : coreAuth
        const response = await authClient.login.$post({
          json: data,
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Login failed')
        }

        console.log('Login successful:', result.data)

        // In a real app, you'd handle the login success (redirect, etc.)
        if (result.data && !(result.data as any).requiresTwoFactor) {
          // Successful login - could redirect or update global state
          window.location.reload() // Simple approach for now
        }
      }

      reset()
      closeDrawer()
    } catch (error) {
      console.error('Login error:', error)
      // In a real app, you'd show a toast notification or inline error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = () => {
    openDrawer(
      <ForgotPasswordForm
        onSubmit={async data => {
          console.log('Forgot password:', data)
        }}
      />
    )
  }

  const handleLetMeIn = () => {
    openDrawer(
      <LetMeInForm
        onSubmit={async data => {
          console.log('Let me in:', data)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Sign In {isTenant ? 'to Workspace' : 'as Admin'}</h2>
        <p className="text-gray-600 mt-2">
          {isTenant ? 'Access your workspace account' : 'Access the admin control panel'}
        </p>
      </div>

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
          <Button type="button" variant="ghost" onClick={handleForgotPassword}>
            Forgot Password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
          {isSubmitting || externalLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {isTenant && (
          <div className="text-center">
            <Button type="button" variant="link" onClick={handleLetMeIn}>
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
