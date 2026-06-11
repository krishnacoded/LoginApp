const Joi = require('joi');

const id = Joi.string().uuid();

const skill = Joi.object({
  skillId: id.required(),
  proficiencyLevel: Joi.number().integer().min(1).max(5).default(3),
  yearsExperience: Joi.number().min(0).max(60).default(0),
  isPrimary: Joi.boolean().default(false),
});

const create = Joi.object({
  userId: id.allow(null),
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  dateOfBirth: Joi.date().iso().less('now').allow(null),
  gender: Joi.string().valid('male', 'female', 'other', 'non_binary', 'prefer_not_to_say').allow(null),
  phone: Joi.string().trim().max(32).allow('', null),
  personalEmail: Joi.string().trim().lowercase().email().allow('', null),
  address: Joi.object().unknown(true).default({}),
  emergencyContact: Joi.object().unknown(true).default({}),
  departmentId: id.allow(null),
  designation: Joi.string().trim().max(140).allow('', null),
  employmentType: Joi.string().valid('full_time', 'part_time', 'contract', 'intern').default('full_time'),
  employmentStatus: Joi.string().valid('active', 'inactive', 'on_leave', 'probation', 'terminated').default('active'),
  joiningDate: Joi.date().iso().allow(null),
  managerId: id.allow(null),
  salary: Joi.number().min(0).allow(null),
  bio: Joi.string().trim().max(2000).allow('', null),
  linkedinUrl: Joi.string().uri().allow('', null),
  skills: Joi.array().items(skill).default([]),
});

const update = create.fork(['firstName', 'lastName'], (schema) => schema.optional());

const list = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(120).allow('', null),
  department: id.optional(),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'probation', 'terminated').optional(),
  employmentType: Joi.string().valid('full_time', 'part_time', 'contract', 'intern').optional(),
  sortBy: Joi.string().valid('first_name', 'last_name', 'employee_code', 'joining_date', 'created_at').optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
});

module.exports = { create, update, list };
