export interface DashboardOverview {
  overview: {
    total_employees: number
    active_employees: number
    on_leave: number
    new_this_month: number
    new_this_week: number
    total_departments: number
    pending_leaves: number
    approved_this_year: number
    rejected_this_year: number
    awaiting_hr: number
    new_this_year: number
  }
  growth: { month: string; month_date: string; count: number }[]
  departmentDistribution: { name: string; id: string; count: number }[]
  leaveTrend: { month: string; month_num: number; approved: number; rejected: number; pending: number }[]
  recentActivity: { action: string; entity_type: string; entity_id: string; created_at: string; user_email: string; employee_name?: string }[]
  topDepartments: { name: string; id: string; employee_count: number; avg_tenure_years: number }[]
  genderDistribution: { gender: string; count: number }[]
}

export interface EmployeeAnalytics {
  byStatus: { employment_status: string; count: number }[]
  byType: { employment_type: string; count: number }[]
  tenureGroups: { tenure_group: string; count: number }[]
  monthlyHiring: { month: string; month_num: number; hires: number }[]
}

export interface SkillAnalytics {
  topSkills: { name: string; category: string; color: string; employee_count: number; avg_proficiency: number }[]
  byCategory: { name: string; color: string; skill_count: number; employee_count: number }[]
}