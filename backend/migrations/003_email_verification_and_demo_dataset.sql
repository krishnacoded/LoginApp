BEGIN;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(token_hash);

INSERT INTO departments (id, name, code, description, location) VALUES
  ('55555555-5555-5555-5555-555555555001', 'Software Development', 'SOFTDEV', 'Application engineering and delivery', 'Indore'),
  ('55555555-5555-5555-5555-555555555002', 'Quality Assurance', 'QA', 'Testing, release validation, and quality control', 'Indore'),
  ('55555555-5555-5555-5555-555555555003', 'Digital Marketing', 'DMKT', 'Digital campaigns and growth marketing', 'Indore'),
  ('55555555-5555-5555-5555-555555555004', 'Technical Support', 'TSUP', 'Customer support and technical operations', 'Indore')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (id, email, password_hash, role_id, is_active, is_email_verified) VALUES
  ('66666666-6666-6666-6666-666666666001', 'pranay@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'admin'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666002', 'rahul@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'manager'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666003', 'priya@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'hr'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666004', 'amit@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666005', 'neha@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666006', 'rohit@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666007', 'anjali@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666008', 'vikas@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666009', 'pooja@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE),
  ('66666666-6666-6666-6666-666666666010', 'sandeep@isoftzone.com', '$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm', (SELECT id FROM roles WHERE name = 'employee'), TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (
  id, user_id, employee_code, first_name, last_name, phone, personal_email,
  address, department_id, designation, salary, joining_date, manager_id,
  employment_status, employment_type, gender
) VALUES
  ('77777777-7777-7777-7777-777777777001', '66666666-6666-6666-6666-666666666001', 'ISO0001', 'Pranay', 'Gupta', '9876543210', 'pranay@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555001', 'Director', 150000, '2020-01-15', NULL, 'active', 'full_time', 'male'),
  ('77777777-7777-7777-7777-777777777002', '66666666-6666-6666-6666-666666666002', 'ISO0002', 'Rahul', 'Sharma', '9876543211', 'rahul@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555001', 'Project Manager', 85000, '2021-04-01', '77777777-7777-7777-7777-777777777001', 'active', 'full_time', 'male'),
  ('77777777-7777-7777-7777-777777777003', '66666666-6666-6666-6666-666666666003', 'ISO0003', 'Priya', 'Verma', '9876543212', 'priya@isoftzone.com', '{"city":"Indore","country":"India"}', '22222222-2222-2222-2222-222222222002', 'HR Manager', 70000, '2021-09-10', '77777777-7777-7777-7777-777777777001', 'active', 'full_time', 'female'),
  ('77777777-7777-7777-7777-777777777004', '66666666-6666-6666-6666-666666666004', 'ISO0004', 'Amit', 'Patel', '9876543213', 'amit@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555001', 'React Developer', 45000, '2024-02-12', '77777777-7777-7777-7777-777777777002', 'active', 'full_time', 'male'),
  ('77777777-7777-7777-7777-777777777005', '66666666-6666-6666-6666-666666666005', 'ISO0005', 'Neha', 'Jain', '9876543214', 'neha@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555001', 'Node Developer', 50000, '2024-03-18', '77777777-7777-7777-7777-777777777002', 'active', 'full_time', 'female'),
  ('77777777-7777-7777-7777-777777777006', '66666666-6666-6666-6666-666666666006', 'ISO0006', 'Rohit', 'Singh', '9876543215', 'rohit@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555002', 'QA Engineer', 40000, '2024-08-05', '77777777-7777-7777-7777-777777777002', 'active', 'full_time', 'male'),
  ('77777777-7777-7777-7777-777777777007', '66666666-6666-6666-6666-666666666007', 'ISO0007', 'Anjali', 'Gupta', '9876543216', 'anjali@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555003', 'Marketing Executive', 35000, '2025-01-20', '77777777-7777-7777-7777-777777777003', 'active', 'full_time', 'female'),
  ('77777777-7777-7777-7777-777777777008', '66666666-6666-6666-6666-666666666008', 'ISO0008', 'Vikas', 'Mehta', '9876543217', 'vikas@isoftzone.com', '{"city":"Indore","country":"India"}', '22222222-2222-2222-2222-222222222004', 'Sales Executive', 38000, '2025-02-11', '77777777-7777-7777-7777-777777777002', 'active', 'full_time', 'male'),
  ('77777777-7777-7777-7777-777777777009', '66666666-6666-6666-6666-666666666009', 'ISO0009', 'Pooja', 'Shah', '9876543218', 'pooja@isoftzone.com', '{"city":"Indore","country":"India"}', '55555555-5555-5555-5555-555555555004', 'Support Engineer', 32000, '2025-05-15', '77777777-7777-7777-7777-777777777002', 'active', 'full_time', 'female'),
  ('77777777-7777-7777-7777-777777777010', '66666666-6666-6666-6666-666666666010', 'ISO0010', 'Sandeep', 'Kumar', '9876543219', 'sandeep@isoftzone.com', '{"city":"Indore","country":"India"}', '22222222-2222-2222-2222-222222222005', 'Accountant', 42000, '2025-07-01', '77777777-7777-7777-7777-777777777003', 'active', 'full_time', 'male')
ON CONFLICT (employee_code) DO NOTHING;

INSERT INTO skills (name, category_id, description) VALUES
  ('React', '11111111-1111-1111-1111-111111111001', 'React frontend development'),
  ('NodeJS', '11111111-1111-1111-1111-111111111001', 'Node.js backend development'),
  ('HTML', '11111111-1111-1111-1111-111111111001', 'Semantic HTML'),
  ('CSS', '11111111-1111-1111-1111-111111111001', 'Responsive CSS'),
  ('Testing', '11111111-1111-1111-1111-111111111001', 'Manual and automated testing'),
  ('Salesforce', '11111111-1111-1111-1111-111111111004', 'Salesforce CRM')
ON CONFLICT DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, proficiency_level, years_experience, is_primary)
SELECT seed.employee_id, s.id, seed.proficiency_level, seed.years_experience, seed.is_primary
FROM (VALUES
  ('77777777-7777-7777-7777-777777777004'::uuid, 'React', 4, 2.5, TRUE),
  ('77777777-7777-7777-7777-777777777004'::uuid, 'JavaScript', 4, 3.0, FALSE),
  ('77777777-7777-7777-7777-777777777004'::uuid, 'HTML', 4, 3.0, FALSE),
  ('77777777-7777-7777-7777-777777777005'::uuid, 'NodeJS', 4, 3.0, TRUE),
  ('77777777-7777-7777-7777-777777777005'::uuid, 'PostgreSQL', 3, 2.0, FALSE),
  ('77777777-7777-7777-7777-777777777005'::uuid, 'JavaScript', 4, 3.0, FALSE),
  ('77777777-7777-7777-7777-777777777006'::uuid, 'Testing', 4, 4.0, TRUE),
  ('77777777-7777-7777-7777-777777777007'::uuid, 'JavaScript', 3, 1.5, FALSE),
  ('77777777-7777-7777-7777-777777777008'::uuid, 'Salesforce', 3, 2.0, TRUE),
  ('77777777-7777-7777-7777-777777777009'::uuid, 'NodeJS', 3, 1.5, FALSE),
  ('77777777-7777-7777-7777-777777777009'::uuid, 'PostgreSQL', 3, 1.0, FALSE),
  ('77777777-7777-7777-7777-777777777010'::uuid, 'Python', 3, 2.0, FALSE)
) AS seed(employee_id, skill_name, proficiency_level, years_experience, is_primary)
JOIN skills s ON s.name = seed.skill_name
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, pending_days)
SELECT e.id, lt.id, EXTRACT(YEAR FROM NOW())::INTEGER, lt.max_days_per_year,
       CASE WHEN e.employee_code IN ('ISO0004', 'ISO0006') AND lt.code = 'CL' THEN 2 ELSE 0 END,
       CASE WHEN e.employee_code IN ('ISO0005', 'ISO0007') AND lt.code IN ('SL', 'CL') THEN 2 ELSE 0 END
