import React from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { X, Loader2, Check } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { skillService } from '../../api'
import { cn } from '../../utils'

interface SkillFormModalProps {
  skill?: any
  categories: any[]
  onClose: () => void
  onSuccess: () => void
}

export default function SkillFormModal({ skill, categories, onClose, onSuccess }: SkillFormModalProps) {
  const isEdit = !!skill
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: skill?.name || '',
      categoryId: skill?.category_id || '',
      description: skill?.description || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? skillService.update(skill.id, data) : skillService.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Skill updated' : 'Skill created'); onSuccess() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  })

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="font-semibold text-white/90">{isEdit ? 'Edit Skill' : 'New Skill'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Skill Name *</label>
              <input {...register('name', { required: 'Required' })} placeholder="e.g. React.js" className={cn('input-field', errors.name && 'border-red-500/50')} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Category</label>
              <select {...register('categoryId')} className="input-field">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Description</label>
              <textarea {...register('description')} rows={3} placeholder="Brief description..." className="input-field resize-none" />
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