import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoaderCircle, Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { profileSettingsSchema, type ProfileSettings } from '@/shared'

export const Route = createFileRoute('/_core/settings/profile')({
  component: ProfileSettings,
})

function ProfileSettings() {

  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      avatar: '',
    },
  })

  const watchedValues = watch()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setValue('avatar', objectUrl)
    }
  }

  const removeAvatar = () => {
    setValue('avatar', '')
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const onSubmit = async (data: ProfileSettings) => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call to /api/core/settings/profile or /api/tenant/settings/profile
      const response = await fetch('/api/core/settings/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Update your name, email, and profile picture</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {preview ? (
                  <AvatarImage src={preview} alt={watchedValues.fullName || 'Profile'} />
                ) : (
                  <AvatarFallback className="text-lg">
                    {getInitials(watchedValues.fullName || 'User')}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -top-2 -right-2 flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full p-0"
                  onClick={triggerFileInput}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                {preview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 rounded-full p-0"
                    onClick={removeAvatar}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <div>
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size 2MB</p>
              {errors.avatar && (
                <p className="mt-1 text-xs text-red-600">{errors.avatar.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                className="mt-1 w-full"
                {...register('fullName')}
                placeholder="Full name"
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                className="mt-1 w-full"
                {...register('email')}
                placeholder="Email address"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

