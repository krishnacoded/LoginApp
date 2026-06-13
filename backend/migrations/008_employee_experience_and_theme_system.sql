-- Employee Experience & Theme System Database Migration
BEGIN;

-- 1. Add theme to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'Midnight Executive';

-- 2. Add verification columns to employee_skills
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending Verification';
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS proof_url VARCHAR(500);
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Mark existing skills as Verified since they are pre-existing
UPDATE employee_skills SET status = 'Verified' WHERE status IS NULL OR status = 'Pending Verification';
-- Change default for new records to Pending Verification
ALTER TABLE employee_skills ALTER COLUMN status SET DEFAULT 'Pending Verification';

-- 3. Create employee_certifications table
CREATE TABLE IF NOT EXISTS employee_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  issuing_organization VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(100),
  credential_url VARCHAR(500),
  status VARCHAR(30) DEFAULT 'Pending Verification',
  proof_url VARCHAR(500),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create employee_education table
CREATE TABLE IF NOT EXISTS employee_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  institution VARCHAR(200) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  field_of_study VARCHAR(100),
  start_date DATE,
  end_date DATE,
  grade VARCHAR(20),
  status VARCHAR(30) DEFAULT 'Pending Verification',
  proof_url VARCHAR(500),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create employee_licenses table
CREATE TABLE IF NOT EXISTS employee_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  license_number VARCHAR(100),
  issuing_state VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(30) DEFAULT 'Pending Verification',
  proof_url VARCHAR(500),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add Goals and Contact Info to departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

COMMIT;
