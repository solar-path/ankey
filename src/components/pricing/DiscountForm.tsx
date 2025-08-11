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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { client } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const discountFormSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  planId: z.string().min(1, 'Plan selection is required'),
  discountPercent: z
    .number()
    .min(0, 'Discount must be non-negative')
    .max(100, 'Discount cannot exceed 100%'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  promoCode: z.string().optional(),
  minMonths: z.number().min(1, 'Minimum months must be at least 1').optional(),
  isActive: z.boolean(),
})

type DiscountFormData = z.infer<typeof discountFormSchema>

interface PricingPlan {
  id: string
  name: string
}

interface DiscountFormProps {
  onSuccess?: () => void
  discountId?: string
  initialData?: Partial<DiscountFormData>
}

export function DiscountForm({ onSuccess, discountId, initialData }: DiscountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plans, setPlans] = useState<PricingPlan[]>([])

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      planId: initialData?.planId || '',
      discountPercent: initialData?.discountPercent || 0,
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      promoCode: initialData?.promoCode || '',
      minMonths: initialData?.minMonths || undefined,
      isActive: initialData?.isActive ?? true,
    },
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await client.pricing.plans.$get()
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans.filter((plan: any) => plan.isActive))
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load plans')
    }
  }

  const onSubmit: SubmitHandler<DiscountFormData> = async data => {
    try {
      setIsSubmitting(true)

      let response
      if (discountId) {
        // Update existing discount
        response = await client.pricing.discounts[':id'].$put({
          param: { id: discountId },
          json: data,
        })
      } else {
        // Create new discount
        response = await client.pricing.discounts.$post({
          json: data,
        })
      }

      if (response.ok) {
        toast.success(
          discountId ? 'Discount updated successfully' : 'Discount created successfully'
        )
        onSuccess?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save discount')
      }
    } catch (error) {
      console.error('Error saving discount:', error)
      toast.error('Failed to save discount')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate a random promo code
  const generatePromoCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    form.setValue('promoCode', code)
  }

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Black Friday Sale" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applicable Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Percentage (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="25"
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="promoCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promo Code (Optional)</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Input placeholder="SAVE25" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={generatePromoCode}>
                    Generate
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Commitment (Months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="12"
                    {...field}
                    onChange={e =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
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
                  <FormLabel className="text-base">Active Discount</FormLabel>
                  <div className="text-sm text-muted-foreground">Enable this discount for use</div>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : discountId ? 'Update Discount' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
