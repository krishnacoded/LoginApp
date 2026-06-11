const Joi = require('joi');

const apply = Joi.object({
  leaveTypeId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  reason: Joi.string().trim().min(4).max(1000).required(),
  isHalfDay: Joi.boolean().default(false),
  halfDayType: Joi.string().valid('first_half', 'second_half').when('isHalfDay', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
  attachmentUrl: Joi.string().allow('', null),
});

const decision = Joi.object({
  comment: Joi.string().trim().max(1000).allow('', null),
});

const rejection = Joi.object({
  comment: Joi.string().trim().min(3).max(1000).required(),
});

const cancel = Joi.object({
  reason: Joi.string().trim().max(1000).allow('', null),
});

module.exports = { apply, decision, rejection, cancel };
