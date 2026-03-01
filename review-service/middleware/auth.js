const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'FmX2a9Pce4zQ1Lp98NsTy7WqR5vUb6KdGh1Jm2LoWp9Zx3YqHr8St4VuCe7xDf9';

const auth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded JWT:', decoded);

        // Map JWT claims to req.user
        req.user = {
            id: String(decoded.userId || decoded.sub),
            email: decoded.email || decoded.sub,
            role: decoded.role || 'USER'
        };
        console.log('Authenticated User:', req.user);

        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = auth;
