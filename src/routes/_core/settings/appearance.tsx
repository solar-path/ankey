import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { toast } from 'sonner'
import { appearanceSettingsSchema, type AppearanceSettings } from '@/shared'
import { useTheme } from '@/hooks/useTheme'

export const Route = createFileRoute('/_core/settings/appearance')({
  component: AppearanceSettingsComponent,
})

function AppearanceSettingsComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme, loading: themeLoading } = useTheme()

  const form = useForm({
    resolver: zodResolver(appearanceSettingsSchema),
    values: {
      theme: theme,
    },
  })

  const onSubmit: SubmitHandler<AppearanceSettings> = async data => {
    try {
      setIsLoading(true)
      
      // Use the global theme setter which handles both UI update and saving
      await setTheme(data.theme)
      
      toast.success('Theme updated successfully')
    } catch (error) {
      console.error('Update appearance settings error:', error)
      toast.error('Failed to update appearance settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (themeLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appearance Settings</h2>
          <p className="text-muted-foreground">Switch between light and dark themes</p>
        </div>
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance Settings</h2>
        <p className="text-muted-foreground">Switch between light and dark themes</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? 'Saving...' : 'Save Theme'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
