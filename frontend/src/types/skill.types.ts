export interface SkillCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  isActive: boolean
  skillCount?: number
  employeeCount?: number
}

export interface Skill {
  id: string
  name: string
  categoryId?: string
  categoryName?: string
  categoryColor?: string
  description?: string
  isActive: boolean
  employeeCount?: number
  createdAt: string
  updatedAt: string
  employees?: SkillEmployee[]
}

export interface SkillEmployee {
  id: string
  firstName: string
  lastName: string
  profilePictureUrl?: string
  designation?: string
  departmentName?: string
  proficiencyLevel: number
  yearsExperience?: number
}

export interface CreateSkillInput {
  name: string
  categoryId?: string
  description?: string
}

export interface SkillStats {
  byCategory: { category: string; color: string; skillCount: number; employeeCount: number }[]
  topSkills: { name: string; employeeCount: number; avgProficiency: number }[]
}