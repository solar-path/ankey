import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { forgotPasswordSchema, type ForgotPasswordData } from '@/shared'

interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordData) => Promise<void>
  isLoading?: boolean
}

export function ForgotPasswordForm({ onSubmit, isLoading = false }: ForgotPasswordFormProps) {
  const { closeDrawer } = useDrawer()

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
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log('Forgot password data:', data)
      }
      reset()
      closeDrawer()
    } catch (error) {
      console.error('Error sending reset email:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset Your Password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a link to reset your password
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
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
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
