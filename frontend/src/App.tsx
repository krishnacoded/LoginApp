import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './store/auth.store'
import { ThemeProvider } from './context/ThemeContext'

import ProtectedRoute from './components/common/ProtectedRoute'

import AppLayout from './layouts/AppLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage'

// Employees
import EmployeesPage from './pages/employees/EmployeesPage'
import EmployeeProfilePage from './pages/employees/EmployeeProfilePage'

// Departments
import DepartmentsPage from './pages/departments/DepartmentsPage'
import DepartmentDetailsPage from './pages/departments/DepartmentDetailsPage'

// Skills
import SkillsPage from './pages/skills/SkillsPage'

// Leaves
import LeavesPage from './pages/leaves/LeavesPage'
import LeaveApprovalsPage from './pages/leaves/LeaveApprovalsPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import VerificationApprovalsPage from './pages/verifications/VerificationApprovalsPage'

// Attendance & Assets
import AttendancePage from './pages/attendance/AttendancePage'
import AssetsPage from './pages/assets/AssetsPage'

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage'

// Audit
import AuditLogsPage from './pages/audit/AuditLogsPage'

// Settings
import SettingsPage from './pages/settings/SettingsPage'

// Notifications & Errors
import NotificationPage from './pages/notifications/NotificationPage'
import UnauthorizedPage from './pages/errors/UnauthorizedPage'
import NotFoundPage from './pages/errors/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Employees */}
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeProfilePage />} />

          {/* Departments */}
          <Route
            path="departments"
            element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']} permissions={['department.view']}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:id"
            element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']} permissions={['department.view']}>
                <DepartmentDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Skills */}
          <Route path="skills" element={<SkillsPage />} />

          {/* Leaves */}
          <Route path="leaves" element={<LeavesPage />} />
          <Route
            path="leaves/approvals"
            element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']} permissions={['leave.approve']}>
                <LeaveApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="verifications/approvals"
            element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <VerificationApprovalsPage />
              </ProtectedRoute>
            }
          />

          {/* Documents */}
          <Route path="documents" element={<DocumentsPage />} />

          {/* Attendance */}
          <Route path="attendance" element={<AttendancePage />} />

          {/* Assets */}
          <Route path="assets" element={<AssetsPage />} />

          {/* Analytics */}
          <Route
            path="analytics"
            element={
              <ProtectedRoute roles={['admin', 'hr']} permissions={['report.view']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['admin', 'hr']} permissions={['audit.view']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationPage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Unauthorized */}
          <Route path="unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}
