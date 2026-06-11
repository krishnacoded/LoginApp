import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { employeeService } from '../../api'
import { useAuth } from '../../store/auth.store'
import EmployeeProfileHeader from '../../components/employees/EmployeeProfileHeader'
import EmployeeTimeline from '../../components/employees/EmployeeTimeline'
import EmployeeSkills from '../../components/employees/EmployeeSkills'
import EmployeeDocuments from '../../components/employees/EmployeeDocuments'
import EmployeeFormModal from '../../components/employees/EmployeeFormModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import { formatDate, getStatusLabel, cn } from '../../utils'
import type { LeaveBalance } from '../../types';

const TABS = ['Overview', 'Skills', 'Documents', 'Timeline']

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [showEdit, setShowEdit] = useState(false)

  const { data: employee, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6"><LoadingSpinner fullPage /></div>
  if (error || !employee) return <div className="p-6"><ErrorState onRetry={refetch} /></div>

  const canEdit = hasRole(['admin', 'hr'])

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <EmployeeProfileHeader employee={employee} canEdit={canEdit} onEdit={() => setShowEdit(true)} onRefresh={refetch} />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === i ? 'text-white' : 'text-white/35 hover:text-white/60',
            )}
            style={activeTab === i ? { background: 'linear-gradient(135deg, #a3ff29, #21d978)' } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 0 && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <InfoCard title="Personal Information">
              <InfoRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <InfoRow label="Gender" value={employee.gender} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Personal Email" value={employee.personalEmail} />
            </InfoCard>

            {/* Professional Info */}
            <InfoCard title="Professional Details">
              <InfoRow label="Employee Code" value={<span className="font-mono text-lime-300">{employee.employeeCode}</span>} />
              <InfoRow label="Department" value={employee.departmentName} />
              <InfoRow label="Employment Type" value={getStatusLabel(employee.employmentType)} />
              <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
              {(employee.managerFirstName || employee.managerLastName) && (
                <InfoRow label="Manager" value={`${employee.managerFirstName} ${employee.managerLastName}`} />
              )}
            </InfoCard>

            {/* Leave Balances */}
            {employee.leaveBalances && employee.leaveBalances.length > 0 && (
              <div className="md:col-span-2">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold text-white/70 mb-4">Leave Balance ({new Date().getFullYear()})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {employee.leaveBalances.map((lb: LeaveBalance) => {
                      const available = lb.allocatedDays + lb.carriedForwardDays - lb.usedDays - lb.pendingDays
                      const pct = lb.allocatedDays > 0 ? Math.min(100, (lb.usedDays / lb.allocatedDays) * 100) : 0
                      return (
                        <div key={lb.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${lb.color}30` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white/50">{lb.code}</span>
                            <span className="text-xs" style={{ color: lb.color }}>{available}d left</span>
                          </div>
                          <p className="text-sm font-medium text-white/70 truncate">{lb.leaveTypeName}</p>
                          <div className="mt-2 h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: lb.color }} />
                          </div>
                          <p className="text-xs text-white/25 mt-1">{lb.usedDays}/{lb.allocatedDays} used</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmployeeSkills skills={employee.skills || []} />
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmployeeDocuments
              employeeId={employee.id}
              documents={employee.documents || []}
              canUpload={canEdit}
            />
          </motion.div>
        )}

        {activeTab === 3 && (
          <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmployeeTimeline timeline={employee.timeline || []} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <EmployeeFormModal
            employee={employee}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['employee', id] })
              setShowEdit(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-semibold text-white/70 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-sm text-white/35">{label}</span>
      <span className="text-sm text-white/70 text-right">{value}</span>
    </div>
  )
}