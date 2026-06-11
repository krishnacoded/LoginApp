export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
  pagination?: PaginationMeta
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: PaginationMeta
}

export interface SelectOption {
  value: string
  label: string
}

export type SortOrder = 'asc' | 'desc'

export interface TableColumn<T = any> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

export interface FilterParams {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  [key: string]: any
}

export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'inactive' | 'probation'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'manager_approved'
export type UserRole = 'admin' | 'hr' | 'manager' | 'employee'
export type DocumentType = 'resume' | 'id_proof' | 'certificate' | 'profile_picture' | 'other'