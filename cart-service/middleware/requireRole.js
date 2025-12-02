// middleware/requireRole.js
module.exports = function requireRole(expectedRole) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (req.user.role !== expectedRole) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};
