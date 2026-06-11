import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, MessageSquare, User, Calendar, Clock, Ban, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leaveService } from '../../api'
import { LeaveRequest } from '../../types'
import Avatar from '../Avatar/Avatar'
import { formatDate, cn } from '../../utils'

interface LeaveApprovalCardProps {
  leave: LeaveRequest
  canApprove: boolean
  onClose: () => void
  onApproved: () => void
  onCancel: () => void
}

export default function LeaveApprovalCard({ leave, canApprove, onClose, onApproved, onCancel }: LeaveApprovalCardProps) {
  const [comment, setComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const approveMutation = useMutation({
    mutationFn: () => leaveService.approve(leave.id, comment),
    onSuccess: () => { toast.success('Leave approved'); onApproved() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => leaveService.reject(leave.id, comment),
    onSuccess: () => { toast.success('Leave rejected'); onApproved() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const isPending = leave.status === 'pending' || leave.status === 'manager_approved'

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto"
        style={{ background: 'rgba(8,12,26,0.99)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0"
          style={{ background: 'rgba(8,12,26,0.99)', zIndex: 10 }}>
          <h2 className="font-semibold text-white/90">Leave Request Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} className="text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status banner */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: `${leave.color}12`, border: `1px solid ${leave.color}30` }}>
            <div>
              <p className="font-semibold" style={{ color: leave.color }}>{leave.leaveTypeName}</p>
              <p className="text-xs text-white/40 mt-0.5">{leave.code} · {leave.totalDays} working days</p>
            </div>
            <StatusPill status={leave.status} />
          </div>

          {/* Employee info */}
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Avatar firstName={leave.firstName} lastName={leave.lastName} src={leave.profilePictureUrl} size="md" />
            <div>
              <p className="font-medium text-white/80">{leave.firstName} {leave.lastName}</p>
              <p className="text-xs text-white/40">{leave.employeeCode} · {leave.departmentName}</p>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBox icon={Calendar} label="Start Date" value={formatDate(leave.startDate)} />
            <InfoBox icon={Calendar} label="End Date" value={formatDate(leave.endDate)} />
            <InfoBox icon={Clock} label="Applied" value={formatDate(leave.appliedAt)} />
            <InfoBox icon={User} label="Days" value={`${leave.totalDays} day${leave.totalDays !== 1 ? 's' : ''}`} />
          </div>

          {/* Reason */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs text-white/35 mb-1.5 font-medium">Reason</p>
            <p className="text-sm text-white/65 leading-relaxed">{leave.reason}</p>
          </div>

          {/* Approval timeline */}
          {leave.approvals && leave.approvals.length > 0 && (
            <div>
              <p className="text-xs text-white/35 mb-3 font-medium uppercase tracking-wider">Approval History</p>
              <div className="space-y-3">
                {leave.approvals.map((approval, i) => (
                  <div key={approval.id} className="flex gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs',
                      approval.action === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      approval.action === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-white/8 text-white/40',
                    )}>
                      {approval.action === 'approved' ? '✓' : approval.action === 'rejected' ? '✗' : `${i + 1}`}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white/65">{approval.approverName || approval.approverEmail}</p>
                        <span className="text-[10px] text-white/25 capitalize">{approval.approverRole}</span>
                      </div>
                      {approval.comment && <p className="text-xs text-white/35 mt-0.5">{approval.comment}</p>}
                      <p className="text-[10px] text-white/20 mt-0.5">{formatDate(approval.actionedAt, 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {isPending && canApprove && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-xs text-white/35 font-medium uppercase tracking-wider">Actions</p>

              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional for approval, required for rejection)"
                rows={3}
                className="input-field resize-none text-sm"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                >
                  {approveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (!comment.trim()) { toast.error('Rejection reason required'); return }
                    rejectMutation.mutate()
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                >
                  {rejectMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Cancel own leave */}
          {isPending && !canApprove && (
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(248,250,252,0.5)' }}
            >
              <Ban size={15} />
              Cancel Request
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: 'Rejected' },
    pending: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Pending' },
    cancelled: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.3)', label: 'Cancelled' },
    manager_approved: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Mgr Approved' },
  }
  const c = config[status] || config.pending
  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

function InfoBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-white/25" />
        <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-medium text-white/70">{value}</p>
    </div>
  )
}