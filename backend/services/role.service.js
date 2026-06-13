const { query, getClient } = require('../config/database');
const { auditLog } = require('../middleware/audit');

class RoleService {
  /**
   * List all roles with permission count
   */
  async getAll() {
    const { rows } = await query(
      `SELECT r.id, r.name, r.description, r.is_system, r.is_custom, r.created_at, r.updated_at,
              (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) as permission_count,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count
       FROM roles r
       ORDER BY r.is_system DESC, r.name ASC`
    );
    return rows;
  }

  /**
   * Get a single role with its full permission list
   */
  async getById(roleId) {
    const { rows: roleRows } = await query(
      `SELECT r.id, r.name, r.description, r.permissions, r.is_system, r.is_custom, r.created_at, r.updated_at
       FROM roles r WHERE r.id = $1`,
      [roleId]
    );

    if (roleRows.length === 0) {
      throw { statusCode: 404, message: 'Role not found' };
    }

    const role = roleRows[0];

    // Load assigned permissions
    const { rows: permRows } = await query(
      `SELECT p.id, p.code, p.name, p.module, p.description
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.module, p.code`,
      [roleId]
    );

    role.assignedPermissions = permRows;

    // Load user count
    const { rows: countRows } = await query(
      'SELECT COUNT(*) as user_count FROM user_roles WHERE role_id = $1',
      [roleId]
    );
    role.userCount = parseInt(countRows[0].user_count, 10);

    return role;
  }

  /**
   * Create a custom role with permissions
   */
  async create(data, performedByUserId, req) {
    const { name, description, permissionIds } = data;

    // Check uniqueness
    const { rows: existing } = await query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    if (existing.length > 0) {
      throw { statusCode: 409, message: `Role with name '${name}' already exists` };
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create the role
      const { rows } = await client.query(
        `INSERT INTO roles (name, description, permissions, is_system, is_custom)
         VALUES ($1, $2, '[]'::jsonb, FALSE, TRUE)
         RETURNING id, name, description, is_system, is_custom, created_at`,
        [name.trim(), description?.trim() || null]
      );
      const role = rows[0];

      // Assign permissions
      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map((pid, i) => `($1, $${i + 2})`).join(', ');
        const params = [role.id, ...permissionIds];
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          params
        );
      }

      await client.query('COMMIT');

      await auditLog(performedByUserId, 'CREATE_ROLE', 'roles', role.id, null, { name, description, permissionIds }, req);

