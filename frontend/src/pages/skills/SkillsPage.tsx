import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, Search, Edit, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { skillService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import SearchInput from '../../components/common/SearchInput'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import SkillFormModal from '../../components/skills/SkillFormModal'
import { debounce, cn } from '../../utils'

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#307FE2',
  'Soft Skills': '#FFE264',
  Management: '#00205B',
  'Domain Knowledge': '#F2A900',
}

export default function SkillsPage() {
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dSearch, setDSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editSkill, setEditSkill] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const doSearch = debounce((v: string) => setDSearch(v), 300)

  const { data: categories } = useQuery({ queryKey: ['skill-categories'], queryFn: skillService.getCategories })
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills', dSearch, categoryFilter],
    queryFn: () => skillService.getAll({ search: dSearch, categoryId: categoryFilter }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => skillService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['skills'] }); toast.success('Skill removed'); setDeleteTarget(null) },
  })

  const grouped = (skills || []).reduce((acc: Record<string, any[]>, s: any) => {
    const cat = s.categoryName || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Skills"
        subtitle={`${skills?.length || 0} skills across ${categories?.length || 0} categories`}
        actions={hasRole(['admin', 'hr']) && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Add Skill
          </button>
        )}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); doSearch(v) }} placeholder="Search skills..." isLoading={isLoading} className="max-w-xs" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter('')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', !categoryFilter ? 'text-[#001133]' : 'btn-secondary')}
            style={!categoryFilter ? { background: 'linear-gradient(135deg, #FFE264, #F2A900)' } : {}}>
            All
          </button>
          {(categories || []).map((cat: any) => (
            <button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.id ? '' : cat.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border', categoryFilter === cat.id ? (cat.name === 'Soft Skills' || cat.name === 'Domain Knowledge' ? 'text-[#001133] border-transparent' : 'text-white border-transparent') : 'text-white/40 hover:text-white/60 border-white/8')}
              style={categoryFilter === cat.id ? { background: CATEGORY_COLORS[cat.name] || cat.color } : {}}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array(12).fill(0).map((_, i) => <div key={i} className="loading-pulse h-24 rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Zap} title="No skills found" description="Add skills to track employee expertise" />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catSkills]) => {
            const color = CATEGORY_COLORS[category] || '#307FE2'
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-semibold text-white/60">{category}</h3>
                  <span className="text-xs text-white/25">({(catSkills as any[]).length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                  {(catSkills as any[]).map((skill, i) => (
                    <motion.div key={skill.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className="glass-card-hover rounded-xl p-4 group relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                          <Zap size={14} style={{ color }} />
                        </div>
                        {hasRole(['admin', 'hr']) && (
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditSkill(skill)} className="p-1 rounded hover:bg-white/5">
                              <Edit size={12} className="text-lime-300" />
                            </button>
                            <button onClick={() => setDeleteTarget(skill)} className="p-1 rounded hover:bg-red-500/10">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white/75 truncate">{skill.name}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users size={11} className="text-white/25" />
                        <span className="text-xs text-white/30">{skill.employeeCount || 0}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {(showCreate || editSkill) && (
          <SkillFormModal
            skill={editSkill}
            categories={categories || []}
            onClose={() => { setShowCreate(false); setEditSkill(null) }}
            onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['skills'] }); setShowCreate(false); setEditSkill(null) }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Skill"
        message={`Remove "${deleteTarget?.name}"? It will be deactivated.`}
        confirmLabel="Remove"
        danger
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}