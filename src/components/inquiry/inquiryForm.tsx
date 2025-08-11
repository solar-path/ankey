import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { client, handleApiResponse } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Search, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import FindInquiryForm from './findInquiryForm'

const inquirySchema = z.object({
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  attachments: z.array(z.instanceof(File)).optional(),
})

type InquiryData = z.infer<typeof inquirySchema>

interface InquiryFormProps {
  onSubmit?: (data: InquiryData) => Promise<void>
  isLoading?: boolean
}

export default function InquiryForm({
  onSubmit,
  isLoading: externalLoading = false,
}: InquiryFormProps) {
  const { closeDrawer, openDrawer } = useDrawer()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InquiryData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      email: '',
      message: '',
      attachments: [],
    },
  })

  const attachments = form.watch('attachments') || []

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentAttachments = attachments || []
      form.setValue('attachments', [...currentAttachments, ...acceptedFiles])
    },
    [attachments, form]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'text/*': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    form.setValue('attachments', newAttachments)
  }

  const handleFormSubmit = async (data: InquiryData) => {
    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Use RPC client to submit inquiry
        const response = await client.inquiry.submit.$post({
          json: {
            email: data.email,
            message: data.message,
            attachments: data.attachments?.map(f => f.name) || [],
          },
        })

        const result = await handleApiResponse(response)

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit inquiry')
        }

        // Show success toast
        toast.success('Inquiry submitted successfully!', {
          description: 'We have received your inquiry and will respond as soon as possible.',
        })

        console.log('Inquiry submitted successfully:', result.data)
      }

      form.reset()
      closeDrawer()
    } catch (error) {
      console.error('Error submitting inquiry:', error)

      // Show error toast
      toast.error('Failed to submit inquiry', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFindInquiry = () => {
    openDrawer(<FindInquiryForm />)
  }

  return (
    <div className="space-y-6 p-2">
      {/* Find Inquiry Button */}



      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[120px]"
                    placeholder="Please describe your inquiry in detail"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attachments (optional)</FormLabel>
                <FormControl>
                  <div>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                      {isDragActive ? (
                        <p className="text-sm text-blue-600">Drop the files here...</p>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600">
                            Drag 'n' drop files here, or click to select
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                        </div>
                      )}
                    </div>

                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
            {isSubmitting || externalLoading ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </form>
      </Form>

       <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFindInquiry}
          className="text-sm"
        >
          <Search className="h-4 w-4 mr-2" />
          Find Existing Inquiry
        </Button>


    </div>
  )
}

// Add static properties to the component for drawer metadata
InquiryForm.defaultTitle = 'Submit an Inquiry'
InquiryForm.defaultDescription = 'Please provide your contact information and message'
