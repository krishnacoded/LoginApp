-- PeopleFlow Schema Extension: Attendance, Assets, View and Stored Procedure
BEGIN;

-- =============================================
-- ATTENDANCE SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_settings (
  id SERIAL PRIMARY KEY,
  office_start_time TIME NOT NULL DEFAULT '09:00:00',
  office_end_time TIME NOT NULL DEFAULT '18:00:00',
  full_day_threshold NUMERIC(4,2) NOT NULL DEFAULT 8.00,
  half_day_threshold NUMERIC(4,2) NOT NULL DEFAULT 4.00,
  late_arrival_threshold TIME NOT NULL DEFAULT '09:15:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO attendance_settings (id, office_start_time, office_end_time, full_day_threshold, half_day_threshold, late_arrival_threshold)
VALUES (1, '09:00:00', '18:00:00', 8.00, 4.00, '09:15:00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'absent', -- 'present', 'absent', 'late', 'half_day'
  work_hours NUMERIC(4,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- =============================================
-- ASSETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'laptop', 'mouse', 'monitor', 'id_card', 'access_card', 'software_license'
  status VARCHAR(30) DEFAULT 'available', -- 'available', 'allocated', 'returned', 'damaged', 'lost'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- =============================================
-- ASSET ALLOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS asset_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  allocated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allocations_asset ON asset_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON asset_allocations(employee_id);

-- =============================================
-- ASSET HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'allocate', 'return', 'status_change', 'damage_report', 'lost_report'
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset ON asset_history(asset_id);

-- =============================================
-- SEED INITIAL ASSETS
-- =============================================
INSERT INTO assets (id, name, serial_number, asset_type, status) VALUES
  ('44444444-4444-4444-4444-444444444001', 'MacBook Pro 16"', 'SN-MBP-98765', 'laptop', 'allocated'),
  ('44444444-4444-4444-4444-444444444002', 'Dell XPS 15', 'SN-XPS-12345', 'laptop', 'allocated'),
  ('44444444-4444-4444-4444-444444444003', 'Logitech MX Master 3S', 'SN-MXM-11223', 'mouse', 'allocated'),
  ('44444444-4444-4444-4444-444444444004', 'Dell UltraSharp 27"', 'SN-DS-44556', 'monitor', 'available'),
  ('44444444-4444-4444-4444-444444444005', 'PeopleFlow Standard ID Card', 'SN-ID-10004', 'id_card', 'allocated'),
  ('44444444-4444-4444-4444-444444444006', 'PeopleFlow Access Card', 'SN-AC-20004', 'access_card', 'allocated'),
  ('44444444-4444-4444-4444-444444444007', 'JetBrains All Products Pack', 'SN-JB-33445', 'software_license', 'available')
ON CONFLICT (serial_number) DO NOTHING;

-- Seed initial allocations
INSERT INTO asset_allocations (id, asset_id, employee_id, allocated_at, allocated_by, notes) VALUES
  ('55555555-5555-5555-5555-555555555101', '44444444-4444-4444-4444-444444444001', '77777777-7777-7777-7777-777777777004', NOW() - INTERVAL '30 days', '66666666-6666-6666-6666-666666666001', 'Assigned on onboarding'),
  ('55555555-5555-5555-5555-555555555102', '44444444-4444-4444-4444-444444444002', '77777777-7777-7777-7777-777777777005', NOW() - INTERVAL '20 days', '66666666-6666-6666-6666-666666666001', 'Work Laptop'),
  ('55555555-5555-5555-5555-555555555103', '44444444-4444-4444-4444-444444444003', '77777777-7777-7777-7777-777777777004', NOW() - INTERVAL '30 days', '66666666-6666-6666-6666-666666666001', 'MX Mouse'),
  ('55555555-5555-5555-5555-555555555104', '44444444-4444-4444-4444-444444444005', '77777777-7777-7777-7777-777777777004', NOW() - INTERVAL '30 days', '66666666-6666-6666-6666-666666666001', 'Official ID'),
  ('55555555-5555-5555-5555-555555555105', '44444444-4444-4444-4444-444444444006', '77777777-7777-7777-7777-777777777004', NOW() - INTERVAL '30 days', '66666666-6666-6666-6666-666666666001', 'Keycard access')
ON CONFLICT DO NOTHING;

-- Seed history
INSERT INTO asset_history (asset_id, employee_id, action, performed_by, notes) VALUES
  ('44444444-4444-4444-4444-444444444001', '77777777-7777-7777-7777-777777777004', 'allocate', '66666666-6666-6666-6666-666666666001', 'Allocated MacBook Pro to Amit Patel'),
  ('44444444-4444-4444-4444-444444444002', '77777777-7777-7777-7777-777777777005', 'allocate', '66666666-6666-6666-6666-666666666001', 'Allocated Dell XPS to Neha Jain'),
  ('44444444-4444-4444-4444-444444444003', '77777777-7777-7777-7777-777777777004', 'allocate', '66666666-6666-6666-6666-666666666001', 'Allocated mouse'),
  ('44444444-4444-4444-4444-444444444005', '77777777-7777-7777-7777-777777777004', 'allocate', '66666666-6666-6666-6666-666666666001', 'Allocated ID card'),
  ('44444444-4444-4444-4444-444444444006', '77777777-7777-7777-7777-777777777004', 'allocate', '66666666-6666-6666-6666-666666666001', 'Allocated access card')
ON CONFLICT DO NOTHING;

-- Seed initial attendance records for this month
-- Supposing today is June 11, 2026. Let's seed present/late records for June 1st to 10th for Amit (ISO0004) and Neha (ISO0005)
INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, work_hours) VALUES
  ('77777777-7777-7777-7777-777777777004', '2026-06-01', '2026-06-01 08:55:00+05:30', '2026-06-01 18:05:00+05:30', 'present', 9.17),
  ('77777777-7777-7777-7777-777777777004', '2026-06-02', '2026-06-02 09:20:00+05:30', '2026-06-02 18:00:00+05:30', 'late', 8.67),
  ('77777777-7777-7777-7777-777777777004', '2026-06-03', '2026-06-03 09:00:00+05:30', '2026-06-03 18:00:00+05:30', 'present', 9.00),
  ('77777777-7777-7777-7777-777777777004', '2026-06-04', '2026-06-04 09:05:00+05:30', '2026-06-04 13:10:00+05:30', 'half_day', 4.08),
  ('77777777-7777-7777-7777-777777777004', '2026-06-05', '2026-06-05 08:50:00+05:30', '2026-06-05 18:15:00+05:30', 'present', 9.42),
  
  ('77777777-7777-7777-7777-777777777005', '2026-06-01', '2026-06-01 08:58:00+05:30', '2026-06-01 18:02:00+05:30', 'present', 9.07),
  ('77777777-7777-7777-7777-777777777005', '2026-06-02', '2026-06-02 09:00:00+05:30', '2026-06-02 18:00:00+05:30', 'present', 9.00),
  ('77777777-7777-7777-7777-777777777005', '2026-06-03', '2026-06-03 09:25:00+05:30', '2026-06-03 18:30:00+05:30', 'late', 9.08),
  ('77777777-7777-7777-7777-777777777005', '2026-06-04', '2026-06-04 08:55:00+05:30', '2026-06-04 18:00:00+05:30', 'present', 9.08),
  ('77777777-7777-7777-7777-777777777005', '2026-06-05', '2026-06-05 08:50:00+05:30', '2026-06-05 12:30:00+05:30', 'half_day', 3.67) -- less than 4h in clock out status status changes to absent but let's test thresholds
ON CONFLICT DO NOTHING;

-- Update half day vs absent correctly
UPDATE attendance 
SET status = 'absent' 
WHERE work_hours < 4.00;

UPDATE attendance 
SET status = 'half_day' 
WHERE work_hours >= 4.00 AND work_hours < 8.00;

-- =============================================
-- VIEWS
-- =============================================
CREATE OR REPLACE VIEW employee_summary_view AS
SELECT 
  e.id,
  e.employee_code,
  e.first_name,
  e.last_name,
  e.designation,
  e.employment_type,
  e.employment_status,
  e.joining_date,
  u.email,
  d.name AS department_name,
  m.first_name || ' ' || m.last_name AS manager_name
FROM employees e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.deleted_at IS NULL;

-- =============================================
-- PROCEDURES
-- =============================================
CREATE OR REPLACE PROCEDURE calculate_leave_balance_proc(emp_id UUID, year_val INT) AS $$
DECLARE
  rec RECORD;
  used_days_count NUMERIC;
  pending_days_count NUMERIC;
  allocated_val NUMERIC;
BEGIN
  FOR rec IN SELECT id, leave_type_id, allocated_days FROM leave_balances WHERE employee_id = emp_id AND year = year_val LOOP
    -- approved leaves count
    SELECT COALESCE(SUM(total_days), 0) INTO used_days_count 
    FROM leave_requests 
    WHERE employee_id = emp_id AND leave_type_id = rec.leave_type_id AND EXTRACT(YEAR FROM start_date) = year_val AND status = 'approved';
    
    -- pending leaves count
    SELECT COALESCE(SUM(total_days), 0) INTO pending_days_count 
    FROM leave_requests 
    WHERE employee_id = emp_id AND leave_type_id = rec.leave_type_id AND EXTRACT(YEAR FROM start_date) = year_val AND status IN ('pending', 'manager_approved');
    
    -- update the leave balances record
    UPDATE leave_balances 
    SET used_days = used_days_count, pending_days = pending_days_count, updated_at = NOW() 
    WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
