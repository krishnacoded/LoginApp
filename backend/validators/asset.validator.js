const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  serialNumber: Joi.string().trim().min(2).max(100).required(),
  assetType: Joi.string().valid('laptop', 'mouse', 'monitor', 'id_card', 'access_card', 'software_license').required(),
});

const allocate = Joi.object({
  employeeId: Joi.string().uuid().required(),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const returnAsset = Joi.object({
  notes: Joi.string().trim().max(1000).allow('', null),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('available', 'allocated', 'returned', 'damaged', 'lost').required(),
  notes: Joi.string().trim().max(1000).allow('', null),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow('', null),
  assetType: Joi.string().valid('laptop', 'mouse', 'monitor', 'id_card', 'access_card', 'software_license').optional(),
  status: Joi.string().valid('available', 'allocated', 'returned', 'damaged', 'lost').optional(),
});

module.exports = { create, allocate, returnAsset, updateStatus, listQuery };
