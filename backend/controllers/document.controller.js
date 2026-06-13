const { query } = require('../config/database');
const ApiResponse = require('../utils/response');
const documentService = require('../services/document.service');
const { auditLog } = require('../middleware/audit');
const path = require('path');
const fs = require('fs');

const getAll = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (req.user.role_name === 'employee') {
      if (filters.documentType === 'policy') {
        filters.isCompanyPolicy = true;
      } else {
        filters.employeeId = req.user.employee_id;
      }
    } else {
      if (filters.employeeId === 'company') {
        filters.isCompanyPolicy = true;
        delete filters.employeeId;
      }
    }
    const result = await documentService.getAll(filters);
    return ApiResponse.paginated(res, result.documents, result.pagination);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getEmployeeDocuments = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.*, u.email as uploaded_by_email,
              e2.first_name || ' ' || e2.last_name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       LEFT JOIN employees e2 ON e2.user_id = u.id
       WHERE d.employee_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC`,
      [req.params.employeeId]
    );
    return ApiResponse.success(res, rows);
  } catch (error) { next(error); }
};

const verify = async (req, res, next) => {
  try {
    const document = await documentService.verify(req.params.id, req.user.id, req.body, req);
    return ApiResponse.success(res, document, 'Document verification updated');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const upload = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return ApiResponse.badRequest(res, 'No files uploaded');
    }

    const { employeeId } = req.params;
    const { documentType, documentName, notes, expiryDate } = req.body;
    const uploadedDocs = [];

    const processFile = async (file, type, name) => {
      const fileUrl = `/uploads/${file.path.replace(/\\/g, '/').split('uploads/')[1]}`;
      const targetEmployeeId = employeeId === 'company' ? null : employeeId;
      const { rows } = await query(
        `INSERT INTO documents (employee_id, uploaded_by, document_type, document_name, file_name, file_path, file_size, mime_type, notes, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [targetEmployeeId, req.user.id, type || 'other', name || file.originalname,
         file.filename, fileUrl, file.size, file.mimetype, notes || null, expiryDate || null]
      );
      return rows[0];
    };

    if (req.files) {
      for (const [fieldname, files] of Object.entries(req.files)) {
        for (const file of files) {
          const doc = await processFile(file, fieldname, documentName);
          uploadedDocs.push(doc);
        }
      }
    } else if (req.file) {
      const doc = await processFile(req.file, documentType, documentName);
      uploadedDocs.push(doc);
    }

    return ApiResponse.created(res, uploadedDocs, 'Documents uploaded successfully');
  } catch (error) { next(error); }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (rows.length === 0) return ApiResponse.notFound(res);

    const doc = rows[0];

    // Soft delete
    await query(
      'UPDATE documents SET deleted_at = NOW() WHERE id = $1',
      [req.params.id]
    );

    // Try to delete physical file (non-blocking)
    try {
      const filePath = path.join(process.cwd(), doc.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    return ApiResponse.success(res, null, 'Document deleted');
  } catch (error) { next(error); }
};

const download = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (rows.length === 0) return ApiResponse.notFound(res);

    const doc = rows[0];
    const filePath = path.resolve(process.cwd(), doc.file_path);

    // Path traversal protection: ensure resolved path is within uploads directory
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      return ApiResponse.forbidden(res, 'Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      return ApiResponse.error(res, 'File not found on server', 404);
    }

    // Audit log for document download
    await auditLog(req.user.id, 'DOCUMENT_DOWNLOAD', 'document', doc.id, null, null, req);

    res.download(filePath, doc.document_name);
  } catch (error) { next(error); }
};

module.exports = { getAll, getEmployeeDocuments, upload, verify, deleteDocument, download };
