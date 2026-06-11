export interface DashboardOverview {
  overview: {
    totalEmployees: number
    activeEmployees: number
    onLeave: number
    newThisMonth: number
    newThisWeek: number
    totalDepartments: number
    pendingLeaves: number
    approvedThisYear: number
    rejectedThisYear: number
    awaitingHr: number
    newThisYear: number
  }
  growth: { month: string; monthDate: string; count: number }[]
  departmentDistribution: { name: string; id: string; count: number }[]
  leaveTrend: { month: string; monthNum: number; approved: number; rejected: number; pending: number }[]
  recentActivity: { action: string; entityType: string; entityId: string; createdAt: string; userEmail: string; employeeName?: string }[]
  topDepartments: { name: string; id: string; employeeCount: number; avgTenureYears: number }[]
  genderDistribution: { gender: string; count: number }[]
}

export interface EmployeeAnalytics {
  byStatus: { employmentStatus: string; count: number }[]
  byType: { employmentType: string; count: number }[]
  tenureGroups: { tenureGroup: string; count: number }[]
  monthlyHiring: { month: string; monthNum: number; hires: number }[]
}

export interface SkillAnalytics {
  topSkills: { name: string; category: string; color: string; employeeCount: number; avgProficiency: number }[]
  byCategory: { name: string; color: string; skillCount: number; employeeCount: number }[]
}