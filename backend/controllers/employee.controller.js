const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await employeeService.getAll(req.query, req);
    return ApiResponse.paginated(res, result.employees, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    return ApiResponse.success(res, employee);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const employee = await employeeService.create(req.body, req.user.id, req);
    return ApiResponse.created(res, employee, 'Employee created successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body, req.user.id, req);
    return ApiResponse.success(res, employee, 'Employee updated successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await employeeService.delete(req.params.id, req.user.id, req);
    return ApiResponse.success(res, null, 'Employee deleted successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const employee = await employeeService.restore(req.params.id, req.user.id, req);
    return ApiResponse.success(res, employee, 'Employee restored successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded');
    const url = await employeeService.updateProfilePicture(req.params.id, req.file.path);
    return ApiResponse.success(res, { url }, 'Profile picture updated');
  } catch (error) {
    next(error);
  }
};

const getDirectReports = async (req, res, next) => {
  try {
    const reports = await employeeService.getDirectReports(req.params.id);
    return ApiResponse.success(res, reports);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await employeeService.getStats();
    return ApiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, restore, uploadProfilePicture, getDirectReports, getStats };