import { LeaveStatus } from './common.types'

export interface LeaveType {
  id: string
  name: string
  code: string
  description?: string
  color: string
  maxDaysPerYear: number
  maxConsecutiveDays?: number
  carryForward: boolean
  maxCarryForwardDays: number
  requiresAttachment: boolean
  requiresApproval: boolean
  applicableGender?: string
  minServiceMonths: number
  isPaid: boolean
  isActive: boolean
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveTypeId: string
  leaveTypeName: string
  color: string
  code: string
  isPaid: boolean
  year: number
  allocatedDays: number
  usedDays: number
  pendingDays: number
  carriedForwardDays: number
}

export interface LeaveApproval {
  id: string
  leaveRequestId: string
  approverId: string
  approverEmail: string
  approverName?: string
  approverPicture?: string
  designation?: string
  approverRole: string
  stage: number
  action: string
  comment?: string
  actionedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  employeeCode: string
  profilePictureUrl?: string
  departmentName?: string
  managerId?: string
  managerFirstName?: string
  managerLastName?: string
  leaveTypeId: string
  leaveTypeName: string
  color: string
  code: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: LeaveStatus
  attachmentUrl?: string
  isHalfDay: boolean
  halfDayType?: string
  appliedAt: string
  cancelledAt?: string
  cancellationReason?: string
  approvalCount?: number
  approvals?: LeaveApproval[]
  createdAt: string
  updatedAt: string
}

export interface ApplyLeaveInput {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
  isHalfDay?: boolean
  halfDayType?: 'first_half' | 'second_half'
  attachment?: File
}

export interface LeaveStats {
  overview: {
    pending: number
    approved: number
    rejected: number
    cancelled: number
    managerApproved: number
    total: number
  }
  byType: { name: string; color: string; count: number; totalDays: number }[]
  monthly: { month: string; monthNum: number; total: number; approved: number; rejected: number }[]
}