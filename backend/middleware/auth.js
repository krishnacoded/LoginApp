const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/database');
const ApiResponse = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const { rows } = await query(
      `SELECT u.id, u.email, u.is_active, u.role_id, r.name as role_name, r.permissions,
              e.id as employee_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.sub]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }

    req.user = rows[0];
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }

    const permissions = req.user.permissions || [];
    const hasAll = permissions.includes('all');
    const hasRole = roles.includes(req.user.role_name);

    if (!hasAll && !hasRole) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

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
              e.id as employee_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.sub]
    );

    if (rows.length > 0 && rows[0].is_active) {
      req.user = rows[0];
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };