const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.min': 'Role name must be at least 3 characters',
      'string.max': 'Role name must be at most 50 characters',
      'any.required': 'Role name is required',
    }),
  description: Joi.string().trim().max(500).optional().allow('', null),
  permissionIds: Joi.array().items(Joi.number().integer().positive()).optional().default([]),
});

const update = Joi.object({
  name: Joi.string().trim().min(3).max(50).optional(),
  description: Joi.string().trim().max(500).optional().allow('', null),
  permissionIds: Joi.array().items(Joi.number().integer().positive()).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const assignRole = Joi.object({
  roleId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'roleId is required' }),
});

module.exports = { create, update, assignRole };
