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

  async createAssetRequest(employeeId, data, userId, req) {
    const { assetType, reason } = data;
    if (!assetType) throw { statusCode: 400, message: 'Asset type is required' };

    const { rows: empRows } = await query('SELECT manager_id FROM employees WHERE id = $1', [employeeId]);
    const managerId = empRows.length > 0 ? empRows[0].manager_id : null;

    const status = managerId ? 'Pending Manager Approval' : 'Pending HR Approval';

    const { rows } = await query(
      `INSERT INTO asset_requests (employee_id, asset_type, reason, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [employeeId, assetType, reason, status]
    );

    const request = rows[0];
    await auditLog(userId, 'CREATE_ASSET_REQUEST', 'asset_requests', request.id, null, request, req);

    try {
      if (managerId) {
        const { rows: mgrUserRows } = await query('SELECT user_id FROM employees WHERE id = $1', [managerId]);
        if (mgrUserRows.length > 0 && mgrUserRows[0].user_id) {
          await notificationService.create(
            mgrUserRows[0].user_id,
            'asset_request_pending',
            'Pending Asset Request',
            `An employee has requested a ${assetType}.`,
            { requestId: request.id },
            '/assets'
          );
        }
      } else {
        const { rows: hrUserRows } = await query(
          `SELECT u.id FROM users u 
           JOIN user_roles ur ON ur.user_id = u.id 
           JOIN roles r ON ur.role_id = r.id 
           WHERE r.name IN ('admin', 'hr')`
        );
        for (const hrUser of hrUserRows) {
          await notificationService.create(
            hrUser.id,
            'asset_request_pending',
            'Pending Asset Request',
            `An employee has requested a ${assetType} (no manager assigned).`,
            { requestId: request.id },
            '/assets'
          );
        }
      }
    } catch (err) {
      console.error('Error creating asset request notification:', err);
    }

    return request;
  }

  async getAssetRequests(employeeId, userRoles, userId) {
    const isHR = userRoles.includes('admin') || userRoles.includes('hr');
    const isManager = userRoles.includes('manager');

    let sql = `
      SELECT ar.*, 
             emp.first_name as employee_first_name, 
             emp.last_name as employee_last_name, 
             emp.employee_code,
             emp.manager_id as employee_manager_id,
             a.name as allocated_asset_name,
             a.serial_number as allocated_asset_serial
      FROM asset_requests ar
      JOIN employees emp ON ar.employee_id = emp.id
      LEFT JOIN assets a ON ar.allocated_asset_id = a.id
    `;
    let params = [];

    if (isHR) {
      sql += ` ORDER BY ar.created_at DESC`;
    } else if (isManager) {
      sql += ` 
        WHERE ar.employee_id = $1 
           OR emp.manager_id = $1
        ORDER BY ar.created_at DESC
      `;
      params = [employeeId];
    } else {
      sql += ` 
        WHERE ar.employee_id = $1
        ORDER BY ar.created_at DESC
      `;
      params = [employeeId];
    }

    const { rows } = await query(sql, params);
    return rows;
  }

  async approveAssetRequest(requestId, comment, userId, userRoles, req) {
    const isHR = userRoles.includes('admin') || userRoles.includes('hr');

    const { rows: reqRows } = await query('SELECT * FROM asset_requests WHERE id = $1', [requestId]);
    if (reqRows.length === 0) throw { statusCode: 404, message: 'Asset request not found' };
    const request = reqRows[0];

    const { rows: userEmpRows } = await query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    const userEmployeeId = userEmpRows.length > 0 ? userEmpRows[0].id : null;

    let newStatus = request.status;
    let updateFields = [];
    let updateParams = [requestId];

    if (request.status === 'Pending Manager Approval') {
      const { rows: empRows } = await query('SELECT manager_id FROM employees WHERE id = $1', [request.employee_id]);
      const empManagerId = empRows.length > 0 ? empRows[0].manager_id : null;

      if (!isHR && empManagerId !== userEmployeeId) {
        throw { statusCode: 403, message: 'You are not authorized to approve this request (not the assigned manager)' };
      }

      newStatus = 'Pending HR Approval';
      updateFields.push('status = $2', 'manager_id = $3', 'manager_comment = $4');
      updateParams.push(newStatus, userEmployeeId, comment || null);
    } else if (request.status === 'Pending HR Approval') {
      if (!isHR) {
        throw { statusCode: 403, message: 'Only HR or admin can perform final approval' };
      }
      newStatus = 'Approved';
      updateFields.push('status = $2', 'hr_comment = $3');
      updateParams.push(newStatus, comment || null);

      if (req.body.assetId) {
        const assetId = req.body.assetId;
        await this.allocateAsset(assetId, request.employee_id, comment || 'Allocated from approved request', userId, req);
        updateFields.push('allocated_asset_id = $' + (updateParams.length + 1));
        updateParams.push(assetId);
      }
    } else {
      throw { statusCode: 400, message: `Request is already in status '${request.status}'` };
    }

    const updateSql = `
      UPDATE asset_requests 
      SET ${updateFields.join(', ')}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    const { rows: updatedRows } = await query(updateSql, updateParams);
    const updatedRequest = updatedRows[0];

    await auditLog(userId, 'APPROVE_ASSET_REQUEST', 'asset_requests', requestId, request, updatedRequest, req);

    try {
      const { rows: empUserRows } = await query('SELECT user_id FROM employees WHERE id = $1', [request.employee_id]);
      if (newStatus === 'Pending HR Approval') {
        const { rows: hrUserRows } = await query(
          `SELECT u.id FROM users u 
           JOIN user_roles ur ON ur.user_id = u.id 
           JOIN roles r ON ur.role_id = r.id 
           WHERE r.name IN ('admin', 'hr')`
        );
        for (const hrUser of hrUserRows) {
          await notificationService.create(
            hrUser.id,
            'asset_request_pending',
            'Asset Request Approved by Manager',
            `A request for a ${request.asset_type} has been approved by the manager and is pending HR allocation.`,
            { requestId },
            '/assets'
          );
        }
      } else if (newStatus === 'Approved') {
        if (empUserRows.length > 0 && empUserRows[0].user_id) {
          await notificationService.create(
            empUserRows[0].user_id,
            'asset_request_approved',
            'Asset Request Approved',
            `Your request for a ${request.asset_type} has been approved by HR.`,
            { requestId },
            '/assets'
          );
        }
      }
    } catch (err) {
      console.error('Error creating asset request approval notification:', err);
    }

    return updatedRequest;
  }

  async rejectAssetRequest(requestId, comment, userId, userRoles, req) {
    const isHR = userRoles.includes('admin') || userRoles.includes('hr');

    const { rows: reqRows } = await query('SELECT * FROM asset_requests WHERE id = $1', [requestId]);
    if (reqRows.length === 0) throw { statusCode: 404, message: 'Asset request not found' };
    const request = reqRows[0];

    const { rows: userEmpRows } = await query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    const userEmployeeId = userEmpRows.length > 0 ? userEmpRows[0].id : null;

    if (request.status !== 'Pending Manager Approval' && request.status !== 'Pending HR Approval') {
      throw { statusCode: 400, message: `Request cannot be rejected from status '${request.status}'` };
    }

    if (request.status === 'Pending Manager Approval') {
      const { rows: empRows } = await query('SELECT manager_id FROM employees WHERE id = $1', [request.employee_id]);
      const empManagerId = empRows.length > 0 ? empRows[0].manager_id : null;

      if (!isHR && empManagerId !== userEmployeeId) {
        throw { statusCode: 403, message: 'You are not authorized to reject this request' };
      }
    } else if (request.status === 'Pending HR Approval') {
      if (!isHR) {
        throw { statusCode: 403, message: 'Only HR or admin can reject at this stage' };
      }
    }

    const newStatus = 'Rejected';
    let updateFields = ['status = $2'];
    let updateParams = [requestId, newStatus];

    if (isHR) {
      updateFields.push('hr_comment = $3');
      updateParams.push(comment || null);
    } else {
      updateFields.push('manager_id = $3', 'manager_comment = $4');
      updateParams.push(userEmployeeId, comment || null);
    }

    const updateSql = `
      UPDATE asset_requests 
      SET ${updateFields.join(', ')}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    const { rows: updatedRows } = await query(updateSql, updateParams);
    const updatedRequest = updatedRows[0];

    await auditLog(userId, 'REJECT_ASSET_REQUEST', 'asset_requests', requestId, request, updatedRequest, req);

    try {
      const { rows: empUserRows } = await query('SELECT user_id FROM employees WHERE id = $1', [request.employee_id]);
      if (empUserRows.length > 0 && empUserRows[0].user_id) {
        await notificationService.create(
          empUserRows[0].user_id,
          'asset_request_rejected',
          'Asset Request Rejected',
          `Your request for a ${request.asset_type} has been rejected.`,
          { requestId },
          '/assets'
        );
      }
    } catch (err) {
      console.error('Error creating asset request rejection notification:', err);
    }

    return updatedRequest;
  }
}

module.exports = new AssetService();
