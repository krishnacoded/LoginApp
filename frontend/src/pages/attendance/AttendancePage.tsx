import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Clock, CheckCircle2, AlertTriangle, Play, Square, Settings, Calendar, 
  ShieldAlert, Users, Search, RefreshCw, Coffee, MapPin, Check, X, Plus, Trash2, HelpCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { attendanceService, shiftService, regularizationService, employeeService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { cn, formatDate } from '../../utils'

export default function AttendancePage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'all' | 'settings' | 'regularizations' | 'shifts'>('my')
  
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
  const [geofencingEnabled, setGeofencingEnabled] = useState(false)
  const [geofenceLatitude, setGeofenceLatitude] = useState(0.0)
  const [geofenceLongitude, setGeofenceLongitude] = useState(0.0)
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState(200)

  // Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; address: string } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Break Type selected
  const [selectedBreakType, setSelectedBreakType] = useState<string>('lunch')

  // Regularization Apply Modal / Form state
  const [regDate, setRegDate] = useState('')
  const [regType, setRegType] = useState('missed_clock_in')
  const [regClockIn, setRegClockIn] = useState('')
  const [regClockOut, setRegClockOut] = useState('')
  const [regReason, setRegReason] = useState('')

  // Shift assignment state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const [shiftStartDate, setShiftStartDate] = useState('')
  const [shiftEndDate, setShiftEndDate] = useState('')

  // Fetch coordinates on mount
  useEffect(() => {
    fetchGeoLocation()
  }, [])

  const fetchGeoLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Current Location Coords'
        })
        setGeoLoading(false)
      },
      (error) => {
        setGeoError(error.message || 'Permission denied')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

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
        setOfficeStartTime(data.officeStartTime || '09:00:00')
        setOfficeEndTime(data.officeEndTime || '18:00:00')
        setFullDayThreshold(parseFloat(data.fullDayThreshold) || 8.0)
        setHalfDayThreshold(parseFloat(data.halfDayThreshold) || 4.0)
        setLateArrivalThreshold(data.lateArrivalThreshold || '09:15:00')
        setGeofencingEnabled(!!data.geofencingEnabled)
        setGeofenceLatitude(parseFloat(data.geofenceLatitude) || 0.0)
        setGeofenceLongitude(parseFloat(data.geofenceLongitude) || 0.0)
        setGeofenceRadiusMeters(parseInt(data.geofenceRadiusMeters) || 200)
      }
      return data
    },
    enabled: hasRole(['admin', 'hr']) && (activeTab === 'settings' || activeTab === 'my'),
  })

  // Regularization Queries
  const { data: myRegularizations } = useQuery({
    queryKey: ['regularizations-my'],
    queryFn: () => regularizationService.getMy(),
    enabled: activeTab === 'regularizations',
  })

  const { data: teamRegularizations } = useQuery({
    queryKey: ['regularizations-team'],
    queryFn: () => regularizationService.getTeam(),
    enabled: hasRole(['admin', 'hr', 'manager']) && activeTab === 'regularizations',
  })

  // Shifts Queries
  const { data: shiftsList } = useQuery({
    queryKey: ['shifts-all'],
    queryFn: () => shiftService.getAll(),
    enabled: hasRole(['admin', 'hr']) && activeTab === 'shifts',
  })

  const { data: employeesList } = useQuery({
    queryKey: ['employees-all-list-shifts'],
    queryFn: async () => {
      const res = await employeeService.getAll({ limit: 100 })
      return res.data || []
    },
    enabled: hasRole(['admin', 'hr']) && activeTab === 'shifts',
  })

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: (body?: any) => attendanceService.clockIn(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-logs'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly-stats'] })
      toast.success('Clocked in successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to clock in'),
  })

  const clockOutMutation = useMutation({
    mutationFn: (body?: any) => attendanceService.clockOut(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-logs'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly-stats'] })
      toast.success('Clocked out successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to clock out'),
  })

  const startBreakMutation = useMutation({
    mutationFn: (type: string) => attendanceService.startBreak(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      toast.success('Break started successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to start break'),
  })

  const endBreakMutation = useMutation({
    mutationFn: () => attendanceService.endBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-my-logs'] })
      toast.success('Break ended successfully!')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to end break'),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => attendanceService.updateSettings(data),
    onSuccess: () => {
      toast.success('Attendance settings updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['attendance-settings'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update settings'),
  })

  const applyRegularizationMutation = useMutation({
    mutationFn: (data: any) => regularizationService.apply(data),
    onSuccess: () => {
      toast.success('Regularization request submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['regularizations-my'] })
      setRegDate('')
      setRegClockIn('')
      setRegClockOut('')
      setRegReason('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit regularization'),
  })

  const reviewRegularizationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => regularizationService.review(id, data),
    onSuccess: () => {
      toast.success('Request updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['regularizations-team'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-team-logs'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to review request'),
  })

  const assignShiftMutation = useMutation({
    mutationFn: (data: any) => shiftService.assign(data),
    onSuccess: () => {
      toast.success('Shift assigned successfully!')
      setSelectedEmployeeId('')
      setShiftStartDate('')
      setShiftEndDate('')
      queryClient.invalidateQueries({ queryKey: ['shifts-all'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to assign shift'),
  })

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate({
      officeStartTime,
      officeEndTime,
      fullDayThreshold,
      halfDayThreshold,
      lateArrivalThreshold,
      geofencingEnabled,
      geofenceLatitude,
      geofenceLongitude,
      geofenceRadiusMeters,
    })
  }

  const handleApplyRegularization = (e: React.FormEvent) => {
    e.preventDefault()
    applyRegularizationMutation.mutate({
      date: regDate,
      requestType: regType,
      requestedClockIn: regClockIn ? `${regDate}T${regClockIn}:00Z` : null,
      requestedClockOut: regClockOut ? `${regDate}T${regClockOut}:00Z` : null,
      reason: regReason,
    })
  }

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault()
    assignShiftMutation.mutate({
      employeeId: selectedEmployeeId,
      shiftId: selectedShiftId,
      startDate: shiftStartDate,
      endDate: shiftEndDate || null,
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
      holiday: 'bg-purple-500/15 text-purple-400 border border-purple-500/35',
      leave: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/35',
      week_off: 'bg-white/10 text-white/50 border border-white/20',
    }
    return (
      <span className={cn('text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase', styles[status] || 'bg-white/8 text-white/40')}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Attendance Desk"
        subtitle="Manage check-ins, breaks, schedules, and regularization requests"
      />

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my')}
          className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'my' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
        >
          My Attendance
        </button>
        <button
          onClick={() => setActiveTab('regularizations')}
          className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'regularizations' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
        >
          Regularizations
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
            onClick={() => setActiveTab('shifts')}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-1.5', activeTab === 'shifts' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            <Calendar size={14} /> Shifts Config
          </button>
        )}
        {hasRole(['admin', 'hr']) && (
          <button
            onClick={() => setActiveTab('settings')}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-1.5', activeTab === 'settings' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            <Settings size={14} /> Policies
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
            <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[420px] relative">
              <div className="text-center w-full">
                <h3 className="text-lg font-semibold text-white/80">Console</h3>
                <p className="text-xs text-white/35 mt-1">{new Date().toDateString()}</p>
              </div>

              {/* Geolocation status indicator */}
              <div className="w-full mt-2 flex items-center justify-center gap-2 text-[11px]">
                {geoLoading ? (
                  <span className="text-white/40 flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Fetching GPS Coords...</span>
                ) : coords ? (
                  <span className="text-emerald-400 flex items-center gap-1"><MapPin size={11} /> GPS Secured</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1" onClick={fetchGeoLocation} style={{ cursor: 'pointer' }}>
                    <ShieldAlert size={11} /> GPS Error (Click to retry)
                  </span>
                )}
              </div>

              {loadingToday ? (
                <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>
              ) : (
                <div className="flex flex-col items-center gap-4 my-4">
                  {/* Status Ring */}
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center border-4 border-white/5 bg-black/20 shadow-inner">
                    <Clock size={36} className={cn('animate-pulse', todayStatus?.clockIn && !todayStatus?.clockOut ? 'text-emerald-400' : 'text-white/20')} />
                    {todayStatus?.clockIn && (
                      <span className="absolute bottom-3 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                        {todayStatus.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className="text-xs text-white/30">Clocked In: <span className="font-mono text-white/70">{formatTime(todayStatus?.clockIn)}</span></p>
                    {todayStatus?.breakDurationMinutes > 0 && (
                      <p className="text-xs text-amber-400/80">Break Duration: <span className="font-mono">{todayStatus.breakDurationMinutes} mins</span></p>
                    )}
                    <p className="text-xs text-white/30">Clocked Out: <span className="font-mono text-white/70">{formatTime(todayStatus?.clockOut)}</span></p>
                  </div>
                </div>
              )}

              {/* Console Action Buttons */}
              <div className="w-full space-y-3">
                {/* Break console */}
                {todayStatus?.clockIn && !todayStatus?.clockOut && (
                  <div className="glass-card p-3 rounded-xl border border-white/5 flex items-center justify-between bg-white/[0.01]">
                    {todayStatus?.activeBreak ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Coffee size={16} className="text-amber-400 animate-bounce" />
                          <div className="text-left">
                            <p className="text-xs text-amber-400 font-semibold uppercase">On break ({todayStatus.activeBreak.breakType})</p>
                            <p className="text-[10px] text-white/30">Started at {new Date(todayStatus.activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => endBreakMutation.mutate()}
                          disabled={endBreakMutation.isPending}
                          className="btn-primary py-1 px-3 text-xs rounded-lg"
                        >
                          End Break
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full gap-2">
                        <select
                          value={selectedBreakType}
                          onChange={(e) => setSelectedBreakType(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-sun"
                        >
                          <option value="lunch">Lunch</option>
                          <option value="tea">Tea</option>
                          <option value="personal">Personal</option>
                          <option value="meeting">Meeting</option>
                          <option value="custom">Custom</option>
                        </select>
                        <button
                          onClick={() => startBreakMutation.mutate(selectedBreakType)}
                          disabled={startBreakMutation.isPending}
                          className="btn-secondary py-1 px-3 text-xs rounded-lg flex items-center gap-1 bg-white/5"
                        >
                          <Coffee size={12} /> Take Break
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Punch IN/OUT controls */}
                <div className="flex gap-3">
                  {!todayStatus?.clockIn ? (
                    <button
                      onClick={() => clockInMutation.mutate(coords)}
                      disabled={clockInMutation.isPending}
                      className="btn-primary flex-1 justify-center py-3 rounded-xl flex items-center gap-2"
                    >
                      <Play size={16} /> Clock In
                    </button>
                  ) : !todayStatus?.clockOut ? (
                    <button
                      onClick={() => clockOutMutation.mutate(coords)}
                      disabled={clockOutMutation.isPending || !!todayStatus?.activeBreak}
                      className={cn(
                        "flex-1 justify-center py-3 rounded-xl flex items-center gap-2 font-semibold transition duration-200",
                        todayStatus?.activeBreak 
                          ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed" 
                          : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                      )}
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
                  <p className="text-2xl font-bold text-blue-400 mt-1">{monthlyStats?.halfDay || 0}</p>
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-white/35">Total Hours</p>
                  <p className="text-2xl font-bold text-white/80 mt-1">{monthlyStats?.totalHours || '0.00'}h</p>
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
                          <th className="p-4">Breaks</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myLogsData.data.map((log: any) => (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition">
                            <td className="p-4 font-medium text-white/80">{formatDate(log.date)}</td>
                            <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockIn)}</td>
                            <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockOut)}</td>
                            <td className="p-4 text-white/70 font-semibold">
                              {log.workHours ? `${log.workHours} hrs` : '--'}
                              {log.overtimeHours > 0 && <span className="text-[10px] text-emerald-400 ml-1">+{log.overtimeHours} OT</span>}
                            </td>
                            <td className="p-4 text-xs text-white/50">{log.breakDurationMinutes > 0 ? `${log.breakDurationMinutes}m` : '-'}</td>
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

        {/* Regularizations Tab */}
        {activeTab === 'regularizations' && (
          <motion.div
            key="regularizations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Request Form */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-6">
              <h3 className="text-md font-semibold text-white/80 mb-4 flex items-center gap-2"><Plus size={16} className="text-sun" /> Request Correction</h3>
              <form onSubmit={handleApplyRegularization} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/45 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1">Correction Type</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  >
                    <option value="missed_clock_in">Missed Clock In</option>
                    <option value="missed_clock_out">Missed Clock Out</option>
                    <option value="incorrect_hours">Incorrect Hours</option>
                    <option value="missed_all">Missed Both punches</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/45 mb-1 font-medium">New Clock In</label>
                    <input
                      type="time"
                      value={regClockIn}
                      onChange={(e) => setRegClockIn(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/80 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/45 mb-1 font-medium">New Clock Out</label>
                    <input
                      type="time"
                      value={regClockOut}
                      onChange={(e) => setRegClockOut(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/80 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1">Justification Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details why log correction is required..."
                    value={regReason}
                    onChange={(e) => setRegReason(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={applyRegularizationMutation.isPending}
                  className="btn-primary w-full py-2.5 rounded-xl font-semibold text-xs flex justify-center items-center"
                >
                  {applyRegularizationMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* List and Approvals */}
            <div className="lg:col-span-2 space-y-6">
              {/* Manager Approvals queue */}
              {hasRole(['admin', 'hr', 'manager']) && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="font-semibold text-white/80 flex items-center gap-2"><Users size={16} /> Team Requests approvals queue</h3>
                  </div>

                  {!teamRegularizations || teamRegularizations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-white/30">No pending regularization approvals in your queue</div>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto">
                      {teamRegularizations.map((req: any) => (
                        <div key={req.id} className="p-4 hover:bg-white/[0.005] transition flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-white/80">{req.firstName} {req.lastName} ({req.employeeCode})</div>
                            <div className="text-[10px] text-white/40">Request Date: <span className="font-semibold">{formatDate(req.date)}</span></div>
                            <div className="text-[11px] bg-white/5 px-2 py-0.5 rounded text-white/60 inline-block font-mono uppercase">{req.requestType.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-white/60 italic font-medium">"Reason: {req.reason}"</div>
                            <div className="text-[10px] text-white/30">
                              Proposed Hours: {req.requestedClockIn ? new Date(req.requestedClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missed'} 
                              {' → '} 
                              {req.requestedClockOut ? new Date(req.requestedClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missed'}
                            </div>
                          </div>

                          {req.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => reviewRegularizationMutation.mutate({ id: req.id, data: { status: 'approved', remarks: 'Approved' } })}
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                                title="Approve"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => reviewRegularizationMutation.mutate({ id: req.id, data: { status: 'rejected', remarks: 'Rejected' } })}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Reject"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', 
                              req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            )}>
                              {req.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Requests Log */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white/80">My Corrections History</h3>
                </div>

                {!myRegularizations || myRegularizations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-white/30">No correction requests submitted yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Proposed Clock In</th>
                          <th className="p-4">Proposed Clock Out</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myRegularizations.map((req: any) => (
                          <tr key={req.id} className="hover:bg-white/[0.01]">
                            <td className="p-4 font-medium text-white/80">{formatDate(req.date)}</td>
                            <td className="p-4 text-xs font-mono uppercase">{req.requestType.replace(/_/g, ' ')}</td>
                            <td className="p-4 font-mono text-xs text-white/50">{req.requestedClockIn ? new Date(req.requestedClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                            <td className="p-4 font-mono text-xs text-white/50">{req.requestedClockOut ? new Date(req.requestedClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                            <td className="p-4 text-xs text-white/70 max-w-[150px] truncate">{req.reason}</td>
                            <td className="p-4">
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border',
                                req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              )}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Logs Tab */}
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
                            <div className="font-semibold text-white/80">{log.firstName} {log.lastName}</div>
                            <div className="text-[11px] text-white/35">{log.employeeCode} · {log.designation}</div>
                          </td>
                          <td className="p-4 font-medium text-white/70">{formatDate(log.date)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockIn)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockOut)}</td>
                          <td className="p-4 text-white/70 font-semibold">
                            {log.workHours ? `${log.workHours} hrs` : '--'}
                            {log.overtimeHours > 0 && <span className="text-[10px] text-emerald-400 ml-1">+{log.overtimeHours} OT</span>}
                          </td>
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

        {/* All Logs (Admin) Tab */}
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
                            <div className="font-semibold text-white/80">{log.firstName} {log.lastName}</div>
                            <div className="text-[11px] text-white/35">{log.employeeCode} · {log.designation}</div>
                          </td>
                          <td className="p-4 text-white/60">{log.departmentName || 'Unassigned'}</td>
                          <td className="p-4 font-medium text-white/70">{formatDate(log.date)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockIn)}</td>
                          <td className="p-4 font-mono text-xs text-white/60">{formatTime(log.clockOut)}</td>
                          <td className="p-4 text-white/70 font-semibold">
                            {log.workHours ? `${log.workHours} hrs` : '--'}
                            {log.overtimeHours > 0 && <span className="text-[10px] text-emerald-400 ml-1">+{log.overtimeHours} OT</span>}
                          </td>
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

        {/* Shifts Configuration Tab */}
        {activeTab === 'shifts' && (
          <motion.div
            key="shifts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Shift Assignment Form */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-6">
              <h3 className="text-md font-semibold text-white/80 mb-4 flex items-center gap-2"><Calendar size={16} className="text-sun" /> Assign Shift schedule</h3>
              <form onSubmit={handleAssignShift} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/45 mb-1">Select Employee</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full text-white/80 focus:outline-none"
                    required
                  >
                    <option value="">Choose Employee...</option>
                    {employeesList.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1">Shift Policy</label>
                  <select
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full text-white/80 focus:outline-none"
                    required
                  >
                    <option value="">Choose Shift pattern...</option>
                    {shiftsList?.map((shift: any) => (
                      <option key={shift.id} value={shift.id}>{shift.name} ({shift.type} - {shift.startTime} to {shift.endTime})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1 font-medium">Assignment Start Date</label>
                  <input
                    type="date"
                    value={shiftStartDate}
                    onChange={(e) => setShiftStartDate(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs w-full text-white/80 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1 font-medium">Assignment End Date (Optional)</label>
                  <input
                    type="date"
                    value={shiftEndDate}
                    onChange={(e) => setShiftEndDate(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs w-full text-white/80 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assignShiftMutation.isPending}
                  className="btn-primary w-full py-2.5 rounded-xl font-semibold text-xs flex justify-center items-center"
                >
                  {assignShiftMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : 'Assign Shift'}
                </button>
              </form>
            </div>

            {/* Shifts Patterns list */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <h3 className="text-md font-semibold text-white/80 mb-4 flex items-center gap-2"><Calendar size={16} /> Configured Shifts patterns</h3>
              <div className="space-y-4">
                {!shiftsList || shiftsList.length === 0 ? (
                  <div className="text-center text-xs text-white/30 py-6">No shift patterns configured in system</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shiftsList.map((shift: any) => (
                      <div key={shift.id} className="p-4 border border-white/5 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold text-white/80">{shift.name}</p>
                            <p className="text-[10px] bg-sun/10 text-sun font-semibold px-2 py-0.5 rounded-full inline-block uppercase mt-1">{shift.type}</p>
                          </div>
                          <span className="text-[10px] text-white/40 font-mono">Grace: {shift.graceTimeMinutes} mins</span>
                        </div>
                        <div className="mt-3 flex justify-between items-center text-xs text-white/50 font-medium">
                          <span>Hours: <span className="font-semibold text-white/80">{shift.startTime} - {shift.endTime}</span></span>
                          {shift.activeEmployees > 0 && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">{shift.activeEmployees} employees</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Policies Tab */}
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
                </div>

                {/* Geofencing configuration */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white/80">Geofencing validation</h4>
                      <p className="text-[10px] text-white/30">Restricts employee check-in within designated geographic coordinates radius.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={geofencingEnabled} 
                        onChange={(e) => setGeofencingEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sun"></div>
                    </label>
                  </div>

                  {geofencingEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-white/45 mb-1">HQ Latitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={geofenceLatitude}
                          onChange={(e) => setGeofenceLatitude(parseFloat(e.target.value))}
                          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs w-full text-white/80 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/45 mb-1">HQ Longitude</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={geofenceLongitude}
                          onChange={(e) => setGeofenceLongitude(parseFloat(e.target.value))}
                          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs w-full text-white/80 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/45 mb-1">Allowed Radius (meters)</label>
                        <input
                          type="number"
                          value={geofenceRadiusMeters}
                          onChange={(e) => setGeofenceRadiusMeters(parseInt(e.target.value))}
                          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs w-full text-white/80 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}
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
