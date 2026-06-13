const shiftService = require('../services/shift.service');
const ApiResponse = require('../utils/response');

class ShiftController {
  async getAll(req, res, next) {
    try {
      const shifts = await shiftService.getAll();
      return ApiResponse.success(res, shifts);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const shift = await shiftService.getById(req.params.id);
      return ApiResponse.success(res, shift);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const shift = await shiftService.create(req.body, req.user.id, req);
      return ApiResponse.created(res, shift, 'Shift created successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const shift = await shiftService.update(req.params.id, req.body, req.user.id, req);
      return ApiResponse.success(res, shift, 'Shift updated successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await shiftService.delete(req.params.id, req.user.id, req);
      return ApiResponse.success(res, result, 'Shift deleted successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async assign(req, res, next) {
    try {
      const result = await shiftService.assignShift(req.body, req.user.id, req);
      return ApiResponse.success(res, result, 'Shift assigned to employee successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async bulkAssign(req, res, next) {
    try {
      const result = await shiftService.bulkAssign(req.body, req.user.id, req);
      return ApiResponse.success(res, result, `Shift assigned to ${result.assignedCount} employees successfully`);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new ShiftController();
