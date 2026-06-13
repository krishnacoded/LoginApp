import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl"
    >
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(48,127,226,0.1)' }}
        >
          <Icon size={28} className="text-secondary/50" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white/50 mb-2">{title}</h3>
      {description && <p className="text-sm text-white/25 text-center max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}