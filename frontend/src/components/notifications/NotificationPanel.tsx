import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../api';
import { formatRelativeDate } from '../../utils';
import { toast } from 'sonner';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 20 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      leave_approved: '✅',
      leave_rejected: '❌',
      leave_applied: '📅',
      new_employee: '👤',
      document_uploaded: '📎',
      department_updated: '🏢',
    };
    return icons[type] || '🔔';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="fixed right-4 top-16 z-50 w-96 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--glass-card-bg)',
          border: '1px solid var(--glass-card-border)',
          boxShadow: 'var(--glass-card-shadow)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-400" />
            <span className="font-semibold text-white/80">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-[#001133]"
                style={{ background: 'linear-gradient(135deg, #FFE264, #F2A900)' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <X size={16} className="text-white/30" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto">
           {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(48, 127, 226, 0.1)' }}>
                <Bell size={20} className="text-amber-400/50" />
              </div>
              <p className="text-sm text-white/30">No notifications yet</p>
            </div>
          )}

          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/2 transition-colors ${!notif.isRead ? 'bg-amber-400/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'rgba(48, 127, 226, 0.1)' }}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${notif.isRead ? 'text-white/50' : 'text-white/80'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-xs text-white/20 mt-1">{formatRelativeDate(notif.createdAt)}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    className="p-1 rounded hover:bg-white/5 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={13} className="text-amber-400" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(notif.id)}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} className="text-white/20 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}