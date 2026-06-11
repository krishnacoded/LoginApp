import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.1)' }}>
        <AlertCircle size={28} className="text-red-400/70" />
      </div>
      <h3 className="text-lg font-semibold text-white/50 mb-2">{title}</h3>
      <p className="text-sm text-white/25 text-center max-w-xs mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </motion.div>
  )
}