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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { client, handleApiResponse } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle, Copy, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface TwoFactorSetupProps {
  onComplete?: (data: { secret: string; backupCodes: string[] }) => Promise<void>
  isLoading?: boolean
}

const verificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
})

type VerificationData = z.infer<typeof verificationSchema>

interface SetupData {
  secret: string
  backupCodes: string[]
  qrCodeUrl: string
  manualEntryKey: string
}

export function TwoFactorSetup({ onComplete, isLoading = false }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  const form = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  })

  const generateSetup = async () => {
    try {
      console.log('Starting 2FA setup...')
      const response = await client.auth['2fa'].setup.$post()
      console.log('API Response:', response)

      const result = await handleApiResponse(response)
      console.log('Parsed result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate 2FA setup')
      }

      console.log('Setup data from API:', result.data)

      const setupData: SetupData = {
        secret: (result.data as any).data.secret,
        backupCodes: (result.data as any).data.backupCodes,
        qrCodeUrl: (result.data as any).data.qrCodeUrl,
        manualEntryKey: (result.data as any).data.manualEntryKey,
      }

      console.log('Processed setup data:', setupData)

      setSetupData(setupData)
      setStep('verify')
    } catch (error) {
      console.error('Failed to generate 2FA setup:', error)
      toast.error('Failed to generate 2FA setup', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  const verifyCode = async (data: VerificationData) => {
    if (!setupData) return

    try {
      const response = await client.auth['2fa'].enable.$post({
        json: {
          secret: setupData.secret,
          code: data.code,
          backupCodes: setupData.backupCodes,
        },
      })

      const result = await handleApiResponse(response)

      if (!result.success) {
        throw new Error(result.error || 'Invalid verification code')
      }

      setStep('backup')
      form.reset()
    } catch (error) {
      console.error('2FA verification failed:', error)
      toast.error('Invalid code', {
        description: 'Please check your authenticator app and try again.',
      })
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const completeFinalStep = async () => {
    if (!setupData || !savedBackupCodes) {
      toast.error('Please save your backup codes first')
      return
    }

    if (onComplete) {
      await onComplete({
        secret: setupData.secret,
        backupCodes: setupData.backupCodes,
      })
    }

    setStep('complete')
  }

  const downloadBackupCodes = () => {
    if (!setupData) return

    const content = [
      'Two-Factor Authentication Backup Codes',
      'Generated: ' + new Date().toLocaleDateString(),
      '',
      'Keep these codes safe! Each can only be used once.',
      '',
      ...setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '2fa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setSavedBackupCodes(true)
    toast.success('Backup codes downloaded')
  }

  if (step === 'generate') {
    return (
      <div className="w-full max-w-md mx-auto p-2">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Set Up Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Secure your account with Google Authenticator or similar TOTP app
            </p>
          </div>
          <Button onClick={generateSetup} className="w-full" disabled={isLoading}>
            {isLoading ? 'Setting up...' : 'Get Started'}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'verify' && setupData) {
    return (
      <div className="w-full max-w-md mx-auto p-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Scan QR Code</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use your authenticator app to scan this QR code
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={setupData.qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 border border-gray-200 dark:border-gray-700 rounded"
            />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Manual Entry Key
            </Label>
            <div className="flex items-center justify-between mt-1">
              <code className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {setupData.manualEntryKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(setupData.manualEntryKey, 'Manual key')}
                className="ml-2"
              >
                {copiedCode === setupData.manualEntryKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(verifyCode)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                       <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <InputOTPGroup >
                          <InputOTPSlot index={0}  />
                          <InputOTPSlot index={1}  />
                          <InputOTPSlot index={2}  />
                          <InputOTPSlot index={3}  />
                          <InputOTPSlot index={4}  />
                          <InputOTPSlot index={5}  />
                        </InputOTPGroup>
                        </InputOTP>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    )
  }

  if (step === 'backup' && setupData) {
    return (
      <div className="w-full max-w-md mx-auto p-2">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Save Backup Codes
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Keep these codes safe. Each can only be used once to access your account if you lose
            your authenticator.
          </p>

          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {setupData.backupCodes.map((code, _index) => (
              <Badge
                key={code}
                variant="secondary"
                className="justify-center font-mono text-xs py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
              >
                {code}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Button
              onClick={downloadBackupCodes}
              variant="outline"
              className="w-full border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              Download Backup Codes
            </Button>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saved-codes"
                checked={savedBackupCodes}
                onChange={e => setSavedBackupCodes(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="saved-codes" className="text-sm text-gray-600 dark:text-gray-400">
                I have saved these backup codes in a secure location
              </label>
            </div>
          </div>

          <Button
            onClick={completeFinalStep}
            className="w-full"
            disabled={!savedBackupCodes || isLoading}
          >
            {isLoading ? 'Enabling 2FA...' : 'Complete Setup'}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="w-full max-w-md mx-auto p-2">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              2FA Enabled Successfully!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Your account is now protected with two-factor authentication
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              You'll now need to enter a code from your authenticator app each time you sign in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Add metadata for QDrawer
;(TwoFactorSetup as any).defaultTitle = 'Two-Factor Authentication Setup'
;(TwoFactorSetup as any).defaultDescription = 'Secure your account with 2FA'
