import { Navigate, RouteObject } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import DashboardPage from '../pages/dashboard/DashboardPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import EmployeeProfilePage from '../pages/employees/EmployeeProfilePage';
import DepartmentsPage from '../pages/departments/DepartmentsPage';
import DepartmentDetailsPage from '../pages/departments/DepartmentDetailsPage';
import SkillsPage from '../pages/skills/SkillsPage';
import LeavesPage from '../pages/leaves/LeavesPage';
import LeaveApprovalsPage from '../pages/leaves/LeaveApprovalsPage';
import DocumentsPage from '../pages/documents/DocumentsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationPage from '../pages/notifications/NotificationPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import AssetsPage from '../pages/assets/AssetsPage';

export const appRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'employees', element: <ProtectedRoute roles={['admin', 'hr', 'manager']}><EmployeesPage /></ProtectedRoute> },
      { path: 'employees/:id', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><EmployeeProfilePage /></ProtectedRoute> },
      { path: 'departments', element: <ProtectedRoute roles={['admin', 'hr', 'manager']}><DepartmentsPage /></ProtectedRoute> },
      { path: 'departments/:id', element: <ProtectedRoute roles={['admin', 'hr', 'manager']}><DepartmentDetailsPage /></ProtectedRoute> },
      { path: 'skills', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><SkillsPage /></ProtectedRoute> },
      { path: 'leaves', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><LeavesPage /></ProtectedRoute> },
      { path: 'leaves/approvals', element: <ProtectedRoute roles={['admin', 'hr', 'manager']}><LeaveApprovalsPage /></ProtectedRoute> },
      { path: 'attendance', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><AttendancePage /></ProtectedRoute> },
      { path: 'assets', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><AssetsPage /></ProtectedRoute> },
      { path: 'documents', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><DocumentsPage /></ProtectedRoute> },
      { path: 'analytics', element: <ProtectedRoute roles={['admin', 'hr', 'manager']}><AnalyticsPage /></ProtectedRoute> },
      { path: 'audit-logs', element: <ProtectedRoute roles={['admin']}><AuditLogsPage /></ProtectedRoute> },
      { path: 'notifications', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><NotificationPage /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute roles={['admin', 'hr', 'manager', 'employee']}><SettingsPage /></ProtectedRoute> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export default appRoutes;
