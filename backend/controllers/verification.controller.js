const verificationService = require('../services/verification.service');
const ApiResponse = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const { type } = req.body;
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return ApiResponse.badRequest(res, 'No employee record associated with this user account');
    }
    if (!type || !req.body.data) {
      return ApiResponse.badRequest(res, 'Verification type and details are required');
    }
    const result = await verificationService.createRequest(type, employeeId, req.body.data);
    return ApiResponse.created(res, result, 'Verification request submitted successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const isHrOrAdmin = req.user.roles.includes('hr') || req.user.roles.includes('admin') || req.user.resolvedPermissions.includes('all');
    let managerEmployeeId = null;

    if (!isHrOrAdmin) {
      // If user is a manager (but not HR/Admin), they can only see direct reports' requests
      if (req.user.roles.includes('manager')) {
        managerEmployeeId = req.user.employee_id;
        if (!managerEmployeeId) {
          return ApiResponse.forbidden(res, 'No employee record found for this manager account');
        }
      } else {
        return ApiResponse.forbidden(res, 'Only Managers, HR, or Admins can review verification requests');
      }
    }

    const requests = await verificationService.getPendingRequests(managerEmployeeId);
    return ApiResponse.success(res, requests);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const action = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return ApiResponse.badRequest(res, 'Action must be approve or reject');
    }

    const result = await verificationService.actionRequest(type, id, action, req.user.id, comment);
    return ApiResponse.success(res, result, `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

module.exports = { create, getPending, action };
