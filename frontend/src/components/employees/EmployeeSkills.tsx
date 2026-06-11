import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Star } from 'lucide-react'
import { EmployeeSkill } from '../../types'
import { getProficiencyLabel, cn } from '../../utils'

interface EmployeeSkillsProps {
  skills: EmployeeSkill[]
}

const PROFICIENCY_COLORS = ['', '#6B7280', '#0891B2', '#a3ff29', '#21d978', '#059669']

export default function EmployeeSkills({ skills }: EmployeeSkillsProps) {
  if (!skills?.length) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center py-12">
        <Zap size={32} className="text-white/15 mb-3" />
        <p className="text-sm text-white/30">No skills added yet</p>
      </div>
    )
  }

  const grouped = skills.reduce((acc: Record<string, EmployeeSkill[]>, skill) => {
    const cat = skill.categoryName || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white/70">Skills & Expertise</h3>
        <span className="badge badge-info">{skills.length} skills</span>
      </div>

      {Object.entries(grouped).map(([category, catSkills]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{category}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catSkills.map((skill, i) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  {skill.isPrimary && <Star size={12} className="text-amber-400 flex-shrink-0" />}
                  <span className="text-sm text-white/70">{skill.skillName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div
                        key={lvl}
                        className="w-2.5 h-2.5 rounded-sm transition-all"
                        style={{
                          background: lvl <= skill.proficiencyLevel
                            ? PROFICIENCY_COLORS[skill.proficiencyLevel]
                            : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/30 w-20 text-right">
                    {getProficiencyLabel(skill.proficiencyLevel)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}