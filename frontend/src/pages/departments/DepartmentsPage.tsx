import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Users, MapPin, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { departmentService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import SearchInput from '../../components/common/SearchInput'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DepartmentFormModal from '../../components/departments/DepartmentFormModal'
import { cn, debounce } from '../../utils'

export default function DepartmentsPage() {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dSearch, setDSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editDept, setEditDept] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const doSearch = debounce((v: string) => setDSearch(v), 300)

  const { data, isLoading } = useQuery({
    queryKey: ['departments', dSearch],
    queryFn: () => departmentService.getAll({ search: dSearch, limit: 50 }),
    select: d => d.data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department deleted')
      setDeleteTarget(null)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Delete failed'),
  })

  const departments = data || []

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments across your organisation`}
        actions={
          hasRole(['admin', 'hr']) && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} />
              New Department
            </button>
          )
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); doSearch(v) }}
        placeholder="Search departments..."
        isLoading={isLoading}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="loading-pulse h-40 rounded-2xl" />)}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments found"
          description="Create your first department to organise your workforce"
          action={hasRole(['admin', 'hr']) && <button onClick={() => setShowCreate(true)} className="btn-primary">Create Department</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept: any, i: number) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover rounded-2xl p-6 relative group cursor-pointer"
              onClick={() => navigate(`/departments/${dept.id}`)}
            >
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => navigate(`/departments/${dept.id}`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Eye size={14} className="text-white/40" />
                </button>
                {hasRole(['admin', 'hr']) && (
                  <>
                    <button onClick={() => setEditDept(dept)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <Edit size={14} className="text-lime-300" />
                    </button>
                    <button onClick={() => setDeleteTarget(dept)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))' }}>
                  <Building2 size={20} className="text-lime-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white/85">{dept.name}</h3>
                  <span className="text-xs font-mono text-lime-300">{dept.code}</span>
                </div>
              </div>

              {dept.description && (
                <p className="text-xs text-white/35 mb-4 line-clamp-2">{dept.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Users size={12} />
                  <span>{dept.employeeCount || 0} employees</span>
                </div>
                {dept.location && (
                  <div className="flex items-center gap-1 text-xs text-white/30">
                    <MapPin size={11} />
                    <span>{dept.location}</span>
                  </div>
                )}
              </div>

              {dept.head_name && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/35">
                  Head: <span className="text-white/55">{dept.headName}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(showCreate || editDept) && (
          <DepartmentFormModal
            department={editDept}
            onClose={() => { setShowCreate(false); setEditDept(null) }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['departments'] })
              setShowCreate(false)
              setEditDept(null)
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"? This cannot be done if there are active employees.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}