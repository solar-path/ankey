import QCalendarPick from '@/components/QCalendarPick'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { personalSettingsSchema, type PersonalSettings } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/settings/personal')({
  component: PersonalSettingsComponent,
})

function PersonalSettingsComponent() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(personalSettingsSchema),
    defaultValues: {
      gender: undefined,
      dateOfBirth: '',
      timezone: '',
      language: 'en',
    },
  })

  const onSubmit: SubmitHandler<PersonalSettings> = async data => {
    try {
      setIsLoading(true)

      // TODO: Replace with actual API call to /api/core/settings/personal or /api/tenant/settings/personal
      const response = await fetch('/api/core/settings/personal', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update personal settings')
      }

      toast.success('Personal settings updated successfully')
    } catch (error) {
      console.error('Update personal settings error:', error)
      toast.error('Failed to update personal settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personal Settings</h2>
        <p className="text-muted-foreground">Update your gender and date of birth</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <QCalendarPick
                    label="Date of Birth"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={date => field.onChange(date?.toISOString() || '')}
                    disabled={form.formState.isSubmitting || isLoading}
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
