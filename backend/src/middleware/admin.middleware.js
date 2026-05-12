/**
 * Admin-only guard – must be used AFTER protect middleware
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied – admin privileges required',
    });
  }
  next();
};
