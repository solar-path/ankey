import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoaderCircle } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(1, 'This field is required'),
  description: z.string().min(1, 'This field is required').nullable().optional(),
  price: z.string().min(1, 'This field is required'),
  isActive: z.string().min(1, 'This field is required'),
})

export type ProductFormData = z.infer<typeof formSchema>

export interface ProductItem {
  id: string
  title: string
  description: string | null
  price: string
  isActive: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ProductFormProps {
  initialData?: Partial<ProductItem>
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitText?: string
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Save',
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? null,
      price: initialData?.price ?? '',
      isActive: initialData?.isActive ?? '',
    },
  })

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data)
      if (!initialData) {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...formField} value={formField.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...formField}
                  value={formField.value || ''}
                  placeholder="Enter description..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input {...formField} value={formField.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Is Active</FormLabel>
              <FormControl>
                <Input {...formField} value={formField.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-4 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
