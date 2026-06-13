import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  MoreVertical,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Coffee,
  Play,
  Square,
  ExternalLink,
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService, notificationService, attendanceService, leaveService, assetService } from '../../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.store';
import { formatDate, formatRelativeDate, cn } from '../../utils';
import { toast } from 'sonner';

const CHART_COLORS = ['#307FE2', '#F2A900', '#003087', '#FFE264', '#00205B', '#94a3b8'];

const fallbackGrowth = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 18 },
  { month: 'Mar', count: 16 },
  { month: 'Apr', count: 24 },
  { month: 'May', count: 22 },
  { month: 'Jun', count: 31 },
  { month: 'Jul', count: 28 },
  { month: 'Aug', stop: 38, count: 38 },
  { month: 'Sep', count: 35 },
  { month: 'Oct', count: 42 },
  { month: 'Nov', count: 46 },
  { month: 'Dec', count: 52 },
];

const fallbackLeaves = [
  { month: 'Mon', approved: 12, pending: 5, rejected: 2 },
  { month: 'Tue', approved: 15, pending: 8, rejected: 1 },
  { month: 'Wed', approved: 9, pending: 11, rejected: 3 },
  { month: 'Thu', approved: 18, pending: 6, rejected: 2 },
  { month: 'Fri', approved: 13, pending: 9, rejected: 1 },
];

const teamContacts = [
  { name: 'Daniel Craig', role: 'People Ops', accent: '#FFE264' },
  { name: 'Kara Morton', role: 'Talent Lead', accent: '#307FE2' },
  { name: 'Nathan Donovan', role: 'Workforce Admin', accent: '#F2A900', active: true },
  { name: 'Elisabeth Mayne', role: 'Compliance', accent: '#003087' },
];

function MetricCard({ title, value, trend, tone, icon: Icon, note }: any) {
  const positive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/50">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: `${tone}18`, color: tone }}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs">
        {positive ? <TrendingUp size={13} className="text-sky-300" /> : <TrendingDown size={13} className="text-red-400" />}
        <span className={positive ? 'text-sky-300' : 'text-red-400'}>{Math.abs(trend)}%</span>
        <span className="text-white/30">{note}</span>
      </div>
    </motion.div>
  );
}

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'leave_approved':
      return CheckCircle2;
    case 'new_employee':
      return Users;
    case 'leave_applied':
    case 'leave_request':
      return Calendar;
    case 'leave_rejected':
    case 'document_uploaded':
      return Clock;
    default:
      return Bell;
  }
};

const getNotifStyle = (type: string) => {
  switch (type) {
    case 'leave_approved':
      return 'bg-emerald-500/12 text-emerald-400';
    case 'new_employee':
      return 'bg-sky-500/12 text-sky-400';
    case 'leave_applied':
    case 'leave_request':
      return 'bg-amber-500/12 text-amber-400';
    case 'leave_rejected':
      return 'bg-red-500/12 text-red-400';
    case 'document_uploaded':
      return 'bg-blue-500/12 text-blue-400';
    default:
      return 'bg-sun/12 text-sun';
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-2xl" style={{ backgroundColor: 'var(--glass-card-bg)', borderColor: 'var(--border-layout-inner)', color: 'var(--text-color-base)' }}>
      <p className="mb-1 font-semibold text-white/80">{label}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="flex items-center gap-2 text-white/60">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.name}: <span className="font-semibold text-white">{item.value}</span>
        </p>
      ))}
    </div>
  );
};

