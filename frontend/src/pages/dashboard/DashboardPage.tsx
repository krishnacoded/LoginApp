import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
import { dashboardService, notificationService } from '../../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.store';
import { formatDate, formatRelativeDate, cn } from '../../utils';

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
    <div className="rounded-lg border border-sun/20 bg-[#001133]/95 px-3 py-2 text-xs shadow-2xl">
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

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
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
  const recentActivity = overview?.recentActivity || [];

  const employeeTotal = Number(stats.totalEmployees || 0);
  const activeEmployees = Number(stats.activeEmployees || 0);
  const activeRate = employeeTotal ? Math.round((activeEmployees / employeeTotal) * 100) : 0;

  const activityRows = recentActivity.slice(0, 5);

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
          {hasRole(['admin', 'hr']) && (
            <button className="btn-primary h-9" onClick={() => navigate('/employees?add=true')}>
              <Plus size={15} />
              Add employee
            </button>
          )}
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
                <MetricCard title="Departments" value={Number(stats.totalDepartments || 0)} trend={16} note="coverage" tone="#003087" icon={Building2} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr]">
            <section className="glass-card rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white/86">Workforce Overview</h2>
                  <p className="mt-1 text-xs text-white/34">Hiring momentum across the year</p>
                </div>
                <button className="rounded-md p-1.5 text-white/35 hover:bg-white/5 hover:text-white">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="skyGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#307FE2" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#307FE2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Employees" stroke="#307FE2" strokeWidth={3} fill="url(#skyGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="glass-card rounded-lg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white/86">Active ratio</h2>
                  <BadgeCheck size={17} className="text-sun" />
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-28">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#F2A900 ${activeRate * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                      }}
                    />
                    <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#001133]">
                      <span className="text-2xl font-semibold">{activeRate}%</span>
                      <span className="text-[10px] text-white/36">Active</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-white/35">Available</p>
                      <p className="text-lg font-semibold">{activeEmployees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/35">On leave</p>
                      <p className="text-lg font-semibold">{stats.onLeave || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-midnight to-black p-4 text-white shadow-[0_16px_45px_rgba(0,0,0,0.4)]">
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-200">Onboarding</span>
                  <Zap size={18} className="text-sun" />
                </div>
                <p className="text-4xl font-semibold leading-none text-white">{stats.newThisMonth || 0}</p>
                <p className="mt-1 text-sm font-medium text-white/70">new profiles this month</p>
                <p className="mt-4 text-xs leading-relaxed text-white/40">Track onboarding, records and leave activity from one operational workspace.</p>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="glass-card rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white/86">Department Mix</h2>
                  <p className="mt-1 text-xs text-white/34">Current headcount spread</p>
                </div>
                <ShieldCheck size={17} className="text-sun" />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="h-[132px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deptDist} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="count">
                        {deptDist.map((_: any, index: number) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {deptDist.slice(0, 5).map((dept: any, index: number) => (
                    <div key={dept.name} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-white/55">
                        <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="truncate">{dept.name}</span>
                      </span>
                      <span className="font-semibold text-white">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="glass-card rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white/86">Leave Flow</h2>
                  <p className="mt-1 text-xs text-white/34">Approvals, rejects and open requests</p>
                </div>
                <FileCheck2 size={17} className="text-sun" />
              </div>
              <div className="h-[170px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={3}>
                    <defs>
                      <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#307FE2" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#003087" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFE264" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#F2A900" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="rejectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.34)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="approved" name="Approved" fill="url(#approvedGrad)" radius={[3, 3, 0, 0]} barSize={8} />
                    <Bar dataKey="pending" name="Pending" fill="url(#pendingGrad)" radius={[3, 3, 0, 0]} barSize={8} />
                    <Bar dataKey="rejected" name="Rejected" fill="url(#rejectedGrad)" radius={[3, 3, 0, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="glass-card rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/86">Notifications</h2>
              <span className="rounded-md bg-sun/12 px-2 py-0.5 text-xs font-semibold text-sun">Live</span>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/86">Activities</h2>
              <Activity size={16} className="text-sun" />
            </div>
            <div className="space-y-3">
              {activityRows.map((act: any, index: number) => (
                <div key={`${act.employeeName || act.userEmail}-${index}`} className="flex gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/7 text-[10px] font-semibold text-white">
                    {(act.employeeName || act.userEmail || 'U').slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-white/62">
                      <span className="font-semibold text-white/82">{act.employeeName || act.userEmail}</span> {String(act.action || '').toLowerCase().replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/28">{act.createdAt ? new Date(act.createdAt).toLocaleTimeString() : ''}</p>
                  </div>
                </div>
              ))}
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
