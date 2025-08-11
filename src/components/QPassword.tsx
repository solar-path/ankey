import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { forwardRef, useState } from 'react'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

interface PasswordComplexityProps {
  password: string
  className?: string
  requirements?: PasswordRequirement[]
}

function PasswordComplexity({
  password,
  className = '',
  requirements = [
    {
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: 'One lowercase letter',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: 'One uppercase letter',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'One number',
      test: (pwd: string) => /\d/.test(pwd),
    },
    {
      label: 'One symbol (@$!%*?&)',
      test: (pwd: string) => /[@$!%*?&]/.test(pwd),
    },
  ]
}: PasswordComplexityProps) {
  const passedCount = requirements.filter(req => req.test(password)).length
  const progress = (passedCount / requirements.length) * 100

  const getStrengthColor = () => {
    if (progress < 40) return 'bg-red-500'
    if (progress < 60) return 'bg-yellow-500'
    if (progress < 80) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (progress < 40) return 'Weak'
    if (progress < 60) return 'Fair'
    if (progress < 80) return 'Good'
    return 'Strong'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Password strength</span>
          <span className={`text-sm font-medium ${
            progress < 40 ? 'text-red-600 dark:text-red-400' :
            progress < 60 ? 'text-yellow-600 dark:text-yellow-400' :
            progress < 80 ? 'text-orange-600 dark:text-orange-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2" />
          <div
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password)
          return (
            <div key={index} className="flex items-center gap-2">
              {passed ? (
                <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
              ) : (
                <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              )}
              <span className={`text-sm ${
                passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {req.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface QPasswordProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showComplexity?: boolean
  complexityClassName?: string
  requirements?: PasswordRequirement[]
}

export const QPassword = forwardRef<HTMLInputElement, QPasswordProps>(
  ({
    showComplexity = false,
    complexityClassName = 'mt-2',
    requirements,
    className = '',
    value = '',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            className={`pr-10 ${className}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </Button>
        </div>

        {showComplexity && (
          <PasswordComplexity
            password={String(value)}
            className={complexityClassName}
            requirements={requirements}
          />
        )}
      </div>
    )
  }
)

QPassword.displayName = 'QPassword'

export { PasswordComplexity }
export type { PasswordComplexityProps, PasswordRequirement, QPasswordProps }
