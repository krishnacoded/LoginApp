const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateTokenPair, verifyRefreshToken, hashToken } = require('../utils/jwt');
const { addDays } = require('date-fns');

class AuthService {
  async login(email, password, ipAddress, userAgent) {
    // Fetch user with role
    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, u.failed_login_attempts,
              u.locked_until, u.role_id, r.name as role_name, r.permissions,
              e.id as employee_id, e.first_name, e.last_name, e.profile_picture_url,
              e.designation, e.department_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const user = rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw { statusCode: 423, message: 'Account temporarily locked. Try again later.' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // Increment failed attempts
      const attempts = user.failed_login_attempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      
      await query(
        `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockedUntil, user.id]
      );
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (!user.is_active) {
      throw { statusCode: 403, message: 'Account has been deactivated' };
    }

    // Reset failed attempts, update last login
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token hash
    const tokenHash = hashToken(refreshToken);
    const expiresAt = addDays(new Date(), 7);
    
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, ipAddress, userAgent]
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_name,
        permissions: user.permissions,
        employeeId: user.employee_id,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePicture: user.profile_picture_url,
        designation: user.designation,
      },
    };
  }

  async register(data) {
    const { email, password, firstName, lastName, roleId } = data;

    // Check if email exists
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      throw { statusCode: 409, message: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Get default role (employee) if not specified
    const roleQuery = roleId
      ? await query('SELECT id FROM roles WHERE id = $1', [roleId])
      : await query("SELECT id FROM roles WHERE name = 'employee'");

    if (roleQuery.rows.length === 0) {
      throw { statusCode: 400, message: 'Invalid role' };
    }

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role_id, is_email_verified)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, email, role_id, created_at`,
      [email.toLowerCase(), passwordHash, roleQuery.rows[0].id]
    );

    const user = rows[0];

    // Generate employee code
    const { rows: countRows } = await query('SELECT COUNT(*) as cnt FROM employees');
    const empCode = `EMP${String(parseInt(countRows[0].cnt) + 1).padStart(4, '0')}`;

    // Create employee record
    const { rows: empRows } = await query(
      `INSERT INTO employees (user_id, employee_code, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [user.id, empCode, firstName, lastName]
    );

    // Create leave balances for current year
    const currentYear = new Date().getFullYear();
    const { rows: leaveTypes } = await query('SELECT id, max_days_per_year FROM leave_types WHERE is_active = TRUE');
    
    for (const lt of leaveTypes) {
      await query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [empRows[0].id, lt.id, currentYear, lt.max_days_per_year]
      );
    }

    return { id: user.id, email: user.email };
  }

  async refreshToken(token, ipAddress, userAgent) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }

    const tokenHash = hashToken(token);
    const { rows } = await query(
      `SELECT rt.id, rt.is_revoked, rt.expires_at, u.id as user_id, u.email, u.is_active,
              u.role_id, r.name as role_name, r.permissions
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE rt.token_hash = $1 AND rt.user_id = $2`,
      [tokenHash, decoded.sub]
    );

    if (rows.length === 0 || rows[0].is_revoked) {
      throw { statusCode: 401, message: 'Refresh token not found or revoked' };
    }

    const tokenRecord = rows[0];

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw { statusCode: 401, message: 'Refresh token expired' };
    }

    if (!tokenRecord.is_active) {
      throw { statusCode: 403, message: 'User account deactivated' };
    }

    // Revoke old token (rotation)
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [tokenRecord.id]);

    // Generate new pair
    const user = {
      id: tokenRecord.user_id,
      email: tokenRecord.email,
      role_id: tokenRecord.role_id,
      role_name: tokenRecord.role_name,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

    // Store new refresh token
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = addDays(new Date(), 7);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenRecord.user_id, newTokenHash, expiresAt, ipAddress, userAgent]
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token) {
    if (!token) return;
    const tokenHash = hashToken(token);
    await query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1',
      [tokenHash]
    );
  }

  async changePassword(userId, currentPassword, newPassword) {
    const { rows } = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'User not found' };

    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) throw { statusCode: 400, message: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    // Revoke all refresh tokens
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);
  }
}

module.exports = new AuthService();