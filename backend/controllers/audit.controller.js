const { query } = require('../config/database');
const ApiResponse = require('../utils/response');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.query.entityType) {
      conditions.push(`al.entity_type = $${idx++}`);
      params.push(req.query.entityType);
    }
    if (req.query.userId) {
      conditions.push(`al.user_id = $${idx++}`);
      params.push(req.query.userId);
    }
    if (req.query.action) {
      conditions.push(`al.action ILIKE $${idx++}`);
      params.push(`%${req.query.action}%`);
    }
    if (req.query.from) {
      conditions.push(`al.created_at >= $${idx++}`);
      params.push(req.query.from);
    }
    if (req.query.to) {
      conditions.push(`al.created_at <= $${idx++}`);
      params.push(req.query.to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) as total FROM audit_logs al ${where}`, params
    );

    const { rows } = await query(
      `SELECT al.*, u.email as user_email,
              e.first_name || ' ' || e.last_name as user_name,
              e.profile_picture_url
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return ApiResponse.paginated(
      res, rows,
      buildPaginationMeta(parseInt(countRes.rows[0].total), page, limit)
    );
  } catch (error) { next(error); }
};

const getEntityLogs = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { rows } = await query(
      `SELECT al.*, u.email as user_email,
              e.first_name || ' ' || e.last_name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2
       ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );
    return ApiResponse.success(res, rows);
  } catch (error) { next(error); }
};

module.exports = { getAll, getEntityLogs };