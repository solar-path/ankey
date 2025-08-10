import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QPhone } from '@/components/QPhone'
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
import { toast } from 'sonner'
import { contactSettingsSchema, type ContactSettings } from '@/shared'

export const Route = createFileRoute('/_core/settings/contacts')({
  component: ContactSettings,
})

function ContactSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ContactSettings>({
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

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-6 shadow"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <QPhone value={field.value || ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="address" placeholder="Address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact (Optional)</h3>

              <FormField
                control={form.control}
                name="emergencyContact.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Emergency contact name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Emergency contact phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContact.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting || isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
