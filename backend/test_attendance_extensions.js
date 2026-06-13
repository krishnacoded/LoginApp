require('dotenv').config();
const { Pool } = require('pg');
const http = require('http');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'peopleflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Krishna',
});

const postJSON = (path, body, headersExtra = {}, token = null) => {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataStr),
      ...headersExtra
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
};

const getJSON = (path, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method: 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

const putJSON = (path, body, token = null) => {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataStr)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method: 'PUT',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
};

const login = async (email, password) => {
  const res = await postJSON('/auth/login', { email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
};

async function runTests() {
  console.log('======== RUNNING INTEGRATION ATTENDANCE TESTS ========');
  let passed = true;

  const assertCondition = (description, cond, detail = '') => {
    if (cond) {
      console.log(`✅ PASS: ${description}`);
    } else {
      console.error(`❌ FAIL: ${description}. ${detail}`);
      passed = false;
    }
  };

  try {
    // 1. Login
    console.log('Logging in...');
    const adminToken = await login('pranay@isoftzone.com', '123456');
    const employeeToken = await login('amit@isoftzone.com', '123456');
    console.log('Tokens retrieved successfully.\n');

    // Get current employee profile to know the ID
    const meRes = await getJSON('/auth/me', employeeToken);
    const employeeId = meRes.body.data.employee_id;
    const employeeCode = meRes.body.data.employee_code;
    assertCondition('Retrieve employee info', !!employeeId && !!employeeCode, `ID: ${employeeId}, Code: ${employeeCode}`);

    // Clean up existing test logs for this employee ID to run from clean state
    console.log('Cleaning up existing test data from DB...');
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM attendance_regularizations WHERE employee_id = $1', [employeeId]);
      await client.query('DELETE FROM attendance_breaks WHERE attendance_id IN (SELECT id FROM attendance WHERE employee_id = $1)', [employeeId]);
      await client.query('DELETE FROM attendance WHERE employee_id = $1', [employeeId]);
      await client.query('DELETE FROM employee_shifts WHERE employee_id = $1', [employeeId]);
      await client.query("DELETE FROM shifts WHERE name LIKE 'Evening Shift Test%'");
      console.log('✅ Clean up complete.\n');
    } finally {
      client.release();
    }

    // Get admin user info too
    const adminMeRes = await getJSON('/auth/me', adminToken);
    if (!adminMeRes || !adminMeRes.body || !adminMeRes.body.data) {
      console.error('adminMeRes failed:', JSON.stringify(adminMeRes));
    }
    const adminUserId = adminMeRes.body.data.id;

    // 2. Shifts Configuration
    console.log('\n--- Shift Management Tests ---');
    const newShift = {
      name: 'Evening Shift Test',
      type: 'fixed',
      startTime: '14:00:00',
      endTime: '22:00:00',
      graceTimeMinutes: 20
    };
    const createShiftRes = await postJSON('/shifts', newShift, {}, adminToken);
    assertCondition('Create shift as Admin', createShiftRes.status === 201, JSON.stringify(createShiftRes.body));
    const shiftId = createShiftRes.body.data.id;

    const listShiftsRes = await getJSON('/shifts', adminToken);
    assertCondition('List shifts', listShiftsRes.status === 200 && listShiftsRes.body.data.length > 0);

    const assignShiftRes = await postJSON('/shifts/assign', {
      employeeId,
      shiftId,
      startDate: new Date().toISOString().split('T')[0]
    }, {}, adminToken);
    assertCondition('Assign shift to employee', assignShiftRes.status === 200 || assignShiftRes.status === 201, JSON.stringify(assignShiftRes.body));

    // 3. Geofencing Settings Update
    console.log('\n--- Geofencing and Settings Tests ---');
    const getSettingsRes = await getJSON('/attendance/settings', adminToken);
    assertCondition('Get attendance settings', getSettingsRes.status === 200);

    // Disable geofencing first to test standard punches
    const originalSettings = getSettingsRes.body.data;
    const updateSettingsRes = await putJSON('/attendance/settings', {
      officeStartTime: originalSettings.office_start_time || '09:00:00',
      officeEndTime: originalSettings.office_end_time || '18:00:00',
      fullDayThreshold: parseFloat(originalSettings.full_day_threshold) || 8.0,
      halfDayThreshold: parseFloat(originalSettings.half_day_threshold) || 4.0,
      lateArrivalThreshold: originalSettings.late_arrival_threshold || '09:15:00',
      geofencingEnabled: false,
      geofenceLatitude: 28.6139,
      geofenceLongitude: 77.2090,
      geofenceRadiusMeters: 100,
      overtimeEnabled: true,
      overtimeThresholdHours: 9.00
    }, adminToken);
    assertCondition('Update settings (disable geofencing for initial clock in)', updateSettingsRes.status === 200, JSON.stringify(updateSettingsRes.body));

    // 4. Clock In / Breaks / Clock Out
    console.log('\n--- Clock-in & Break Tracking Tests ---');
    
    // First make sure no existing clock in for today
    const todayStr = new Date().toISOString().split('T')[0];
    
    const clockInRes = await postJSON('/attendance/clock-in', {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Test Office Location'
    }, {}, employeeToken);
    assertCondition('Clock In employee', clockInRes.status === 200 || clockInRes.status === 201, JSON.stringify(clockInRes.body));

    const todayStatusRes = await getJSON('/attendance/today', employeeToken);
    assertCondition('Verify today clock in status', todayStatusRes.status === 200 && todayStatusRes.body.data !== null && !!todayStatusRes.body.data.clock_in);

    // Break Start
    const startBreakRes = await postJSON('/attendance/break/start', { breakType: 'tea' }, {}, employeeToken);
    assertCondition('Start Break', startBreakRes.status === 200, JSON.stringify(startBreakRes.body));

    // Wait a brief moment or call end break directly (duration will be small)
    const endBreakRes = await postJSON('/attendance/break/end', {}, {}, employeeToken);
    assertCondition('End Break', endBreakRes.status === 200, JSON.stringify(endBreakRes.body));

    // Clock Out
    const clockOutRes = await postJSON('/attendance/clock-out', {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Test Office Location'
    }, {}, employeeToken);
    assertCondition('Clock Out employee', clockOutRes.status === 200, JSON.stringify(clockOutRes.body));

    // 5. Geofencing Blocking check
    console.log('\n--- Geofencing Block Test ---');
    // Enable geofencing
    await putJSON('/attendance/settings', {
      officeStartTime: '09:00:00',
      officeEndTime: '18:00:00',
      fullDayThreshold: 8.0,
      halfDayThreshold: 4.0,
      lateArrivalThreshold: '09:15:00',
      geofencingEnabled: true,
      geofenceLatitude: 28.6139, // Delhi Coords
      geofenceLongitude: 77.2090,
      geofenceRadiusMeters: 100,
      overtimeEnabled: true,
      overtimeThresholdHours: 9.00
    }, adminToken);

    // Try clocking in with far away coordinates (e.g. Mumbai 19.0760, 72.8777)
    // Wait: we already clocked in/out for today, so we should test on a mock route or handle "Already clocked in" vs "Geofence block"
    // Since we clocked out, trying to clock in again for today should give "Already clocked in for this shift date" or "Geofence block".
    // Actually, clock-in first checks geofence before checking for existing shift logs!
    // Let's verify this order in attendance.service.js:
    // Yes: 1. Geofencing check is lines 51-67, and "Already clocked in" checks are lines 96-99.
    // So if Mumbai coords are sent, it should fail with "Clock-in blocked: You are outside the authorized geofence radius"
    const farClockInRes = await postJSON('/attendance/clock-in', {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Location'
    }, {}, employeeToken);
    assertCondition('Clock In blocked by geofencing', farClockInRes.status === 400 && farClockInRes.body.message.includes('outside the authorized geofence'), JSON.stringify(farClockInRes.body));

    // Restore geofencing to disabled or correct setting
    await putJSON('/attendance/settings', {
      officeStartTime: '09:00:00',
      officeEndTime: '18:00:00',
      fullDayThreshold: 8.0,
      halfDayThreshold: 4.0,
      lateArrivalThreshold: '09:15:00',
      geofencingEnabled: false,
      geofenceLatitude: 28.6139,
      geofenceLongitude: 77.2090,
      geofenceRadiusMeters: 100,
      overtimeEnabled: true,
      overtimeThresholdHours: 9.00
    }, adminToken);

    // 6. Regularization Request Workflow
    console.log('\n--- Regularization Request Workflow Tests ---');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const applyRegRes = await postJSON('/regularizations', {
      date: yesterdayStr,
      requestType: 'missed_clock_out',
      requestedClockIn: `${yesterdayStr}T09:00:00.000Z`,
      requestedClockOut: `${yesterdayStr}T18:00:00.000Z`,
      reason: 'Forgot to punch out'
    }, {}, employeeToken);
    assertCondition('Apply for regularization', applyRegRes.status === 201, JSON.stringify(applyRegRes.body));
    const regId = applyRegRes.body.data.id;

    const getMyRegRes = await getJSON('/regularizations/my', employeeToken);
    assertCondition('Get employee\'s own regularizations', getMyRegRes.status === 200 && getMyRegRes.body.data.length > 0);

    const getTeamRegRes = await getJSON('/regularizations/team', adminToken);
    assertCondition('Get manager\'s team regularizations', getTeamRegRes.status === 200);

    const reviewRegRes = await postJSON(`/regularizations/${regId}/review`, {
      status: 'approved',
      remarks: 'Approved after verification'
    }, {}, adminToken);
    assertCondition('Review/Approve regularization as Admin/Manager', reviewRegRes.status === 200, JSON.stringify(reviewRegRes.body));

    // Verify attendance record exists for yesterday and has status "present" or correct hours
    const myLogsRes = await getJSON(`/attendance/my-logs?startDate=${yesterdayStr}&endDate=${yesterdayStr}`, employeeToken);
    assertCondition('Verify regularized attendance log update', myLogsRes.status === 200 && myLogsRes.body.data.length > 0 && myLogsRes.body.data[0].status !== 'absent');

    // 7. Biometric Sync API
    console.log('\n--- Biometric Sync API Tests ---');
    const biometricApiKey = process.env.BIOMETRIC_API_KEY || 'peopleflow_biometric_sync_secret_2026';
    
    // We will test syncing an IN punch for another day, say 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const syncBiometricRes = await postJSON('/attendance/sync/biometric', {
      logs: [
        {
          employee_code: employeeCode,
          timestamp: `${twoDaysAgoStr}T08:55:00Z`,
          punch_type: 'in'
        },
        {
          employee_code: employeeCode,
          timestamp: `${twoDaysAgoStr}T18:05:00Z`,
          punch_type: 'out'
        }
      ]
    }, { 'X-API-KEY': biometricApiKey }, null);
    assertCondition('Sync biometric punches', syncBiometricRes.status === 200 && syncBiometricRes.body.data.synced === 2, JSON.stringify(syncBiometricRes.body));

    // 8. Bulk Corrections
    console.log('\n--- Bulk Corrections Tests ---');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    const bulkCorrectRes = await postJSON('/attendance/bulk-correct', {
      corrections: [
        {
          employeeId,
          date: threeDaysAgoStr,
          clockIn: `${threeDaysAgoStr}T09:00:00Z`,
          clockOut: `${threeDaysAgoStr}T17:00:00Z`,
          status: 'present',
          workHours: 8.00,
          overtimeHours: 0.00,
          isWfh: true
        }
      ]
    }, {}, adminToken);
    assertCondition('Bulk correct attendance logs', bulkCorrectRes.status === 200 && bulkCorrectRes.body.data.updated + bulkCorrectRes.body.data.created === 1, JSON.stringify(bulkCorrectRes.body));

    console.log('\n================================================');
    await pool.end();
    if (passed) {
      console.log('🎉 ALL INTEGRATION ATTENDANCE TESTS PASSED SUCCESSFULLY! 🎉');
      process.exit(0);
    } else {
      console.error('❌ SOME INTEGRATION ATTENDANCE TESTS FAILED! ❌');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test script failed to run:', error);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

runTests();
