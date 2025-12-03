const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 
  "FmX2a9Pce4zQ1Lp98NsTy7WqR5vUb6KdGh1Jm2LoWp9Zx3YqHr8St4VuCe7xDf9";

function authenticate(req, res, next) {

  // 1) Prefer gateway-forwarded header X-USER-ID
  const forwardedUserId = req.header("X-USER-ID");
  const email = req.header("X-USER-EMAIL");
  const role = req.header("X-USER-ROLE");
  if (forwardedUserId) {
    req.user = { id: forwardedUserId, email, role };
    return next();
  }
  
  // 2) Fallback: verify JWT itself (only if service is exposed to clients)
  const auth = req.headers['authorization'] || req.headers['Authorization'];

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = auth.substring(7);

  try {
    console.log("Token:", token);

    // ✔ FIXED — use default HS256
    const payload = jwt.verify(token, secret);

    req.user = {
      email: payload.sub || payload.email,
      role: payload.role,
      id: payload.userId
    };

    next();

  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
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
