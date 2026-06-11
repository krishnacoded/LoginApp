import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { employeeService, departmentService, skillService } from '../../api'
import { cn } from '../../utils'
import { Employee } from '../../types'

const step1Schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
})

const step2Schema = z.object({
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  employmentType: z.string().optional(),
  employmentStatus: z.string().optional(),
  joiningDate: z.string().optional(),
  managerId: z.string().optional(),
  salary: z.string().optional(),
})

const STEPS = ['Personal Info', 'Professional', 'Skills', 'Review']

interface EmployeeFormModalProps {
  employee?: Employee | null
  onClose: () => void
  onSuccess: () => void
}

function EmployeeFormModalInner({ employee, onClose, onSuccess }: EmployeeFormModalProps) {
  const isEdit = !!employee
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<any>(employee ? {
    firstName: employee.firstName,
    lastName: employee.lastName,
    dateOfBirth: employee.dateOfBirth || '',
    gender: employee.gender || '',
    phone: employee.phone || '',
    personalEmail: employee.personalEmail || '',
    departmentId: employee.departmentId || '',
    designation: employee.designation || '',
    employmentType: employee.employmentType || 'full_time',
    employmentStatus: employee.employmentStatus || 'active',
    joiningDate: employee.joiningDate || '',
    managerId: employee.managerId || '',
    salary: employee.salary?.toString() || '',
    skills: employee.skills?.map(s => ({ skillId: s.skillId, proficiencyLevel: s.proficiencyLevel })) || [],
  } : {
    firstName: '', lastName: '', dateOfBirth: '', gender: '', phone: '', personalEmail: '',
    departmentId: '', designation: '', employmentType: 'full_time', employmentStatus: 'active',
    joiningDate: '', managerId: '', salary: '', skills: [],
  })

  const { data: departments } = useQuery({
    queryKey: ['departments-select'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
    select: d => d.data,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-select'],
    queryFn: () => employeeService.getAll({ limit: 100, status: 'active' }),
    select: d => d.data,
  })

  const { data: skills } = useQuery({
    queryKey: ['skills-select'],
    queryFn: () => skillService.getAll(),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? employeeService.update(employee!.id, data)
      : employeeService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated successfully' : 'Employee created successfully')
      onSuccess()
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Failed to save employee';
      const errors = err?.response?.data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        toast.error(`${errMsg}: ${errors.join(', ')}`);
      } else {
        toast.error(errMsg);
      }
    },
  })

  const step1Form = useForm({ resolver: zodResolver(step1Schema), defaultValues: formData })
  const step2Form = useForm({ resolver: zodResolver(step2Schema), defaultValues: formData })

  const nextStep = async () => {
    if (step === 0) {
      const valid = await step1Form.trigger()
      if (!valid) return
      const vals = step1Form.getValues()
      setFormData((p: any) => ({
        ...p,
        firstName: vals.firstName,
        lastName: vals.lastName,
        dateOfBirth: vals.dateOfBirth,
        gender: vals.gender,
        phone: vals.phone,
        personalEmail: vals.personalEmail,
      }))
    } else if (step === 1) {
      const valid = await step2Form.trigger()
      if (!valid) return
      const vals = step2Form.getValues()
      setFormData((p: any) => ({
        ...p,
        departmentId: vals.departmentId,
        designation: vals.designation,
        employmentType: vals.employmentType,
        employmentStatus: vals.employmentStatus,
        joiningDate: vals.joiningDate,
        managerId: vals.managerId,
        salary: vals.salary,
      }))
    }
    setStep(s => s + 1)
  }

  const prevStep = () => {
    if (step === 1) {
      const vals = step2Form.getValues()
      setFormData((p: any) => ({
        ...p,
        departmentId: vals.departmentId,
        designation: vals.designation,
        employmentType: vals.employmentType,
        employmentStatus: vals.employmentStatus,
        joiningDate: vals.joiningDate,
        managerId: vals.managerId,
        salary: vals.salary,
      }))
    }
    setStep(s => s - 1)
  }

  const handleSubmit = () => {
    const payload = {
      ...formData,
      dateOfBirth: formData.dateOfBirth || null,
      joiningDate: formData.joiningDate || null,
      personalEmail: formData.personalEmail || null,
      departmentId: formData.departmentId || null,
      managerId: formData.managerId || null,
      phone: formData.phone || null,
      gender: formData.gender || null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
    }
    mutation.mutate(payload)
  }

  const toggleSkill = (skillId: string) => {
    setFormData((p: any) => {
      const existing = p.skills.find((s: any) => s.skillId === skillId)
      if (existing) {
        return { ...p, skills: p.skills.filter((s: any) => s.skillId !== skillId) }
      }
      return { ...p, skills: [...p.skills, { skillId, proficiencyLevel: 3 }] }
    })
  }

  const updateSkillLevel = (skillId: string, level: number) => {
    setFormData((p: any) => ({
      ...p,
      skills: p.skills.map((s: any) => s.skillId === skillId ? { ...s, proficiencyLevel: level } : s),
    }))
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
            <div>
              <h2 className="font-semibold text-white/90">{isEdit ? 'Edit Employee' : 'New Employee'}</h2>
              <p className="text-xs text-white/35 mt-0.5">Step {step + 1} of {STEPS.length}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0 px-6 py-4 border-b border-white/5 flex-shrink-0">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    i < step && 'bg-emerald-500 text-white',
                    i === step && 'text-white',
                    i > step && 'text-white/25',
                  )}
                    style={i === step ? { background: 'linear-gradient(135deg, #a3ff29, #21d978)' } : i < step ? {} : { background: 'rgba(255,255,255,0.06)' }}>
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-white/70' : 'text-white/25')}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-px flex-1 mx-2', i < step ? 'bg-emerald-500/50' : 'bg-white/8')} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <StepPersonal key="step0" form={step1Form} />
              )}
              {step === 1 && (
                <StepProfessional key="step1" form={step2Form} departments={departments || []} employees={employees || []} />
              )}
              {step === 2 && (
                <StepSkills key="step2" allSkills={skills || []} selected={formData.skills} onToggle={toggleSkill} onLevelChange={updateSkillLevel} />
              )}
              {step === 3 && (
                <StepReview key="step3" data={formData} departments={departments || []} />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0">
            <button
              onClick={step === 0 ? onClose : prevStep}
              className="btn-secondary"
            >
              <ChevronLeft size={16} />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="btn-primary">
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={16} /> {isEdit ? 'Update Employee' : 'Create Employee'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function EmployeeFormModal({ employee, onClose, onSuccess }: EmployeeFormModalProps) {
  const isEdit = !!employee
  const { data: fullEmployee, isLoading } = useQuery({
    queryKey: ['employee-detail-modal', employee?.id],
    queryFn: () => employeeService.getById(employee!.id),
    enabled: isEdit && !!employee?.id,
  })

  if (isEdit && isLoading) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 20 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-2xl h-[400px] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Loader2 className="animate-spin text-lime-400 mb-3" size={32} />
            <p className="text-sm text-white/40">Loading employee details...</p>
          </div>
        </motion.div>
      </>
    )
  }

  return (
    <EmployeeFormModalInner
      employee={isEdit ? fullEmployee : null}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function StepPersonal({ form }: { form: any }) {
  const { register, formState: { errors } } = form
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name *" error={errors.firstName?.message as string}>
          <input {...register('firstName')} placeholder="John" className={cn('input-field', errors.firstName && 'border-red-500/50')} />
        </Field>
        <Field label="Last Name *" error={errors.lastName?.message as string}>
          <input {...register('lastName')} placeholder="Doe" className={cn('input-field', errors.lastName && 'border-red-500/50')} />
        </Field>
        <Field label="Date of Birth">
          <input {...register('dateOfBirth')} type="date" className="input-field" />
        </Field>
        <Field label="Gender">
          <select {...register('gender')} className="input-field">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Phone">
          <input {...register('phone')} placeholder="+1 (555) 000-0000" className="input-field" />
        </Field>
        <Field label="Personal Email">
          <input {...register('personalEmail')} type="email" placeholder="personal@email.com" className="input-field" />
        </Field>
      </div>
    </motion.div>
  )
}

function StepProfessional({ form, departments, employees }: { form: any; departments: any[]; employees: any[] }) {
  const { register } = form
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Department">
          <select {...register('departmentId')} className="input-field">
            <option value="">Select department</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Designation">
          <input {...register('designation')} placeholder="Software Engineer" className="input-field" />
        </Field>
        <Field label="Employment Type">
          <select {...register('employmentType')} className="input-field">
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </Field>
        <Field label="Employment Status">
          <select {...register('employmentStatus')} className="input-field">
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="probation">Probation</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Joining Date">
          <input {...register('joiningDate')} type="date" className="input-field" />
        </Field>
        <Field label="Manager">
          <select {...register('managerId')} className="input-field">
            <option value="">No Manager</option>
            {employees.map((e: any) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Salary">
            <input {...register('salary')} type="number" placeholder="Annual salary" className="input-field" />
          </Field>
        </div>
      </div>
    </motion.div>
  )
}

function StepSkills({ allSkills, selected, onToggle, onLevelChange }: any) {
  const LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
      <p className="text-sm text-white/40">Select skills and set proficiency levels</p>
      <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
        {allSkills.map((skill: any) => {
          const sel = selected.find((s: any) => s.skillId === skill.id)
          return (
            <div key={skill.id} className={cn(
              'p-3 rounded-xl cursor-pointer border transition-all',
              sel ? 'border-lime-400/50 bg-lime-400/10' : 'border-white/6 hover:border-white/12 hover:bg-white/2',
            )} onClick={() => onToggle(skill.id)}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-white/70">{skill.name}</p>
                {sel && <Check size={13} className="text-lime-300" />}
              </div>
              <p className="text-xs text-white/30">{skill.category_name}</p>
              {sel && (
                <div className="mt-2 flex gap-1" onClick={e => e.stopPropagation()}>
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button key={lvl} onClick={() => onLevelChange(skill.id, lvl)}
                      className={cn('w-5 h-5 rounded text-xs font-bold transition-all',
                        sel.proficiencyLevel >= lvl ? 'bg-lime-400 text-white' : 'bg-white/6 text-white/25')}
                      title={LEVELS[lvl - 1]}>
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-lime-300">{selected.length} skill{selected.length !== 1 ? 's' : ''} selected</p>
      )}
    </motion.div>
  )
}

function StepReview({ data, departments }: { data: any; departments: any[] }) {
  const dept = departments.find((d: any) => d.id === data.departmentId)
  const rows = [
    ['Name', `${data.firstName} ${data.lastName}`],
    ['Gender', data.gender],
    ['Phone', data.phone],
    ['Department', dept?.name],
    ['Designation', data.designation],
    ['Employment Type', data.employmentType],
    ['Employment Status', data.employmentStatus],
    ['Joining Date', data.joiningDate],
    ['Skills', data.skills?.length ? `${data.skills.length} selected` : 'None'],
  ].filter(([_, v]) => !!v)

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {rows.map(([label, value], i) => (
          <div key={label as string} className={cn(
            'flex items-center justify-between px-4 py-3 text-sm',
            i !== rows.length - 1 && 'border-b border-white/5',
          )}>
            <span className="text-white/40">{label}</span>
            <span className="text-white/75 font-medium capitalize">{value as string}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
