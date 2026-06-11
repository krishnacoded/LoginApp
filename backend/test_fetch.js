const http = require('http');

const postJSON = (url, body) => {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const dataStr = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataStr.length
      }
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

const getJSON = (url, token, params = {}) => {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const query = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    const path = query ? `${u.pathname}?${query}` : u.pathname;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await postJSON('http://localhost:5000/api/v1/auth/login', {
      email: 'pranay@isoftzone.com',
      password: '123456'
    });
    const token = loginRes.body.data.accessToken;
    const empId = '77777777-7777-7777-7777-777777777004';
    console.log(`Fetching employee ${empId} details...`);
    const empRes = await getJSON(`http://localhost:5000/api/v1/employees/${empId}`, token);
    console.log('Employee Status:', empRes.status);
    console.log('Employee Body:', JSON.stringify(empRes.body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}
run();
