const { query, getClient } = require('../config/database');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');

class EmployeeService {
  async getAll(filters = {}, req) {
    const { page, limit, offset } = getPaginationParams(filters);
    const conditions = ['e.deleted_at IS NULL'];
    const params = [];
    let paramIdx = 1;

    if (filters.search) {
      conditions.push(`(
        to_tsvector('english', e.first_name || ' ' || e.last_name) @@ plainto_tsquery('english', $${paramIdx})
        OR e.employee_code ILIKE $${paramIdx + 1}
        OR e.designation ILIKE $${paramIdx + 1}
        OR u.email ILIKE $${paramIdx + 1}
      )`);
      params.push(filters.search, `%${filters.search}%`);
      paramIdx += 2;
    }

    if (filters.department) {
      conditions.push(`e.department_id = $${paramIdx++}`);
      params.push(filters.department);
    }

    if (filters.status) {
      conditions.push(`e.employment_status = $${paramIdx++}`);
      params.push(filters.status);
    }

    if (filters.employmentType) {
      conditions.push(`e.employment_type = $${paramIdx++}`);
      params.push(filters.employmentType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortField = ['first_name', 'last_name', 'employee_code', 'joining_date', 'created_at']
      .includes(filters.sortBy) ? `e.${filters.sortBy}` : 'e.created_at';
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = await query(
      `SELECT COUNT(*) as total FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       ${whereClause}`,
      params
    );

    const dataQuery = await query(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.designation,
              e.employment_type, e.employment_status, e.joining_date, e.profile_picture_url,
              e.phone, e.gender,
              u.email, u.is_active as account_active, u.last_login,
              d.name as department_name, d.id as department_id,
              m.first_name as manager_first_name, m.last_name as manager_last_name,
              m.id as manager_id,
              ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees m ON e.manager_id = m.id
       LEFT JOIN employee_skills es ON es.employee_id = e.id
       LEFT JOIN skills s ON es.skill_id = s.id
       ${whereClause}
       GROUP BY e.id, u.email, u.is_active, u.last_login, d.name, d.id,
                m.first_name, m.last_name, m.id
       ORDER BY ${sortField} ${sortOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return {
      employees: dataQuery.rows,
      pagination: buildPaginationMeta(parseInt(countQuery.rows[0].total), page, limit),
    };
  }

  async getById(id) {
    const { rows } = await query(
      `SELECT e.*, u.email, u.is_active as account_active, u.last_login,
              r.name as role_name,
              d.name as department_name, d.code as department_code,
              m.first_name as manager_first_name, m.last_name as manager_last_name,
              m.employee_code as manager_code, m.id as manager_id,
              m.profile_picture_url as manager_picture
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id]
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'Employee not found' };

    const employee = rows[0];

    // Get skills
    const { rows: skills } = await query(
      `SELECT es.id, es.proficiency_level, es.years_experience, es.is_primary, es.certified,
              s.id as skill_id, s.name as skill_name,
              sc.name as category_name, sc.color as category_color
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       WHERE es.employee_id = $1`,
      [id]
    );

    // Get documents
    const { rows: documents } = await query(
      `SELECT id, document_type, document_name, file_name, file_size, mime_type,
              is_verified, expiry_date, created_at
       FROM documents
       WHERE employee_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [id]
    );

    // Get timeline
    const { rows: timeline } = await query(
      `SELECT et.*, u.email as performed_by_email,
              emp.first_name || ' ' || emp.last_name as performed_by_name
       FROM employee_timeline et
       LEFT JOIN users u ON et.performed_by = u.id
       LEFT JOIN employees emp ON emp.user_id = u.id
       WHERE et.employee_id = $1
       ORDER BY et.event_date DESC, et.created_at DESC
       LIMIT 20`,
      [id]
    );

    // Get leave balance summary
    const { rows: leaveBalances } = await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color, lt.code
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1 AND lb.year = $2 AND lt.is_active = TRUE`,
      [id, new Date().getFullYear()]
    );

    return { ...employee, skills, documents, timeline, leaveBalances };
  }

  async create(data, createdBy, req) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Generate employee code
      const { rows: codes } = await client.query(
        "SELECT employee_code FROM employees WHERE employee_code LIKE 'EMP%'"
      );
      let maxNum = 0;
      for (const row of codes) {
        const numPart = row.employee_code.substring(3);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      const empCode = `EMP${String(maxNum + 1).padStart(4, '0')}`;

      const { rows } = await client.query(
        `INSERT INTO employees (
          user_id, employee_code, first_name, last_name, date_of_birth, gender,
          phone, personal_email, address, emergency_contact,
          department_id, designation, employment_type, employment_status,
          joining_date, manager_id, salary, bio, linkedin_url, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING *`,
        [
          data.userId || null, empCode, data.firstName, data.lastName,
          data.dateOfBirth || null, data.gender || null,
          data.phone || null, data.personalEmail || null,
          JSON.stringify(data.address || {}), JSON.stringify(data.emergencyContact || {}),
          data.departmentId || null, data.designation || null,
          data.employmentType || 'full_time', data.employmentStatus || 'active',
          data.joiningDate || null, data.managerId || null,
          data.salary || null, data.bio || null, data.linkedinUrl || null,
          createdBy,
        ]
      );

      const employee = rows[0];

      // Add skills
      if (data.skills && data.skills.length > 0) {
        for (const skill of data.skills) {
          await client.query(
            `INSERT INTO employee_skills (employee_id, skill_id, proficiency_level, years_experience, is_primary)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (employee_id, skill_id) DO UPDATE
             SET proficiency_level = EXCLUDED.proficiency_level`,
            [employee.id, skill.skillId, skill.proficiencyLevel || 3, skill.yearsExperience || 0, skill.isPrimary || false]
          );
        }
      }

      // Create leave balances for current year
      const currentYear = new Date().getFullYear();
      const { rows: leaveTypes } = await client.query(
        'SELECT id, max_days_per_year FROM leave_types WHERE is_active = TRUE'
      );
      for (const lt of leaveTypes) {
        await client.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [employee.id, lt.id, currentYear, lt.max_days_per_year]
        );
      }

      // Add timeline event
      await client.query(
        `INSERT INTO employee_timeline (employee_id, event_type, title, description, event_date, performed_by)
         VALUES ($1, 'joined', 'Employee Onboarded', 'Employee profile created', $2, $3)`,
        [employee.id, data.joiningDate || new Date(), createdBy]
      );

      await client.query('COMMIT');

      // Send notifications to all other employees in the same department
      if (employee.department_id) {
        try {
          const { rows: dept } = await client.query('SELECT name FROM departments WHERE id = $1', [employee.department_id]);
          const deptName = dept[0]?.name || 'Department';
          const { rows: deptUsers } = await client.query(
            `SELECT user_id FROM employees
             WHERE department_id = $1 AND id != $2 AND user_id IS NOT NULL AND deleted_at IS NULL`,
            [employee.department_id, employee.id]
          );

          const title = 'New Team Member';
          const message = `${employee.first_name} ${employee.last_name} has joined the ${deptName} department as ${employee.designation || 'a team member'}.`;
          
          const notificationService = require('./notification.service');
          for (const deptUser of deptUsers) {
            await notificationService.create(
              deptUser.user_id,
              'new_employee',
              title,
              message,
              { employeeId: employee.id },
              `/employees/${employee.id}`
            );
          }
        } catch (err) {
          console.error('Error creating new team member notifications:', err);
        }
      }

      await auditLog(createdBy, 'CREATE_EMPLOYEE', 'employee', employee.id, null, employee, req);
      return employee;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, data, updatedBy, req) {
    const existing = await this.getById(id);

    const fields = [];
    const values = [];
    let idx = 1;

    const updateableFields = {
      firstName: 'first_name', lastName: 'last_name', dateOfBirth: 'date_of_birth',
      gender: 'gender', phone: 'phone', personalEmail: 'personal_email',
      address: 'address', emergencyContact: 'emergency_contact',
      departmentId: 'department_id', designation: 'designation',
      employmentType: 'employment_type', employmentStatus: 'employment_status',
      joiningDate: 'joining_date', managerId: 'manager_id',
      salary: 'salary', bio: 'bio', linkedinUrl: 'linkedin_url',
    };

    for (const [key, col] of Object.entries(updateableFields)) {
      if (data[key] !== undefined) {
        const val = (key === 'address' || key === 'emergencyContact')
          ? JSON.stringify(data[key])
          : data[key];
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const { rows } = await query(
      `UPDATE employees SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'Employee not found' };

    // Update skills if provided
    if (data.skills) {
      await query('DELETE FROM employee_skills WHERE employee_id = $1', [id]);
      for (const skill of data.skills) {
        await query(
          `INSERT INTO employee_skills (employee_id, skill_id, proficiency_level, years_experience, is_primary)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (employee_id, skill_id) DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level`,
          [id, skill.skillId, skill.proficiencyLevel || 3, skill.yearsExperience || 0, skill.isPrimary || false]
        );
      }
    }

    await auditLog(updatedBy, 'UPDATE_EMPLOYEE', 'employee', id, existing, rows[0], req);

    if (existing.user_id) {
      try {
        const isSelf = updatedBy === existing.user_id;
        const type = isSelf ? 'profile_updated' : 'employee_updated';
        const title = isSelf ? 'Profile Updated' : 'Employee Profile Updated';
        const message = isSelf 
          ? 'Your profile details have been updated successfully.'
          : 'Your employee profile has been updated by HR/Administrator.';
        await notificationService.create(existing.user_id, type, title, message, { employeeId: id }, `/employees/${id}`);
      } catch (err) {
        console.error('Error creating profile update notification:', err);
      }
    }

    return rows[0];
  }

  async delete(id, deletedBy, req) {
    const existing = await this.getById(id);
    await query(
      `UPDATE employees SET deleted_at = NOW(), employment_status = 'terminated', is_active = FALSE
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    await auditLog(deletedBy, 'DELETE_EMPLOYEE', 'employee', id, existing, null, req);
  }

  async restore(id, restoredBy, req) {
    const { rows } = await query(
      `UPDATE employees SET deleted_at = NULL, employment_status = 'active', is_active = TRUE
       WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [id]
    );
    if (rows.length === 0) throw { statusCode: 404, message: 'Employee not found' };
    await auditLog(restoredBy, 'RESTORE_EMPLOYEE', 'employee', id, null, rows[0], req);
    return rows[0];
  }

  async updateProfilePicture(id, filePath) {
    const url = `/uploads/${filePath.replace(/\\/g, '/').split('uploads/')[1]}`;
    await query('UPDATE employees SET profile_picture_url = $1 WHERE id = $2', [url, id]);
    return url;
  }

  async getDirectReports(managerId) {
    const { rows } = await query(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.designation,
              e.profile_picture_url, e.employment_status, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.manager_id = $1 AND e.deleted_at IS NULL`,
      [managerId]
    );
    return rows;
  }

  async getStats() {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
        COUNT(*) FILTER (WHERE employment_status = 'active' AND deleted_at IS NULL) as active,
        COUNT(*) FILTER (WHERE employment_status = 'on_leave' AND deleted_at IS NULL) as on_leave,
        COUNT(*) FILTER (WHERE employment_status = 'terminated' AND deleted_at IS NULL) as terminated,
        COUNT(*) FILTER (WHERE joining_date >= DATE_TRUNC('month', NOW()) AND deleted_at IS NULL) as new_this_month,
        COUNT(*) FILTER (WHERE joining_date >= DATE_TRUNC('year', NOW()) AND deleted_at IS NULL) as new_this_year
      FROM employees
    `);
    return rows[0];
  }
}

module.exports = new EmployeeService();