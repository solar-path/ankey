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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { client } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  features: z.string().min(1, 'Features are required'),
  pricePerUserPerMonth: z.number().min(0, 'Price must be non-negative'),
  minUsers: z.number().min(1, 'Minimum users must be at least 1').optional(),
  maxUsers: z.number().min(1, 'Maximum users must be at least 1').optional(),
  trialDays: z.number().min(0, 'Trial days must be non-negative').optional(),
  trialMaxUsers: z.number().min(1, 'Trial max users must be at least 1').optional(),
  badge: z.string().optional(),
  isActive: z.boolean(),
})

type PlanFormData = z.infer<typeof planFormSchema>

interface PlanFormProps {
  onSuccess?: () => void
  planId?: string
  initialData?: Partial<PlanFormData>
}

export function PlanForm({ onSuccess, planId, initialData }: PlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      features: initialData?.features || 'Core features included\nEmail support\nBasic integrations\nStandard security',
      pricePerUserPerMonth: initialData?.pricePerUserPerMonth || 0,
      minUsers: initialData?.minUsers,
      maxUsers: initialData?.maxUsers,
      trialDays: initialData?.trialDays,
      trialMaxUsers: initialData?.trialMaxUsers,
      badge: initialData?.badge || '',
      isActive: initialData?.isActive ?? true,
    },
  })

  const onSubmit: SubmitHandler<PlanFormData> = async data => {
    try {
      setIsSubmitting(true)

      // Convert features text to array
      const featuresArray = data.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const payload = {
        ...data,
        features: JSON.stringify(featuresArray),
        displayOrder: 1, // Default display order
      }

      let response
      if (planId) {
        // Update existing plan
        response = await client.pricing.plans[':id'].$put({
          param: { id: planId },
          json: payload,
        })
      } else {
        // Create new plan
        response = await client.pricing.plans.$post({
          json: payload,
        })
      }

      if (response.ok) {
        toast.success(planId ? 'Plan updated successfully' : 'Plan created successfully')
        onSuccess?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Professional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Brief description of this plan" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Features</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter features, one per line&#10;e.g.:&#10;Core features included&#10;Email support&#10;Basic integrations"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  Enter each feature on a new line
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerUserPerMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per User per Month ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.99"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Users</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={field.value || ''}
                      onChange={e => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Users</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="100"
                      value={field.value || ''}
                      onChange={e => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="trialDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trial Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="14"
                      value={field.value || ''}
                      onChange={e => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trialMaxUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trial Max Users</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="5"
                      value={field.value || ''}
                      onChange={e => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="badge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Most Popular, Best Value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Plan</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Enable this plan for new subscriptions
                  </div>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : planId ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
