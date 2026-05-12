import jwt from 'jsonwebtoken';

/**
 * Generate a JWT for the given user payload
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify a JWT and return the decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
