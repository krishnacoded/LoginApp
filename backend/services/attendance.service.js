const { query } = require('../config/database');
const attendanceRepository = require('../repositories/attendance.repository');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');
const shiftService = require('./shift.service');

const parseTime = (timeStr) => {
  const [h, m, s] = timeStr.split(':').map(Number);
  return { h, m, s: s || 0 };
};

const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
};

const getDeviceInfoFromReq = (req) => {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] || 'unknown',
  };
};

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
    const clockInTime = new Date();

    // 1. Geofencing check
    const settings = await attendanceRepository.getSettings();
    if (settings && settings.geofencing_enabled) {
      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        throw { statusCode: 400, message: 'Geo-location coordinates are required by company policy.' };
      }
      const distance = getDistanceMeters(
        parseFloat(latitude), 
        parseFloat(longitude), 
        parseFloat(settings.geofence_latitude), 
        parseFloat(settings.geofence_longitude)
      );
      if (distance > parseInt(settings.geofence_radius_meters || 200, 10)) {
        throw { statusCode: 400, message: `Clock-in blocked: You are outside the authorized geofence radius (${Math.round(distance)}m away).` };
      }
    }

    // Resolve shift assignment
    const shift = await shiftService.getEmployeeShift(employeeId, today);
    if (!shift) {
      throw { statusCode: 500, message: 'No active work shift assigned.' };
    }

    let clockInDateStr = today;
    let resolvedShift = shift;

    // Cross-date night shift detection on clock-in:
    // If checking in after midnight but before 5 AM, check if yesterday was a night shift and user has not clocked in yet.
    const currentHour = clockInTime.getHours();
    if (currentHour >= 0 && currentHour < 5) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayShift = await shiftService.getEmployeeShift(employeeId, yesterdayStr);
      if (yesterdayShift && yesterdayShift.type === 'night') {
        const yesterdayRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, yesterdayStr);
        if (!yesterdayRecord) {
          clockInDateStr = yesterdayStr;
          resolvedShift = yesterdayShift;
        }
      }
    }

    const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, clockInDateStr);
    if (existing) {
      throw { statusCode: 400, message: 'Already clocked in for this shift date' };
    }

    // Determine status (late/present)
    let status = 'present';
    if (resolvedShift.type === 'flexible') {
      if (resolvedShift.flexible_end_range) {
        const [eh, em, es] = resolvedShift.flexible_end_range.split(':').map(Number);
        const limitTime = new Date(clockInTime);
        limitTime.setHours(eh, em, es || 0, 0);
        if (clockInTime > limitTime) {
          status = 'late';
        }
      }
    } else {
      // fixed, night, rotational
      const [sh, sm, ss] = resolvedShift.start_time.split(':').map(Number);
      const shiftStart = new Date(clockInDateStr);
      shiftStart.setHours(sh, sm, ss || 0, 0);
      const lateThreshold = new Date(shiftStart.getTime() + (resolvedShift.grace_time_minutes || 0) * 60 * 1000);
      if (clockInTime > lateThreshold) {
        status = 'late';
      }
    }

    const record = await attendanceRepository.create({
      employeeId,
      date: clockInDateStr,
      clockIn: clockInTime,
      status,
      shiftId: resolvedShift.id,
      checkInLatitude: req.body.latitude || null,
      checkInLongitude: req.body.longitude || null,
      checkInAddress: req.body.address || null,
      deviceInfo: req.body.deviceInfo || getDeviceInfoFromReq(req),
      isWfh: req.body.isWfh || false,
      isOnDuty: req.body.isOnDuty || false,
    });

    await auditLog(userId, 'CLOCK_IN', 'attendance', record.id, null, record, req);
    
    // Send notification
    await notificationService.create(
      userId,
      'attendance',
      'Shift Started',
      `You successfully clocked in for ${resolvedShift.name} at ${clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      {},
      '/attendance'
    );

    return record;
  }

  async clockOut(employeeId, userId, req) {
    const today = new Date().toISOString().split('T')[0];
    const clockOutTime = new Date();

    // 1. Geofencing check on clock out
    const settings = await attendanceRepository.getSettings();
    if (settings && settings.geofencing_enabled) {
      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        throw { statusCode: 400, message: 'Geo-location coordinates are required by company policy.' };
      }
      const distance = getDistanceMeters(
        parseFloat(latitude), 
        parseFloat(longitude), 
        parseFloat(settings.geofence_latitude), 
        parseFloat(settings.geofence_longitude)
      );
      if (distance > parseInt(settings.geofence_radius_meters || 200, 10)) {
        throw { statusCode: 400, message: `Clock-out blocked: You are outside the authorized geofence radius (${Math.round(distance)}m away).` };
      }
    }

    // Find active record
    let record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (!record || record.clock_out) {
      // Check for active night shift from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, yesterdayStr);
      if (yesterdayRecord && !yesterdayRecord.clock_out) {
        const yesterdayShift = await shiftService.getEmployeeShift(employeeId, yesterdayStr);
        if (yesterdayShift && yesterdayShift.type === 'night') {
          record = yesterdayRecord;
        }
      }
    }

    if (!record) {
      throw { statusCode: 400, message: 'No active clock-in record found for today or yesterday.' };
    }
    if (record.clock_out) {
      throw { statusCode: 400, message: 'Already clocked out.' };
    }

    const shift = await shiftService.getById(record.shift_id);
    const clockInTime = new Date(record.clock_in);

    // Calculate work hours minus break duration
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const breakMin = record.break_duration_minutes || 0;
    const workHours = parseFloat(((diffMs / (1000 * 60 * 60)) - (breakMin / 60)).toFixed(2));

    const halfThreshold = parseFloat(settings?.half_day_threshold || 4.00);
    const fullThreshold = parseFloat(settings?.full_day_threshold || 8.00);

    let finalStatus = record.status;
    if (workHours < halfThreshold) {
      finalStatus = 'absent';
    } else if (workHours >= halfThreshold && workHours < fullThreshold) {
      finalStatus = 'half_day';
    }

    // Overtime
    let overtimeHours = 0.00;
    if (settings && settings.overtime_enabled) {
      const otThreshold = parseFloat(settings.overtime_threshold_hours || 9.00);
      if (workHours > otThreshold) {
        overtimeHours = parseFloat((workHours - otThreshold).toFixed(2));
      }
    }

    const updated = await attendanceRepository.update(record.id, {
      clockOut: clockOutTime,
      status: finalStatus,
      workHours: Math.max(0, workHours),
      overtimeHours,
      checkOutLatitude: req.body.latitude || null,
      checkOutLongitude: req.body.longitude || null,
      checkOutAddress: req.body.address || null,
    });

    await auditLog(userId, 'CLOCK_OUT', 'attendance', record.id, record, updated, req);

    await notificationService.create(
      userId,
      'attendance',
      'Shift Completed',
      `You clocked out successfully. Total work hours: ${workHours} hrs.`,
      {},
      '/attendance'
    );

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
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (record) {
      const activeBreak = await attendanceRepository.getActiveBreak(record.id);
      record.activeBreak = activeBreak;
    }
    return record;
  }

  async startBreak(employeeId, breakType, userId, req) {
    const today = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw { statusCode: 400, message: 'Must clock in before starting a break' };
    }
    if (record.clock_out) {
      throw { statusCode: 400, message: 'Cannot start a break after clocking out' };
    }

    const activeBreak = await attendanceRepository.getActiveBreak(record.id);
    if (activeBreak) {
      throw { statusCode: 400, message: 'Already on an active break' };
    }

    const brk = await attendanceRepository.startBreak(record.id, breakType);
    await auditLog(userId, 'START_BREAK', 'attendance_breaks', brk.id, null, brk, req);
    return brk;
  }

  async endBreak(employeeId, userId, req) {
    const today = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findByEmployeeAndDate(employeeId, today);

    if (!record) {
      throw { statusCode: 400, message: 'No active attendance record found for today' };
    }

    const activeBreak = await attendanceRepository.getActiveBreak(record.id);
    if (!activeBreak) {
      throw { statusCode: 400, message: 'Not currently on a break' };
    }

    const brk = await attendanceRepository.endBreak(activeBreak.id);
    await attendanceRepository.updateTotalBreakDuration(record.id);

    await auditLog(userId, 'END_BREAK', 'attendance_breaks', brk.id, activeBreak, brk, req);
    return brk;
  }

  async syncDailyAttendance(dateStr) {
    // Find all active employees
    const { rows: employees } = await query(
      "SELECT id, user_id FROM employees WHERE deleted_at IS NULL AND employment_status = 'active'"
    );

    const dateObj = new Date(dateStr);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Sunday or Saturday

    // Check if this date is a public holiday
    const { rows: holidayRows } = await query('SELECT name FROM holidays WHERE date = $1', [dateStr]);
    const holidayName = holidayRows.length > 0 ? holidayRows[0].name : null;

    for (const emp of employees) {
      // Check if there is already an attendance record
      const record = await attendanceRepository.findByEmployeeAndDate(emp.id, dateStr);

      if (!record) {
        // Check for approved leave
        const { rows: leaveRows } = await query(
          `SELECT lt.name FROM leave_requests lr
           JOIN leave_types lt ON lr.leave_type_id = lt.id
           WHERE lr.employee_id = $1 
             AND lr.status = 'approved'
             AND lr.start_date <= $2 
             AND lr.end_date >= $2`,
          [emp.id, dateStr]
        );

        if (leaveRows.length > 0) {
          await attendanceRepository.create({
            employeeId: emp.id,
            date: dateStr,
            status: 'leave',
            workHours: 0.00,
          });
        } else if (holidayName) {
          await attendanceRepository.create({
            employeeId: emp.id,
            date: dateStr,
            status: 'holiday',
            workHours: 0.00,
          });
        } else if (isWeekend) {
          await attendanceRepository.create({
            employeeId: emp.id,
            date: dateStr,
            status: 'week_off',
            workHours: 0.00,
          });
        } else {
          await attendanceRepository.create({
            employeeId: emp.id,
            date: dateStr,
            status: 'absent',
            workHours: 0.00,
          });
        }
      } else if (!record.clock_out) {
        // Missed checkout: mark status as absent and work_hours = 0
        await attendanceRepository.update(record.id, {
          status: 'absent',
          workHours: 0.00,
        });
      }
    }

    return { processedCount: employees.length };
  }

  async syncBiometricLogs(logs) {
    const results = { synced: 0, failed: 0, warnings: [] };
    const settings = await attendanceRepository.getSettings();

    for (const log of logs) {
      const { employee_code, timestamp, punch_type } = log;
      if (!employee_code || !timestamp || !punch_type) {
        results.failed++;
        results.warnings.push('Invalid log format: missing code, timestamp or type.');
        continue;
      }

      // Find employee
      const { rows: emp } = await query(
        'SELECT id, user_id FROM employees WHERE employee_code = $1 AND deleted_at IS NULL',
        [employee_code]
      );
      if (emp.length === 0) {
        results.failed++;
        results.warnings.push(`Employee not found for code: ${employee_code}`);
        continue;
      }
      const employeeId = emp[0].id;
      const punchTime = new Date(timestamp);
      const dateStr = punchTime.toISOString().split('T')[0];

      if (punch_type === 'in') {
        // Clock in
        try {
          const shift = await shiftService.getEmployeeShift(employeeId, dateStr);
          const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, dateStr);

          if (existing) {
            results.failed++;
            continue; // Already exists
          }

          let status = 'present';
          if (shift.type !== 'flexible') {
            const [sh, sm, ss] = shift.start_time.split(':').map(Number);
            const shiftStart = new Date(dateStr);
            shiftStart.setHours(sh, sm, ss || 0, 0);
            const lateThreshold = new Date(shiftStart.getTime() + (shift.grace_time_minutes || 0) * 60 * 1000);
            if (punchTime > lateThreshold) status = 'late';
          }

          await attendanceRepository.create({
            employeeId,
            date: dateStr,
            clockIn: punchTime,
            status,
            shiftId: shift.id,
          });
          results.synced++;
        } catch (e) {
          results.failed++;
          results.warnings.push(`Failed to sync IN log for ${employee_code}: ${e.message}`);
        }
      } else if (punch_type === 'out') {
        // Clock out
        try {
          let record = await attendanceRepository.findByEmployeeAndDate(employeeId, dateStr);
          if (!record || record.clock_out) {
            // Check yesterday night shift
            const yesterday = new Date(dateStr);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, yesterdayStr);
            if (yesterdayRecord && !yesterdayRecord.clock_out) {
              const yesterdayShift = await shiftService.getEmployeeShift(employeeId, yesterdayStr);
              if (yesterdayShift && yesterdayShift.type === 'night') {
                record = yesterdayRecord;
              }
            }
          }

          if (!record || record.clock_out) {
            results.failed++;
            continue; // No active clock-in
          }

          const shift = await shiftService.getById(record.shift_id);
          const clockInTime = new Date(record.clock_in);
          const diffMs = punchTime.getTime() - clockInTime.getTime();
          const breakMin = record.break_duration_minutes || 0;
          const workHours = parseFloat(((diffMs / (1000 * 60 * 60)) - (breakMin / 60)).toFixed(2));

          const halfThreshold = parseFloat(settings?.half_day_threshold || 4.00);
          const fullThreshold = parseFloat(settings?.full_day_threshold || 8.00);

          let finalStatus = record.status;
          if (workHours < halfThreshold) {
            finalStatus = 'absent';
          } else if (workHours >= halfThreshold && workHours < fullThreshold) {
            finalStatus = 'half_day';
          }

          let overtimeHours = 0.00;
          if (settings?.overtime_enabled) {
            const otThreshold = parseFloat(settings.overtime_threshold_hours || 9.00);
            if (workHours > otThreshold) {
              overtimeHours = parseFloat((workHours - otThreshold).toFixed(2));
            }
          }

          await attendanceRepository.update(record.id, {
            clockOut: punchTime,
            status: finalStatus,
            workHours: Math.max(0, workHours),
            overtimeHours,
          });
          results.synced++;
        } catch (e) {
          results.failed++;
          results.warnings.push(`Failed to sync OUT log for ${employee_code}: ${e.message}`);
        }
      }
    }

    return results;
  }

  async bulkCorrectAttendance(corrections, userId, req) {
    const results = { updated: 0, created: 0, failed: 0 };

    for (const corr of corrections) {
      const { employeeId, date, clockIn, clockOut, status, workHours, overtimeHours, isWfh, isOnDuty } = corr;
      if (!employeeId || !date) {
        results.failed++;
        continue;
      }

      try {
        const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, date);
        const shift = await shiftService.getEmployeeShift(employeeId, date);

        const data = {
          clockIn: clockIn ? new Date(clockIn) : null,
          clockOut: clockOut ? new Date(clockOut) : null,
          status: status || 'present',
          workHours: workHours !== undefined ? parseFloat(workHours) : null,
          overtimeHours: overtimeHours !== undefined ? parseFloat(overtimeHours) : 0.00,
          isWfh: isWfh || false,
          isOnDuty: isOnDuty || false,
          shiftId: shift.id,
        };

        if (existing) {
          await attendanceRepository.update(existing.id, data);
          results.updated++;
          await auditLog(userId, 'CORRECT_ATTENDANCE', 'attendance', existing.id, existing, data, req);
        } else {
          const record = await attendanceRepository.create({
            employeeId,
            date,
            ...data
          });
          results.created++;
          await auditLog(userId, 'CREATE_ATTENDANCE_MANUAL', 'attendance', record.id, null, record, req);
        }
      } catch (e) {
        results.failed++;
      }
    }

    return results;
  }
}

module.exports = new AttendanceService();
