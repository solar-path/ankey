import QCalendarPick from '@/components/QCalendarPick'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { personalSettingsSchema, type PersonalSettings } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/settings/personal')({
  component: PersonalSettingsComponent,
})

function PersonalSettingsComponent() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(personalSettingsSchema),
    defaultValues: {
      gender: undefined,
      dateOfBirth: '',
      timezone: '',
      language: 'en',
    },
  })

  const onSubmit = async (data: PersonalSettings) => {
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

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-sm leading-none font-medium">Gender</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-xs text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <QCalendarPick
                label="Date of Birth"
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date?.toISOString() || '')}
                error={errors.dateOfBirth?.message}
                disabled={isSubmitting || isLoading}
                fromYear={1900}
                toYear={new Date().getFullYear()}
              />
            )}
          />

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}