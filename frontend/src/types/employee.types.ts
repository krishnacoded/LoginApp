import { EmploymentStatus, EmploymentType } from './common.types'
import type { LeaveBalance } from './leave.types'

export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface EmergencyContact {
  name?: string
  relationship?: string
  phone?: string
}

export interface EmployeeSkill {
  id: string
  skillId: string
  skillName: string
  categoryName?: string
  categoryColor?: string
  proficiencyLevel: number
  yearsExperience?: number
  isPrimary?: boolean
  certified?: boolean
}

export interface Document {
  id: string
  documentType: string
  documentName: string
  fileName: string
  fileSize?: number
  mimeType?: string
  isVerified?: boolean
  expiryDate?: string
  createdAt: string
}

export interface TimelineEvent {
  id: string
  eventType: string
  title: string
  description?: string
  eventDate: string
  performedByName?: string
  performedByEmail?: string
  metadata?: Record<string, any>
  createdAt: string
}


export interface Employee {
  id: string
  userId?: string
  employeeCode: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  personalEmail?: string
  email?: string
  address?: Address
  emergencyContact?: EmergencyContact
  departmentId?: string
  departmentName?: string
  departmentCode?: string
  designation?: string
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  joiningDate?: string
  confirmationDate?: string
  managerId?: string
  managerFirstName?: string
  managerLastName?: string
  managerCode?: string
  managerPicture?: string
  salary?: number
  bio?: string
  linkedinUrl?: string
  profilePictureUrl?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string
  // Relations
  skills?: EmployeeSkill[]
  documents?: Document[]
  timeline?: TimelineEvent[]
  leaveBalances?: LeaveBalance[]
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  personalEmail?: string
  address?: Address
  emergencyContact?: EmergencyContact
  departmentId?: string
  designation?: string
  employmentType?: EmploymentType
  employmentStatus?: EmploymentStatus
  joiningDate?: string
  managerId?: string
  salary?: number
  bio?: string
  linkedinUrl?: string
  skills?: { skillId: string; proficiencyLevel: number; yearsExperience?: number; isPrimary?: boolean }[]
}