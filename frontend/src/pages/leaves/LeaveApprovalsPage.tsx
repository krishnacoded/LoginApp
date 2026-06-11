import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react'
import { leaveService } from '../../api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import LeaveApprovalCard from '../../components/leaves/LeaveApprovalCard'
import Pagination from '../../components/common/Pagination'
import { formatDate, cn } from '../../utils'
import { LeaveRequest } from '../../types'
import Avatar from '../../components/Avatar/Avatar'

export default function LeaveApprovalsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<LeaveRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leaves-pending', page],
    queryFn: () => leaveService.getAll({ status: 'pending', page, limit: 15 }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['leave-stats'],
    queryFn: leaveService.getStats,
  })

  const leaves: LeaveRequest[] = data?.data || []
  const pagination = data?.pagination
  const stats = statsData?.overview

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leaves-pending'] })
    queryClient.invalidateQueries({ queryKey: ['leave-stats'] })
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Leave Approvals"
        subtitle="Review and action pending leave requests"
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: stats.pending, color: '#D97706', icon: Clock },
            { label: 'Approved', value: stats.approved, color: '#059669', icon: CheckCircle2 },
            { label: 'Rejected', value: stats.rejected, color: '#DC2626', icon: XCircle },
            { label: 'Total', value: stats.total, color: '#a3ff29', icon: Users },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/40">{label}</p>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-white mt-1">{value || 0}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : leaves.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No pending approvals" description="All leave requests have been actioned" />
      ) : (
        <div className="space-y-2">
          {leaves.map((leave, i) => (
            <motion.div key={leave.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card-hover rounded-2xl p-4 cursor-pointer flex items-center gap-4"
              onClick={() => setSelected(leave)}>
              <Avatar firstName={leave.firstName} lastName={leave.lastName} src={leave.profilePictureUrl} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white/80">{leave.firstName} {leave.lastName}</p>
                <p className="text-xs text-white/40">{leave.employeeCode} · {leave.departmentName}</p>
              </div>
              <div className="hidden md:block text-center">
                <p className="text-sm font-semibold" style={{ color: leave.color }}>{leave.leaveTypeName}</p>
                <p className="text-xs text-white/35">{leave.totalDays} days</p>
              </div>
              <div className="hidden md:block text-center">
                <p className="text-xs text-white/40">{formatDate(leave.startDate)}</p>
                <p className="text-xs text-white/25">→ {formatDate(leave.endDate)}</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 rounded-lg text-xs text-amber-400 font-medium"
                  style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <Clock size={11} className="inline mr-1" />Pending
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}

      <AnimatePresence>
        {selected && (
          <LeaveApprovalCard
            leave={selected}
            canApprove
            onClose={() => setSelected(null)}
            onApproved={() => { refresh(); setSelected(null) }}
            onCancel={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}