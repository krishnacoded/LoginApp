const attendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/response');
const { query } = require('../config/database');

const getEmployeeId = async (userId) => {
  const { rows } = await query('SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
  if (rows.length === 0) throw { statusCode: 404, message: 'Employee profile not found' };
  return rows[0].id;
};

const clockIn = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await attendanceService.clockIn(employeeId, req.user.id, req);
    return ApiResponse.success(res, result, 'Clocked in successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const clockOut = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await attendanceService.clockOut(employeeId, req.user.id, req);
    return ApiResponse.success(res, result, 'Clocked out successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await attendanceService.getTodayStatus(employeeId);
    return ApiResponse.success(res, result);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getMyLogs = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await attendanceService.getMyLogs(employeeId, req.query);
    return ApiResponse.paginated(res, result.rows, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getTeamLogs = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await attendanceService.getTeamLogs(employeeId, req.query);
    return ApiResponse.paginated(res, result.rows, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getAllLogs = async (req, res, next) => {
  try {
    const result = await attendanceService.getAllLogs(req.query);
    return ApiResponse.paginated(res, result.rows, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await attendanceService.getSettings();
    return ApiResponse.success(res, settings);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await attendanceService.updateSettings(req.body, req.user.id, req);
    return ApiResponse.success(res, settings, 'Attendance settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const stats = await attendanceService.getDailyStats(date);
    return ApiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || await getEmployeeId(req.user.id);
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    const result = await attendanceService.getMonthlyStats(employeeId, year, month);
    return ApiResponse.success(res, result);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const startBreak = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const breakType = req.body.breakType || 'lunch';
    const brk = await attendanceService.startBreak(employeeId, breakType, req.user.id, req);
    return ApiResponse.success(res, brk, 'Break started successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const endBreak = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const brk = await attendanceService.endBreak(employeeId, req.user.id, req);
    return ApiResponse.success(res, brk, 'Break ended successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const syncDaily = async (req, res, next) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const defaultDate = yesterday.toISOString().split('T')[0];
    const date = req.body.date || defaultDate;

    const result = await attendanceService.syncDailyAttendance(date);
    return ApiResponse.success(res, result, `Successfully processed daily attendance status for date: ${date}`);
  } catch (error) {
    next(error);
  }
};

const syncBiometricLogs = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.BIOMETRIC_API_KEY || 'peopleflow_biometric_sync_secret_2026';
    if (!apiKey || apiKey !== expectedKey) {
      return ApiResponse.unauthorized(res, 'Invalid Biometric API Key');
    }

    const logs = req.body.logs || [];
    const result = await attendanceService.syncBiometricLogs(logs);
    return ApiResponse.success(res, result, 'Biometric sync processed');
  } catch (error) {
    next(error);
  }
};

const bulkCorrect = async (req, res, next) => {
  try {
    const corrections = req.body.corrections || [];
    const result = await attendanceService.bulkCorrectAttendance(corrections, req.user.id, req);
    return ApiResponse.success(res, result, 'Bulk corrections processed');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getHolidays = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM holidays ORDER BY date ASC');
    return ApiResponse.success(res, rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockIn,
  clockOut,
  getTodayStatus,
  getMyLogs,
  getTeamLogs,
  getAllLogs,
  getSettings,
  updateSettings,
  getStats,
  getMonthlyStats,
  startBreak,
  endBreak,
  syncDaily,
  syncBiometricLogs,
  bulkCorrect,
  getHolidays,
};
