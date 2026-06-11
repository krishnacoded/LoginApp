import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, BarChart3, MapPin, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { departmentService } from '../../api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import Avatar from '../../components/Avatar/Avatar'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils'

export default function DepartmentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: dept, isLoading, error, refetch } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6"><LoadingSpinner fullPage /></div>
  if (error || !dept) return <div className="p-6"><ErrorState onRetry={refetch} /></div>

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <button onClick={() => navigate(-1)} className="btn-secondary text-sm mb-4">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.2))' }}>
            <BarChart3 size={28} className="text-lime-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white/90">{dept.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xs text-lime-300">{dept.code}</span>
              {dept.location && (
                <span className="flex items-center gap-1 text-xs text-white/35">
                  <MapPin size={11} /> {dept.location}
                </span>
              )}
              <span className={dept.isActive ? 'badge-active badge' : 'badge-inactive badge'}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold text-white">{dept.employeeCount || 0}</p>
            <p className="text-xs text-white/35">Employees</p>
          </div>
        </div>
        {dept.description && <p className="mt-4 text-sm text-white/40">{dept.description}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Employees list */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white/70 mb-4">Team Members ({dept.employees?.length || 0})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dept.employees?.map((emp: any, i: number) => (
              <motion.div key={emp.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => navigate(`/employees/${emp.id}`)}>
                <Avatar firstName={emp.firstName} lastName={emp.lastName} src={emp.profilePictureUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/75">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-white/35">{emp.designation}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={emp.employmentStatus} />
                  <p className="text-xs text-white/25 mt-1">{formatDate(emp.joiningDate)}</p>
                </div>
              </motion.div>
            ))}
            {(!dept.employees || dept.employees.length === 0) && (
              <p className="text-sm text-white/25 text-center py-8">No employees in this department</p>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {dept.headName && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/35 mb-3">Department Head</p>
              <div className="flex items-center gap-3">
                <Avatar firstName={dept.headName.split(' ')[0]} lastName={dept.headName.split(' ')[1]} src={dept.headPicture} size="md" />
                <div>
                  <p className="text-sm font-medium text-white/75">{dept.headName}</p>
                  <p className="text-xs text-white/35">{dept.headDesignation}</p>
                </div>
              </div>
            </div>
          )}

          {dept.skillStats && dept.skillStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-white/35 mb-3">Top Skills</p>
              <div className="space-y-2">
                {dept.skillStats.slice(0, 6).map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="text-white/50 truncate">{s.name}</span>
                    <span className="text-white/30 flex-shrink-0 ml-2">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dept.hireTrend && dept.hireTrend.length > 0 && (
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-lime-300" />
                <p className="text-xs text-white/35">Hiring Trend (12 months)</p>
              </div>
              <div className="h-[100px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dept.hireTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="count" fill="#a3ff29" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}