const Joi = require('joi');

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow('', null),
  color: Joi.string().pattern(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).default('#a3ff29'),
  icon: Joi.string().trim().max(80).allow('', null),
});

const create = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  categoryId: Joi.string().uuid().allow(null),
  description: Joi.string().trim().max(1000).allow('', null),
});

const update = create.fork(['name'], (schema) => schema.optional()).keys({
  isActive: Joi.boolean().optional(),
});

const list = Joi.object({
  search: Joi.string().trim().max(120).allow('', null),
  categoryId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().truthy('true').falsy('false').optional(),
});

module.exports = { createCategory, create, update, list };
