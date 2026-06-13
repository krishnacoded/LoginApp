const Joi = require('joi');

const apply = Joi.object({
  attendanceId: Joi.string().uuid().optional().allow(null),
  date: Joi.date().iso().required(),
  requestType: Joi.string().valid('missed_clock_in', 'missed_clock_out', 'incorrect_hours', 'missed_all').required(),
  requestedClockIn: Joi.date().iso().optional().allow(null),
  requestedClockOut: Joi.date().iso().optional().allow(null),
  reason: Joi.string().trim().min(5).max(500).required(),
});

const review = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  remarks: Joi.string().trim().max(300).optional().allow(''),
});

module.exports = {
  apply,
  review,
};
