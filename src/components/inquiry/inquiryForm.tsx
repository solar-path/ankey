import InputError from '@/components/input-error';
import { useDrawer } from '@/components/QDrawer.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Transition } from '@headlessui/react';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { toast } from 'sonner';

export default function InquiryForm() {
    // References to form elements for focus management
    const emailInput = useRef<HTMLInputElement>(null);
    const messageInput = useRef<HTMLTextAreaElement>(null);
    const { closeDrawer } = useDrawer();

    const { data, setData, errors, post, reset, processing, recentlySuccessful } = useForm({
        email: '',
        message: '',
    });

    // We're now handling toast notifications directly in the onSuccess callback

    const submitInquiry: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('inquiry.create'), {
            preserveScroll: true,
            onSuccess: () => {
                // Add direct toast notification
                toast.success('Inquiry submitted successfully', {
                    description: 'Thank you for your inquiry!',
                });
                reset();
                closeDrawer();
            },
            onError: (errors) => {
                if (errors.email) {
                    emailInput.current?.focus();
                }

                if (errors.message) {
                    messageInput.current?.focus();
                }

                toast.error('Error submitting inquiry', {
                    description: 'Please try again later.',
                });
            },
        });
    };

    return (
        <div>
            <form onSubmit={submitInquiry} className="flex flex-col space-y-4 p-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        className="w-full"
                        placeholder="Email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} />
                </div>

                <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea className="w-full" placeholder="Message" value={data.message} onChange={(e) => setData('message', e.target.value)} />
                    <InputError message={errors.message} />
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

            <div className="flex items-center justify-center space-x-2 pt-2 text-center">
                <p className="text-sm">Already submitted an inquiry?</p>
                <Button variant="ghost" type="button" size="sm">
                    <Link href="/inquiry/find">Find</Link>
                </Button>
            </div>
        </div>
    );
}

// Add static properties to the component for drawer metadata
InquiryForm.defaultTitle = 'Submit an Inquiry';
InquiryForm.defaultDescription = 'Please provide your contact information and message';