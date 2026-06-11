import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle2, AlertTriangle, Play, Square, Settings, Calendar, ShieldAlert, Users, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { attendanceService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { cn, formatDate } from '../../utils'

export default function AttendancePage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'all' | 'settings'>('my')
  
  // Filters
  const [page, setPage] = useState(1)
  const [teamPage, setTeamPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Settings state
  const [officeStartTime, setOfficeStartTime] = useState('09:00:00')
  const [officeEndTime, setOfficeEndTime] = useState('18:00:00')
  const [fullDayThreshold, setFullDayThreshold] = useState(8.0)
  const [halfDayThreshold, setHalfDayThreshold] = useState(4.0)
  const [lateArrivalThreshold, setLateArrivalThreshold] = useState('09:15:00')

  // Queries
  const { data: todayStatus, isLoading: loadingToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceService.getTodayStatus(),
  })

  const { data: monthlyStats } = useQuery({
    queryKey: ['attendance-monthly-stats'],
    queryFn: () => attendanceService.getMonthlyStats(),
  })

  const { data: myLogsData, isLoading: loadingMy } = useQuery({
    queryKey: ['attendance-my-logs', page],
    queryFn: () => attendanceService.getMyLogs({ page, limit: 10 }),
  })

  const { data: teamLogsData, isLoading: loadingTeam } = useQuery({
    queryKey: ['attendance-team-logs', teamPage, statusFilter, dateFilter],
    queryFn: () => attendanceService.getTeamLogs({ page: teamPage, limit: 10, status: statusFilter, startDate: dateFilter, endDate: dateFilter }),
    enabled: hasRole(['admin', 'hr', 'manager']) && activeTab === 'team',
  })

  const { data: allLogsData, isLoading: loadingAll } = useQuery({
    queryKey: ['attendance-all-logs', allPage, statusFilter, dateFilter],
    queryFn: () => attendanceService.getAllLogs({ page: allPage, limit: 10, status: statusFilter, startDate: dateFilter, endDate: dateFilter }),
    enabled: hasRole(['admin', 'hr']) && activeTab === 'all',
  })

  const { data: settingsData } = useQuery({
    queryKey: ['attendance-settings'],
    queryFn: async () => {
      const data = await attendanceService.getSettings()
      if (data) {
        setOfficeStartTime(data.office_start_time || '09:00:00')
        setOfficeEndTime(data.office_end_time || '18:00:00')
        setFullDayThreshold(parseFloat(data.full_day_threshold) || 8.0)
        setHalfDayThreshold(parseFloat(data.half_day_threshold) || 4.0)
        setLateArrivalThreshold(data.late_arrival_threshold || '09:15:00')
      }
      return data
    },
    enabled: hasRole(['admin', 'hr']) && activeTab === 'settings',
  })

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: () => attendanceService.clockIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-logs'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly-stats'] })
      toast.success('Clocked in successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to clock in'),
  })

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceService.clockOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-logs'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly-stats'] })
      toast.success('Clocked out successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to clock out'),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => attendanceService.updateSettings(data),
    onSuccess: () => {
      toast.success('Attendance settings updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['attendance-settings'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update settings'),
  })

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate({
      officeStartTime,
      officeEndTime,
      fullDayThreshold,
      halfDayThreshold,
      lateArrivalThreshold,
    })
  }

  // Helpers
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35',
      late: 'bg-amber-500/15 text-amber-400 border border-amber-500/35',
      half_day: 'bg-blue-500/15 text-blue-400 border border-blue-500/35',
      absent: 'bg-red-500/15 text-red-400 border border-red-500/35',
    }
    return (
      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full uppercase', styles[status] || 'bg-white/8 text-white/40')}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Attendance Desk"
        subtitle="Manage check-ins, office hours, and team logs"
      />

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my')}
          className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'my' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
        >
          My Attendance
        </button>
        {hasRole(['admin', 'hr', 'manager']) && (
          <button
            onClick={() => { setActiveTab('team'); setStatusFilter(''); setDateFilter('') }}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'team' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            Team Logs
          </button>
        )}
        {hasRole(['admin', 'hr']) && (
          <button
            onClick={() => { setActiveTab('all'); setStatusFilter(''); setDateFilter('') }}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'all' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            All Logs (Admin)
          </button>
        )}
        {hasRole(['admin', 'hr']) && (
          <button
            onClick={() => setActiveTab('settings')}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-1.5', activeTab === 'settings' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            <Settings size={14} /> Settings
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'my' && (
          <motion.div
            key="my"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Clocking Console */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col items-center justify-between min-h-[350px]">
              <div className="text-center w-full">
                <h3 className="text-lg font-semibold text-white/80">Today's Console</h3>
                <p className="text-xs text-white/35 mt-1">{new Date().toDateString()}</p>
              </div>

              {loadingToday ? (
                <LoadingSpinner />
              ) : (
                <div className="flex flex-col items-center gap-6 my-6">
                  {/* Status Ring */}
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-4 border-white/5 bg-black/20 shadow-inner">
                    <Clock size={40} className={cn('animate-pulse', todayStatus?.clock_in && !todayStatus?.clock_out ? 'text-emerald-400' : 'text-white/20')} />
                    {todayStatus?.clock_in && (
                      <span className="absolute bottom-3 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                        {todayStatus.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-white/30">Clocked In: <span className="font-mono text-white/70">{formatTime(todayStatus?.clock_in)}</span></p>
                    <p className="text-xs text-white/30 mt-1">Clocked Out: <span className="font-mono text-white/70">{formatTime(todayStatus?.clock_out)}</span></p>
                  </div>
                </div>
              )}

              <div className="w-full flex gap-3">
                {!todayStatus?.clock_in ? (
                  <button
                    onClick={() => clockInMutation.mutate()}
                    disabled={clockInMutation.isPending}
                    className="btn-primary flex-1 justify-center py-3 rounded-xl flex items-center gap-2"
                  >
                    <Play size={16} /> Clock In
                  </button>
                ) : !todayStatus?.clock_out ? (
                  <button
                    onClick={() => clockOutMutation.mutate()}
                    disabled={clockOutMutation.isPending}
                    className="flex-1 justify-center py-3 rounded-xl flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-600/20 transition duration-200"
                  >
                    <Square size={16} /> Clock Out
                  </button>
                ) : (
                  <div className="w-full text-center py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/40">
                    Shift Completed For Today 🎉
                  </div>
                )}
              </div>
            </div>

            {/* Logs & Monthly Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/35">Present Days</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{monthlyStats?.present || 0}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/35">Late Arrivals</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{monthlyStats?.late || 0}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/35">Half Days</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{monthlyStats?.half_day || 0}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/35">Total Hours</p>
                  <p className="text-2xl font-bold text-white/80 mt-1">{monthlyStats?.total_hours || '0.00'}h</p>
                </div>
              </div>

              {/* Logs Table */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-semibold text-white/70 flex items-center gap-2"><Calendar size={16} /> Monthly Log</h3>
                </div>

                {loadingMy ? (
                  <div className="p-10"><LoadingSpinner /></div>
                ) : !myLogsData?.data || myLogsData.data.length === 0 ? (
                  <div className="p-10"><EmptyState icon={Clock} title="No attendance logs" description="You have not clocked any attendance records yet" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Clock In</th>
                          <th className="p-4">Clock Out</th>
                          <th className="p-4">Hours</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myLogsData.data.map((log: any) => (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition">
                            <td className="p-4 font-medium text-white/80">{formatDate(log.date)}</td>
                            <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_in)}</td>
                            <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_out)}</td>
                            <td className="p-4 text-white/70 font-semibold">{log.work_hours ? `${log.work_hours} hrs` : '--'}</td>
                            <td className="p-4">{getStatusBadge(log.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {myLogsData?.pagination && (
                  <div className="p-3 border-t border-white/5">
                    <Pagination pagination={myLogsData.pagination} onPageChange={setPage} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTeamPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1">Specific Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setTeamPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                />
              </div>

              <button
                onClick={() => { setStatusFilter(''); setDateFilter(''); setTeamPage(1) }}
                className="btn-secondary self-end py-2 px-3 text-xs"
              >
                Clear
              </button>
            </div>

            {/* Team Logs Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {loadingTeam ? (
                <div className="p-10"><LoadingSpinner /></div>
              ) : !teamLogsData?.data || teamLogsData.data.length === 0 ? (
                <div className="p-10"><EmptyState icon={Users} title="No team records" description="No attendance logs found matching filters" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Clock In</th>
                        <th className="p-4">Clock Out</th>
                        <th className="p-4">Work Hours</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {teamLogsData.data.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition">
                          <td className="p-4">
                            <div className="font-semibold text-white/80">{log.first_name} {log.last_name}</div>
                            <div className="text-[11px] text-white/35">{log.employee_code} · {log.designation}</div>
                          </td>
                          <td className="p-4 font-medium text-white/70">{formatDate(log.date)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_in)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_out)}</td>
                          <td className="p-4 text-white/70 font-semibold">{log.work_hours ? `${log.work_hours} hrs` : '--'}</td>
                          <td className="p-4">{getStatusBadge(log.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {teamLogsData?.pagination && (
                <div className="p-3 border-t border-white/5">
                  <Pagination pagination={teamLogsData.pagination} onPageChange={setTeamPage} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'all' && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setAllPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] uppercase tracking-wider text-white/30 mb-1">Date Filter</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setAllPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                />
              </div>

              <button
                onClick={() => { setStatusFilter(''); setDateFilter(''); setAllPage(1) }}
                className="btn-secondary self-end py-2 px-3 text-xs"
              >
                Clear
              </button>
            </div>

            {/* Admin Logs Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {loadingAll ? (
                <div className="p-10"><LoadingSpinner /></div>
              ) : !allLogsData?.data || allLogsData.data.length === 0 ? (
                <div className="p-10"><EmptyState icon={Users} title="No records found" description="No attendance logs match the selected filters" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Clock In</th>
                        <th className="p-4">Clock Out</th>
                        <th className="p-4">Work Hours</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allLogsData.data.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition">
                          <td className="p-4">
                            <div className="font-semibold text-white/80">{log.first_name} {log.last_name}</div>
                            <div className="text-[11px] text-white/35">{log.employee_code} · {log.designation}</div>
                          </td>
                          <td className="p-4 text-white/60">{log.department_name || 'Unassigned'}</td>
                          <td className="p-4 font-medium text-white/70">{formatDate(log.date)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_in)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clock_out)}</td>
                          <td className="p-4 text-white/70 font-semibold">{log.work_hours ? `${log.work_hours} hrs` : '--'}</td>
                          <td className="p-4">{getStatusBadge(log.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {allLogsData?.pagination && (
                <div className="p-3 border-t border-white/5">
                  <Pagination pagination={allLogsData.pagination} onPageChange={setAllPage} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[700px]"
          >
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white/80 flex items-center gap-2 mb-6">
                <Settings size={18} className="text-sun" /> Configure Office Policies
              </h3>

              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/45 mb-1.5 font-medium">Shift Start Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00:00"
                      value={officeStartTime}
                      onChange={(e) => setOfficeStartTime(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full text-white/80 focus:outline-none focus:border-sun"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/45 mb-1.5 font-medium">Shift End Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 18:00:00"
                      value={officeEndTime}
                      onChange={(e) => setOfficeEndTime(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full text-white/80 focus:outline-none focus:border-sun"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/45 mb-1.5 font-medium">Full-Day Threshold (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={fullDayThreshold}
                      onChange={(e) => setFullDayThreshold(parseFloat(e.target.value))}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full text-white/80 focus:outline-none focus:border-sun"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/45 mb-1.5 font-medium">Half-Day Threshold (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={halfDayThreshold}
                      onChange={(e) => setHalfDayThreshold(parseFloat(e.target.value))}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full text-white/80 focus:outline-none focus:border-sun"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1.5 font-medium">Late Arrival Buffer Limit</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:15:00"
                    value={lateArrivalThreshold}
                    onChange={(e) => setLateArrivalThreshold(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  />
                  <p className="text-[10px] text-white/30 mt-1.5">Employee clock-ins after this time will automatically mark the status as 'Late'.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="btn-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                  >
                    {updateSettingsMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
                    Save Policy Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
