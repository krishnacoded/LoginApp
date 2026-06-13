const assetService = require('../services/asset.service');
const ApiResponse = require('../utils/response');
const { query } = require('../config/database');

const getEmployeeId = async (userId) => {
  const { rows } = await query('SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
  if (rows.length === 0) throw { statusCode: 404, message: 'Employee profile not found' };
  return rows[0].id;
};

const getAll = async (req, res, next) => {
  try {
    const result = await assetService.getAll(req.query);
    return ApiResponse.paginated(res, result.assets, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const asset = await assetService.getById(req.params.id);
    return ApiResponse.success(res, asset);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user.id, req);
    return ApiResponse.created(res, asset, 'Asset created successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const allocateAsset = async (req, res, next) => {
  try {
    const { employeeId, notes } = req.body;
    const allocation = await assetService.allocateAsset(req.params.id, employeeId, notes, req.user.id, req);
    return ApiResponse.success(res, allocation, 'Asset allocated successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const returnAsset = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const allocation = await assetService.returnAsset(req.params.id, notes, req.user.id, req);
    return ApiResponse.success(res, allocation, 'Asset marked as returned');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const asset = await assetService.updateStatus(req.params.id, status, notes, req.user.id, req);
    return ApiResponse.success(res, asset, `Asset status updated to ${status}`);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getMyAssets = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const assets = await assetService.getEmployeeAssets(employeeId);
    return ApiResponse.success(res, assets);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getAssetRequests = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const requests = await assetService.getAssetRequests(employeeId, req.user.roles || [req.user.role], req.user.id);
    return ApiResponse.success(res, requests);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const createAssetRequest = async (req, res, next) => {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const request = await assetService.createAssetRequest(employeeId, req.body, req.user.id, req);
    return ApiResponse.created(res, request, 'Asset request submitted successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const approveAssetRequest = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const request = await assetService.approveAssetRequest(req.params.id, comment, req.user.id, req.user.roles || [req.user.role], req);
    return ApiResponse.success(res, request, 'Asset request approved successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const rejectAssetRequest = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const request = await assetService.rejectAssetRequest(req.params.id, comment, req.user.id, req.user.roles || [req.user.role], req);
    return ApiResponse.success(res, request, 'Asset request rejected successfully');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  createAsset,
  allocateAsset,
  returnAsset,
  updateStatus,
  getMyAssets,
  getAssetRequests,
  createAssetRequest,
  approveAssetRequest,
  rejectAssetRequest,
};
