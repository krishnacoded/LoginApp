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
import { useTheme } from '../../context/ThemeContext'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
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
                activeTab === tab.id ? '' : 'text-white/40 hover:text-white/60 hover:bg-white/3')}
              style={activeTab === tab.id ? { background: 'var(--sidebar-hover-bg)', color: 'var(--sidebar-hover-text)' } : {}}>
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



          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-white/85">Appearance</h2>
                <p className="text-xs text-white/35 mt-1">Select your visual theme preference. The change will apply immediately.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PeopleFlow Midnight */}
                <button
                  onClick={() => setTheme('PeopleFlow Midnight')}
                  className={cn(
                    'p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-40',
                    theme === 'PeopleFlow Midnight' ? 'border-amber-400 shadow-lg glow' : 'border-white/5 hover:border-white/20'
                  )}
                  style={{ background: 'linear-gradient(135deg, #00205B 0%, #001133 100%)' }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-white">PeopleFlow Midnight</span>
                    {theme === 'PeopleFlow Midnight' && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">Active</span>
                    )}
                  </div>
                  <div className="space-y-2 opacity-80 w-full">
                    <div className="h-2 w-12 rounded bg-white/20" />
                    <div className="h-5 w-full rounded bg-white/5 border border-white/10" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded bg-gradient-to-r from-amber-300 to-amber-500" />
                      <div className="h-5 w-10 rounded bg-white/10" />
                    </div>
                  </div>
                </button>

                {/* PeopleFlow Light */}
                <button
                  onClick={() => setTheme('PeopleFlow Light')}
                  className={cn(
                    'p-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-40',
                    theme === 'PeopleFlow Light' ? 'border-amber-500 shadow-md' : 'border-white/5 hover:border-white/20'
                  )}
                  style={{ background: '#F8FAFC' }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold" style={{ color: '#091E42' }}>PeopleFlow Light</span>
                    {theme === 'PeopleFlow Light' && (
                      <span className="bg-amber-500/20 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">Active</span>
                    )}
                  </div>
                  <div className="space-y-2 opacity-80 w-full">
                    <div className="h-2 w-12 rounded" style={{ backgroundColor: 'rgba(9, 30, 66, 0.2)' }} />
                    <div className="h-5 w-full rounded border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(9, 30, 66, 0.1)' }} />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded bg-gradient-to-r from-amber-300 to-amber-500" />
                      <div className="h-5 w-10 rounded" style={{ backgroundColor: 'rgba(9, 30, 66, 0.05)' }} />
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}