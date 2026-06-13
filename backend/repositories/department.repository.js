const { query } = require('../config/database');

const baseSelect = `
  SELECT d.*,
         head.first_name || ' ' || head.last_name as head_name,
         head.profile_picture_url as head_picture,
         parent.name as parent_department_name,
         COUNT(emp.id) FILTER (WHERE emp.deleted_at IS NULL AND emp.employment_status = 'active') as employee_count
  FROM departments d
  LEFT JOIN employees head ON d.head_employee_id = head.id
  LEFT JOIN departments parent ON d.parent_department_id = parent.id
  LEFT JOIN employees emp ON emp.department_id = d.id
`;

class DepartmentRepository {
  async findAll({ search, isActive, limit = 20, offset = 0 } = {}) {
    const conditions = ['d.deleted_at IS NULL'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(d.name ILIKE $${idx} OR d.code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (isActive !== undefined) {
      conditions.push(`d.is_active = $${idx++}`);
      params.push(isActive === true || isActive === 'true');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const count = await query(`SELECT COUNT(*) as total FROM departments d ${where}`, params);
    const data = await query(
      `${baseSelect}
       ${where}
       GROUP BY d.id, head.first_name, head.last_name, head.profile_picture_url, parent.name
       ORDER BY d.name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { rows: data.rows, total: parseInt(count.rows[0].total, 10) };
  }

  async findById(id) {
    const { rows } = await query(
      `${baseSelect}
       WHERE d.id = $1 AND d.deleted_at IS NULL
       GROUP BY d.id, head.first_name, head.last_name, head.profile_picture_url, parent.name`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { rows } = await query(
      `INSERT INTO departments (name, code, description, head_employee_id, budget, location, parent_department_id, goals, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.name,
        data.code.toUpperCase(),
        data.description || null,
        data.headEmployeeId || null,
        data.budget || null,
        data.location || null,
        data.parentDepartmentId || null,
        data.goals || null,
        data.contactPhone || null,
        data.contactEmail || null,
      ]
    );
    return rows[0];
  }

  async update(id, fields, values) {
    const { rows } = await query(
      `UPDATE departments SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async softDelete(id) {
    await query('UPDATE departments SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [id]);
  }
}

module.exports = new DepartmentRepository();
