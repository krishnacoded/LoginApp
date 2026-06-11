import React from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Briefcase, Award, FileText, Clock } from 'lucide-react'
import { TimelineEvent } from '../../types'
import { formatDate, formatRelativeDate } from '../../utils'

const EVENT_ICONS: Record<string, any> = {
  joined: UserCheck,
  promotion: Award,
  department_change: Briefcase,
  document_added: FileText,
  default: Clock,
}

const EVENT_COLORS: Record<string, string> = {
  joined: '#059669',
  promotion: '#D97706',
  department_change: '#a3ff29',
  document_added: '#0891B2',
  default: '#21d978',
}

interface EmployeeTimelineProps {
  timeline: TimelineEvent[]
}

export default function EmployeeTimeline({ timeline }: EmployeeTimelineProps) {
  if (!timeline?.length) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center py-12">
        <Clock size={32} className="text-white/15 mb-3" />
        <p className="text-sm text-white/30">No timeline events yet</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-semibold text-white/70 mb-6">Activity Timeline</h3>
      <div className="relative space-y-5">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-2 bottom-0 w-px bg-white/5" />

        {timeline.map((event, i) => {
          const Icon = EVENT_ICONS[event.eventType] || EVENT_ICONS.default
          const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.default

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4 relative"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={15} style={{ color }} />
              </div>

              <div className="flex-1 pb-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/75">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-white/40 mt-0.5">{event.description}</p>
                    )}
                    {event.performedByName && (
                      <p className="text-xs text-white/30 mt-1">by {event.performedByName}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-white/30">{formatDate(event.eventDate)}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{formatRelativeDate(event.createdAt)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}