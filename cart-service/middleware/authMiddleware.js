const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || "FmX2a9Pce4zQ1Lp98NsTy7WqR5vUb6KdGh1Jm2LoWp9Zx3YqHr8St4VuCe7xDf9";

function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, secret);
    req.user = { email: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authenticate, requireRole };
