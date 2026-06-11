const Joi = require('joi');

const id = Joi.string().uuid();

const create = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  code: Joi.string().trim().min(2).max(16).uppercase().required(),
  description: Joi.string().trim().max(1000).allow('', null),
  headEmployeeId: id.allow(null),
  parentDepartmentId: id.allow(null),
  budget: Joi.number().min(0).allow(null),
  location: Joi.string().trim().max(160).allow('', null),
});

const update = create.fork(['name', 'code'], (schema) => schema.optional()).keys({
  isActive: Joi.boolean().optional(),
});

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(120).allow('', null),
  isActive: Joi.boolean().truthy('true').falsy('false').optional(),
});

module.exports = { create, update, list };
