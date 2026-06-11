import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Building2, Calendar, User, Edit, ArrowLeft, ExternalLink, Camera, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import Avatar from '../Avatar/Avatar'
import StatusBadge from '../common/StatusBadge'
import { Employee } from '../../types'
import { formatDate, cn } from '../../utils'
import { employeeService } from '../../api'
import { useAuth } from '../../store/auth.store'

interface EmployeeProfileHeaderProps {
  employee: Employee
  canEdit: boolean
  onEdit: () => void
  onRefresh?: () => void
}

export default function EmployeeProfileHeader({ employee, canEdit, onEdit, onRefresh }: EmployeeProfileHeaderProps) {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSelf = user?.employeeId === employee.id || user?.employee_id === employee.id
  const canUploadPhoto = canEdit || isSelf

  const uploadMutation = useMutation({
    mutationFn: (file: File) => employeeService.uploadProfilePicture(employee.id, file),
    onSuccess: () => {
      toast.success('Profile picture updated successfully')
      if (isSelf) {
        refreshUser()
      }
      if (onRefresh) {
        onRefresh()
      }
    },
    onError: () => {
      toast.error('Failed to upload profile picture')
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #0f8f55 0%, #a3ff29 50%, #21d978 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative group cursor-pointer" onClick={() => canUploadPhoto && fileInputRef.current?.click()}>
            <Avatar
              firstName={employee.firstName}
              lastName={employee.lastName}
              src={employee.profilePictureUrl}
              size="xl"
              className="ring-4 ring-[#020617] rounded-2xl"
            />
            {canUploadPhoto && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadMutation.isPending ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <StatusBadge
              status={employee.employmentStatus}
              className="absolute -bottom-1 -right-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pb-1">
            <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
              <ArrowLeft size={14} />
              Back
            </button>
            {canEdit && (
              <button onClick={onEdit} className="btn-primary text-sm">
                <Edit size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white/90">
              {employee.firstName} {employee.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-white/50">{employee.designation || 'No designation'}</span>
              <span className="text-white/20">·</span>
              <span className="text-xs font-mono text-lime-300">{employee.employeeCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
            {employee.email && (
              <InfoItem icon={Mail} label="Email" value={employee.email} />
            )}
            {employee.phone && (
              <InfoItem icon={Phone} label="Phone" value={employee.phone} />
            )}
            {employee.departmentName && (
              <InfoItem icon={Building2} label="Department" value={employee.departmentName} />
            )}
            {employee.joiningDate && (
              <InfoItem icon={Calendar} label="Joined" value={formatDate(employee.joiningDate)} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-white/25 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
        <p className="text-xs text-white/65 truncate max-w-[120px]">{value}</p>
      </div>
    </div>
  )
}