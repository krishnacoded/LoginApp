import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dashboardService } from '../../api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getStatusLabel } from '../../utils'

const COLORS = ['#307FE2', '#F2A900', '#003087', '#FFE264', '#00205B', '#ef4444', '#94a3b8', '#64748b']

const TooltipStyle = {
  contentStyle: {
    background: 'rgba(0, 17, 51, 0.95)',
    border: '1px solid rgba(242, 169, 0, 0.2)',
    borderRadius: 12,
    fontSize: 12,
    color: '#f8fafc',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  },
}

function ChartCard({ title, subtitle, children, className }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-6 ${className || ''}`}>
      <div className="mb-5">
        <h3 className="font-semibold text-white/80">{title}</h3>
        {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: l1 } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardService.getOverview,
  })

  const { data: empAnalytics, isLoading: l2 } = useQuery({
    queryKey: ['employee-analytics'],
    queryFn: dashboardService.getEmployeeAnalytics,
  })

  const { data: skillAnalytics, isLoading: l3 } = useQuery({
    queryKey: ['skill-analytics'],
    queryFn: dashboardService.getSkillAnalytics,
  })

  if (l1 || l2 || l3) return <div className="p-6"><LoadingSpinner fullPage /></div>

  const growth = (overview?.growth || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }))
  const deptDist = (overview?.departmentDistribution || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }))
  const leaveTrend = (overview?.leaveTrend || []).map((item: any) => ({
    ...item,
    approved: Number(item.approved || 0),
    rejected: Number(item.rejected || 0),
    pending: Number(item.pending || 0)
  }))
  const byStatus = (empAnalytics?.byStatus || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }))
  const byType = (empAnalytics?.byType || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }))
  const tenureGroups = (empAnalytics?.tenureGroups || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0)
  }))
  const monthlyHiring = (empAnalytics?.monthlyHiring || []).map((item: any) => ({
    ...item,
    hires: Number(item.hires || 0)
  }))
  const topSkills = (skillAnalytics?.topSkills || []).map((item: any) => ({
    ...item,
    employeeCount: Number(item.employeeCount || 0),
    avgProficiency: Number(item.avgProficiency || 0)
  }))
  const skillByCategory = (skillAnalytics?.byCategory || []).map((item: any) => ({
    ...item,
    skillCount: Number(item.skillCount || 0),
    employeeCount: Number(item.employeeCount || 0)
  }))

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="Analytics" subtitle="Deep insights into your workforce" />

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Employee Growth" subtitle="Monthly hiring over the past year">
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#307FE2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#307FE2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} cursor={false} />
                <Area type="monotone" dataKey="count" name="New Hires" stroke="#307FE2" strokeWidth={2.5} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Hiring This Year" subtitle="Hires per month">
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHiring} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="hiringGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE264" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F2A900" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} cursor={false} />
                <Bar dataKey="hires" name="Hires" fill="url(#hiringGrad)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <ChartCard title="By Department" subtitle="Headcount distribution">
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptDist} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} dataKey="count">
                  {deptDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TooltipStyle} formatter={(v: any) => [v, 'Employees']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {deptDist.slice(0, 4).map((d: any, i: number) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/45 truncate max-w-[100px]">{d.name}</span>
                </div>
                <span className="text-white/60 font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Employment Status" subtitle="Active vs other">
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} dataKey="count" nameKey="employmentStatus">
                  {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TooltipStyle} formatter={(v: any, n: any) => [v, getStatusLabel(n)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {byStatus.map((s: any, i: number) => (
              <div key={s.employmentStatus} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/45">{getStatusLabel(s.employmentStatus)}</span>
                </div>
                <span className="text-white/60 font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Employment Types" subtitle="Full-time vs other">
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} dataKey="count" nameKey="employmentType">
                  {byType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TooltipStyle} formatter={(v: any, n: any) => [v, getStatusLabel(n)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {byType.map((t: any, i: number) => (
              <div key={t.employmentType} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/45">{getStatusLabel(t.employmentType)}</span>
                </div>
                <span className="text-white/60 font-medium">{t.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Tenure Groups" subtitle="Employee longevity breakdown">
          <div className="space-y-3 mt-2">
            {tenureGroups.map((t: any, i: number) => {
              const max = Math.max(...tenureGroups.map((x: any) => parseInt(x.count)))
              const pct = max > 0 ? (parseInt(t.count) / max) * 100 : 0
              return (
                <div key={t.tenureGroup}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50">{t.tenureGroup}</span>
                    <span className="text-white/60 font-medium">{t.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Leave Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Leave Trends" subtitle="Monthly approvals, rejections, pending">
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={3}>
                <defs>
                  <linearGradient id="approvedGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#307FE2" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#003087" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="pendingGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE264" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F2A900" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="rejectedGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} cursor={false} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                <Bar dataKey="approved" name="Approved" fill="url(#approvedGrad2)" radius={[3, 3, 0, 0]} barSize={8} />
                <Bar dataKey="rejected" name="Rejected" fill="url(#rejectedGrad2)" radius={[3, 3, 0, 0]} barSize={8} />
                <Bar dataKey="pending" name="Pending" fill="url(#pendingGrad2)" radius={[3, 3, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Skills by Adoption" subtitle="Most common skills across employees">
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSkills.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
                <defs>
                  <linearGradient id="skillsGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#003087" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#307FE2" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...TooltipStyle} cursor={false} />
                <Bar dataKey="employeeCount" name="Employees" fill="url(#skillsGrad)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Skills by category */}
      {skillByCategory.length > 0 && (
        <ChartCard title="Skills by Category" subtitle="Skill distribution across categories">
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillByCategory} margin={{ top: 5, right: 5, bottom: 0, left: -10 }} barGap={3}>
                <defs>
                  <linearGradient id="skillsCatGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE264" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F2A900" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="skillsCatGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#307FE2" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#003087" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} cursor={false} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                <Bar dataKey="skillCount" name="Skills" fill="url(#skillsCatGrad1)" radius={[3, 3, 0, 0]} barSize={8} />
                <Bar dataKey="employeeCount" name="Employees" fill="url(#skillsCatGrad2)" radius={[3, 3, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  )
}
