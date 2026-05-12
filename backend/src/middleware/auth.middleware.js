import { verifyToken } from '../services/token.service.js';

/**
 * Protect routes – verify JWT from Authorization header or cookie
 */
export const protect = (req, res, next) => {
  let token;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback: check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – no token provided',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – token invalid or expired',
    });
  }
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied – Admin privileges required',
    });
  }
};
