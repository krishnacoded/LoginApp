import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Filter, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { leaveService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import LeaveRequestModal from '../../components/leaves/LeaveRequestModal'
import LeaveApprovalCard from '../../components/leaves/LeaveApprovalCard'
import LeaveBalanceCard from '../../components/leaves/LeaveBalanceCard'
import { cn, formatDate } from '../../utils'
import { LeaveRequest } from '../../types'

const STATUS_FILTERS = [
  { value: '', label: 'All', icon: Calendar },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: 'cancelled', label: 'Cancelled', icon: Ban },
]

export default function LeavesPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showApply, setShowApply] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', statusFilter, page],
    queryFn: () => leaveService.getAll({ status: statusFilter, page, limit: 10 }),
  })

  const { data: balances } = useQuery({
    queryKey: ['leave-balance-my'],
    queryFn: () => leaveService.getMyBalance(),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance-my'] })
      toast.success('Leave request cancelled')
      setSelectedLeave(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to cancel'),
  })

  const leaves: LeaveRequest[] = data?.data || []
  const pagination = data?.pagination

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      approved: <CheckCircle2 size={14} className="text-emerald-400" />,
      rejected: <XCircle size={14} className="text-red-400" />,
      pending: <Clock size={14} className="text-amber-400" />,
      cancelled: <Ban size={14} className="text-white/30" />,
      manager_approved: <CheckCircle2 size={14} className="text-blue-400" />,
    }
    return icons[status] || <Clock size={14} className="text-white/30" />
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Leave Management"
        subtitle="Apply and track your leave requests"
        actions={
          <button onClick={() => setShowApply(true)} className="btn-primary">
            <Plus size={16} /> Apply Leave
          </button>
        }
      />

      {/* Leave Balance Cards */}
      {balances && balances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {balances.map((bal: any) => (
            <LeaveBalanceCard key={bal.id} balance={bal} />
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1) }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
              statusFilter === value ? 'text-white' : 'text-white/35 hover:text-white/60',
            )}
            style={statusFilter === value ? { background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.2))', border: '1px solid rgba(79,70,229,0.4)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Leaves list */}
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No leave requests"
          description={statusFilter ? `No ${statusFilter} leave requests` : 'Apply for your first leave'}
          action={!statusFilter && <button onClick={() => setShowApply(true)} className="btn-primary">Apply Leave</button>}
        />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave, i) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card-hover rounded-2xl p-5 cursor-pointer"
              onClick={() => setSelectedLeave(leave)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Color bar */}
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: leave.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white/80">{leave.leaveTypeName}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: `${leave.color}20`, color: leave.color }}>
                        {leave.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="text-sm text-white/45">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </span>
                      <span className="text-sm font-semibold text-white/65">
                        {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                      </span>
                      {hasRole(['admin', 'hr', 'manager']) && (
                        <span className="text-sm text-white/40">
                          {leave.firstName} {leave.lastName}
                          {leave.departmentName && <span className="text-white/25"> · {leave.departmentName}</span>}
                        </span>
                      )}
                    </div>

                    {leave.reason && (
                      <p className="text-xs text-white/30 mt-1.5 line-clamp-1">{leave.reason}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(leave.status)}
                  <span className={cn(
                    'text-xs font-semibold capitalize px-2.5 py-1 rounded-full',
                    leave.status === 'approved' && 'bg-emerald-500/15 text-emerald-400',
                    leave.status === 'rejected' && 'bg-red-500/15 text-red-400',
                    leave.status === 'pending' && 'bg-amber-500/15 text-amber-400',
                    leave.status === 'cancelled' && 'bg-white/8 text-white/30',
                    leave.status === 'manager_approved' && 'bg-emerald-400/15 text-blue-400',
                  )}>
                    {leave.status === 'manager_approved' ? 'Mgr Approved' : leave.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {/* Leave detail / approval panel */}
      <AnimatePresence>
        {selectedLeave && (
          <LeaveApprovalCard
            leave={selectedLeave}
            canApprove={hasRole(['admin', 'hr', 'manager'])}
            onClose={() => setSelectedLeave(null)}
            onApproved={() => {
              queryClient.invalidateQueries({ queryKey: ['leaves'] })
              queryClient.invalidateQueries({ queryKey: ['leave-balance-my'] })
              setSelectedLeave(null)
            }}
            onCancel={() => cancelMutation.mutate(selectedLeave.id)}
          />
        )}
      </AnimatePresence>

      {/* Apply leave modal */}
      <AnimatePresence>
        {showApply && (
          <LeaveRequestModal
            onClose={() => setShowApply(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['leaves'] })
              queryClient.invalidateQueries({ queryKey: ['leave-balance-my'] })
              setShowApply(false)
              toast.success('Leave request submitted!')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}