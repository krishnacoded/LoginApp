const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/database');
const ApiResponse = require('../utils/response');

/**
 * Authentication middleware.
 * Verifies JWT, loads user with ALL assigned roles and RESOLVED permissions
 * from the normalized permission tables (user_roles → role_permissions → permissions).
 *
 * Populates req.user with:
 *   id, email, is_active, role_id (legacy), role_name (primary),
 *   employee_id, roles[], resolvedPermissions[], permissions (legacy JSONB)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Load user with primary role (backward compat) and employee_id
    const { rows } = await query(
      `SELECT u.id, u.email, u.is_active, u.role_id, r.name as role_name, r.permissions,
              e.id as employee_id, e.department_id, u.theme
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.sub]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }

    const user = rows[0];

    // Load ALL assigned roles via user_roles junction table
    const { rows: roleRows } = await query(
      `SELECT r.id, r.name, r.permissions
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    // If user_roles has entries, use them; otherwise fall back to legacy role_id
    let roles = [];
    let resolvedPermissions = [];

    if (roleRows.length > 0) {
      roles = roleRows.map(r => r.name);

      // Check if any role has the 'all' shortcut (admin)
      const hasAll = roleRows.some(r => {
        const perms = r.permissions || [];
        return perms.includes('all');
      });

      if (hasAll) {
        resolvedPermissions = ['all'];
      } else {
        // Load granular permissions from normalized tables
        const { rows: permRows } = await query(
          `SELECT DISTINCT p.code
           FROM user_roles ur
           JOIN role_permissions rp ON rp.role_id = ur.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE ur.user_id = $1`,
          [user.id]
        );
        resolvedPermissions = permRows.map(r => r.code);
      }
    } else {
      // Fallback: legacy single role_id
      roles = user.role_name ? [user.role_name] : [];
      const legacyPerms = user.permissions || [];
      if (legacyPerms.includes('all')) {
        resolvedPermissions = ['all'];
      } else {
        // Try loading from role_permissions for the legacy role
        if (user.role_id) {
          const { rows: permRows } = await query(
            `SELECT DISTINCT p.code
             FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = $1`,
            [user.role_id]
          );
          resolvedPermissions = permRows.length > 0
            ? permRows.map(r => r.code)
            : legacyPerms; // absolute fallback to JSONB
        } else {
          resolvedPermissions = legacyPerms;
        }
      }
    }

    req.user = {
      ...user,
      roles,                    // string[] — all assigned role names
      resolvedPermissions,      // string[] — union of all permission codes
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid access token');
    }
    next(error);
  }
};

/**
 * LEGACY role-name authorization — kept for backward compatibility.
 * Prefer requirePermission() for new code.
 *
 * Usage: authorize('admin', 'hr', 'manager')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const permissions = req.user.resolvedPermissions || req.user.permissions || [];
    const hasAll = permissions.includes('all');

    // Check if ANY of the user's roles matches the allowed list
    const userRoles = req.user.roles || [req.user.role_name];
    const hasRole = userRoles.some(r => roles.includes(r));

    if (!hasAll && !hasRole) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Permission-based authorization — checks if user has ANY of the listed permissions.
 *
 * Usage: requirePermission('employee.create', 'employee.edit')
 *        → user needs at least ONE of these permissions
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const userPerms = req.user.resolvedPermissions || req.user.permissions || [];

    // 'all' shortcut (admin)
    if (userPerms.includes('all')) {
      return next();
    }

    const hasAny = permissions.some(p => userPerms.includes(p));
    if (!hasAny) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Permission-based authorization — checks if user has ALL of the listed permissions.
 *
 * Usage: requireAllPermissions('employee.view', 'employee.view_sensitive')
 *        → user needs BOTH permissions
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const userPerms = req.user.resolvedPermissions || req.user.permissions || [];

    if (userPerms.includes('all')) {
      return next();
    }

    const hasAll = permissions.every(p => userPerms.includes(p));
    if (!hasAll) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Optional authentication — populates req.user if a valid token is present,
 * but does NOT reject the request if absent.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const { rows } = await query(
      `SELECT u.id, u.email, u.is_active, u.role_id, r.name as role_name, r.permissions,
              e.id as employee_id, e.department_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.sub]
    );

    if (rows.length > 0 && rows[0].is_active) {
      const user = rows[0];

      // Load roles + permissions
      const { rows: roleRows } = await query(
        `SELECT r.name, r.permissions FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1`,
        [user.id]
      );

      const roles = roleRows.length > 0 ? roleRows.map(r => r.name) : (user.role_name ? [user.role_name] : []);
      const hasAll = roleRows.some(r => (r.permissions || []).includes('all'));

      let resolvedPermissions = [];
      if (hasAll || (user.permissions || []).includes('all')) {
        resolvedPermissions = ['all'];
      } else if (roleRows.length > 0) {
        const { rows: permRows } = await query(
          `SELECT DISTINCT p.code FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = $1`,
          [user.id]
        );
        resolvedPermissions = permRows.map(r => r.code);
      }

      req.user = { ...user, roles, resolvedPermissions };
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth, requirePermission, requireAllPermissions };