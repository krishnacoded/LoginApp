import React from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Check } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { departmentService, employeeService } from '../../api'
import { cn } from '../../utils'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required').max(10, 'Max 10 chars'),
  description: z.string().optional(),
  location: z.string().optional(),
  budget: z.string().optional(),
  headEmployeeId: z.string().optional(),
  goals: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional().refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email format',
  }),
})

interface DepartmentFormModalProps {
  department?: any
  onClose: () => void
  onSuccess: () => void
}

export default function DepartmentFormModal({ department, onClose, onSuccess }: DepartmentFormModalProps) {
  const isEdit = !!department

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
      location: department?.location || '',
      budget: department?.budget?.toString() || '',
      headEmployeeId: department?.headEmployeeId || department?.head_employee_id || '',
      goals: department?.goals || '',
      contactPhone: department?.contactPhone || department?.contact_phone || '',
      contactEmail: department?.contactEmail || department?.contact_email || '',
    },
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-select-dept'],
    queryFn: () => employeeService.getAll({ limit: 100, status: 'active' }),
    select: d => d.data,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, budget: data.budget ? parseFloat(data.budget) : undefined }
      return isEdit ? departmentService.update(department.id, payload) : departmentService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Department updated' : 'Department created')
      onSuccess()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="font-semibold text-white/90">{isEdit ? 'Edit Department' : 'New Department'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Name *</label>
                <input {...register('name')} placeholder="Engineering" className={cn('input-field', errors.name && 'border-red-500/50')} />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message as string}</p>}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Code *</label>
                <input {...register('code')} placeholder="ENG" className={cn('input-field', errors.code && 'border-red-500/50')} />
                {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message as string}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Department description..." className="input-field resize-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Goals</label>
              <textarea {...register('goals')} rows={2} placeholder="Department goals and key results..." className="input-field resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Contact Phone / Ext</label>
                <input {...register('contactPhone')} placeholder="+1 (555) 019-2834" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Contact Email</label>
                <input {...register('contactEmail')} placeholder="dept@company.com" className={cn('input-field', errors.contactEmail && 'border-red-500/50')} />
                {errors.contactEmail && <p className="text-xs text-red-400 mt-1">{errors.contactEmail.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Location</label>
                <input {...register('location')} placeholder="Floor 3" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Annual Budget</label>
                <input {...register('budget')} type="number" placeholder="500000" className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Department Head</label>
              <select {...register('headEmployeeId')} className="input-field">
                <option value="">No head assigned</option>
                {(employees || []).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.firstName || e.first_name} {e.lastName || e.last_name} — {e.designation}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary">
                {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> {isEdit ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}