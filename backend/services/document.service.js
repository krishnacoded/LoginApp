const path = require('path');
const fs = require('fs');
const repository = require('../repositories/document.repository');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');

class DocumentService {
  async getAll(filters = {}) {
    const { page, limit, offset } = getPaginationParams(filters);
    const result = await repository.findAll({ ...filters, limit, offset });
    return {
      documents: result.rows,
      pagination: buildPaginationMeta(result.total, page, limit),
    };
  }

  async getById(id) {
    const document = await repository.findById(id);
    if (!document) throw { statusCode: 404, message: 'Document not found' };
    return document;
  }

  async createFromFile(employeeId, file, body, uploadedBy, req) {
    const fileUrl = `/uploads/${file.path.replace(/\\/g, '/').split('uploads/')[1]}`;
    const document = await repository.create({
      employeeId,
      uploadedBy,
      documentType: body.documentType,
      documentName: body.documentName || file.originalname,
      fileName: file.filename,
      filePath: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      notes: body.notes,
      expiryDate: body.expiryDate,
    });
    await auditLog(uploadedBy, 'UPLOAD_DOCUMENT', 'document', document.id, null, document, req);
    return document;
  }

  async verify(id, userId, payload, req) {
    const existing = await this.getById(id);
    const updated = await repository.verify(id, userId, payload.isVerified, payload.verificationNotes);
    await auditLog(userId, 'VERIFY_DOCUMENT', 'document', id, existing, updated, req);
    return updated;
  }

  async delete(id, userId, req) {
    const document = await this.getById(id);
    await repository.softDelete(id);

    try {
      const filePath = path.join(process.cwd(), document.file_path || '');
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    await auditLog(userId, 'DELETE_DOCUMENT', 'document', id, document, null, req);
  }
}

module.exports = new DocumentService();
