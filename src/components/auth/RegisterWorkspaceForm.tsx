import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { client, handleApiResponse } from '@/lib/rpc'
import { registerSchema, type RegisterData } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface RegisterWorkspaceFormProps {
  onSubmit?: (data: RegisterData) => Promise<void>
  isLoading?: boolean
}

interface PasswordComplexityProps {
  password: string
  className?: string
}

function PasswordComplexity({ password, className }: PasswordComplexityProps) {
  const requirements = [
    {
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: 'One lowercase letter',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: 'One uppercase letter',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'One number',
      test: (pwd: string) => /\d/.test(pwd),
    },
    {
      label: 'One symbol (@$!%*?&)',
      test: (pwd: string) => /[@$!%*?&]/.test(pwd),
    },
  ]

  const passedCount = requirements.filter(req => req.test(password)).length
  const progress = (passedCount / requirements.length) * 100

  const getStrengthColor = () => {
    if (progress < 40) return 'bg-red-500'
    if (progress < 60) return 'bg-yellow-500'
    if (progress < 80) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (progress < 40) return 'Weak'
    if (progress < 60) return 'Fair'
    if (progress < 80) return 'Good'
    return 'Strong'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Password strength</span>
          <span className={`text-sm font-medium ${
            progress < 40 ? 'text-red-600 dark:text-red-400' :
            progress < 60 ? 'text-yellow-600 dark:text-yellow-400' :
            progress < 80 ? 'text-orange-600 dark:text-orange-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2" />
          <div
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password)
          return (
            <div key={index} className="flex items-center gap-2">
              {passed ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
              ) : (
                <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              )}
              <span className={`text-sm ${
                passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {req.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RegisterWorkspaceForm({
  onSubmit,
  isLoading: externalLoading = false,
}: RegisterWorkspaceFormProps) {
  const { closeDrawer } = useDrawer()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      workspace: '',
      fullName: '',
      email: '',
      password: '',
      acceptTerms: false,
    },
  })

  const workspaceName = form.watch('workspace')
  const password = form.watch('password')

  const handleFormSubmit = async (data: RegisterData) => {
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Use RPC client for workspace registration
        const response = await client.auth['register-workspace'].$post({
          json: data,
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Registration failed')
        }

        // Show success toast
        toast.success('Workspace created successfully!', {
          description: 'Welcome to your new workspace. You can now start managing your team.',
        })

        console.log('Workspace created successfully:', result.data)

        // Navigate to core dashboard after successful registration
        navigate({ to: '/dashboard' })
        return // Early return to avoid duplicate closeDrawer
      }
      closeDrawer()
    } catch (error) {
      console.error('Registration error:', error)

      // Show error toast
      toast.error('Registration failed', {
        description:
          error instanceof Error ? error.message : 'Please check your information and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className="space-y-6 p-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="workspace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="my-company" {...field} />
                </FormControl>
                {workspaceName && (
                  <FormDescription>
                    Your workspace will be available at:{' '}
                    <strong>{generateSlug(workspaceName)}.localhost:3000</strong>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
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
                  <Input type="password" placeholder="Enter a strong password" {...field} />
                </FormControl>
                <PasswordComplexity password={password || ''} className="mt-2" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={e => field.onChange(e.target.checked)}
                  />
                </FormControl>
                  <FormLabel>
                    I agree to the
                    <Link
                      to="/learn"
                      search={{ doc: 'terms' }}
                      className="text-blue-600 hover:text-blue-500 underline"
                      onClick={e => e.stopPropagation()}
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/learn"
                      search={{ doc: 'privacy' }}
                      className="text-blue-600 hover:text-blue-500 underline"
                      onClick={e => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                  </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
            {isSubmitting || externalLoading ? 'Creating Workspace...' : 'Create Workspace'}
          </Button>
        </form>
      </Form>
    </div>
  )
}

// Add metadata for QDrawer
;(RegisterWorkspaceForm as any).defaultTitle = 'Create Workspace'
;(RegisterWorkspaceForm as any).defaultDescription = 'Set up your new workspace in minutes'
