const Joi = require('joi');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const updateSettings = Joi.object({
  officeStartTime: Joi.string().regex(timeRegex).required().messages({
    'string.pattern.base': 'Office start time must be in HH:MM or HH:MM:SS format',
  }),
  officeEndTime: Joi.string().regex(timeRegex).required().messages({
    'string.pattern.base': 'Office end time must be in HH:MM or HH:MM:SS format',
  }),
  fullDayThreshold: Joi.number().min(0).max(24).required(),
  halfDayThreshold: Joi.number().min(0).max(Joi.ref('fullDayThreshold')).required(),
  lateArrivalThreshold: Joi.string().regex(timeRegex).required().messages({
    'string.pattern.base': 'Late arrival threshold must be in HH:MM or HH:MM:SS format',
  }),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  employeeId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day').optional(),
});

module.exports = { updateSettings, listQuery };
