import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '../../utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
  trend?: 'up' | 'down'
  trendValue?: number
  trendLabel?: string
  index?: number
  className?: string
}

export default function StatCard({
  title, value, icon: Icon, color = '#a3ff29',
  subtitle, trend, trendValue, trendLabel, index = 0, className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ translateY: -2 }}
      className={cn('stat-card', className)}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: color, transform: 'translate(30%, -30%)' }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>

      {trend && trendValue !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-4 text-xs font-medium',
          trend === 'up' ? 'text-emerald-400' : 'text-red-400',
        )}>
          {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{trendValue}% {trendLabel || 'vs last month'}</span>
        </div>
      )}
    </motion.div>
  )
}