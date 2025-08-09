import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCallback, useState } from 'react'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText } from 'lucide-react'
import { client, handleApiResponse } from '@/lib/rpc'
import { toast } from 'sonner'

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
  const { closeDrawer } = useDrawer()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InquiryData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      email: '',
      message: '',
      attachments: [],
    },
  })

  const attachments = watch('attachments') || []

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentAttachments = attachments || []
      setValue('attachments', [...currentAttachments, ...acceptedFiles])
    },
    [attachments, setValue]
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
    setValue('attachments', newAttachments)
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

      reset()
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </Label>
          <Textarea
            id="message"
            {...register('message')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            placeholder="Please describe your inquiry in detail"
          />
          {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (optional)
          </Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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

        <Button type="submit" className="w-full" disabled={isSubmitting || externalLoading}>
          {isSubmitting || externalLoading ? 'Submitting...' : 'Submit Inquiry'}
        </Button>
      </form>
    </div>
  )
}

// Add static properties to the component for drawer metadata
InquiryForm.defaultTitle = 'Submit an Inquiry'
InquiryForm.defaultDescription = 'Please provide your contact information and message'
