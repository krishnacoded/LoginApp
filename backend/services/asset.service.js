const assetRepository = require('../repositories/asset.repository');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');
const { query } = require('../config/database');

class AssetService {
  async createAsset(data, userId, req) {
    const existing = await assetRepository.findBySerialNumber(data.serialNumber);
    if (existing) {
      throw { statusCode: 400, message: `Asset with serial number ${data.serialNumber} already exists` };
    }

    const asset = await assetRepository.create(data);

    await assetRepository.createHistory({
      assetId: asset.id,
      action: 'create',
      performedBy: userId,
      notes: `Asset created: ${asset.name} (${asset.serial_number})`,
    });

    await auditLog(userId, 'CREATE_ASSET', 'assets', asset.id, null, asset, req);
    return asset;
  }

  async allocateAsset(assetId, employeeId, notes, userId, req) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw { statusCode: 404, message: 'Asset not found' };
    }

    // 1. Verify status is available
    if (asset.status !== 'available') {
      throw { statusCode: 400, message: `Asset status is '${asset.status}' and cannot be allocated. It must be 'available'.` };
    }

    // 2. Verify there is no active allocation record
    const activeAlloc = await assetRepository.getActiveAllocation(assetId);
    if (activeAlloc) {
      throw { statusCode: 400, message: 'Asset is already allocated to another employee (active record exists)' };
    }

    // Allocate asset
    const allocation = await assetRepository.createAllocation({
      assetId,
      employeeId,
      allocatedBy: userId,
      notes,
    });

    // Update status to allocated
    const updatedAsset = await assetRepository.updateStatus(assetId, 'allocated');

    // History log
    await assetRepository.createHistory({
      assetId,
      employeeId,
      action: 'allocate',
      performedBy: userId,
      notes: notes || `Allocated to employee`,
    });

    await auditLog(userId, 'ALLOCATE_ASSET', 'assets', assetId, asset, updatedAsset, req);

    // Notify employee
    try {
      const { rows } = await query('SELECT user_id, first_name, last_name FROM employees WHERE id = $1', [employeeId]);
      if (rows.length > 0 && rows[0].user_id) {
        await notificationService.create(
          rows[0].user_id,
          'asset_assigned',
          'New Asset Assigned',
          `A ${asset.name} (S/N: ${asset.serial_number}) has been allocated to you.`,
          { assetId, allocationId: allocation.id },
          '/assets'
        );
      }
    } catch (err) {
      console.error('Error creating asset allocation notification:', err);
    }

    return allocation;
  }

  async returnAsset(assetId, notes, userId, req) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw { statusCode: 404, message: 'Asset not found' };
    }

    const activeAlloc = await assetRepository.getActiveAllocation(assetId);
    if (!activeAlloc) {
      throw { statusCode: 400, message: 'No active allocation found for this asset' };
    }

    // Return allocation
    const allocation = await assetRepository.returnAllocation(activeAlloc.id, notes);

    // Update status to available
    const updatedAsset = await assetRepository.updateStatus(assetId, 'available');

    // History log
    await assetRepository.createHistory({
      assetId,
      employeeId: activeAlloc.employee_id,
      action: 'return',
      performedBy: userId,
      notes: notes || 'Asset returned',
    });

    await auditLog(userId, 'RETURN_ASSET', 'assets', assetId, asset, updatedAsset, req);

    // Notify employee
    try {
      const { rows } = await query('SELECT user_id FROM employees WHERE id = $1', [activeAlloc.employee_id]);
      if (rows.length > 0 && rows[0].user_id) {
        await notificationService.create(
          rows[0].user_id,
          'asset_returned',
          'Asset Returned',
          `The assigned ${asset.name} has been marked as returned.`,
          { assetId },
          '/assets'
        );
      }
    } catch (err) {
      console.error('Error creating asset return notification:', err);
    }

    return allocation;
  }

  async updateStatus(assetId, status, notes, userId, req) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw { statusCode: 404, message: 'Asset not found' };
    }

    const activeAlloc = await assetRepository.getActiveAllocation(assetId);

    // Update status
    const updatedAsset = await assetRepository.updateStatus(assetId, status);

    // History log
    await assetRepository.createHistory({
      assetId,
      employeeId: activeAlloc?.employee_id || null,
      action: 'status_change',
      performedBy: userId,
      notes: notes || `Status changed to ${status}`,
    });

    await auditLog(userId, 'UPDATE_ASSET_STATUS', 'assets', assetId, asset, updatedAsset, req);

    // Notify employee if allocated
    if (activeAlloc) {
      try {
        const { rows } = await query('SELECT user_id FROM employees WHERE id = $1', [activeAlloc.employee_id]);
        if (rows.length > 0 && rows[0].user_id) {
          await notificationService.create(
            rows[0].user_id,
            'asset_status_updated',
            'Asset Status Updated',
            `Your assigned ${asset.name} has been marked as ${status}.`,
            { assetId },
            '/assets'
          );
        }
      } catch (err) {
        console.error('Error creating status notification:', err);
      }
    }

    return updatedAsset;
  }

  async getAll(queryFilters) {
    const { page, limit, offset } = getPaginationParams(queryFilters);
    const filters = {
      search: queryFilters.search,
      assetType: queryFilters.assetType,
      status: queryFilters.status,
    };

    const { rows, total } = await assetRepository.findAll(filters, { limit, offset });
    return {
      assets: rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getById(id) {
    const asset = await assetRepository.findById(id);
    if (!asset) throw { statusCode: 404, message: 'Asset not found' };
    const history = await assetRepository.getHistory(id);
    return { ...asset, history };
  }

  async getEmployeeAssets(employeeId) {
    return await assetRepository.getEmployeeAllocations(employeeId);
  }
}

module.exports = new AssetService();
