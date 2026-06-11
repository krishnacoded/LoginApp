import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle2 } from 'lucide-react'
import { cn, formatFileSize, getFileIcon } from '../../utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  label?: string
  description?: string
  files?: File[]
  onRemove?: (index: number) => void
  className?: string
}

export default function FileUpload({
  onFilesSelected, accept, maxFiles = 5, maxSize = 10 * 1024 * 1024,
  label = 'Upload files', description, files = [], onRemove, className,
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept, maxFiles, maxSize,
    multiple: maxFiles > 1,
  })

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive && !isDragReject && 'border-lime-400/70 bg-lime-400/5',
          isDragReject && 'border-red-500/70 bg-red-500/5',
          !isDragActive && 'border-white/10 hover:border-white/20 hover:bg-white/2',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: isDragActive ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.04)' }}>
            <Upload size={20} className={isDragActive ? 'text-lime-300' : 'text-white/30'} />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">
              {isDragActive ? 'Drop files here' : label}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {description || `Drag & drop or click to browse · Max ${formatFileSize(maxSize)}`}
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xl flex-shrink-0">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/70 truncate">{file.name}</p>
                  <p className="text-xs text-white/30">{formatFileSize(file.size)}</p>
                </div>
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                {onRemove && (
                  <button
                    onClick={() => onRemove(i)}
                    className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0"
                  >
                    <X size={14} className="text-white/30 hover:text-red-400" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}