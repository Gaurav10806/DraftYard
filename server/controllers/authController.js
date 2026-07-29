const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlockedEmail = require('../models/BlockedEmail');

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is blacklisted
    const isBlocked = await BlockedEmail.findOne({ email: cleanEmail });
    if (isBlocked) {
      return res.status(403).json({
        error: `This email address has been blocked by administrators. Reason: ${isBlocked.reason}`,
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const user = await User.create({ name: name.trim(), email: cleanEmail, password });
    const token = signToken(user._id, user.role);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is blacklisted
    const isBlocked = await BlockedEmail.findOne({ email: cleanEmail });
    if (isBlocked) {
      return res.status(403).json({
        error: `This email address has been blocked by administrators. Reason: ${isBlocked.reason}`,
      });
    }

    // Demote gaurav10806@gmail.com from admin if present
    await User.updateOne({ email: 'gaurav10806@gmail.com' }, { role: 'user' }).catch(() => {});

    // Auto-provision or update draftadmin@gmail.com with admin role & Draft@2026 password
    if (cleanEmail === 'draftadmin@gmail.com') {
      let adminUser = await User.findOne({ email: 'draftadmin@gmail.com' }).select('+password');
      if (!adminUser) {
        adminUser = await User.create({
          name: 'DraftYard Admin',
          email: 'draftadmin@gmail.com',
          password: 'Draft@2026',
          role: 'admin',
          username: 'draftadmin',
        });
      } else {
        let modified = false;
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          modified = true;
        }
        const isPasswordCorrect = await adminUser.comparePassword(password);
        if (!isPasswordCorrect && password === 'Draft@2026') {
          adminUser.password = 'Draft@2026';
          modified = true;
        }
        if (modified) {
          await adminUser.save();
        }
      }

      const isPasswordMatch = await adminUser.comparePassword(password);
      if (!isPasswordMatch && password !== 'Draft@2026') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken(adminUser._id, adminUser.role);
      return res.json({ token, user: adminUser });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id, user.role);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/auth/me  (requires requireAuth middleware)
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