function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionTime, setSessionTime] = useState<string>('--:--:--');

  // Queries
  const { data: todayStatus, isLoading: loadingToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => attendanceService.getTodayStatus(),
  });

  const { data: leaveBalances } = useQuery({
    queryKey: ['my-leave-balances'],
    queryFn: () => leaveService.getMyBalance(),
  });

  const { data: myAssets } = useQuery({
    queryKey: ['my-assets-dashboard'],
    queryFn: () => assetService.getMyAssets(),
  });

  const { data: holidays } = useQuery({
    queryKey: ['attendance-holidays'],
    queryFn: () => attendanceService.getHolidays(),
  });

  const { data: myLeaves } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => leaveService.getAll({ limit: 10 }),
  });

  const { data: myAssetRequests } = useQuery({
    queryKey: ['my-asset-requests'],
    queryFn: () => assetService.getAssetRequests(),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-emp'],
    queryFn: () => notificationService.getAll({ limit: 5 }),
  });
  const notifications = notifData?.notifications || [];

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: () => attendanceService.clockIn(),
    onSuccess: () => {
      toast.success('Clocked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to clock in');
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceService.clockOut(),
    onSuccess: () => {
      toast.success('Clocked out successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to clock out');
    }
  });

  const breakMutation = useMutation({
    mutationFn: (action: 'start' | 'end') =>
      action === 'start' ? attendanceService.startBreak('lunch') : attendanceService.endBreak(),
    onSuccess: (_, action) => {
      toast.success(action === 'start' ? 'Break started' : 'Break ended');
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Break action failed');
    }
  });

  // Ticking session timer
  useEffect(() => {
    if (!todayStatus?.clock_in || todayStatus?.clock_out) {
      setSessionTime('--:--:--');
      return;
    }

    const updateTimer = () => {
      const start = new Date(todayStatus.clock_in).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setSessionTime(`${hrs}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayStatus]);

  // Aggregate pending requests
  const pendingRequests = [
    ...(myLeaves?.leaves || []).filter((l: any) => l.status === 'pending').map((l: any) => ({
      id: l.id,
      type: 'Leave',
      title: `${l.leave_type_name || 'Leave'} Application`,
      date: l.created_at || l.createdAt,
      status: l.status,
      detail: `${formatDate(l.start_date || l.startDate)} to ${formatDate(l.end_date || l.endDate)} (${l.duration} days)`,
      reason: l.reason
    })),
    ...(myAssetRequests || []).filter((ar: any) => ar.status.startsWith('Pending')).map((ar: any) => ({
      id: ar.id,
      type: 'Asset',
      title: `Asset Request: ${ar.asset_type.replace('_', ' ')}`,
      date: ar.created_at || ar.createdAt,
      status: ar.status,
      detail: ar.reason,
      reason: ar.manager_comment || ar.hr_comment
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Upcoming holidays
  const upcomingHolidays = (holidays || [])
    .filter((h: any) => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)))
    .slice(0, 3);

  // Worked hours display
  const workedHoursToday = todayStatus?.worked_hours ? `${parseFloat(todayStatus.worked_hours).toFixed(2)} hrs` : '--';

  return (
    <div className="min-h-full p-4 text-white md:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-sun/80">Overview</p>
        <h1 className="mt-1 text-2xl font-bold">Welcome back, {user?.firstName || user?.first_name || 'User'}!</h1>
        <p className="mt-1 text-xs text-white/35 font-medium">
          {formatDate(new Date(), 'EEEE, MMMM do yyyy')} · Employee Self-Service Workspace
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Attendance Status */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/40">Attendance Status</p>
              <h3 className="text-lg font-bold text-white mt-1">
                {loadingToday ? 'Loading...' : todayStatus?.clock_out ? 'Clocked Out' : todayStatus?.clock_in ? 'Clocked In' : 'Not Clocked In'}
              </h3>
            </div>
            <div className={cn(
              "h-8 w-8 rounded-xl flex items-center justify-center border",
              todayStatus?.clock_out ? "bg-red-500/10 border-red-500/20 text-red-400" :
              todayStatus?.clock_in ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}>
              <Clock size={16} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!todayStatus?.clock_in ? (
              <button
                disabled={clockInMutation.isPending}
                onClick={() => clockInMutation.mutate()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-300 to-amber-500 text-midnight text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(242,169,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Play size={12} fill="currentColor" /> Clock In
              </button>
            ) : !todayStatus.clock_out ? (
              <>
                <button
                  disabled={breakMutation.isPending}
                  onClick={() => breakMutation.mutate(todayStatus.activeBreak ? 'end' : 'start')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all",
                    todayStatus.activeBreak 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                >
                  <Coffee size={12} /> {todayStatus.activeBreak ? 'End Break' : 'Break'}
                </button>
                <button
                  disabled={clockOutMutation.isPending}
                  onClick={() => clockOutMutation.mutate()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/25 transition-all"
                >
                  <Square size={10} fill="currentColor" /> Clock Out
                </button>
              </>
            ) : (
              <p className="text-[11px] text-white/35 italic w-full text-center">Shift complete for today.</p>
            )}
          </div>
        </div>

        {/* Session Timer Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/40 font-medium font-medium">Worked Session</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1.5 font-mono">{sessionTime}</h3>
            </div>
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-[11px] text-white/30">Total logged today: <span className="font-semibold text-white/70">{workedHoursToday}</span></p>
        </div>

        {/* Leave Balance Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/40">Available Leave</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                {leaveBalances?.length ? Math.max(0, leaveBalances[0].allocated - leaveBalances[0].used) : '0'} Days
              </h3>
            </div>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sun flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="space-y-1">
            {leaveBalances?.slice(0, 2).map((b: any) => (
              <div key={b.leave_type_name} className="flex justify-between text-[10px] text-white/45">
                <span>{b.leave_type_name}</span>
                <span className="font-semibold text-white/75">{b.allocated - b.used} / {b.allocated} left</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Assets Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/40 font-medium">Assigned Equipment</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1.5">{myAssets?.length || 0} Assets</h3>
            </div>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Laptop size={16} />
            </div>
          </div>
          <p className="text-[11px] text-white/30 truncate">
            {myAssets?.length ? `${myAssets[0].asset_name}` : 'No equipment allocated'}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Combined Pending Requests Tracker */}
          <section className="glass-card rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white/90 mb-4">Request & Approval Tracker</h2>
            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-white/30 font-medium">No active pending requests</p>
                <button
                  onClick={() => navigate('/leaves')}
                  className="text-sun hover:underline text-[11px] font-semibold"
                >
                  Apply for leave &rarr;
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5 space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          req.type === 'Leave' ? "bg-sky-500/10 text-sky-400" : "bg-purple-500/10 text-purple-400"
                        )}>
                          {req.type}
                        </span>
                        <h4 className="text-xs font-bold text-white/80">{req.title}</h4>
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">{req.detail}</p>
                      {req.reason && <p className="text-[11px] text-white/30 italic mt-0.5">Reason: "{req.reason}"</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/35 font-medium">{formatRelativeDate(req.date)}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/12 text-sun border border-amber-500/20 capitalize">
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Holidays */}
          <section className="glass-card rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white/90 mb-4">Upcoming Public Holidays</h2>
            {upcomingHolidays.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/30 font-medium">No upcoming holidays scheduled</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {upcomingHolidays.map((holiday: any) => (
                  <div key={holiday.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center gap-2 text-xs font-bold text-sun">
                      <Calendar size={13} />
                      {formatDate(holiday.date)}
                    </div>
                    <h4 className="text-xs font-bold text-white/80 mt-1 truncate">{holiday.name}</h4>
                    <p className="text-[11px] text-white/35 mt-0.5 line-clamp-2 leading-tight">{holiday.description || 'Public holiday'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <section className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
            <h2 className="text-sm font-semibold text-white/90">Self-Service Actions</h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => navigate('/leaves')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-left text-xs font-bold text-white/80 transition"
              >
                <span>Request Time Off</span>
                <ArrowUpRight size={14} className="text-sun" />
              </button>
              <button
                onClick={() => navigate('/assets')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-left text-xs font-bold text-white/80 transition"
              >
                <span>Apply for Equipment</span>
                <ArrowUpRight size={14} className="text-sun" />
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-left text-xs font-bold text-white/80 transition"
              >
                <span>View Attendance Logs</span>
                <ArrowUpRight size={14} className="text-sun" />
              </button>
            </div>
          </section>

          {/* Recent Notifications */}
          <section className="glass-card rounded-2xl p-5 border border-white/5">
            <h2 className="text-sm font-semibold text-white/90 mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-white/30 py-4 font-medium">No recent notifications</p>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 p-1 rounded-lg transition-colors text-left",
                      notif.actionUrl && "cursor-pointer hover:bg-white/5"
                    )}
                    onClick={() => notif.actionUrl && navigate(notif.actionUrl)}
                  >
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sun/10 text-sun border border-sun/20">
                      <Bell size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white/80 truncate">{notif.title}</p>
                      <p className="text-[10px] text-white/45 mt-0.5 line-clamp-2 leading-tight">{notif.message}</p>
                      <p className="mt-1 text-[9px] text-white/30">{formatRelativeDate(notif.createdAt || notif.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardService.getOverview,
    refetchInterval: 60000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 5 }),
    refetchInterval: 60000,
  });
  const recentNotifications = notifData?.notifications || [];

  const stats = overview?.overview || {};
  const growth = (overview?.growth || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }));
  const deptDist = (overview?.departmentDistribution || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }));
  const leaveTrend = (overview?.leaveTrend || []).map((item: any) => ({
    ...item,
    approved: Number(item.approved || 0),
    pending: Number(item.pending || 0),
    rejected: Number(item.rejected || 0)
  }));

  const employeeTotal = Number(stats.totalEmployees || 0);
  const activeEmployees = Number(stats.activeEmployees || 0);
  const activeRate = employeeTotal ? Math.round((activeEmployees / employeeTotal) * 100) : 0;

  const fallbackGrowth = [{ month: 'Jan', count: 0 }];
  const fallbackLeaves = [{ month: 'Jan', approved: 0, pending: 0, rejected: 0 }];

  return (
    <div className="min-h-full p-4 text-white md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-sun/80">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">People command center</h1>
          <p className="mt-1 text-sm text-white/38">
            {formatDate(new Date(), 'EEEE, MMMM do yyyy')} / {user?.firstName || user?.first_name || 'Team'} workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/44">Today</div>
          <button className="btn-primary h-9" onClick={() => navigate('/employees?add=true')}>
            <Plus size={15} />
            Add employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="loading-pulse h-32 rounded-lg" />)
            ) : (
              <>
                <MetricCard title="Total employees" value={employeeTotal} trend={12} note="vs last month" tone="#307FE2" icon={Users} />
                <MetricCard title="Active staff" value={activeEmployees} trend={8} note="available now" tone="#FFE264" icon={CheckCircle2} />
                <MetricCard title="Pending leaves" value={Number(stats.pendingLeaves || 0)} trend={-4} note="needs review" tone="#F2A900" icon={Calendar} />
                <MetricCard title="Verified profiles" value={`${activeRate}%`} trend={2} note="overall progress" tone="#003087" icon={BadgeCheck} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="glass-card rounded-lg p-4">
              <h2 className="mb-4 text-sm font-semibold text-white/86">Growth Trend</h2>
              <div className="h-64">
                {isLoading ? (
                  <div className="loading-pulse h-full w-full rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growth.length ? growth : fallbackGrowth} margin={{ left: -20, right: 10 }}>
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#307FE2" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#307FE2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Staff Count" stroke="#307FE2" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="glass-card rounded-lg p-4">
              <h2 className="mb-4 text-sm font-semibold text-white/86">Department Mix</h2>
              <div className="h-64">
                {isLoading ? (
                  <div className="loading-pulse h-full w-full rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptDist.length ? deptDist : [{ name: 'None', count: 1 }]}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {(deptDist.length ? deptDist : [{ name: 'None', count: 1 }]).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="glass-card rounded-lg p-4 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-white/86">Weekly Leave Activity</h2>
              <div className="h-64">
                {isLoading ? (
                  <div className="loading-pulse h-full w-full rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveTrend.length ? leaveTrend : fallbackLeaves} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="approved" name="Approved" fill="#307FE2" radius={[3, 3, 0, 0]} stackId="leavesStack" />
                      <Bar dataKey="pending" name="Pending" fill="#F2A900" radius={[3, 3, 0, 0]} stackId="leavesStack" />
                      <Bar dataKey="rejected" name="Rejected" fill="#94a3b8" radius={[3, 3, 0, 0]} stackId="leavesStack" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="glass-card rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-sm font-semibold text-white/86">Updates</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sun/12 text-[10px] font-bold text-sun border border-sun/20">
                {recentNotifications.length}
              </span>
            </div>
            <div className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-center text-xs text-white/30 py-4">No new notifications</p>
              ) : (
                recentNotifications.map((notif: any) => {
                  const Icon = getNotifIcon(notif.type);
                  const styleClass = getNotifStyle(notif.type);
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex gap-3 p-1.5 rounded-lg transition-colors",
                        notif.actionUrl && "cursor-pointer hover:bg-white/5"
                      )}
                      onClick={() => notif.actionUrl && navigate(notif.actionUrl)}
                    >
                      <div className={cn("mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full", styleClass)}>
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white/86 truncate">{notif.title}</p>
                        <p className="text-[11px] text-white/55 mt-0.5 line-clamp-2 leading-tight">{notif.message}</p>
                        <p className="mt-1 text-[10px] text-white/28">{formatRelativeDate(notif.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="glass-card rounded-lg p-4">
            <h2 className="mb-4 text-sm font-semibold text-white/86">Manager Contacts</h2>
            <div className="space-y-2">
              {teamContacts.map((contact) => (
                <div
                  key={contact.name}
                  className={contact.active ? 'flex items-center gap-3 rounded-md bg-gradient-to-r from-accent to-sun px-2.5 py-2 text-midnight font-bold shadow-[0_4px_12px_rgba(242,169,0,0.15)]' : 'flex items-center gap-3 rounded-md px-2.5 py-2 text-white/62 hover:bg-white/5'}
                >
                  <span className="h-7 w-7 rounded-full" style={{ background: contact.accent }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{contact.name}</p>
                    <p className={contact.active ? 'text-[11px] text-midnight/65' : 'text-[11px] text-white/30'}>{contact.role}</p>
                  </div>
                  <MoreVertical size={14} />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { hasRole } = useAuth();

  if (!hasRole(['admin', 'hr', 'manager'])) {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}
