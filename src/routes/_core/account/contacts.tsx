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
import { client } from '@/lib/rpc'
import { contactSettingsSchema, type ContactSettings } from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'


export const Route = createFileRoute('/_core/account/contacts')({
  component: ContactSettings,
})

function ContactSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const form = useForm<ContactSettings>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      phone: '',
      address: '',
    },
  })

  // Load existing contact settings
  useEffect(() => {
    const loadContactSettings = async () => {
      try {
        setIsLoadingData(true)
        const response = await client.settings.me.$get()

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.contact) {
            form.reset({
              phone: data.data.contact.phone || '',
              address: data.data.contact.address || '',
            })
          }
        }
      } catch (error) {
        console.error('Failed to load contact settings:', error)
        toast.error('Failed to load contact settings')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadContactSettings()
  }, [form])

  const onSubmit = async (data: ContactSettings) => {
    try {
      setIsLoading(true)

      // Use Hono RPC client as required by CLAUDE.md
      const response = await client.settings.contact.$patch({
        json: data,
      })

      if (!response.ok) {
        throw new Error('Failed to update contact settings')
      }

      toast.success('Contact settings updated successfully')

      // Refresh the form with updated data
      const updatedResponse = await client.settings.me.$get()
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        if (updatedData.success && updatedData.data?.contact) {
          form.reset({
            phone: updatedData.data.contact.phone || '',
            address: updatedData.data.contact.address || '',
          })
        }
      }
    } catch (error) {
      console.error('Update contact settings error:', error)
      toast.error('Failed to update contact settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact Settings</h2>
          <p className="text-muted-foreground">Update your phone number and address</p>
        </div>
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
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
