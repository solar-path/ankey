import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Transition } from '@headlessui/react'
import { useForm } from '@inertiajs/react'
import { FormEventHandler, useRef } from 'react'
import { toast } from 'sonner'

export default function FindInquiryForm() {
  // Reference to the input field for focus management
  const idInput = useRef<HTMLInputElement>(null)

  const { data, setData, errors, post, reset, processing, recentlySuccessful } = useForm({
    id: '',
  })

  // We're now handling toast notifications directly in the onSuccess callback

  const submitInquiry: FormEventHandler = e => {
    e.preventDefault()
    console.log(data)

    post(route('inquiry.find'), {
      preserveScroll: true,
      onSuccess: () => {
        // Add direct toast notification
        toast.success('Inquiry found', {
          description: 'We found your inquiry details.',
        })
        reset()
      },
      onError: errors => {
        if (errors.id) {
          idInput.current?.focus()
          toast.error('Inquiry not found', {
            description: 'Please check the ID and try again.',
          })
        } else {
          toast.error('Error finding inquiry', {
            description: 'Please try again later.',
          })
        }
      },
    })
  }

  return (
    <div>
      <form onSubmit={submitInquiry} className="flex flex-col space-y-4 p-4">
        <div>
          <Label htmlFor="id">Inquiry ID</Label>
          <Input
            type="text"
            className="w-full"
            placeholder="Enter inquiry ID"
            value={data.id}
            onChange={e => setData('id', e.target.value)}
          />
          <InputError message={errors.id} />
        </div>

        <div>
          <Button type="submit" disabled={processing}>
            {processing ? 'Submitting...' : 'Submit'}
          </Button>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-neutral-600">Saved</p>
          </Transition>
        </div>
      </form>
    </div>
  )
}

// Add static properties to the component for drawer metadata
FindInquiryForm.defaultTitle = 'Find Your Inquiry'
FindInquiryForm.defaultDescription = 'Enter your inquiry ID to find your submission'
