const allowedRole = (roles = []) => {
  if (!Array.isArray(roles)) {
    throw new Error('roles must be an array');
  }

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

const notAllowedRole = (roles = []) => {
  if (!Array.isArray(roles)) {
    throw new Error('roles must be an array');
  }

  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = { allowedRole, notAllowedRole };
