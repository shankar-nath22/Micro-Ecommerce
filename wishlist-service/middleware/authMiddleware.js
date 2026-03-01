const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "FmX2a9Pce4zQ1Lp98NsTy7WqR5vUb6KdGh1Jm2LoWp9Zx3YqHr8St4VuCe7xDf9";

const authenticate = (req, res, next) => {
    // 1. Check for Gateway headers
    const userId = req.header("X-USER-ID");
    const role = req.header("X-USER-ROLE");
    const email = req.header("X-USER-EMAIL");

    if (userId) {
        req.user = {
            id: userId,
            role: role || "USER",
            email: email || ""
        };
        return next();
    }

    // 2. Fallback to direct JWT (for local testing)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Map userId from Java JWT to id
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            email: decoded.sub || decoded.email
        };
        next();
    } catch (err) {
        console.error("[Wishlist Auth] JWT Verify Error:", err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user && (req.user.role === role || req.user.role === 'ADMIN')) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};

module.exports = { authenticate, requireRole };
