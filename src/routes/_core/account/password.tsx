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
import { client } from '@/lib/rpc'
import { passwordChangeSchema, type PasswordChange } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'


export const Route = createFileRoute('/_core/account/password')({
  component: PasswordSettings,
})

function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const passwordInput = useRef<HTMLInputElement>(null)
  const currentPasswordInput = useRef<HTMLInputElement>(null)

  const form = useForm<PasswordChange>({
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
      console.log('Submitting password change data:', {
        currentPassword: '[HIDDEN]',
        newPassword: '[HIDDEN]',
        confirmPassword: '[HIDDEN]',
        passwordsMatch: data.newPassword === data.confirmPassword,
      })

      // Use Hono RPC client as required by CLAUDE.md
      const response = await client.settings.password.$patch({
        json: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Password change API error:', errorData)
        throw new Error(errorData.error || errorData.message || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      form.reset()
    } catch (error: any) {
      console.error('Change password error:', error)

      // Extract meaningful error message
      let errorMessage = 'Failed to change password'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error.error) {
        errorMessage = error.error
      }

      toast.error(errorMessage)

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

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={currentPasswordInput}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Current password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={passwordInput}
                      type="password"
                      autoComplete="new-password"
                      placeholder="New password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? (
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
      </Form>
    </div>
  )
}
