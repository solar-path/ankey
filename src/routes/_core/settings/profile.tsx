import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { useAuth } from '@/contexts/AuthContext'
import { client } from '@/lib/rpc'
import { profileSettingsSchema, type ProfileSettings } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, Plus, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_core/settings/profile')({
  component: ProfileSettingsSimple,
})

function ProfileSettingsSimple() {
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, refreshUser } = useAuth()

  const form = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      avatar: '',
    },
  })

  // Load data once when component mounts
  useEffect(() => {
    if (!user) return

    // Set form values from user
    form.setValue('fullName', user.fullName || '')
    form.setValue('email', user.email || '')

    // Load profile to get avatar
    loadProfile()
  }, []) // Empty dependency - only run once

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/settings/profile', {
        credentials: 'include'
      })
      const data = await response.json()

      console.log('Profile loaded:', data)

      if (data.success && data.data) {
        if (data.data.fullName) form.setValue('fullName', data.data.fullName)
        if (data.data.email) form.setValue('email', data.data.email)

        // Set avatar URL if exists
        if (data.data.avatar) {
          const url = data.data.avatar.startsWith('/')
            ? data.data.avatar
            : `/uploads/${data.data.avatar}`
          console.log('Setting avatar URL:', url)
          setAvatarUrl(url)
          form.setValue('avatar', data.data.avatar)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type')
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setAvatarUrl(objectUrl)
    setSelectedFile(file)
  }

  const handleRemoveAvatar = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setAvatarUrl('')
        setSelectedFile(null)
        form.setValue('avatar', '')
        if (fileInputRef.current) fileInputRef.current.value = ''
        toast.success('Avatar removed')
        await refreshUser()
      }
    } catch (error) {
      console.error('Remove avatar error:', error)
      toast.error('Failed to remove avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileSettings) => {
    try {
      setIsLoading(true)

      // Upload new avatar if selected
      if (selectedFile) {
        const formData = new FormData()
        formData.append('avatar', selectedFile)

        const uploadResponse = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        const uploadResult = await uploadResponse.json()
        console.log('Upload result:', uploadResult)

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed')
        }

        // Update the avatar path for profile update
        data.avatar = uploadResult.data.filePath
      }

      // Update profile
      const profileData: any = {
        fullName: data.fullName
      }

      // Only include avatar if we have a new one
      if (data.avatar && data.avatar !== form.getValues('avatar')) {
        profileData.avatar = data.avatar
      }

      const response = await client.settings.profile.$patch({
        json: profileData
      })

      if (response.ok) {
        toast.success('Profile updated')
        setSelectedFile(null)

        // Update avatar URL if changed
        if (data.avatar) {
          const url = data.avatar.startsWith('/')
            ? data.avatar
            : `/uploads/${data.avatar}`
          setAvatarUrl(url)
        }

        await refreshUser()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Update your profile information</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Profile" />
                  ) : (
                    <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(form.watch('fullName') || user?.fullName || 'U')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-full p-0 bg-white dark:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveAvatar}
                      disabled={isLoading}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP. Max 2MB</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your name" />
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
                      <Input {...field} type="email" disabled className="bg-gray-50 dark:bg-gray-900" />
                    </FormControl>
                    <FormDescription>Email cannot be changed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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
