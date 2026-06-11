const { query } = require('../config/database');

const auditLog = async (userId, action, entityType, entityId, oldValues = null, newValues = null, req = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || null,
        req?.headers?.['user-agent'] || null,
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = { auditLog };