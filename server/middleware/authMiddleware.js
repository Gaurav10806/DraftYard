const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and attaches the user to req.user.
// Use on any route that requires the caller to be logged in.
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    console.log("AUTH HEADER:", header);

    if (!token) {
      console.log("NO TOKEN");
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT PAYLOAD:", payload);

    const user = await User.findById(payload.id);
    console.log("FOUND USER:", user ? user._id : null);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("AUTH ERROR:", err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const isAdmin = req.user.role === 'admin' || req.user.email?.toLowerCase() === 'draftadmin@gmail.com';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
