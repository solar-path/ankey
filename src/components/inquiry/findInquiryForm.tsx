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
import { client, handleApiResponse } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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

  const form = useForm<FindInquiryData>({
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
        const response = await client.inquiry.find.$post({
          json: { id: data.id },
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Inquiry not found')
        }

        setFoundInquiry(result.data)

        // Show success toast
        toast.success('Inquiry found!', {
          description: `Found inquiry ${result.data.id} from ${result.data.email}`,
        })

        console.log('Found inquiry:', result.data)
      }
    } catch (error) {
      console.error('Error finding inquiry:', error)
      setFoundInquiry(null)

      // Show error toast
      toast.error('Inquiry not found', {
        description:
          error instanceof Error ? error.message : 'Please check the inquiry ID and try again.',
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6 p-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inquiry ID</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter inquiry ID (e.g., INQ-12345)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSearching || externalLoading}>
            {isSearching || externalLoading ? 'Searching...' : 'Find Inquiry'}
          </Button>
        </form>
      </Form>

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
