import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { appearanceSettingsSchema, type AppearanceSettings } from '@/shared'

export const Route = createFileRoute('/_core/settings/appearance')({
  component: AppearanceSettingsComponent,
})

function AppearanceSettingsComponent() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      theme: 'system' as const,
      density: 'comfortable' as const,
      primaryColor: '#000000',
      fontSize: 'medium' as const,
      sidebarCollapsed: false,
    },
  })

  const onSubmit = async (data: AppearanceSettings) => {
    try {
      setIsLoading(true)

      // TODO: Replace with actual API call to /api/core/settings/appearance or /api/tenant/settings/appearance
      const response = await fetch('/api/core/settings/appearance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update appearance settings')
      }

      toast.success('Appearance settings updated successfully')
    } catch (error) {
      console.error('Update appearance settings error:', error)
      toast.error('Failed to update appearance settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance Settings</h2>
        <p className="text-muted-foreground">Customize your app's appearance and theme</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-sm leading-none font-medium">Theme</Label>
            <Controller
              control={control}
              name="theme"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.theme && <p className="text-xs text-red-600">{errors.theme.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-sm leading-none font-medium">Density</Label>
            <Controller
              control={control}
              name="density"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.density && <p className="text-xs text-red-600">{errors.density.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-sm leading-none font-medium">Font Size</Label>
            <Controller
              control={control}
              name="fontSize"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.fontSize && <p className="text-xs text-red-600">{errors.fontSize.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              {...register('primaryColor')}
              className="mt-1 block w-full h-10"
            />
            {errors.primaryColor && (
              <p className="text-xs text-red-600">{errors.primaryColor.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sidebarCollapsed"
              {...register('sidebarCollapsed')}
              className="rounded"
            />
            <Label htmlFor="sidebarCollapsed" className="text-sm font-medium leading-none">
              Start with sidebar collapsed
            </Label>
            {errors.sidebarCollapsed && (
              <p className="text-xs text-red-600">{errors.sidebarCollapsed.message}</p>
            )}
          </div>

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
