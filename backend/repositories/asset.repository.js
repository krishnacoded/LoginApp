const { query } = require('../config/database');

class AssetRepository {
  async create(data) {
    const { rows } = await query(
      `INSERT INTO assets (name, serial_number, asset_type, status)
       VALUES ($1, $2, $3, 'available')
       RETURNING *`,
      [data.name, data.serialNumber, data.assetType]
    );
    return rows[0];
  }

  async findById(id) {
    const { rows } = await query('SELECT * FROM assets WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findBySerialNumber(serialNumber) {
    const { rows } = await query('SELECT * FROM assets WHERE serial_number = $1', [serialNumber]);
    return rows[0] || null;
  }

  async findAll(filters = {}, pagination = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(name ILIKE $${idx} OR serial_number ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.assetType) {
      conditions.push(`asset_type = $${idx++}`);
      params.push(filters.assetType);
    }
    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM assets ${where}`, params);

    const { limit, offset } = pagination;
    const { rows } = await query(
      `SELECT a.*, 
              al.employee_id, al.allocated_at,
              e.first_name || ' ' || e.last_name as allocated_to_name,
              e.employee_code as allocated_to_code
       FROM assets a
       LEFT JOIN asset_allocations al ON al.asset_id = a.id AND al.returned_at IS NULL
       LEFT JOIN employees e ON al.employee_id = e.id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  }

  async updateStatus(id, status) {
    const { rows } = await query(
      'UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return rows[0];
  }

  async getActiveAllocation(assetId) {
    const { rows } = await query(
      'SELECT * FROM asset_allocations WHERE asset_id = $1 AND returned_at IS NULL',
      [assetId]
    );
    return rows[0] || null;
  }

  async createAllocation(data) {
    const { rows } = await query(
      `INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.assetId, data.employeeId, data.allocatedBy, data.notes]
    );
    return rows[0];
  }

  async returnAllocation(id, notes) {
    const { rows } = await query(
      `UPDATE asset_allocations
       SET returned_at = NOW(), notes = COALESCE($1, notes)
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );
    return rows[0];
  }

  async createHistory(data) {
    const { rows } = await query(
      `INSERT INTO asset_history (asset_id, employee_id, action, performed_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.assetId, data.employeeId || null, data.action, data.performedBy, data.notes]
    );
    return rows[0];
  }

  async getHistory(assetId) {
    const { rows } = await query(
      `SELECT h.*, u.email as performed_by_email,
              e.first_name || ' ' || e.last_name as employee_name,
              e.employee_code
       FROM asset_history h
       LEFT JOIN users u ON h.performed_by = u.id
       LEFT JOIN employees e ON h.employee_id = e.id
       WHERE h.asset_id = $1
       ORDER BY h.created_at DESC`,
      [assetId]
    );
    return rows;
  }

  async getEmployeeAllocations(employeeId) {
    const { rows } = await query(
      `SELECT al.*, a.name as asset_name, a.serial_number, a.asset_type, a.status as asset_status
       FROM asset_allocations al
       JOIN assets a ON al.asset_id = a.id
       WHERE al.employee_id = $1 AND al.returned_at IS NULL
       ORDER BY al.allocated_at DESC`,
      [employeeId]
    );
    return rows;
  }
}

module.exports = new AssetRepository();
