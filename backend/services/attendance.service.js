const attendanceRepository = require('../repositories/attendance.repository');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');

class AttendanceService {
  async getSettings() {
    return await attendanceRepository.getSettings();
  }

  async updateSettings(data, userId, req) {
    const oldSettings = await attendanceRepository.getSettings();
    const updated = await attendanceRepository.updateSettings(data);
    await auditLog(userId, 'UPDATE_ATTENDANCE_SETTINGS', 'attendance_settings', '1', oldSettings, updated, req);
    return updated;
  }

  async clockIn(employeeId, userId, req) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

    if (existing) {
      throw { statusCode: 400, message: 'Already clocked in today' };
    }

    const settings = await attendanceRepository.getSettings();
    const clockInTime = new Date();
    
    // Parse time components
    const [lateH, lateM] = (settings?.late_arrival_threshold || '09:15:00').split(':').map(Number);
    const lateThresholdToday = new Date();
    lateThresholdToday.setHours(lateH, lateM, 0, 0);

    let status = 'present';
    if (clockInTime > lateThresholdToday) {
      status = 'late';
    }

    const record = await attendanceRepository.create({
      employeeId,
      date: today,
      clockIn: clockInTime,
      status,
    });

    await auditLog(userId, 'CLOCK_IN', 'attendance', record.id, null, record, req);
    return record;
  }

  async clockOut(employeeId, userId, req) {
    const today = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw { statusCode: 400, message: 'No clock-in record found for today' };
    }
    if (record.clock_out) {
      throw { statusCode: 400, message: 'Already clocked out today' };
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(record.clock_in);
    
    // Calculate work hours
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const settings = await attendanceRepository.getSettings();
    const halfThreshold = parseFloat(settings?.half_day_threshold || 4.00);
    const fullThreshold = parseFloat(settings?.full_day_threshold || 8.00);

    let finalStatus = record.status; // defaults to 'present' or 'late' from clock in
    
    if (workHours < halfThreshold) {
      finalStatus = 'absent';
    } else if (workHours >= halfThreshold && workHours < fullThreshold) {
      finalStatus = 'half_day';
    }

    const updated = await attendanceRepository.update(record.id, {
      clockOut: clockOutTime,
      status: finalStatus,
      workHours,
    });

    await auditLog(userId, 'CLOCK_OUT', 'attendance', record.id, record, updated, req);
    return updated;
  }

  async getMyLogs(employeeId, queryFilters) {
    const { page, limit, offset } = getPaginationParams(queryFilters);
    const filters = {
      employeeId,
      startDate: queryFilters.startDate,
      endDate: queryFilters.endDate,
      status: queryFilters.status,
    };

    const { rows, total } = await attendanceRepository.findAll(filters, { limit, offset });
    return {
      rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getTeamLogs(managerEmployeeId, queryFilters) {
    const { page, limit, offset } = getPaginationParams(queryFilters);
    const filters = {
      managerId: managerEmployeeId,
      employeeId: queryFilters.employeeId,
      startDate: queryFilters.startDate,
      endDate: queryFilters.endDate,
      status: queryFilters.status,
    };

    const { rows, total } = await attendanceRepository.findAll(filters, { limit, offset });
    return {
      rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getAllLogs(queryFilters) {
    const { page, limit, offset } = getPaginationParams(queryFilters);
    const filters = {
      employeeId: queryFilters.employeeId,
      departmentId: queryFilters.departmentId,
      startDate: queryFilters.startDate,
      endDate: queryFilters.endDate,
      status: queryFilters.status,
    };

    const { rows, total } = await attendanceRepository.findAll(filters, { limit, offset });
    return {
      rows,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  async getDailyStats(date = new Date().toISOString().split('T')[0]) {
    return await attendanceRepository.getDailyStats(date);
  }

  async getMonthlyStats(employeeId, year, month) {
    return await attendanceRepository.getMonthlyStats(employeeId, year, month);
  }

  async getTodayStatus(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    return await attendanceRepository.findByEmployeeAndDate(employeeId, today);
  }
}

module.exports = new AttendanceService();
