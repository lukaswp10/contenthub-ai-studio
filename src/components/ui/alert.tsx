import React from 'react'
import { cn } from '../../utils/cn'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
  children: React.ReactNode
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-gray-800 border-gray-600 text-gray-100",
      destructive: "bg-red-900/20 border-red-500/50 text-red-300"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg border p-4",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Alert.displayName = "Alert"

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
      />
    )
  }
)

AlertDescription.displayName = "AlertDescription" 