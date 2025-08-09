import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { passwordChangeSchema, type PasswordChange } from '@/shared'

export const Route = createFileRoute('/_core/settings/password')({
  component: PasswordSettings,
})

function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const passwordInput = useRef<HTMLInputElement>(null)
  const currentPasswordInput = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordChange) => {
    try {
      setIsLoading(true)

      // TODO: Replace with actual API call to /api/core/settings/password or /api/tenant/settings/password
      const response = await fetch('/api/core/settings/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      reset()
    } catch (error: any) {
      console.error('Change password error:', error)
      toast.error(error.message || 'Failed to change password')

      // Focus appropriate field based on error
      if (error.message?.includes('current password')) {
        currentPasswordInput.current?.focus()
      } else {
        passwordInput.current?.focus()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Change Password</h2>
        <p className="text-muted-foreground">
          Ensure your account is using a long, random password to stay secure
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              {...register('currentPassword', {
                setValueAs: value => {
                  if (currentPasswordInput.current) {
                    currentPasswordInput.current.value = value
                  }
                  return value
                },
              })}
              ref={currentPasswordInput}
              type="password"
              className="mt-1 block w-full"
              autoComplete="current-password"
              placeholder="Current password"
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              {...register('newPassword', {
                setValueAs: value => {
                  if (passwordInput.current) {
                    passwordInput.current.value = value
                  }
                  return value
                },
              })}
              ref={passwordInput}
              type="password"
              className="mt-1 block w-full"
              autoComplete="new-password"
              placeholder="New password"
            />
            {errors.newPassword && (
              <p className="text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              {...register('confirmPassword')}
              type="password"
              className="mt-1 block w-full"
              autoComplete="new-password"
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save password'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
