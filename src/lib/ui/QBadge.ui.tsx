import { cn } from "@/lib/utils"

interface QBadgeProps {
  count?: number
  max?: number
  showZero?: boolean
  variant?: "default" | "primary" | "secondary" | "destructive" | "success" | "warning"
  size?: "sm" | "md" | "lg"
  className?: string
  dot?: boolean
}

const variantStyles = {
  default: "bg-black text-white",
  primary: "bg-black text-white",
  secondary: "bg-black text-white",
  destructive: "bg-black text-white",
  success: "bg-black text-white",
  warning: "bg-black text-white",
}

const sizeStyles = {
  sm: "text-[10px] min-w-4 h-4 px-1",
  md: "text-xs min-w-5 h-5 px-1.5",
  lg: "text-sm min-w-6 h-6 px-2",
}

const dotSizeStyles = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
}

/**
 * QBadge - Universal notification badge component
 *
 * Features:
 * - Display count with max limit (e.g., "99+")
 * - Dot mode for simple indicator
 * - Multiple variants (primary, destructive, success, warning)
 * - Multiple sizes (sm, md, lg)
 * - Hide when count is 0 (unless showZero is true)
 *
 * @example
 * // Basic usage
 * <QBadge count={5} />
 *
 * @example
 * // With max limit
 * <QBadge count={150} max={99} /> // Shows "99+"
 *
 * @example
 * // Dot indicator
 * <QBadge dot variant="destructive" />
 *
 * @example
 * // Different variants
 * <QBadge count={3} variant="primary" />
 * <QBadge count={10} variant="destructive" />
 * <QBadge count={5} variant="success" />
 */
export function QBadge({
  count = 0,
  max = 99,
  showZero = false,
  variant = "destructive",
  size = "sm",
  className,
  dot = false,
}: QBadgeProps) {
  // Don't render if count is 0 and showZero is false
  if (!dot && count === 0 && !showZero) {
    return null
  }

  // Dot mode
  if (dot) {
    return (
      <span
        className={cn(
          "rounded-full",
          variantStyles[variant],
          dotSizeStyles[size],
          className
        )}
      />
    )
  }

  // Count display
  const displayCount = count > max ? `${max}+` : count

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {displayCount}
    </span>
  )
}
