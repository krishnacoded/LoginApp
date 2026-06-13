import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trash2, Check, CheckCheck, Inbox, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../api'
import { formatRelativeDate, cn } from '../../utils'
import { toast } from 'sonner'
import Pagination from '../../components/common/Pagination'

export default function NotificationPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [eventTypeFilter, setEventTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter, page, eventTypeFilter],
    queryFn: () => notificationService.getAll({ 
      unreadOnly: filter === 'unread',
      page,
      limit: 10,
      type: eventTypeFilter || undefined
    }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      leave_approved: '✅',
      leave_rejected: '❌',
      leave_applied: '📅',
      new_employee: '👤',
      document_expiry: '⏰',
      document_uploaded: '📎',
      department_updated: '🏢',
      employee_updated: '⚙️',
      profile_updated: '⚙️',
      asset_assigned: '💻',
      asset_returned: '🔄',
      password_changed: '🔑',
      role_changed: '🛡️',
    }
    return icons[type] || '🔔'
  }

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markReadMutation.mutateAsync(notif.id)
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
    }
  }

  const filteredNotifs = notifications.filter((notif: any) => {
    if (!search) return true
    return (
      notif.title.toLowerCase().includes(search.toLowerCase()) ||
      notif.message.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Notification Center</h1>
          <p className="text-sm text-white/35 mt-0.5">
            Manage your updates and alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/3 border border-white/6 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              filter === 'all' ? 'text-[#001133]' : 'text-white/35 hover:text-white/60'
            )}
            style={filter === 'all' ? { background: 'linear-gradient(135deg, #FFE264, #F2A900)' } : {}}
          >
            All Updates
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
              filter === 'unread' ? 'text-[#001133]' : 'text-white/35 hover:text-white/60'
            )}
            style={filter === 'unread' ? { background: 'linear-gradient(135deg, #FFE264, #F2A900)' } : {}}
          >
            Unread
            {unreadCount > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                filter === 'unread' ? 'bg-[#001133] text-amber-300' : 'bg-amber-400 text-[#001133]'
              )}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search on this page..."
            className="input-field pl-9 text-sm"
          />
        </div>

        <div className="w-[180px]">
          <select
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1) }}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun h-10"
          >
            <option value="">All Categories</option>
            <option value="new_employee">New Employee</option>
            <option value="profile_updated">Profile Update</option>
            <option value="leave_applied">Leave Applied</option>
            <option value="leave_approved">Leave Approved</option>
            <option value="leave_rejected">Leave Rejected</option>
            <option value="asset_assigned">Asset Assigned</option>
            <option value="asset_returned">Asset Returned</option>
            <option value="password_changed">Password Change</option>
            <option value="role_changed">Role Change</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="loading-pulse h-20 rounded-2xl" />
            ))}
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(48, 127, 226, 0.08)', border: '1px solid rgba(48, 127, 226, 0.15)' }}>
              <Inbox size={26} className="text-secondary opacity-70" />
            </div>
            <h3 className="text-lg font-semibold text-white/70 mb-1">
              No notifications
            </h3>
            <p className="text-sm text-white/25 max-w-xs">
              {search ? "We couldn't find any updates matching your search query." : "You're all caught up! There are no updates to display."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifs.map((notif: any, idx: number) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group',
                  !notif.isRead 
                    ? 'bg-amber-400/5 hover:bg-amber-400/10 border-amber-400/15' 
                    : 'bg-white/2 hover:bg-white/4 border-white/6 hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: !notif.isRead ? 'rgba(48, 127, 226, 0.08)' : 'rgba(255,255,255,0.03)' }}>
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-semibold truncate',
                        !notif.isRead ? 'text-white/90' : 'text-white/50'
                      )}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5 line-clamp-2 md:line-clamp-1',
                      !notif.isRead ? 'text-white/55 font-medium' : 'text-white/30'
                    )}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">
                      {formatRelativeDate(notif.createdAt)}
                    </p>
                  </div>
                </div>
 
                <div className="flex items-center gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markReadMutation.mutate(notif.id)
                      }}
                      className="p-2 rounded-xl bg-white/3 hover:bg-amber-400/20 text-white/40 hover:text-amber-300 transition-all"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMutation.mutate(notif.id)
                    }}
                    className="p-2 rounded-xl bg-white/3 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {data?.pagination && (
          <div className="pt-4">
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}