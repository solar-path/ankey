import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { letMeInSchema, type LetMeInData } from '@/shared'

interface LetMeInFormProps {
  onSubmit: (data: LetMeInData) => Promise<void>
  isLoading?: boolean
  workspaceName?: string
}

export function LetMeInForm({ onSubmit, isLoading = false, workspaceName }: LetMeInFormProps) {
  const { closeDrawer } = useDrawer()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LetMeInData>({
    resolver: zodResolver(letMeInSchema),
  })

  const handleFormSubmit = async (data: LetMeInData) => {
    try {
      await onSubmit(data)
      closeDrawer()
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Request Access</h2>
        <p className="text-gray-600 mt-2">
          Request access to {workspaceName ? `the ${workspaceName} workspace` : 'this workspace'}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="text-amber-600 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-800">Access Request Process</h3>
            <div className="text-sm text-amber-700 mt-1">
              Your request will be sent to workspace administrators for approval. You'll receive an
              email once your request is reviewed.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            {...register('fullName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your full name"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Access
          </label>
          <textarea
            id="reason"
            {...register('reason')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please explain why you need access to this workspace..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Help administrators understand why you need access
          </p>
          {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Your request is sent to workspace administrators</li>
            <li>Administrators review your request and reason</li>
            <li>You'll receive an email with the decision</li>
            <li>If approved, you'll get login credentials</li>
          </ol>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Submitting Request...' : 'Submit Access Request'}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              // TODO: Go back to login form
              closeDrawer()
            }}
          >
            Back to Login
          </Button>
        </div>
      </form>
    </div>
  )
}

// Add metadata for QDrawer
;(LetMeInForm as any).defaultTitle = 'Request Access'
;(LetMeInForm as any).defaultDescription = 'Submit a request to join this workspace'
