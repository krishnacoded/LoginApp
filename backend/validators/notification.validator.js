const Joi = require('joi');

const create = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().trim().max(80).required(),
  title: Joi.string().trim().min(2).max(160).required(),
  message: Joi.string().trim().min(2).max(1000).required(),
  data: Joi.object().unknown(true).default({}),
  actionUrl: Joi.string().trim().max(500).allow('', null),
});

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().truthy('true').falsy('false').default(false),
});

module.exports = { create, list };
