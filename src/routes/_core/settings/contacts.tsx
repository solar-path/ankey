import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QPhone } from '@/components/QPhone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { contactSettingsSchema, type ContactSettings } from '@/shared'

export const Route = createFileRoute('/_core/settings/contacts')({
  component: ContactSettings,
})

function ContactSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactSettings>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      phone: '',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    },
  })

  const watchedValues = watch()

  const handlePhoneChange = (value: string) => {
    setValue('phone', value)
  }

  const onSubmit = async (data: ContactSettings) => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call to /api/core/settings/contact or /api/tenant/settings/contact
      const response = await fetch('/api/core/settings/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact settings')
      }

      toast.success('Contact settings updated successfully')
    } catch (error) {
      console.error('Update contact settings error:', error)
      toast.error('Failed to update contact settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contact Settings</h2>
        <p className="text-muted-foreground">Update your phone number and address</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <QPhone 
              value={watchedValues.phone || ''}
              onChange={handlePhoneChange}
              className="mt-1 block w-full"
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              className="mt-1 block w-full"
              {...register('address')}
              autoComplete="address"
              placeholder="Address"
            />
            {errors.address && (
              <p className="text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact (Optional)</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="emergencyContact.name">Name</Label>
              <Input
                id="emergencyContact.name"
                className="mt-1 block w-full"
                {...register('emergencyContact.name')}
                placeholder="Emergency contact name"
              />
              {errors.emergencyContact?.name && (
                <p className="text-xs text-red-600">{errors.emergencyContact.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergencyContact.phone">Phone</Label>
              <Input
                id="emergencyContact.phone"
                className="mt-1 block w-full"
                {...register('emergencyContact.phone')}
                placeholder="Emergency contact phone"
              />
              {errors.emergencyContact?.phone && (
                <p className="text-xs text-red-600">{errors.emergencyContact.phone.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergencyContact.relationship">Relationship</Label>
              <Input
                id="emergencyContact.relationship"
                className="mt-1 block w-full"
                {...register('emergencyContact.relationship')}
                placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
              />
              {errors.emergencyContact?.relationship && (
                <p className="text-xs text-red-600">{errors.emergencyContact.relationship.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}