import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel, isLoading,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 mx-4"
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(79,70,229,0.15)' }}>
                  <AlertTriangle size={18} style={{ color: danger ? '#f87171' : '#a3ff29' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white/90">{title}</h3>
                  <p className="text-sm text-white/50 mt-1">{message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{
                    background: danger
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                      : 'linear-gradient(135deg, #a3ff29, #21d978)',
                  }}
                >
                  {isLoading ? 'Processing...' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}