      return await this.getById(role.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a role's name, description, and/or permissions
   */
  async update(roleId, data, performedByUserId, req) {
    const existing = await this.getById(roleId);

    // Prevent renaming system roles
    if (existing.is_system && data.name && data.name !== existing.name) {
      throw { statusCode: 403, message: 'Cannot rename system roles' };
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update role fields
      if (data.name || data.description !== undefined) {
        await client.query(
          `UPDATE roles SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            updated_at = NOW()
           WHERE id = $3`,
          [data.name?.trim() || null, data.description?.trim(), roleId]
        );
      }

      // Update permissions if provided
      if (data.permissionIds) {
        // Remove old permissions
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

        // Insert new permissions
        if (data.permissionIds.length > 0) {
          const values = data.permissionIds.map((pid, i) => `($1, $${i + 2})`).join(', ');
          const params = [roleId, ...data.permissionIds];
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            params
          );
        }
      }

      await client.query('COMMIT');

      const oldPerms = existing.assignedPermissions.map(p => p.code);
      await auditLog(
        performedByUserId, 'UPDATE_ROLE', 'roles', roleId,
        { name: existing.name, permissions: oldPerms },
        { name: data.name || existing.name, permissionIds: data.permissionIds },
        req
      );

      return await this.getById(roleId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a custom role — moves affected users to the 'employee' role
   */
  async delete(roleId, performedByUserId, req) {
    const existing = await this.getById(roleId);

    if (existing.is_system) {
      throw { statusCode: 403, message: 'Cannot delete system roles' };
    }

    // Get the employee role ID for reassignment
    const { rows: empRole } = await query("SELECT id FROM roles WHERE name = 'employee'");
    if (empRole.length === 0) {
      throw { statusCode: 500, message: 'Default employee role not found' };
    }
    const employeeRoleId = empRole[0].id;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Move affected users in user_roles to employee role
      const { rows: affectedUsers } = await client.query(
        'SELECT user_id FROM user_roles WHERE role_id = $1',
        [roleId]
      );

      if (affectedUsers.length > 0) {
        // Remove the old role assignment
        await client.query('DELETE FROM user_roles WHERE role_id = $1', [roleId]);

        // Assign employee role to users who no longer have any role
        for (const { user_id } of affectedUsers) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user_id, employeeRoleId]
          );
          // Also update legacy role_id
          await client.query(
            'UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2',
            [employeeRoleId, user_id]
          );
        }
      }

      // Delete role_permissions
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      // Delete the role
      await client.query('DELETE FROM roles WHERE id = $1', [roleId]);

      await client.query('COMMIT');

      await auditLog(
        performedByUserId, 'DELETE_ROLE', 'roles', roleId,
        { name: existing.name, userCount: existing.userCount },
        { reassignedTo: 'employee', affectedUsers: affectedUsers.length },
        req
      );

      return { deleted: true, affectedUsers: affectedUsers.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all available permissions grouped by module
   */
  async getAllPermissions() {
    const { rows } = await query(
      'SELECT id, code, name, module, description FROM permissions ORDER BY module, code'
    );

    // Group by module
    const grouped = {};
    for (const perm of rows) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return { permissions: rows, grouped };
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId, roleId, performedByUserId, req) {
    // Verify user exists
    const { rows: userRows } = await query(
      'SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (userRows.length === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Verify role exists
    const { rows: roleRows } = await query('SELECT id, name FROM roles WHERE id = $1', [roleId]);
    if (roleRows.length === 0) {
      throw { statusCode: 404, message: 'Role not found' };
    }

    await query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, role_id) DO NOTHING',
      [userId, roleId, performedByUserId]
    );

    await auditLog(
      performedByUserId, 'ROLE_ASSIGN', 'user_roles', userId,
      null,
      { userId, roleId, roleName: roleRows[0].name },
      req
    );

    return { success: true, role: roleRows[0].name };
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId, roleId, performedByUserId, req) {
    // Verify user exists
    const { rows: userRows } = await query(
      'SELECT id, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (userRows.length === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Verify the user has this role
    const { rows: urRows } = await query(
      'SELECT role_id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    if (urRows.length === 0) {
      throw { statusCode: 400, message: 'User does not have this role' };
    }

    // Prevent removing last role
    const { rows: countRows } = await query(
      'SELECT COUNT(*) as cnt FROM user_roles WHERE user_id = $1',
      [userId]
    );
    if (parseInt(countRows[0].cnt, 10) <= 1) {
      throw { statusCode: 400, message: 'Cannot remove the last role from a user. Assign another role first.' };
    }

    const { rows: roleRows } = await query('SELECT name FROM roles WHERE id = $1', [roleId]);

    await query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);

    await auditLog(
      performedByUserId, 'ROLE_REMOVE', 'user_roles', userId,
      { roleId, roleName: roleRows[0]?.name },
      null,
      req
    );

    return { success: true, removedRole: roleRows[0]?.name };
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId) {
    const { rows: userRows } = await query(
      'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (userRows.length === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const { rows } = await query(
      `SELECT r.id, r.name, r.description, r.is_system, r.is_custom, ur.assigned_at,
              u2.email as assigned_by_email
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN users u2 ON ur.assigned_by = u2.id
       WHERE ur.user_id = $1
       ORDER BY ur.assigned_at`,
      [userId]
    );

    return rows;
  }
}

module.exports = new RoleService();
