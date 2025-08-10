import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { useSettingsContext } from '@/hooks/useSettingsContext'
import { handleApiResponse } from '@/lib/rpc'
import { profileSettingsSchema, type ProfileSettings } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, Plus, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/settings/profile')({
  component: ProfileSettings,
})

function ProfileSettings() {
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { settingsClient } = useSettingsContext()

  const form = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      avatar: '',
    },
  })

  const watchedValues = form.watch()

  // Load user data into form when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        setDataLoading(true)

        // Try to fetch extended profile data from settings endpoint
        const response = await settingsClient.profile.$get()
        const result = await handleApiResponse(response)

        if (result.success && result.data) {
          const profileData = result.data as ProfileSettings
          form.reset({
            fullName: profileData.fullName || user.fullName || '',
            email: profileData.email || user.email || '',
            avatar: profileData.avatar || '',
          })

          if (profileData.avatar) {
            setPreview(profileData.avatar)
          }
        } else {
          // Fallback to user data from auth context
          form.reset({
            fullName: user.fullName || '',
            email: user.email || '',
            avatar: '',
          })
        }
      } catch (error) {
        console.error('Failed to load profile data:', error)
        // Fallback to user data from auth context
        form.reset({
          fullName: user.fullName || '',
          email: user.email || '',
          avatar: '',
        })
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [user, form])

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
      form.setValue('avatar', objectUrl)
    }
  }

  const removeAvatar = () => {
    form.setValue('avatar', '')
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

      // Use context-aware RPC client
      const response = await settingsClient.profile.$patch({
        json: data,
      })
      const result = await handleApiResponse(response)

      if (result.success) {
        toast.success('Profile updated successfully')
        // Refresh user data in auth context if needed
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
          <p className="text-muted-foreground">Update your name, email, and profile picture</p>
        </div>
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-center py-12">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">Loading profile data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Update your name, email, and profile picture</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
        >
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem>
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
                      <FormLabel className="text-sm font-medium">Profile Picture</FormLabel>
                      <FormDescription className="text-xs">
                        JPG, GIF or PNG. Max size 2MB
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" autoComplete="name" {...field} />
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
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      autoComplete="email"
                      disabled
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Email address cannot be changed for security reasons
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? (
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
        </form>
      </Form>
    </div>
  )
}
