const { query } = require('../config/database');

class DocumentRepository {
  async findAll({ employeeId, documentType, verified, search, limit = 20, offset = 0 } = {}) {
    const conditions = ['d.deleted_at IS NULL'];
    const params = [];
    let idx = 1;

    if (employeeId) {
      conditions.push(`d.employee_id = $${idx++}`);
      params.push(employeeId);
    }
    if (documentType) {
      conditions.push(`d.document_type = $${idx++}`);
      params.push(documentType);
    }
    if (verified !== undefined) {
      conditions.push(`d.is_verified = $${idx++}`);
      params.push(verified === true || verified === 'true');
    }
    if (search) {
      conditions.push(`(d.document_name ILIKE $${idx} OR d.file_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const count = await query(`SELECT COUNT(*) as total FROM documents d ${where}`, params);
    const data = await query(
      `SELECT d.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_code,
              u.email as uploaded_by_email
       FROM documents d
       LEFT JOIN employees e ON d.employee_id = e.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { rows: data.rows, total: parseInt(count.rows[0].total, 10) };
  }

  async findById(id) {
    const { rows } = await query('SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const { rows } = await query(
      `INSERT INTO documents (
        employee_id, uploaded_by, document_type, document_name, file_name,
        file_path, file_size, mime_type, notes, expiry_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        data.employeeId,
        data.uploadedBy,
        data.documentType || 'other',
        data.documentName,
        data.fileName,
        data.filePath,
        data.fileSize,
        data.mimeType,
        data.notes || null,
        data.expiryDate || null,
      ]
    );
    return rows[0];
  }

  async verify(id, verifiedBy, isVerified) {
    const { rows } = await query(
      `UPDATE documents
       SET is_verified = $1, verified_by = $2, verified_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [isVerified, verifiedBy, id]
    );
    return rows[0] || null;
  }

  async softDelete(id) {
    await query('UPDATE documents SET deleted_at = NOW() WHERE id = $1', [id]);
  }
}

module.exports = new DocumentRepository();