FROM employees e
CROSS JOIN leave_types lt
WHERE e.employee_code LIKE 'ISO%' AND lt.is_active = TRUE
ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE
SET used_days = EXCLUDED.used_days,
    pending_days = EXCLUDED.pending_days;

INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, created_at) VALUES
  ('88888888-8888-8888-8888-888888888001', '77777777-7777-7777-7777-777777777004', (SELECT id FROM leave_types WHERE code = 'CL'), '2026-06-01', '2026-06-03', 3, 'Family function', 'approved', '2026-05-25'),
  ('88888888-8888-8888-8888-888888888002', '77777777-7777-7777-7777-777777777005', (SELECT id FROM leave_types WHERE code = 'SL'), '2026-06-10', '2026-06-11', 2, 'Fever', 'pending', '2026-06-08'),
  ('88888888-8888-8888-8888-888888888003', '77777777-7777-7777-7777-777777777006', (SELECT id FROM leave_types WHERE code = 'CL'), '2026-05-20', '2026-05-21', 2, 'Personal work', 'approved', '2026-05-15'),
  ('88888888-8888-8888-8888-888888888004', '77777777-7777-7777-7777-777777777007', (SELECT id FROM leave_types WHERE code = 'CL'), '2026-06-15', '2026-06-17', 3, 'Travel', 'pending', '2026-06-09'),
  ('88888888-8888-8888-8888-888888888005', '77777777-7777-7777-7777-777777777008', (SELECT id FROM leave_types WHERE code = 'SL'), '2026-06-18', '2026-06-20', 3, 'Medical', 'rejected', '2026-06-07')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_approvals (leave_request_id, approver_id, approver_role, stage, action, comment, actioned_at) VALUES
  ('88888888-8888-8888-8888-888888888001', '66666666-6666-6666-6666-666666666002', 'manager', 1, 'approved', 'Manager approved', '2026-05-26'),
  ('88888888-8888-8888-8888-888888888001', '66666666-6666-6666-6666-666666666003', 'hr', 2, 'approved', 'HR approved', '2026-05-27'),
  ('88888888-8888-8888-8888-888888888003', '66666666-6666-6666-6666-666666666002', 'manager', 1, 'approved', 'Manager approved', '2026-05-16'),
  ('88888888-8888-8888-8888-888888888003', '66666666-6666-6666-6666-666666666003', 'hr', 2, 'approved', 'HR approved', '2026-05-17'),
  ('88888888-8888-8888-8888-888888888005', '66666666-6666-6666-6666-666666666002', 'manager', 1, 'rejected', 'Insufficient reason', '2026-06-08')
ON CONFLICT DO NOTHING;

INSERT INTO employee_timeline (employee_id, event_type, title, description, event_date, performed_by)
SELECT e.id, 'joined', 'Employee onboarded', 'Imported from i-SOFTZONE demo dataset', e.joining_date, e.user_id
FROM employees e
WHERE e.employee_code LIKE 'ISO%'
ON CONFLICT DO NOTHING;

COMMIT;
