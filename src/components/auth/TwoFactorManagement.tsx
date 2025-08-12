import { useDrawer } from '@/components/QDrawer/QDrawer.store'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { client, handleApiResponse } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Key, Mail, Shield, ShieldCheck, ShieldX, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { TwoFactorSetup } from './TwoFactorSetup'

interface TwoFactorManagementProps {
  user: {
    twoFactorEnabled: boolean
    email: string
  }
  onUpdate?: () => void
}

const disableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

const emailCodeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
})

type DisableData = z.infer<typeof disableSchema>
type EmailCodeData = z.infer<typeof emailCodeSchema>

export function TwoFactorManagement({ user, onUpdate }: TwoFactorManagementProps) {
  const { openDrawer, closeDrawer } = useDrawer()
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const disableForm = useForm<DisableData>({
    resolver: zodResolver(disableSchema),
    defaultValues: {
      password: '',
    },
  })

  const emailForm = useForm<EmailCodeData>({
    resolver: zodResolver(emailCodeSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleEnable2FA = () => {
    openDrawer(
      <TwoFactorSetup
        onComplete={async () => {
          toast.success('Two-factor authentication enabled!')
          closeDrawer()
          onUpdate?.()
        }}
        isLoading={isLoading}
      />
    )
  }

  const handleDisable2FA = async (data: DisableData) => {
    setIsLoading(true)
    try {
      const response = await client.auth['2fa'].disable.$post({
        json: {
          password: data.password,
        },
      })

      const result = await handleApiResponse(response)

      if (!result.success) {
        throw new Error(result.error || 'Failed to disable 2FA')
      }

      toast.success('Two-factor authentication disabled')
      disableForm.reset()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to disable 2FA:', error)
      toast.error('Failed to disable 2FA', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendEmailCode = async () => {
    setIsLoading(true)
    try {
      const response = await client.auth['2fa'].email.send.$post()
      const result = await handleApiResponse(response)

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification code')
      }

      setEmailCodeSent(true)
      toast.success('Verification code sent to your email')
    } catch (error) {
      console.error('Failed to send email code:', error)
      toast.error('Failed to send verification code', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmailCode = async (data: EmailCodeData) => {
    setIsLoading(true)
    try {
      const response = await client.auth['2fa'].email.verify.$post({
        json: {
          code: data.code,
        },
      })

      const result = await handleApiResponse(response)

      if (!result.success) {
        throw new Error(result.error || 'Invalid verification code')
      }

      toast.success('Email verification successful!')
      setEmailCodeSent(false)
      emailForm.reset()
    } catch (error) {
      console.error('Email verification failed:', error)
      toast.error('Invalid verification code', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateBackupCodes = async () => {
    setIsLoading(true)
    try {
      const response = await client.auth['2fa']['backup-codes'].regenerate.$post()
      const result = await handleApiResponse(response)

      if (!result.success) {
        throw new Error(result.error || 'Failed to regenerate backup codes')
      }

      toast.success('New backup codes generated', {
        description: 'Please download and save your new backup codes.',
      })
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error)
      toast.error('Failed to regenerate backup codes', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-2">
      {/* Status Section */}
      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {user.twoFactorEnabled ? (
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ShieldX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.twoFactorEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant={user.twoFactorEnabled ? 'default' : 'secondary'}
              className={
                user.twoFactorEnabled
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }
            >
              {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>

            {!user.twoFactorEnabled ? (
              <Button onClick={handleEnable2FA} disabled={isLoading}>
                <Shield className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    <ShieldX className="w-4 h-4 mr-2" />
                    Disable 2FA
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                      Disable Two-Factor Authentication?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                      This will make your account less secure. You'll need to enter your password to
                      confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <Form {...disableForm}>
                    <form
                      onSubmit={disableForm.handleSubmit(handleDisable2FA)}
                      className="space-y-4"
                    >
                      <FormField
                        control={disableForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-gray-100">
                              Current Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          Cancel
                        </AlertDialogCancel>
                        <Button type="submit" variant="destructive" disabled={isLoading}>
                          {isLoading ? 'Disabling...' : 'Disable 2FA'}
                        </Button>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Methods */}
      {user.twoFactorEnabled && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Authentication Methods
          </h3>

          {/* TOTP App */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Authenticator App
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Google Authenticator, Authy, or similar TOTP app
                  </p>
                </div>
              </div>

              <Badge
                variant="default"
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                Primary Method
              </Badge>
            </div>
          </div>

          {/* Email 2FA */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Email Verification
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Backup method via {user.email}
                  </p>
                </div>
              </div>

              {!emailCodeSent ? (
                <Button
                  onClick={sendEmailCode}
                  variant="outline"
                  disabled={isLoading}
                  className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  Test Email 2FA
                </Button>
              ) : (
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(verifyEmailCode)} className="space-y-3">
                    <FormField
                      control={emailForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <InputOTP
                              maxLength={6}
                              value={field.value}
                              onChange={field.onChange}
                            >
                              <InputOTPGroup className="gap-2">
                                <InputOTPSlot index={0} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                                <InputOTPSlot index={1} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                                <InputOTPSlot index={2} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                                <InputOTPSlot index={3} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                                <InputOTPSlot index={4} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                                <InputOTPSlot index={5} className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailCodeSent(false)
                          emailForm.reset()
                        }}
                        className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>

          {/* Backup Codes */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Key className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Backup Codes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    One-time use codes for account recovery
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">5 codes remaining</span>
              </div>

              <Button
                onClick={regenerateBackupCodes}
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate New Codes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add metadata for QDrawer
;(TwoFactorManagement as any).defaultTitle = 'Two-Factor Authentication'
;(TwoFactorManagement as any).defaultDescription = 'Manage your 2FA settings'
