const Joi = require('joi');

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'number')
  .required();

const register = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password,
  roleId: Joi.number().integer().positive().optional(),
});

const login = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password.invalid(Joi.ref('currentPassword')),
});

module.exports = { register, login, refresh, changePassword };
