import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Lock, Bell, Palette, Shield, Loader2, Check, Upload } from 'lucide-react'
import { useAuth } from '../../store/auth.store'
import { authService } from '../../api/auth.service'
import { employeeService } from '../../api'
import Avatar from '../../components/Avatar/Avatar'
import { cn } from '../../utils'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const pwForm = useForm({ resolver: zodResolver(passwordSchema) })

  const pwMutation = useMutation({
    mutationFn: (d: any) => authService.changePassword(d.currentPassword, d.newPassword),
    onSuccess: () => { toast.success('Password changed'); pwForm.reset() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const empId = user?.employeeId || user?.employee_id;
      if (!empId) throw new Error('No employee record')
      return employeeService.uploadProfilePicture(empId, file)
    },
    onSuccess: () => { refreshUser(); toast.success('Profile picture updated') },
    onError: () => toast.error('Upload failed'),
  })

  return (
    <div className="p-6 max-w-[900px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-sm text-white/35 mt-0.5">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                activeTab === tab.id ? 'text-lime-200' : 'text-white/40 hover:text-white/60 hover:bg-white/3')}
              style={activeTab === tab.id ? { background: 'rgba(79,70,229,0.15)' } : {}}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-6">
              <h2 className="font-semibold text-white/80">Profile Information</h2>

              <div className="flex items-center gap-5">
                <Avatar firstName={user?.firstName || user?.first_name} lastName={user?.lastName || user?.last_name} src={user?.profilePictureUrl || user?.profile_picture_url} size="xl" className="rounded-2xl" />
                <div>
                  <p className="font-semibold text-white/80">
                    {user?.firstName || user?.first_name ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}` : user?.email}
                  </p>
                  <p className="text-sm text-white/40 capitalize mt-0.5">{user?.role} · {user?.designation}</p>
                  {(user?.employeeId || user?.employee_id) && (
                    <label className="mt-3 flex items-center gap-2 cursor-pointer btn-secondary text-xs px-3 py-1.5 w-fit">
                      <Upload size={13} />
                      Change Photo
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={e => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Role', value: user?.role },
                  { label: 'Designation', value: user?.designation },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs text-white/35 mb-1">{label}</p>
                    <p className="text-sm font-medium text-white/70 capitalize">{value}</p>
                  </div>
                ) : null)}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-white/80">Change Password</h2>

              <form onSubmit={pwForm.handleSubmit(d => pwMutation.mutate(d))} className="space-y-4">
                {[
                  { name: 'currentPassword', label: 'Current Password' },
                  { name: 'newPassword', label: 'New Password' },
                  { name: 'confirmPassword', label: 'Confirm New Password' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                    <input
                      {...pwForm.register(name as any)}
                      type="password"
                      placeholder="••••••••"
                      className={cn('input-field', pwForm.formState.errors[name as keyof typeof pwForm.formState.errors] && 'border-red-500/50')}
                    />
                    {pwForm.formState.errors[name as keyof typeof pwForm.formState.errors] && (
                      <p className="text-xs text-red-400 mt-1">
                        {pwForm.formState.errors[name as keyof typeof pwForm.formState.errors]?.message as string}
                      </p>
                    )}
                  </div>
                ))}

                <button type="submit" disabled={pwMutation.isPending} className="btn-primary">
                  {pwMutation.isPending ? <><Loader2 size={15} className="animate-spin" />Changing...</> : <><Check size={15} />Change Password</>}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white/80">Notification Preferences</h2>
              {[
                { label: 'Leave approved/rejected', desc: 'When your leave requests are actioned' },
                { label: 'New team member', desc: 'When someone joins your department' },
                { label: 'Document expiry', desc: 'Reminder when documents are about to expire' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <p className="text-sm font-medium text-white/70">{label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{ background: 'rgba(79,70,229,0.8)' }} />
                  </label>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}