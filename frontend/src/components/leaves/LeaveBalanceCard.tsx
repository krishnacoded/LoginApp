import React from 'react'
import { motion } from 'framer-motion'
import { LeaveBalance } from '../../types'

interface LeaveBalanceCardProps {
  balance: LeaveBalance
}

export default function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const available = balance.allocatedDays + balance.carriedForwardDays - balance.usedDays - balance.pendingDays
  const total = balance.allocatedDays + balance.carriedForwardDays
  const usedPct = total > 0 ? Math.min(100, (balance.usedDays / total) * 100) : 0
  const pendPct = total > 0 ? Math.min(100 - usedPct, (balance.pendingDays / total) * 100) : 0

  return (
    <motion.div
      whileHover={{ translateY: -2 }}
      className="glass-card-hover rounded-xl p-4"
      style={{ borderLeft: `3px solid ${balance.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold" style={{ color: balance.color }}>{balance.code}</span>
        <span className="text-xs text-white/30">{available}d left</span>
      </div>
      <p className="text-xs font-medium text-white/60 truncate mb-3">{balance.leaveTypeName}</p>

      {/* Stacked progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden bg-white/8 relative">
        <div className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${usedPct}%`, background: balance.color }} />
        <div className="absolute top-0 h-full rounded-full opacity-50"
          style={{ left: `${usedPct}%`, width: `${pendPct}%`, background: balance.color }} />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-white/25">
        <span>Used: {balance.usedDays}</span>
        <span>Total: {total}</span>
      </div>
    </motion.div>
  )
}