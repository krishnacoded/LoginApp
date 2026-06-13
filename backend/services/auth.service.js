const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendVerificationEmail } = require('./email.service');
const notificationService = require('./notification.service');
const { auditLog } = require('../middleware/audit');
const {
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
} = require('../utils/jwt');

class AuthService {
async register(data) {
  const {
    email,
    password,
    firstName,
    lastName,
  } = data;

  const { getClient } = require('../config/database');
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw {
        statusCode: 409,
        message: 'Email already registered',
      };
    }

    // Employee role only
    const roleResult = await client.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = 'employee'
      `
    );

    if (roleResult.rows.length === 0) {
      throw {
        statusCode: 500,
        message: 'Employee role not found',
      };
    }


    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    const userResult = await client.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        role_id,
        is_active,
        is_email_verified
      )
      VALUES ($1, $2, $3, TRUE, $4)
      RETURNING id, email
      `,
      [
        email.toLowerCase(),
        passwordHash,
        roleResult.rows[0].id,
        !requireVerification,
      ]
    );

    const user = userResult.rows[0];

    // Also insert into user_roles junction table for multi-role support
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, roleResult.rows[0].id]
    );

    // Generate employee code
    const { rows: codes } = await client.query(
      "SELECT employee_code FROM employees WHERE employee_code LIKE 'EMP%'"
    );
    let maxNum = 0;
    for (const row of codes) {
      const numPart = row.employee_code.substring(3);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    const employeeCode = `EMP${String(maxNum + 1).padStart(4, '0')}`;

    const employeeResult = await client.query(
      `
      INSERT INTO employees (
        user_id,
        employee_code,
        first_name,
        last_name,
        personal_email,
        employment_status,
        employment_type,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5,
        'active',
        'full_time',
        TRUE
      )
      RETURNING id
      `,
      [
        user.id,
        employeeCode,
        firstName,
        lastName,
        email.toLowerCase(),
      ]
    );

    let verificationToken = null;
    if (requireVerification) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      await client.query(
        `
        INSERT INTO email_verification_tokens (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '24 hours'
        )
        `,
        [user.id, hashToken(verificationToken)]
      );
    }

    await client.query('COMMIT');

    let verificationEmailSent = false;
    if (requireVerification && verificationToken) {
      try {
        const emailResult = await sendVerificationEmail({
          to: user.email,
          firstName,
          token: verificationToken,
        });
        verificationEmailSent = !!emailResult.sent;
      } catch (emailError) {
        console.error('Failed to send verification email during registration:', emailError);
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: 'employee',
      roles: ['employee'],
      employeeId: employeeResult.rows[0].id,
      employeeCode,
      firstName,
      lastName,
      verificationEmailSent,
    };

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // ignore rollback errors if transaction was already committed or aborted
    }
    throw error;
  } finally {
    client.release();
  }
}
  async login(email, password, ip, userAgent) {
    const userResult = await query(
      `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.role_id,
        u.is_active,
        u.is_email_verified,
        u.failed_login_attempts,
        u.locked_until,
        r.name AS role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email = $1
      AND u.deleted_at IS NULL
      `,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Audit failed login — unknown user
      try {
        await auditLog(null, 'FAILED_LOGIN', 'auth', null, null, { email: email.toLowerCase(), reason: 'unknown_user' }, { ip, headers: { 'user-agent': userAgent } });
      } catch (e) { /* silent */ }
      throw {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    const user = userResult.rows[0];

    // Account lockout check — 5 failed attempts → 15 minute lock
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      try {
        await auditLog(user.id, 'FAILED_LOGIN', 'auth', user.id, null, { email: email.toLowerCase(), reason: 'account_locked', locked_until: user.locked_until }, { ip, headers: { 'user-agent': userAgent } });
      } catch (e) { /* silent */ }
      throw {
        statusCode: 423,
        message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      };
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      if (newAttempts >= MAX_ATTEMPTS) {
        await query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '${LOCKOUT_MINUTES} minutes' WHERE id = $2`,
          [newAttempts, user.id]
        );
      } else {
        await query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
      }

      try {
        await auditLog(user.id, 'FAILED_LOGIN', 'auth', user.id, null, { email: email.toLowerCase(), reason: 'invalid_password', attempt: newAttempts }, { ip, headers: { 'user-agent': userAgent } });
      } catch (e) { /* silent */ }

      throw {
        statusCode: 401,
        message: 'Invalid credentials',
      };
    }

    if (!user.is_active) {
      throw {
        statusCode: 403,
        message: 'Account is inactive',
      };
    }

    if (!user.is_email_verified) {
      throw {
        statusCode: 403,
        message: 'Please verify your email before signing in',
      };
    }

    // Successful login — reset failed attempts and lockout
    await query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    const { accessToken, refreshToken } =
      generateTokenPair(user);

    const tokenHash = hashToken(refreshToken);

    await query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '7 days',
        $3,
        $4
      )
      `,
      [
        user.id,
        tokenHash,
        ip || null,
        userAgent || null,
      ]
    );

    await query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    // Load user with roles and resolved permissions for response
    const empResult = await query(
      `SELECT u.id, u.email, u.is_active, u.last_login, u.created_at,
              r.name as role, r.permissions,
              e.id as employee_id, e.employee_code, e.first_name, e.last_name,
              e.profile_picture_url, e.designation, e.department_id,
              d.name as department_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id AND e.deleted_at IS NULL
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.id = $1`,
      [user.id]
    );

    // Load all roles from user_roles junction
    const { rows: roleRows } = await query(
      'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1',
      [user.id]
    );
    const roles = roleRows.length > 0 ? roleRows.map(r => r.name) : (empResult.rows[0]?.role ? [empResult.rows[0].role] : []);

    // Load resolved permissions
    let resolvedPermissions = [];
    const hasAll = roles.includes('admin') || (empResult.rows[0]?.permissions || []).includes('all');
    if (hasAll) {
      resolvedPermissions = ['all'];
    } else {
      const { rows: permRows } = await query(
        `SELECT DISTINCT p.code FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = $1`,
        [user.id]
      );
      resolvedPermissions = permRows.map(r => r.code);
    }

    const userData = { ...empResult.rows[0], roles, resolvedPermissions };

    return {
      accessToken,
      refreshToken,
      user: userData,
    };
  }

  async refreshToken(refreshToken, ip, userAgent) {

    const tokenHash = hashToken(refreshToken);

    const tokenResult = await query(
      `
      SELECT *
      FROM refresh_tokens
      WHERE token_hash = $1
      AND is_revoked = FALSE
      `,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      throw {
        statusCode: 401,
        message: 'Invalid refresh token',
      };
    }

    // Fix: use the stored token's user_id instead of undefined 'decoded'
    const storedToken = tokenResult.rows[0];

    // Check token expiry
    if (new Date(storedToken.expires_at) < new Date()) {
      await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [storedToken.id]);
      throw { statusCode: 401, message: 'Refresh token expired' };
    }

    const userResult = await query(
      `
      SELECT
        u.id,
        u.email,
        u.role_id,
        r.name AS role_name,
        r.permissions
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      `,
      [storedToken.user_id]
    );

    if (userResult.rows.length === 0) {
      throw {
        statusCode: 401,
        message: 'User not found',
      };
    }

    await query(
      `
      UPDATE refresh_tokens
      SET is_revoked = TRUE
      WHERE token_hash = $1
      `,
      [tokenHash]
    );

    const user = userResult.rows[0];

    const tokens = generateTokenPair(user);

    await query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '7 days',
        $3,
        $4
      )
      `,
      [
        user.id,
        hashToken(tokens.refreshToken),
        ip || null,
        userAgent || null,
      ]
    );

    return tokens;
  }

  async verifyEmail(token) {
    if (!token || typeof token !== 'string') {
      throw { statusCode: 400, message: 'Verification token is required' };
    }

    const tokenHash = hashToken(token);
    const { rows } = await query(
      `
      SELECT evt.id, evt.user_id, evt.expires_at, evt.verified_at, u.is_email_verified
      FROM email_verification_tokens evt
      JOIN users u ON u.id = evt.user_id
      WHERE evt.token_hash = $1
      `,
      [tokenHash]
    );

    if (rows.length === 0) {
      throw { statusCode: 400, message: 'Invalid verification link' };
    }

    const record = rows[0];

    if (record.is_email_verified || record.verified_at) {
      return { alreadyVerified: true };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw { statusCode: 400, message: 'Verification link has expired' };
    }

    await query(
      `
      UPDATE users
      SET is_email_verified = TRUE, updated_at = NOW()
      WHERE id = $1
      `,
      [record.user_id]
    );

    await query(
      `
      UPDATE email_verification_tokens
      SET verified_at = NOW()
      WHERE id = $1
      `,
      [record.id]
    );

    return { alreadyVerified: false };
  }

  async logout(refreshToken) {
    if (!refreshToken) return;

    const tokenHash = hashToken(refreshToken);

    await query(
      `
      UPDATE refresh_tokens
      SET is_revoked = TRUE
      WHERE token_hash = $1
      `,
      [tokenHash]
    );
  }

  async changePassword(
    userId,
    currentPassword,
    newPassword
  ) {
    const result = await query(
      `
      SELECT password_hash
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    const valid = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!valid) {
      throw {
        statusCode: 400,
        message: 'Current password incorrect',
      };
    }

    const newHash = await bcrypt.hash(
      newPassword,
      12
    );

    await query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      `,
      [newHash, userId]
    );

    // Audit log for password change
    try {
      await auditLog(userId, 'CHANGE_PASSWORD', 'users', userId, null, { event: 'password_changed' });
    } catch (e) { /* silent */ }

    // Trigger notification
    try {
      await notificationService.create(
        userId,
        'password_changed',
        'Security Alert: Password Changed',
        'Your password has been changed successfully. If you did not perform this action, please contact support immediately.',
        {},
        '/settings'
      );
    } catch (err) {
      console.error('Error creating password change notification:', err);
    }
  }

  async forgotPassword(email) {
    // Find user by email (don't reveal if user doesn't exist - always return success)
    const { rows } = await query(
      'SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return { sent: true }; // Don't reveal user existence
    }

    const user = rows[0];

    // Invalidate any existing reset tokens
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // Generate new token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    );

    // Get employee first name for email
    const { rows: empRows } = await query(
      'SELECT first_name FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
      [user.id]
    );
    const firstName = empRows[0]?.first_name || null;

    // Send email
    const { sendPasswordResetEmail } = require('./email.service');
    try {
      await sendPasswordResetEmail({ to: user.email, firstName, token: resetToken });
    } catch (err) {
      console.error('Error sending password reset email:', err);
    }

    return { sent: true };
  }

  async resetPassword(token, newPassword) {
    if (!token || typeof token !== 'string') {
      throw { statusCode: 400, message: 'Reset token is required' };
    }

    const tokenHash = hashToken(token);
    const { rows } = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      throw { statusCode: 400, message: 'Invalid or expired reset link' };
    }

    const record = rows[0];

    if (record.used_at) {
      throw { statusCode: 400, message: 'This reset link has already been used' };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      throw { statusCode: 400, message: 'This reset link has expired' };
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, record.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [record.id]);

    // Revoke all refresh tokens for security
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [record.user_id]);

    // Send notification
    try {
      await notificationService.create(
        record.user_id,
        'password_changed',
        'Security Alert: Password Reset',
        'Your password was reset via the forgot password flow. If you did not perform this action, please contact support immediately.',
        {},
        '/settings'
      );
    } catch (err) {
      console.error('Error creating password reset notification:', err);
    }

    return { success: true };
  }

  async updateUserRole(targetUserId, newRoleId, performedByUserId, req) {
    const { rows: userRows } = await query(
      `SELECT u.id, u.email, u.role_id, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [targetUserId]
    );

    if (userRows.length === 0) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const targetUser = userRows[0];

    const { rows: roleRows } = await query('SELECT id, name FROM roles WHERE id = $1', [newRoleId]);
    if (roleRows.length === 0) {
      throw { statusCode: 400, message: 'Invalid role selection' };
    }
    const newRole = roleRows[0];

    const { rows: actorRows } = await query(
      `SELECT u.role_id, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [performedByUserId]
    );
    const actorRoleName = actorRows[0]?.role_name || '';

    if (actorRoleName === 'hr') {
      if (newRole.name === 'admin' || targetUser.role_name === 'admin') {
        throw { statusCode: 403, message: 'HR is not authorized to modify Admin roles or accounts' };
      }
    }

    await query('UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2', [newRoleId, targetUserId]);

    // Also update user_roles junction table
    // Remove old primary role and add new one
    if (targetUser.role_id) {
      await query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [targetUserId, targetUser.role_id]);
    }
    await query(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, role_id) DO NOTHING',
      [targetUserId, newRoleId, performedByUserId]
    );

    try {
      await notificationService.create(
        targetUserId,
        'role_changed',
        'Account Access Updated',
        `Your user role has been updated from ${targetUser.role_name} to ${newRole.name}.`,
        { role: newRole.name },
        '/dashboard'
      );
    } catch (err) {
      console.error('Error creating role change notification:', err);
    }

    await auditLog(
      performedByUserId,
      'CHANGE_ROLE',
      'users',
      targetUserId,
      { role_id: targetUser.role_id, role_name: targetUser.role_name },
      { role_id: newRole.id, role_name: newRole.name },
      req
    );

    return { success: true, newRole: newRole.name };
  }
}

module.exports = new AuthService();
