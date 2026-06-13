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
  geofencingEnabled: Joi.boolean().optional(),
  geofenceLatitude: Joi.number().min(-90).max(90).optional().allow(null),
  geofenceLongitude: Joi.number().min(-180).max(180).optional().allow(null),
  geofenceRadiusMeters: Joi.number().integer().min(0).optional().allow(null),
  deviceTrackingEnabled: Joi.boolean().optional(),
  overtimeEnabled: Joi.boolean().optional(),
  overtimeThresholdHours: Joi.number().min(0).max(24).optional().allow(null),
  earlyDepartureThresholdTime: Joi.string().regex(timeRegex).optional().allow(null),
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
