const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/response');
const { auditLog } = require('../middleware/audit');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name required'),
];

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array().map(e => e.msg));
    }

    const { email, password } = req.body;
    const result = await authService.login(
      email,
      password,
      req.ip,
      req.headers['user-agent']
    );

    await auditLog(result.user.id, 'LOGIN', 'auth', result.user.id, null, { email }, req);

    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array().map(e => e.msg));
    }

    const result = await authService.register(req.body);
    await auditLog(result.id, 'REGISTER', 'auth', result.id, null, { email: result.email }, req);

    return ApiResponse.created(res, result, 'Registration successful. Please verify your email before signing in.');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.query.token);
    const message = result.alreadyVerified
      ? 'Email is already verified'
      : 'Email verified successfully';

    return ApiResponse.success(res, result, message);
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token required');
    }

    const result = await authService.refreshToken(refreshToken, req.ip, req.headers['user-agent']);
    return ApiResponse.success(res, result, 'Token refreshed');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    await auditLog(req.user.id, 'LOGOUT', 'auth', req.user.id, null, null, req);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  const { query } = require('../config/database');
  
  const { rows } = await query(
    `SELECT u.id, u.email, u.is_active, u.last_login, u.created_at,
            r.name as role, r.permissions,
            e.id as employee_id, e.employee_code, e.first_name, e.last_name,
            e.profile_picture_url, e.designation, e.department_id,
            d.name as department_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (rows.length === 0) return ApiResponse.notFound(res);
  return ApiResponse.success(res, rows[0]);
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) {
      return ApiResponse.badRequest(res, 'roleId is required');
    }
    const result = await authService.updateUserRole(id, roleId, req.user.id, req);
    return ApiResponse.success(res, result, 'User role updated successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

module.exports = {
  login, loginValidation,
  register, registerValidation,
  verifyEmail,
  refreshToken, logout, getMe, changePassword, updateUserRole,
};
