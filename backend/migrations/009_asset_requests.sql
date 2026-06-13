-- Migration: Asset Request Workflows
BEGIN;

-- 1. Create asset_requests table
CREATE TABLE IF NOT EXISTS asset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- 'laptop', 'mouse', 'monitor', 'id_card', 'access_card', 'software_license'
  reason TEXT,
  status VARCHAR(50) DEFAULT 'Pending Manager Approval', -- 'Pending Manager Approval', 'Pending HR Approval', 'Approved', 'Rejected'
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- manager who approved/rejected
  manager_comment TEXT,
  hr_comment TEXT,
  allocated_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indices for asset_requests
CREATE INDEX IF NOT EXISTS idx_asset_requests_employee ON asset_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_requests_status ON asset_requests(status);

-- 3. Add Permissions
INSERT INTO permissions (code, name, module, description) VALUES
  ('asset.request_apply', 'Apply for Asset', 'assets', 'Can request equipment/assets'),
  ('asset.request_approve', 'Approve Asset Requests', 'assets', 'Can approve team asset requests')
ON CONFLICT (code) DO NOTHING;

-- 4. Assign permissions to roles
-- admin & hr gets both
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('admin', 'hr')
  AND p.code IN ('asset.request_apply', 'asset.request_approve')
ON CONFLICT DO NOTHING;

-- manager gets both
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.code IN ('asset.request_apply', 'asset.request_approve')
ON CONFLICT DO NOTHING;

-- employee gets request_apply
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'employee'
  AND p.code = 'asset.request_apply'
ON CONFLICT DO NOTHING;

COMMIT;
