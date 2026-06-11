const http = require('http');

const postJSON = (path, body, token = null) => {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataStr.length
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
      'Content-Length': dataStr.length
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
  console.log('======== RUNNING INTEGRATION RBAC TESTS ========');
  
  try {
    // 1. Get tokens
    console.log('Logging in as all roles...');
    const adminToken = await login('pranay@isoftzone.com', '123456');
    const managerToken = await login('rahul@isoftzone.com', '123456');
    const hrToken = await login('priya@isoftzone.com', '123456');
    const employeeToken = await login('amit@isoftzone.com', '123456');
    console.log('✅ All tokens retrieved successfully.\n');

    let passed = true;

    // Helper to evaluate test
    const assertStatus = (description, actual, expected) => {
      if (actual === expected) {
        console.log(`PASS: ${description} (Status: ${actual})`);
      } else {
        console.error(`FAIL: ${description} (Expected: ${expected}, Got: ${actual})`);
        passed = false;
      }
    };

    // Test Case 1: Employee trying to view audit logs (should be forbidden: 403)
    const res1 = await getJSON('/audit-logs', employeeToken);
    assertStatus('Employee fetching audit logs', res1.status, 403);

    // Test Case 2: Manager trying to view audit logs (should be forbidden: 403)
    const res2 = await getJSON('/audit-logs', managerToken);
    assertStatus('Manager fetching audit logs', res2.status, 403);

    // Test Case 3: HR trying to view audit logs (should be allowed: 200)
    const res3 = await getJSON('/audit-logs', hrToken);
    assertStatus('HR fetching audit logs', res3.status, 200);

    // Test Case 4: Admin trying to view audit logs (should be allowed: 200)
    const res4 = await getJSON('/audit-logs', adminToken);
    assertStatus('Admin fetching audit logs', res4.status, 200);

    // Test Case 5: Employee trying to change role (should be forbidden: 403)
    const targetUserId = '66666666-6666-6666-6666-666666666004'; // amit's user id
    const newRoleId = 3; // hr
    const res5 = await putJSON(`/auth/users/${targetUserId}/role`, { roleId: newRoleId }, employeeToken);
    assertStatus('Employee changing user role', res5.status, 403);

    // Test Case 6: HR trying to change user role (should be forbidden at route level: 403)
    const res6 = await putJSON(`/auth/users/${targetUserId}/role`, { roleId: newRoleId }, hrToken);
    assertStatus('HR changing user role', res6.status, 403);

    // Test Case 7: Admin trying to change user role (should be allowed: 200)
    // Let's change amit's role back to employee role (ID 4)
    const res7 = await putJSON(`/auth/users/${targetUserId}/role`, { roleId: 4 }, adminToken);
    assertStatus('Admin changing user role to Employee', res7.status, 200);

    // Test Case 8: Employee downloading reports (should be forbidden: 403)
    const res8 = await getJSON('/reports/leaves', employeeToken);
    assertStatus('Employee exporting leave reports', res8.status, 403);

    // Test Case 9: Manager downloading reports (should be allowed: 200)
    const res9 = await getJSON('/reports/leaves', managerToken);
    assertStatus('Manager exporting leave reports', res9.status, 200);

    // Test Case 10: HR downloading reports (should be allowed: 200)
    const res10 = await getJSON('/reports/leaves', hrToken);
    assertStatus('HR exporting leave reports', res10.status, 200);

    // Test Case 11: Admin downloading reports (should be allowed: 200)
    const res11 = await getJSON('/reports/leaves', adminToken);
    assertStatus('Admin exporting leave reports', res11.status, 200);

    console.log('\n================================================');
    if (passed) {
      console.log('🎉 ALL INTEGRATION RBAC TESTS PASSED SUCCESSFULLY! 🎉');
      process.exit(0);
    } else {
      console.error('❌ SOME INTEGRATION RBAC TESTS FAILED! ❌');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test script failed to run:', error);
    process.exit(1);
  }
}

// Run immediately
runTests();
