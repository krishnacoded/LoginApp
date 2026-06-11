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
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'employees/:id', element: <EmployeeProfilePage /> },
      { path: 'departments', element: <DepartmentsPage /> },
      { path: 'departments/:id', element: <DepartmentDetailsPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'leaves/approvals', element: <LeaveApprovalsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'notifications', element: <NotificationPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export default appRoutes;
