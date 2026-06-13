const { query } = require('../config/database');

/**
 * Data scope middleware — attaches req.dataScope based on the user's role.
 *
 * req.dataScope = {
 *   scope: 'all' | 'team' | 'department' | 'self',
 *   employeeId: UUID | null,           — the user's own employee_id
 *   employeeIds: UUID[] | null,        — IDs the user may access (self + direct reports)
 *   departmentId: UUID | null,         — user's department_id (for dept-head future use)
 * }
 *
 * Usage:  router.get('/', authenticate, attachDataScope, controller.getAll);
 *         Then in the controller/service read req.dataScope to filter queries.
 */

const attachDataScope = async (req, _res, next) => {
  try {
    const user = req.user;
    if (!user) {
      req.dataScope = { scope: 'self', employeeId: null, employeeIds: [], departmentId: null };
      return next();
    }

    const permissions = user.resolvedPermissions || user.permissions || [];

    // Admin / HR — or anyone with the 'all' shortcut — see everything
    if (
      permissions.includes('all') ||
      user.role_name === 'admin' ||
      user.role_name === 'hr'
    ) {
      req.dataScope = { scope: 'all', employeeId: user.employee_id || null, employeeIds: null, departmentId: null };
      return next();
    }

    const employeeId = user.employee_id || null;

    // Manager — own data + direct reports
    if (user.role_name === 'manager' || permissions.includes('attendance.view_team')) {
      if (!employeeId) {
        req.dataScope = { scope: 'self', employeeId: null, employeeIds: [], departmentId: null };
        return next();
      }

      const { rows } = await query(
        'SELECT id FROM employees WHERE manager_id = $1 AND deleted_at IS NULL',
        [employeeId]
      );

      const teamIds = rows.map(r => r.id);
      teamIds.push(employeeId); // include self

      // Also get the manager's department for optional dept-level scope
      const { rows: empRows } = await query(
        'SELECT department_id FROM employees WHERE id = $1',
        [employeeId]
      );

      req.dataScope = {
        scope: 'team',
        employeeId,
        employeeIds: teamIds,
        departmentId: empRows[0]?.department_id || null,
      };
      return next();
    }

    // Employee — own data only
    req.dataScope = {
      scope: 'self',
      employeeId,
      employeeIds: employeeId ? [employeeId] : [],
      departmentId: null,
    };
    next();
  } catch (error) {
    // Don't block request on scope errors — fall back to self scope
    console.error('Data scope middleware error:', error);
    req.dataScope = {
      scope: 'self',
      employeeId: req.user?.employee_id || null,
      employeeIds: req.user?.employee_id ? [req.user.employee_id] : [],
      departmentId: null,
    };
    next();
  }
};

/**
 * Helper: build a SQL WHERE clause fragment for employee-scoped queries.
 *
 * @param {object} dataScope — req.dataScope
 * @param {string} employeeAlias — SQL alias for the employees table (default 'e')
 * @param {number} paramStartIdx — the next $N parameter index to use
 * @returns {{ clause: string, params: any[], nextIdx: number }}
 *
 * Example:
 *   const { clause, params, nextIdx } = buildScopeClause(req.dataScope, 'e', 3);
 *   if (clause) conditions.push(clause);
 *   queryParams.push(...params);
 */
const buildScopeClause = (dataScope, employeeAlias = 'e', paramStartIdx = 1) => {
  if (!dataScope || dataScope.scope === 'all') {
    return { clause: '', params: [], nextIdx: paramStartIdx };
  }

  if (dataScope.scope === 'team' && dataScope.employeeIds?.length > 0) {
    const placeholders = dataScope.employeeIds.map((_, i) => `$${paramStartIdx + i}`).join(', ');
    return {
      clause: `${employeeAlias}.id IN (${placeholders})`,
      params: [...dataScope.employeeIds],
      nextIdx: paramStartIdx + dataScope.employeeIds.length,
    };
  }

  if (dataScope.scope === 'self' && dataScope.employeeId) {
    return {
      clause: `${employeeAlias}.id = $${paramStartIdx}`,
      params: [dataScope.employeeId],
      nextIdx: paramStartIdx + 1,
    };
  }

  // Fallback: show nothing
  return { clause: '1 = 0', params: [], nextIdx: paramStartIdx };
};

/**
 * Helper: strip sensitive fields from an employee object based on permissions.
 *
 * @param {object} employee — the raw employee DB row
 * @param {string[]} permissions — the user's resolved permissions
 * @param {string|null} selfEmployeeId — the requesting user's own employee_id
 * @returns {object} — sanitised employee object
 */
const sanitizeEmployeeFields = (employee, permissions = [], selfEmployeeId = null) => {
  if (!employee) return employee;

  const canViewSensitive =
    permissions.includes('all') ||
    permissions.includes('employee.view_sensitive') ||
    employee.id === selfEmployeeId; // Users can always see their own data

  if (!canViewSensitive) {
    const sanitized = { ...employee };
    delete sanitized.salary;
    delete sanitized.bank_details;
    delete sanitized.emergency_contact;
    delete sanitized.personal_email;
    // Keep address city/country for directory, remove full address
    if (sanitized.address && typeof sanitized.address === 'object') {
      sanitized.address = { city: sanitized.address.city, country: sanitized.address.country };
    }
    return sanitized;
  }

  return employee;
};

module.exports = { attachDataScope, buildScopeClause, sanitizeEmployeeFields };
