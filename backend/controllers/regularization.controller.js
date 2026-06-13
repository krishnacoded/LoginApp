const regularizationService = require('../services/regularization.service');
const ApiResponse = require('../utils/response');
const { query } = require('../config/database');

const getEmployeeId = async (userId) => {
  const { rows } = await query('SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
  if (rows.length === 0) throw { statusCode: 404, message: 'Employee profile not found' };
  return rows[0].id;
};

class RegularizationController {
  async apply(req, res, next) {
    try {
      const employeeId = await getEmployeeId(req.user.id);
      const result = await regularizationService.apply(employeeId, req.body, req.user.id, req);
      return ApiResponse.created(res, result, 'Regularization request submitted successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const employeeId = await getEmployeeId(req.user.id);
      const result = await regularizationService.getMyRequests(employeeId);
      return ApiResponse.success(res, result);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getTeamRequests(req, res, next) {
    try {
      const employeeId = await getEmployeeId(req.user.id);
      const result = await regularizationService.getTeamRequests(employeeId);
      return ApiResponse.success(res, result);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getAllRequests(req, res, next) {
    try {
      const result = await regularizationService.getAllRequests();
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async review(req, res, next) {
    try {
      const result = await regularizationService.review(req.params.id, req.user, req.body, req);
      return ApiResponse.success(res, result, `Request reviewed successfully: ${req.body.status}`);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new RegularizationController();
