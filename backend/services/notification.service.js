const { query } = require('../config/database');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

class NotificationService {
  async getAll(userId, filters = {}) {
    // Check for expiring documents first
    await this.checkDocumentExpiry(userId);

    const { page, limit, offset } = getPaginationParams(filters);
    const conditions = ['user_id = $1'];
    const params = [userId];

    if (filters.unreadOnly === true || filters.unreadOnly === 'true') {
      conditions.push('is_read = FALSE');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const count = await query(`SELECT COUNT(*) as total FROM notifications ${where}`, params);
    const unread = await query('SELECT COUNT(*) as total FROM notifications WHERE user_id = $1 AND is_read = FALSE', [userId]);
    const data = await query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [...params, limit, offset]
    );

    return {
      notifications: data.rows,
      unreadCount: parseInt(unread.rows[0].total, 10),
      pagination: buildPaginationMeta(parseInt(count.rows[0].total, 10), page, limit),
    };
  }

  async checkDocumentExpiry(userId) {
    try {
      // Find employee ID for this user
      const { rows: emp } = await query('SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
      if (emp.length === 0) return;
      const employeeId = emp[0].id;

      // Find documents expiring within 30 days
      const { rows: expiringDocs } = await query(
        `SELECT id, document_name, expiry_date
         FROM documents
         WHERE employee_id = $1
           AND expiry_date IS NOT NULL
           AND expiry_date <= NOW() + INTERVAL '30 days'
           AND deleted_at IS NULL`,
        [employeeId]
      );

      for (const doc of expiringDocs) {
        // Check if notification already exists
        const { rows: existing } = await query(
          `SELECT id FROM notifications
           WHERE user_id = $1 AND type = 'document_expiry' AND (data->>'documentId') = $2`,
          [userId, doc.id]
        );

        if (existing.length === 0) {
          const expiryDateFormatted = new Date(doc.expiry_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          await this.create(
            userId,
            'document_expiry',
            'Document Expiring Soon',
            `Your document "${doc.document_name}" is set to expire on ${expiryDateFormatted}.`,
            { documentId: doc.id },
            '/documents'
          );
        }
      }
    } catch (err) {
      console.error('Error checking document expiry notifications:', err);
    }
  }

  async create(userId, type, title, message, data = {}, actionUrl = null) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), actionUrl]
    );
    return result.rows[0];
  }

  async markRead(id, userId) {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  async markAllRead(userId) {
    await query('UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE', [userId]);
  }

  async delete(id, userId) {
    await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

module.exports = new NotificationService();
