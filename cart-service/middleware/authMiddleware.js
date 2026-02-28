const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

/**
 * Main authentication middleware.
 * Priority:
 *   1) Trust API Gateway headers (X-USER-ID, X-USER-ROLE, X-USER-EMAIL)
 *   2) Fallback to direct JWT if service is called without gateway (dev only)
 */
function authenticate(req, res, next) {
  // ---- 1) Gateway-provided authentication ----
  const userId = req.header("X-USER-ID");
  const role = req.header("X-USER-ROLE");
  const email = req.header("X-USER-EMAIL");

  if (userId) {
    req.user = {
      id: userId,
      role: role || "USER",
      email: email || "",
    };
    return next();
  }

  // ---- 2) Direct token (development fallback) ----
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.substring(7);

  try {
    const payload = jwt.verify(token, secret);

    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.sub || payload.email,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role-based access control.
 * Example:
 *   app.post("/cart/add", authenticate, requireRole("USER"), addToCart)
 */
function requireRole(required) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const role = req.user.role;

    // ADMIN can access everything
    if (role === "ADMIN") return next();

    if (role !== required) {
      return res.status(403).json({ error: "Forbidden: insufficient permission" });
    }

    return next();
  };
}

module.exports = { authenticate, requireRole };
