const roleService = require('../services/role.service');
const ApiResponse = require('../utils/response');

class RoleController {
  async getAll(req, res, next) {
    try {
      const roles = await roleService.getAll();
      return ApiResponse.success(res, roles);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await roleService.getById(parseInt(req.params.id, 10));
      return ApiResponse.success(res, role);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const role = await roleService.create(req.body, req.user.id, req);
      return ApiResponse.created(res, role, 'Role created successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.update(parseInt(req.params.id, 10), req.body, req.user.id, req);
      return ApiResponse.success(res, role, 'Role updated successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await roleService.delete(parseInt(req.params.id, 10), req.user.id, req);
      return ApiResponse.success(res, result, 'Role deleted successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getPermissions(req, res, next) {
    try {
      const result = await roleService.getAllPermissions();
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async assignRole(req, res, next) {
    try {
      const { roleId } = req.body;
      if (!roleId) return ApiResponse.badRequest(res, 'roleId is required');
      const result = await roleService.assignRoleToUser(req.params.userId, roleId, req.user.id, req);
      return ApiResponse.success(res, result, 'Role assigned successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async removeRole(req, res, next) {
    try {
      const result = await roleService.removeRoleFromUser(req.params.userId, parseInt(req.params.roleId, 10), req.user.id, req);
      return ApiResponse.success(res, result, 'Role removed successfully');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getUserRoles(req, res, next) {
    try {
      const roles = await roleService.getUserRoles(req.params.userId);
      return ApiResponse.success(res, roles);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new RoleController();
