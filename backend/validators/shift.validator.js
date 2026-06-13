const Joi = require('joi');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const createShift = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  type: Joi.string().valid('fixed', 'flexible', 'rotational', 'night').required(),
  startTime: Joi.string().regex(timeRegex).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM or HH:MM:SS format',
  }),
  endTime: Joi.string().regex(timeRegex).required().messages({
    'string.pattern.base': 'End time must be in HH:MM or HH:MM:SS format',
  }),
  flexibleStartRange: Joi.string().regex(timeRegex).optional().allow(null).messages({
    'string.pattern.base': 'Flexible start range must be in HH:MM or HH:MM:SS format',
  }),
  flexibleEndRange: Joi.string().regex(timeRegex).optional().allow(null).messages({
    'string.pattern.base': 'Flexible end range must be in HH:MM or HH:MM:SS format',
  }),
  graceTimeMinutes: Joi.number().integer().min(0).max(120).default(15),
});

const updateShift = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  type: Joi.string().valid('fixed', 'flexible', 'rotational', 'night').optional(),
  startTime: Joi.string().regex(timeRegex).optional().messages({
    'string.pattern.base': 'Start time must be in HH:MM or HH:MM:SS format',
  }),
  endTime: Joi.string().regex(timeRegex).optional().messages({
    'string.pattern.base': 'End time must be in HH:MM or HH:MM:SS format',
  }),
  flexibleStartRange: Joi.string().regex(timeRegex).optional().allow(null).messages({
    'string.pattern.base': 'Flexible start range must be in HH:MM or HH:MM:SS format',
  }),
  flexibleEndRange: Joi.string().regex(timeRegex).optional().allow(null).messages({
    'string.pattern.base': 'Flexible end range must be in HH:MM or HH:MM:SS format',
  }),
  graceTimeMinutes: Joi.number().integer().min(0).max(120).optional(),
});

const assignShift = Joi.object({
  employeeId: Joi.string().uuid().required(),
  shiftId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().optional().allow(null),
});

const bulkAssignShift = Joi.object({
  employeeIds: Joi.array().items(Joi.string().uuid()).optional(),
  departmentId: Joi.string().uuid().optional(),
  shiftId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().optional().allow(null),
}).or('employeeIds', 'departmentId');

module.exports = {
  createShift,
  updateShift,
  assignShift,
  bulkAssignShift,
};
