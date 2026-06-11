const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          message: 'A record with this information already exists',
          detail: err.detail,
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          message: 'Referenced record does not exist',
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          success: false,
          message: `Field '${err.column}' is required`,
        });
    }
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum allowed is 10MB',
    });
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
};

module.exports = { errorHandler, notFound };