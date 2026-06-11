import React from 'react'
import { cn, getInitials, generateAvatarColor } from '../../utils'

interface AvatarProps {
  firstName?: string
  lastName?: string
  email?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
}

export default function Avatar({ firstName, lastName, email, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName, email)
  const gradClass = generateAvatarColor(`${firstName || ''}${lastName || email || ''}`)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setHasError(false)
  }, [src])

  return (
    <div className={cn(
      'rounded-xl flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0',
      `bg-gradient-to-br ${gradClass}`,
      sizes[size],
      className,
    )}>
      {src && !hasError ? (
        <img src={src} alt={initials} className="w-full h-full object-cover" onError={() => setHasError(true)} />
      ) : (
        initials
      )}
    </div>
  )
}