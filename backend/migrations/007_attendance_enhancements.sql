-- PeopleFlow Schema Extension: Shifts, Breaks, Regularizations, Geofencing, Holidays
BEGIN;

-- =============================================
-- PUBLIC HOLIDAYS CALENDAR
-- =============================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  date DATE NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHIFT CONFIGURATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'fixed', -- 'fixed', 'flexible', 'rotational', 'night'
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  flexible_start_range TIME, -- e.g. '08:00:00'
  flexible_end_range TIME,   -- e.g. '11:00:00'
  grace_time_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMPLOYEE SHIFT ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means ongoing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_emp ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_dates ON employee_shifts(start_date, end_date);

-- =============================================
-- BREAK LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  break_type VARCHAR(50) NOT NULL DEFAULT 'lunch', -- 'lunch', 'tea', 'personal', 'meeting', 'custom'
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breaks_attendance ON attendance_breaks(attendance_id);

-- =============================================
-- REGULARIZATION REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_regularizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_type VARCHAR(50) NOT NULL, -- 'missed_clock_in', 'missed_clock_out', 'incorrect_hours', 'missed_all'
  requested_clock_in TIMESTAMPTZ,
  requested_clock_out TIMESTAMPTZ,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  manager_id UUID REFERENCES employees(id),
  manager_approved_at TIMESTAMPTZ,
  manager_remarks TEXT,
  hr_id UUID REFERENCES users(id),
  hr_approved_at TIMESTAMPTZ,
  hr_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regularizations_emp ON attendance_regularizations(employee_id);
CREATE INDEX IF NOT EXISTS idx_regularizations_manager ON attendance_regularizations(manager_id);

-- =============================================
-- ATTENDANCE TABLE EXTENSION
-- =============================================
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id),
  ADD COLUMN IF NOT EXISTS check_in_latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS check_in_longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS check_in_address TEXT,
  ADD COLUMN IF NOT EXISTS check_out_latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS check_out_longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS check_out_address TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB,
  ADD COLUMN IF NOT EXISTS is_wfh BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(4,2) DEFAULT 0.00;

-- =============================================
-- SETTINGS TABLE EXTENSION
-- =============================================
ALTER TABLE attendance_settings 
  ADD COLUMN IF NOT EXISTS geofencing_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS geofence_latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geofence_longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS device_tracking_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overtime_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overtime_threshold_hours NUMERIC(4,2) DEFAULT 9.00,
  ADD COLUMN IF NOT EXISTS early_departure_threshold_time TIME DEFAULT '17:00:00';

-- =============================================
-- SEED DEFAULT SHIFTS
-- =============================================
INSERT INTO shifts (id, name, type, start_time, end_time, flexible_start_range, flexible_end_range, grace_time_minutes)
VALUES
  ('33333333-3333-3333-3333-333333333001', 'General Shift', 'fixed', '09:00:00', '18:00:00', NULL, NULL, 15),
  ('33333333-3333-3333-3333-333333333002', 'Flexible Morning Shift', 'flexible', '08:00:00', '17:00:00', '08:00:00', '11:00:00', 0),
  ('33333333-3333-3333-3333-333333333003', 'Night Shift', 'night', '22:00:00', '06:00:00', NULL, NULL, 15)
ON CONFLICT (id) DO NOTHING;

-- Seed default General Shift for existing employees as starting General Shift
-- Seed employee general shift assignments for existing employees
INSERT INTO employee_shifts (employee_id, shift_id, start_date)
SELECT id, '33333333-3333-3333-3333-333333333001', '2026-01-01'
FROM employees
WHERE deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Seed some sample holidays
INSERT INTO holidays (name, date, description) VALUES
  ('New Year''s Day', '2026-01-01', 'First day of the new year'),
  ('Republic Day', '2026-01-26', 'Republic day celebrations'),
  ('Independence Day', '2026-08-15', 'National Independence Day'),
  ('Gandhi Jayanti', '2026-10-02', 'Mahatma Gandhi birthday'),
  ('Christmas Day', '2026-12-25', 'Christmas celebration')
ON CONFLICT (date) DO NOTHING;

-- =============================================
-- SEED NEW PERMISSIONS FOR SHIFTS AND REGULARIZATIONS
-- =============================================
INSERT INTO permissions (code, name, module, description) VALUES
  ('shift.view', 'View Shift Policies', 'attendance', 'Can view shifts and employee shift schedules'),
  ('shift.manage', 'Manage Shifts & Schedules', 'attendance', 'Can create, edit shifts and assign shifts to employees'),
  ('attendance.regularize_apply', 'Apply for Regularization', 'attendance', 'Can request correction on own attendance logs'),
  ('attendance.regularize_approve', 'Approve Regularization', 'attendance', 'Can review and approve/reject team regularization requests'),
  ('holiday.manage', 'Manage Holiday Calendar', 'attendance', 'Can add, edit and delete public holidays')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to System Roles (admin and hr)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('admin', 'hr')
  AND p.code IN ('shift.view', 'shift.manage', 'attendance.regularize_apply', 'attendance.regularize_approve', 'holiday.manage')
ON CONFLICT DO NOTHING;

-- Map to Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
  AND p.code IN ('shift.view', 'attendance.regularize_apply', 'attendance.regularize_approve')
ON CONFLICT DO NOTHING;

-- Map to Employee role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'employee'
  AND p.code IN ('attendance.regularize_apply')
ON CONFLICT DO NOTHING;

COMMIT;
