import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ShieldAlert, FileText, Zap, Award, BookOpen, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { verificationService } from '../../api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { formatDate, cn } from '../../utils'

export default function VerificationApprovalsPage() {
  const queryClient = useQueryClient()
  const [actionTarget, setActionTarget] = useState<{ request: any; action: 'approve' | 'reject' } | null>(null)
  const [comment, setComment] = useState('')

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['verifications-pending'],
    queryFn: verificationService.getPending,
  })

  const actionMutation = useMutation({
    mutationFn: (payload: { type: string; id: string; action: 'approve' | 'reject'; comment?: string }) =>
      verificationService.actionRequest(payload.type, payload.id, payload.action, payload.comment),
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`)
      setActionTarget(null)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['verifications-pending'] })
      queryClient.invalidateQueries({ queryKey: ['employee'] }) // Invalidate any cached employee profile
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to action request')
    }
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return <Zap size={15} className="text-cyan-400" />
      case 'certification': return <Award size={15} className="text-amber-400" />
      case 'education': return <BookOpen size={15} className="text-lime-400" />
      default: return <FileText size={15} className="text-indigo-400" />
    }
  }

  const renderDetails = (req: any) => {
    if (req.type === 'skill') {
      return (
        <span className="text-xs text-white/50">
          Proficiency: <strong className="text-white/80">{req.metadata.proficiency_level}/5</strong> · Exp: <strong className="text-white/80">{req.metadata.years_experience} years</strong>
        </span>
      )
    } else if (req.type === 'certification') {
      return (
        <span className="text-xs text-white/50">
          Org: <strong className="text-white/80">{req.metadata.issuing_organization}</strong> · Issue: <strong className="text-white/80">{formatDate(req.metadata.issue_date)}</strong>
        </span>
      )
    } else if (req.type === 'education') {
      return (
        <span className="text-xs text-white/50">
          Inst: <strong className="text-white/80">{req.metadata.institution}</strong> · End Date: <strong className="text-white/80">{formatDate(req.metadata.end_date)}</strong>
        </span>
      )
    } else if (req.type === 'license') {
      return (
        <span className="text-xs text-white/50">
          Lic #: <strong className="text-white/80">{req.metadata.license_number || 'N/A'}</strong> · State: <strong className="text-white/80">{req.metadata.issuing_state}</strong>
        </span>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Verification Requests"
        subtitle="Review and approve employee skills, certifications, and educational credentials"
      />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : !requests || requests.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No pending verifications" description="All submitted credentials have been verified" />
      ) : (
        <div className="space-y-3">
          {requests.map((req: any, i: number) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/8">
                  {getTypeIcon(req.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/80">{req.employee_name}</span>
                    <span className="text-xs font-mono text-lime-400">{req.employee_code}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold capitalize text-lime-300 px-2 py-0.5 rounded bg-lime-400/10 border border-lime-400/20">
                      {req.type}
                    </span>
                    <span className="text-xs text-white/80 font-medium">{req.credential_name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {renderDetails(req)}
                    <span className="text-[11px] text-white/30 flex items-center gap-1">
                      <Clock size={11} /> Requested: {formatDate(req.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {req.proof_url && (
                  <a
                    href={req.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <FileText size={12} /> View Proof
                  </a>
                )}
                <button
                  onClick={() => setActionTarget({ request: req, action: 'approve' })}
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all"
                  title="Approve / Verify"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setActionTarget({ request: req, action: 'reject' })}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
                  title="Reject"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CONFIRMATION / ACTION MODAL */}
      <AnimatePresence>
        {actionTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setActionTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
                style={{ background: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    actionTarget.action === 'approve' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  )}>
                    {actionTarget.action === 'approve' ? <Check size={20} /> : <X size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">
                      {actionTarget.action === 'approve' ? 'Verify Request' : 'Reject Request'}
                    </h3>
                    <p className="text-xs text-white/35 mt-0.5">
                      {actionTarget.request.employee_name} · {actionTarget.request.credential_name}
                    </p>
                  </div>
                </div>

                {actionTarget.action === 'reject' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 block">Rejection Comments *</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      rows={3}
                      className="input-field resize-none"
                      required
                    />
                  </div>
                )}

                {actionTarget.action === 'approve' && (
                  <p className="text-xs text-white/45">
                    By verifying this request, you confirm that the uploaded proof corresponds to a valid competency. This will show on the employee's public profile.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setActionTarget(null)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={() => actionMutation.mutate({
                      type: actionTarget.request.type,
                      id: actionTarget.request.id,
                      action: actionTarget.action,
                      comment: actionTarget.action === 'reject' ? comment : undefined
                    })}
                    disabled={actionMutation.isPending || (actionTarget.action === 'reject' && !comment.trim())}
                    className={cn(
                      'btn-primary text-xs flex items-center gap-1.5',
                      actionTarget.action === 'reject' && 'bg-red-600 text-white hover:bg-red-700'
                    )}
                  >
                    {actionMutation.isPending ? (
                      <><Loader2 size={13} className="animate-spin" /> Processing...</>
                    ) : (
                      <>Confirm {actionTarget.action === 'approve' ? 'Verify' : 'Reject'}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
