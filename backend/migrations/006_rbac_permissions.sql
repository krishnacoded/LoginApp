-- PeopleFlow RBAC Permission Architecture Migration
-- Creates normalized permission tables and migrates from role-name authorization to permission-based authorization
BEGIN;

-- =============================================
-- PERMISSIONS TABLE (granular permission codes)
-- =============================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- =============================================
-- ROLE_PERMISSIONS JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

-- =============================================
-- USER_ROLES JUNCTION TABLE (multi-role support)
-- =============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- =============================================
-- ADD SYSTEM/CUSTOM FLAGS TO ROLES
-- =============================================
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Mark existing roles as system roles (cannot be deleted)
UPDATE roles SET is_system = TRUE, is_custom = FALSE WHERE name IN ('admin', 'hr', 'manager', 'employee');

-- =============================================
-- SEED ALL PERMISSION CODES
-- =============================================
INSERT INTO permissions (code, name, module, description) VALUES
  -- Employee Module
  ('employee.view',            'View Employees',           'employees',    'View employee list and basic profiles (scoped by data role)'),
  ('employee.view_sensitive',  'View Sensitive Data',      'employees',    'View salary, bank details, PII fields'),
  ('employee.create',          'Create Employee',          'employees',    'Create new employee records'),
  ('employee.edit',            'Edit Employee',            'employees',    'Edit employee profile details'),
  ('employee.delete',          'Delete Employee',          'employees',    'Soft-delete employee records'),
  
  -- Leave Module
  ('leave.view',               'View Leaves',              'leaves',       'View leave requests (scoped by data role)'),
  ('leave.apply',              'Apply for Leave',          'leaves',       'Submit own leave applications'),
  ('leave.approve',            'Approve/Reject Leaves',    'leaves',       'Approve or reject leave requests'),
  ('leave.manage_types',       'Manage Leave Types',       'leaves',       'Create, edit, delete leave types'),
  
  -- Attendance Module
  ('attendance.view_own',      'View Own Attendance',      'attendance',   'View own attendance logs'),
  ('attendance.view_team',     'View Team Attendance',     'attendance',   'View direct reports attendance'),
  ('attendance.view_all',      'View All Attendance',      'attendance',   'View all employee attendance logs'),
  ('attendance.manage_settings','Manage Attendance Settings','attendance', 'Edit attendance rules and settings'),
  
  -- Department Module
  ('department.view',          'View Departments',         'departments',  'View department list and details'),
  ('department.create',        'Create Department',        'departments',  'Create new departments'),
  ('department.edit',          'Edit Department',          'departments',  'Edit department details'),
  ('department.delete',        'Delete Department',        'departments',  'Delete departments'),
  
  -- Asset Module
  ('asset.view',               'View Assets',              'assets',       'View asset inventory'),
  ('asset.create',             'Create Asset',             'assets',       'Create new asset records'),
  ('asset.allocate',           'Allocate/Return Assets',   'assets',       'Allocate assets to employees and record returns'),
  ('asset.manage_status',      'Manage Asset Status',      'assets',       'Update asset status (damaged, lost, etc.)'),
  
  -- Document Module
  ('document.view',            'View Documents',           'documents',    'View documents (scoped by data role)'),
  ('document.upload',          'Upload Documents',         'documents',    'Upload new documents'),
  ('document.verify',          'Verify Documents',         'documents',    'Mark documents as verified'),
  ('document.delete',          'Delete Documents',         'documents',    'Delete documents'),
  
  -- Skill Module
  ('skill.view',               'View Skills',              'skills',       'View skills directory'),
  ('skill.create',             'Create/Edit Skills',       'skills',       'Create and edit skills and categories'),
  ('skill.delete',             'Delete Skills',            'skills',       'Delete skills and categories'),
  
  -- Reports Module
  ('report.view',              'View Reports',             'reports',      'View report dashboards'),
  ('report.export',            'Export Reports',           'reports',      'Export reports as CSV/XLSX/PDF'),
  
  -- Audit Module
  ('audit.view',               'View Audit Logs',          'audit',        'View system audit logs'),
  
  -- Dashboard Module
  ('dashboard.view_full',      'View Full Dashboard',      'dashboard',    'View organization-wide dashboard analytics'),
  
  -- Settings Module
  ('settings.manage',          'Manage Settings',          'settings',     'Manage system-wide settings'),
  
  -- Role Management Module
  ('role.view',                'View Roles',               'roles',        'View role list and permissions'),
  ('role.create',              'Create Roles',             'roles',        'Create custom roles'),
  ('role.edit',                'Edit Roles',               'roles',        'Edit role permissions'),
  ('role.delete',              'Delete Roles',             'roles',        'Delete custom roles'),
  ('role.assign',              'Assign Roles',             'roles',        'Assign and remove roles from users'),
  
  -- Notification Module
  ('notification.manage',      'Manage Notifications',     'notifications','View and manage own notifications')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- MAP PERMISSIONS TO DEFAULT SYSTEM ROLES
-- =============================================

-- Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- HR: Most permissions except role management and some admin-only ones
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'hr'
  AND p.code IN (
    'employee.view', 'employee.view_sensitive', 'employee.create', 'employee.edit', 'employee.delete',
    'leave.view', 'leave.apply', 'leave.approve', 'leave.manage_types',
    'attendance.view_own', 'attendance.view_team', 'attendance.view_all', 'attendance.manage_settings',
    'department.view', 'department.create', 'department.edit', 'department.delete',
    'asset.view', 'asset.create', 'asset.allocate', 'asset.manage_status',
    'document.view', 'document.upload', 'document.verify', 'document.delete',
    'skill.view', 'skill.create', 'skill.delete',
    'report.view', 'report.export',
    'audit.view',
    'dashboard.view_full',
    'settings.manage',
    'role.view', 'role.assign',
    'notification.manage'
  )
ON CONFLICT DO NOTHING;

-- Manager: Team-scoped access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.code IN (
    'employee.view',
    'leave.view', 'leave.apply', 'leave.approve',
    'attendance.view_own', 'attendance.view_team',
    'department.view',
    'asset.view',
    'document.view', 'document.upload',
    'skill.view',
    'report.view', 'report.export',
    'dashboard.view_full',
    'notification.manage'
  )
ON CONFLICT DO NOTHING;

-- Employee: Self-scoped minimal access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'employee'
  AND p.code IN (
    'employee.view',
    'leave.view', 'leave.apply',
    'attendance.view_own',
    'department.view',
    'document.view', 'document.upload',
    'skill.view',
    'notification.manage'
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATE EXISTING users.role_id → user_roles
-- =============================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, u.role_id
FROM users u
WHERE u.role_id IS NOT NULL
  AND u.deleted_at IS NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
