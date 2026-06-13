import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Calendar, FileText } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leaveService } from '../../api'
import { cn } from '../../utils'
import FileUpload from '../common/FileUpload'
import { LeaveBalance, LeaveType } from '../../types'

const schema = z.object({
  leaveTypeId: z.string().min(1, 'Select a leave type'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  reason: z.string().min(10, 'Please provide a reason (min 10 chars)'),
  isHalfDay: z.boolean().optional(),
  halfDayType: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface LeaveRequestModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function LeaveRequestModal({ onClose, onSuccess }: LeaveRequestModalProps) {
  const [attachments, setAttachments] = useState<File[]>([])

  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ['leave-types'],
    queryFn: () => leaveService.getTypes(),
  })

  const { data: balance } = useQuery<LeaveBalance[]>({
    queryKey: ['leave-balance-my'],
    queryFn: () => leaveService.getMyBalance(),
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isHalfDay: false },
  })

  const selectedTypeId = watch('leaveTypeId')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const isHalfDay = watch('isHalfDay')

  const selectedType = leaveTypes?.find((t) => t.id === selectedTypeId)
  const selectedBalance = balance?.find((b) => b.leaveTypeId === selectedTypeId)

  const calcDays = () => {
    if (!startDate || !endDate) return 0
    if (isHalfDay) return 0.5
    let count = 0
    const s = new Date(startDate)
    const e = new Date(endDate)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) count++
    }
    return count
  }

  const days = calcDays()
  const available = selectedBalance
    ? selectedBalance.allocatedDays + selectedBalance.carriedForwardDays - selectedBalance.usedDays - selectedBalance.pendingDays
    : null

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (attachments.length > 0) {
        const fd = new FormData()
        Object.entries(data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v))
        })
        fd.append('leave_attachment', attachments[0])
        return leaveService.apply(fd)
      }
      return leaveService.apply(data)
    },
    onSuccess,
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit leave'),
  })

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0"
            style={{ background: 'rgba(8,12,26,0.99)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <h2 className="font-semibold text-white/90">Apply for Leave</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
            <div>
              <label className="text-xs text-white/40 mb-2 block font-medium">Leave Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {(leaveTypes || []).map((type) => (
                  <label key={type.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all',
                    selectedTypeId === type.id ? 'border-primary/50 bg-primary/8' : 'border-white/6 hover:border-white/12',
                  )}>
                    <input {...register('leaveTypeId')} type="radio" value={type.id} className="sr-only" />
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: type.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/70 truncate">{type.name}</p>
                      <p className="text-[10px] text-white/30">{type.maxDaysPerYear}d/year</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.leaveTypeId && <p className="text-xs text-red-400 mt-1">{errors.leaveTypeId.message}</p>}
            </div>

            {selectedBalance && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: `${selectedType?.color}10`, border: `1px solid ${selectedType?.color}30` }}>
                <span className="text-xs text-white/50">Available Balance</span>
                <span className="text-sm font-bold" style={{ color: selectedType?.color }}>
                  {available} days remaining
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Start Date *</label>
                <input {...register('startDate')} type="date" min={new Date().toISOString().split('T')[0]}
                  className={cn('input-field', errors.startDate && 'border-red-500/50')} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">End Date *</label>
                <input {...register('endDate')} type="date" min={startDate || new Date().toISOString().split('T')[0]}
                  className={cn('input-field', errors.endDate && 'border-red-500/50')} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input {...register('isHalfDay')} type="checkbox" id="halfDay" className="w-4 h-4 rounded accent-primary" />
              <label htmlFor="halfDay" className="text-sm text-white/50 cursor-pointer">Half day</label>
              {isHalfDay && (
                <select {...register('halfDayType')} className="input-field ml-2 flex-1 text-sm">
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              )}
            </div>

            {days > 0 && (
              <div className={cn(
                'flex items-center justify-between px-4 py-2.5 rounded-xl text-sm',
                available !== null && days > available ? 'bg-red-500/10 border border-red-500/30' : 'bg-primary/10 border border-primary/20',
              )}>
                <span className="text-white/50">Total working days</span>
                <span className={cn('font-bold', available !== null && days > available ? 'text-red-400' : 'text-primary')}>
                  {days} day{days !== 1 ? 's' : ''}
                  {available !== null && days > available && ' (exceeds balance)'}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Reason *</label>
              <textarea {...register('reason')} rows={3} placeholder="Please provide a reason for your leave request..."
                className={cn('input-field resize-none', errors.reason && 'border-red-500/50')} />
              {errors.reason && <p className="text-xs text-red-400 mt-1">{errors.reason.message}</p>}
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block flex items-center gap-1.5">
                <FileText size={12} />
                Attachment {selectedType?.requiresAttachment && <span className="text-red-400">*</span>}
              </label>
              <FileUpload
                onFilesSelected={setAttachments}
                files={attachments}
                onRemove={() => setAttachments([])}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ 'image/*': ['.jpg', '.png'], 'application/pdf': ['.pdf'] }}
                label="Attach supporting document"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={mutation.isPending || (available !== null && days > available && days > 0)}
                className="btn-primary disabled:opacity-50">
                {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}