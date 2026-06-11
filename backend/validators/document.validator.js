const Joi = require('joi');

const documentTypes = ['resume', 'id_proof', 'certificate', 'contract', 'tax', 'performance', 'other'];

const upload = Joi.object({
  documentType: Joi.string().valid(...documentTypes).default('other'),
  documentName: Joi.string().trim().min(2).max(180).required(),
  notes: Joi.string().trim().max(1000).allow('', null),
  expiryDate: Joi.date().iso().greater('now').allow(null),
});

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employeeId: Joi.string().uuid().optional(),
  documentType: Joi.string().valid(...documentTypes).optional(),
  verified: Joi.boolean().truthy('true').falsy('false').optional(),
  search: Joi.string().trim().max(120).allow('', null),
});

const verify = Joi.object({
  isVerified: Joi.boolean().required(),
  verificationNotes: Joi.string().trim().max(1000).allow('', null),
});

module.exports = { upload, list, verify, documentTypes };
