import * as React from 'react'
import { cn } from '@/utils/cn'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12'
    }

    return (
      <div
        ref={ref}
        className={cn('animate-spin', sizeClasses[size], className)}
        {...props}
      >
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    )
  }
)
LoadingSpinner.displayName = 'LoadingSpinner'

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const dotSizes = {
      sm: 'h-1 w-1',
      md: 'h-2 w-2',
      lg: 'h-3 w-3'
    }

    return (
      <div
        ref={ref}
        className={cn('flex space-x-1', className)}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse rounded-full bg-current',
              dotSizes[size]
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }
)
LoadingDots.displayName = 'LoadingDots'

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, lines = 1, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 w-full"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    )
  }
)
LoadingSkeleton.displayName = 'LoadingSkeleton'

interface LoadingPageProps {
  message?: string
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Carregando...' 
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4 text-primary" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export { LoadingSpinner, LoadingDots, LoadingSkeleton, LoadingPage } 