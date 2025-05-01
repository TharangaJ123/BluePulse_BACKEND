const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a new JWT secret
const generateNewJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.user_role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

const generateRefreshToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    {
      userId: user._id,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  generateNewJWTSecret
}; 