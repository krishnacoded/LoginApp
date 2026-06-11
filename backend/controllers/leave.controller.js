const leaveService = require('../services/leave.service');
const { query } = require('../config/database');
const ApiResponse = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await leaveService.getAll(req.query, req.user);
    return ApiResponse.paginated(res, result.leaves, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const leave = await leaveService.getById(req.params.id);
    return ApiResponse.success(res, leave);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const apply = async (req, res, next) => {
  try {
    // Get employee ID from user
    const { rows } = await query(
      'SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );

    if (rows.length === 0) return ApiResponse.error(res, 'Employee profile not found', 404);

    // Handle file upload
    if (req.file) {
      req.body.attachmentUrl = `/uploads/leaves/${req.file.filename}`;
    }

    const leave = await leaveService.apply(rows[0].id, req.body, req.user.id, req);
    return ApiResponse.created(res, leave, 'Leave application submitted');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const leave = await leaveService.approve(req.params.id, req.user.id, req.user.role_name, comment, req);
    return ApiResponse.success(res, leave, 'Leave approved successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment) return ApiResponse.badRequest(res, 'Rejection reason required');
    const leave = await leaveService.reject(req.params.id, req.user.id, req.user.role_name, comment, req);
    return ApiResponse.success(res, leave, 'Leave rejected');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    await leaveService.cancel(req.params.id, req.user.id, req.body.reason, req);
    return ApiResponse.success(res, null, 'Leave cancelled');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;
    const year = req.query.year || new Date().getFullYear();
    const balances = await leaveService.getBalance(employeeId, year);
    return ApiResponse.success(res, balances);
  } catch (error) { next(error); }
};

const getMyBalance = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
      [req.user.id]
    );
    if (rows.length === 0) return ApiResponse.notFound(res, 'Employee not found');
    const year = req.query.year || new Date().getFullYear();
    const balances = await leaveService.getBalance(rows[0].id, year);
    return ApiResponse.success(res, balances);
  } catch (error) { next(error); }
};

const getTypes = async (req, res, next) => {
  try {
    const types = await leaveService.getTypes();
    return ApiResponse.success(res, types);
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await leaveService.getStats();
    return ApiResponse.success(res, stats);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, apply, approve, reject, cancel, getBalance, getMyBalance, getTypes, getStats };