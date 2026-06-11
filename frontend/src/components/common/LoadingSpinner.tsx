import React from 'react'
import { cn } from '../../utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
}

export default function LoadingSpinner({ size = 'md', className, fullPage }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3' }

  const spinner = (
    <div className={cn(
      'rounded-full border-lime-400/30 border-t-lime-400 animate-spin',
      sizes[size],
      className,
    )} />
  )

  if (fullPage) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-white/30">Loading...</p>
        </div>
      </div>
    )
  }

  return spinner
}