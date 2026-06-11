import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Trash2, FileText, Upload, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { employeeService } from '../../api'
import { Document } from '../../types'
import { formatDate, formatFileSize, getFileIcon, cn } from '../../utils'
import FileUpload from '../common/FileUpload'
import ConfirmDialog from '../common/ConfirmDialog'

interface EmployeeDocumentsProps {
  employeeId: string
  documents: Document[]
  canUpload?: boolean
}

export default function EmployeeDocuments({ employeeId, documents, canUpload }: EmployeeDocumentsProps) {
  const queryClient = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [docType, setDocType] = useState('other')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      files.forEach(f => fd.append('document', f))
      fd.append('documentType', docType)
      return employeeService.uploadDocuments(employeeId, fd)
    },
    onSuccess: () => {
      toast.success('Documents uploaded')
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      setFiles([])
      setShowUpload(false)
    },
    onError: () => toast.error('Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => employeeService.deleteDocument(employeeId, docId),
    onSuccess: () => {
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      setDeleteTarget(null)
    },
  })

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white/70">Documents</h3>
        {canUpload && (
          <button onClick={() => setShowUpload(!showUpload)} className="btn-secondary text-sm">
            <Upload size={13} />
            Upload
          </button>
        )}
      </div>

      {showUpload && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="input-field text-sm">
              <option value="resume">Resume</option>
              <option value="id_proof">ID Proof</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <FileUpload
            onFilesSelected={setFiles}
            files={files}
            onRemove={i => setFiles(f => f.filter((_, idx) => idx !== i))}
            accept={{ 'image/*': ['.jpg', '.png'], 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] }}
          />
          {files.length > 0 && (
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending}
              className="btn-primary w-full justify-center text-sm"
            >
              {uploadMutation.isPending ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {!documents?.length ? (
        <div className="flex flex-col items-center justify-center py-10">
          <FileText size={28} className="text-white/15 mb-2" />
          <p className="text-sm text-white/25">No documents uploaded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-xl flex-shrink-0">{getFileIcon(doc.mimeType || '')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/70 truncate">{doc.documentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/25 capitalize">{doc.documentType}</span>
                  {doc.fileSize && <span className="text-xs text-white/20">· {formatFileSize(doc.fileSize)}</span>}
                  <span className="text-xs text-white/20">· {formatDate(doc.createdAt)}</span>
                  {doc.isVerified && <CheckCircle2 size={11} className="text-emerald-400" />}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`/api/v1/employees/${employeeId}/documents/${doc.id}/download`}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Download size={14} className="text-white/40" />
                </a>
                {canUpload && (
                  <button onClick={() => setDeleteTarget(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Document"
        message="This document will be permanently deleted. Are you sure?"
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}