const repository = require('../repositories/department.repository');
const employeeRepository = require('../repositories/employee.repository');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');

class DepartmentService {
  async getAll(filters = {}) {
    const { page, limit, offset } = getPaginationParams(filters);
    const result = await repository.findAll({ ...filters, limit, offset });
    return {
      departments: result.rows,
      pagination: buildPaginationMeta(result.total, page, limit),
    };
  }

  async getById(id) {
    const department = await repository.findById(id);
    if (!department) throw { statusCode: 404, message: 'Department not found' };
    return department;
  }

  async create(data, userId, req) {
    const department = await repository.create(data);
    await auditLog(userId, 'CREATE_DEPARTMENT', 'department', department.id, null, department, req);
    return department;
  }

  async update(id, data, userId, req) {
    const existing = await this.getById(id);
    const map = {
      name: 'name',
      code: 'code',
      description: 'description',
      headEmployeeId: 'head_employee_id',
      budget: 'budget',
      location: 'location',
      isActive: 'is_active',
      parentDepartmentId: 'parent_department_id',
      goals: 'goals',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
    };
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, column] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${idx++}`);
        values.push(key === 'code' ? data[key].toUpperCase() : data[key]);
      }
    }

    if (!fields.length) return existing;
    values.push(id);
    const updated = await repository.update(id, fields, values);
    if (!updated) throw { statusCode: 404, message: 'Department not found' };
    await auditLog(userId, 'UPDATE_DEPARTMENT', 'department', id, existing, updated, req);
    return updated;
  }

  async delete(id, userId, req) {
    const activeEmployees = await employeeRepository.countActiveByDepartment(id);
    if (activeEmployees > 0) {
      throw { statusCode: 400, message: 'Cannot delete department with active employees' };
    }
    await repository.softDelete(id);
    await auditLog(userId, 'DELETE_DEPARTMENT', 'department', id, null, null, req);
  }
}

module.exports = new DepartmentService();
