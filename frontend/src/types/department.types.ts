export interface Department {
  id: string
  name: string
  code: string
  description?: string
  headEmployeeId?: string
  headName?: string
  headDesignation?: string
  headPicture?: string
  headCode?: string
  parentDepartmentId?: string
  parentDepartmentName?: string
  budget?: number
  location?: string
  isActive: boolean
  employeeCount?: number
  createdAt: string
  updatedAt: string
  // Detail relations
  employees?: DepartmentEmployee[]
  skillStats?: { name: string; count: number }[]
  hireTrend?: { month: string; count: number }[]
}

export interface DepartmentEmployee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  designation?: string
  profilePictureUrl?: string
  employmentStatus: string
  joiningDate?: string
}

export interface CreateDepartmentInput {
  name: string
  code: string
  description?: string
  headEmployeeId?: string
  parentDepartmentId?: string
  budget?: number
  location?: string
}

export interface DepartmentAnalytics {
  overview: {
    totalDepartments: number
    activeDepartments: number
    totalBudget: number
  }
  bySize: { name: string; id: string; employeeCount: number }[]
  recentHires: { department: string; count: number }[]
}