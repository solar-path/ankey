import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/shared'
import { useState } from 'react'
import { coreAuth, handleApiResponse } from '@/lib/rpc'

interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordData) => Promise<void>
  isLoading?: boolean
}

export function ForgotPasswordForm({
  onSubmit,
  isLoading: externalLoading = false,
}: ForgotPasswordFormProps) {
  const { closeDrawer } = useDrawer()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleFormSubmit = async (data: ForgotPasswordData) => {
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Use RPC client for forgot password
        const response = await coreAuth['forgot-password'].$post({
          json: data,
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Failed to send reset email')
        }

        console.log('Password reset email sent:', result.data)

        // In a real app, you'd show a success message
      }
      reset()
      closeDrawer()
    } catch (error) {
      console.error('Error sending reset email:', error)
      // In a real app, you'd show error toast or inline message
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
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
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
          {isSubmitting || externalLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => {
                // This will be handled by the parent component
                console.log('Switch to login form')
              }}
            >
              Sign in instead
            </Button>
          </p>
        </div>
      </form>
    </div>
  )
}

// Add metadata for QDrawer
;(ForgotPasswordForm as any).defaultTitle = 'Reset Password'
;(ForgotPasswordForm as any).defaultDescription = 'Get a link to reset your password'
