import { UserRole } from './common.types'

export interface User {
  id: string
  email: string
  role: UserRole | string
  permissions: string[]

  employee_id?: string
  employeeId?: string
  employee_code?: string
  employeeCode?: string

  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string

  profile_picture_url?: string
  profilePictureUrl?: string

  designation?: string

  department_id?: string
  departmentId?: string
  department_name?: string
  departmentName?: string

  is_active?: boolean
  isActive?: boolean
  last_login?: string
  lastLogin?: string
  created_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}