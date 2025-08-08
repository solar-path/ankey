import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { z } from 'zod'
import { useState } from 'react'
import { coreInquiry, handleApiResponse } from '@/lib/rpc'

const findInquirySchema = z.object({
  id: z.string().min(1, 'Inquiry ID is required'),
})

type FindInquiryData = z.infer<typeof findInquirySchema>

interface FindInquiryFormProps {
  onSubmit?: (data: FindInquiryData) => Promise<void>
  isLoading?: boolean
}

export default function FindInquiryForm({
  onSubmit,
  isLoading: externalLoading = false,
}: FindInquiryFormProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [foundInquiry, setFoundInquiry] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindInquiryData>({
    resolver: zodResolver(findInquirySchema),
    defaultValues: {
      id: '',
    },
  })

  const handleFormSubmit = async (data: FindInquiryData) => {
    setIsSearching(true)
    setFoundInquiry(null)

    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Use RPC client to find inquiry
        const response = await coreInquiry.find.$post({
          json: { id: data.id },
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Inquiry not found')
        }

        setFoundInquiry(result.data)
        console.log('Found inquiry:', result.data)
      }
    } catch (error) {
      console.error('Error finding inquiry:', error)
      setFoundInquiry(null)
      // In a real app, you'd show a toast notification or inline error
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
   
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

        <Button type="submit" className="w-full" disabled={isSearching || externalLoading}>
          {isSearching || externalLoading ? 'Searching...' : 'Find Inquiry'}
        </Button>
      </form>

      {foundInquiry && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Inquiry Found</h3>
          <div className="space-y-2 text-sm text-green-700">
            <p>
              <strong>ID:</strong> {foundInquiry.id}
            </p>
            <p>
              <strong>Email:</strong> {foundInquiry.email}
            </p>
            <p>
              <strong>Status:</strong> {foundInquiry.status}
            </p>
            <p>
              <strong>Submitted:</strong> {new Date(foundInquiry.submittedAt).toLocaleDateString()}
            </p>
            {foundInquiry.response && (
              <div>
                <strong>Response:</strong>
                <p className="mt-1 p-2 bg-white border rounded text-gray-800">
                  {foundInquiry.response}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Add static properties to the component for drawer metadata
FindInquiryForm.defaultTitle = 'Find Your Inquiry'
FindInquiryForm.defaultDescription = 'Enter your inquiry ID to find your submission'
