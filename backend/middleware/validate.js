const ApiResponse = require('../utils/response');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return ApiResponse.badRequest(
      res,
      'Validation failed',
      error.details.map((detail) => detail.message.replace(/"/g, ''))
    );
  }

  req[source] = value;
  next();
};

module.exports = validate;
