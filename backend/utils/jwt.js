const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'peopleflow',
    audience: 'peopleflow-client',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'peopleflow',
    audience: 'peopleflow-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'peopleflow',
    audience: 'peopleflow-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'peopleflow',
    audience: 'peopleflow-client',
  });
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateTokenPair = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role_name,
    roleId: user.role_id,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ sub: user.id });

  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateTokenPair,
};