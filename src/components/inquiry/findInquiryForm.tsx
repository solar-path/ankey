import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { z } from 'zod'

const findInquirySchema = z.object({
  id: z.string().min(1, 'Inquiry ID is required'),
})

type FindInquiryData = z.infer<typeof findInquirySchema>

interface FindInquiryFormProps {
  onSubmit?: (data: FindInquiryData) => Promise<void>
  isLoading?: boolean
}

export default function FindInquiryForm({ onSubmit, isLoading = false }: FindInquiryFormProps) {
  const { closeDrawer } = useDrawer()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FindInquiryData>({
    resolver: zodResolver(findInquirySchema),
    defaultValues: {
      id: '',
    },
  })

  const handleFormSubmit = async (data: FindInquiryData) => {
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log('Find inquiry data:', data)
      }
      reset()
      closeDrawer()
    } catch (error) {
      console.error('Error finding inquiry:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Find Your Inquiry</h2>
        <p className="text-gray-600 mt-2">Enter your inquiry ID to find your submission</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
            Inquiry ID
          </Label>
          <Input
            id="id"
            type="text"
            {...register('id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter inquiry ID (e.g., INQ-12345)"
          />
          {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find Inquiry'}
        </Button>
      </form>
    </div>
  )
}

// Add static properties to the component for drawer metadata
FindInquiryForm.defaultTitle = 'Find Your Inquiry'
FindInquiryForm.defaultDescription = 'Enter your inquiry ID to find your submission'
