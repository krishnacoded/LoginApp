import React from 'react'
import { cn, getStatusColor, getStatusLabel } from '../../utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(getStatusColor(status), className)}>
      {getStatusLabel(status)}
    </span>
  )
}