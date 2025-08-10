import QCalendarPick from '@/components/QCalendarPick'
import { client } from '@/lib/rpc'
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
import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/settings/personal')({
  component: PersonalSettingsComponent,
})

function PersonalSettingsComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(personalSettingsSchema),
    defaultValues: {
      gender: undefined,
      dateOfBirth: '',
      timezone: '',
      language: 'en',
    },
  })

  // Load existing personal settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setDataLoading(true)

        // Get current user's settings from the API
        const response = await client.settings.me.$get()

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const settings = result.data
            // Update form with existing personal settings
            form.reset({
              gender: settings.personal?.gender || undefined,
              dateOfBirth: settings.personal?.dateOfBirth || '',
              timezone: settings.personal?.timezone || '',
              language: settings.personal?.language || 'en',
            })

            console.log('Loaded personal settings:', settings.personal)
          }
        }
      } catch (error) {
        console.error('Failed to load personal settings:', error)
        // Keep default values if loading fails
      } finally {
        setDataLoading(false)
      }
    }

    loadSettings()
  }, [])

  const onSubmit: SubmitHandler<PersonalSettings> = async data => {
    try {
      setIsLoading(true)

      // Use Hono RPC client as required by CLAUDE.md
      const response = await client.settings.personal.$patch({
        json: data,
      })

      if (!response.ok) {
        throw new Error('Failed to update personal settings')
      }

      toast.success('Personal settings updated successfully')

      // Reload settings to ensure form shows updated data
      const updatedResponse = await client.settings.me.$get()
      if (updatedResponse.ok) {
        const result = await updatedResponse.json()
        if (result.success && result.data) {
          const settings = result.data
          form.reset({
            gender: settings.personal?.gender || undefined,
            dateOfBirth: settings.personal?.dateOfBirth || '',
            timezone: settings.personal?.timezone || '',
            language: settings.personal?.language || 'en',
          })

          console.log('Reloaded personal settings after save:', settings.personal)
        }
      }
    } catch (error) {
      console.error('Update personal settings error:', error)
      toast.error('Failed to update personal settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personal Settings</h2>
          <p className="text-muted-foreground">
            Update your personal information, timezone, and language preferences
          </p>
        </div>
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personal Settings</h2>
        <p className="text-muted-foreground">
          Update your personal information, timezone, and language preferences
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

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (EST)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CST)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PST)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                      <SelectItem value="Asia/Almaty">Almaty (ALMT)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="kk">Қазақша</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
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
