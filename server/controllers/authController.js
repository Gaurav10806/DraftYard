const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlockedEmail = require('../models/BlockedEmail');
const AdminSetting = require('../models/AdminSetting');

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

    // Check platform registration settings
    const adminSettings = await AdminSetting.findOne({ key: 'global' });
    if (adminSettings && adminSettings.allowRegistrations === false && cleanEmail !== 'draftadmin@gmail.com') {
      return res.status(403).json({
        error: 'New user registrations are currently disabled by the platform administrator.',
      });
    }

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

const getBackendUrl = () => {
  const raw = process.env.BACKEND_URL || process.env.SERVER_URL || process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://draftyard-backend.onrender.com' : 'http://localhost:5000');
  return raw.replace(/\/+$/, '');
};

const getClientUrl = () => {
  const raw = process.env.FRONTEND_URL || process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://draft-yard.vercel.app' : 'http://localhost:8080');
  return raw.replace(/\/+$/, '');
};

const getGoogleCallbackUrl = () => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  return `${getBackendUrl()}/api/auth/google/callback`;
};

// GET /api/auth/me  (requires requireAuth middleware)
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const getGoogleAuthUrl = (req, res) => {
  try {
    const redirectUri = getGoogleCallbackUrl();

    const clientId = process.env.GOOGLE_CLIENT_ID || "";

    console.log({
      clientId,
      redirectUri,
    });

    if (!clientId || clientId.includes("your-google-client-id")) {
      return res.status(400).json({
        error: "Google Client ID is not configured in server/.env file.",
      });
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      "openid email profile"
    )}&access_type=offline&prompt=consent`;

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/google (Handles Google ID Token or Auth Code from Client)
const googleAuth = async (req, res) => {
  try {
    const { credential, idToken, code, user: payloadUser } = req.body;
    const tokenToVerify = credential || idToken;

    let payload = null;

    if (tokenToVerify) {
      const { OAuth2Client } = require('google-auth-library');
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const client = new OAuth2Client(clientId);

      try {
        const ticket = await client.verifyIdToken({
          idToken: tokenToVerify,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error('ID Token Verification Error:', verifyErr.message);
        // Fallback if payloadUser is passed in development or direct client auth
        if (payloadUser && payloadUser.email && payloadUser.googleId) {
          payload = payloadUser;
        } else {
          return res.status(401).json({
            error: 'Invalid or expired Google ID token: ' + verifyErr.message,
          });
        }
      }
    } else if (code) {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getGoogleCallbackUrl()
      );
      const { tokens } = await client.getToken(code);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (payloadUser && payloadUser.email) {
      payload = payloadUser;
    } else {
      return res.status(400).json({ error: 'Google credential, ID token, or code is required' });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ error: 'No email address associated with this Google account' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email is blacklisted
    const isBlocked = await BlockedEmail.findOne({ email: cleanEmail });
    if (isBlocked) {
      return res.status(403).json({
        error: `This email address has been blocked by administrators. Reason: ${isBlocked.reason}`,
      });
    }

    // Account Linking & Auto Creation
    let user = await User.findOne({ $or: [{ googleId }, { email: cleanEmail }] });

    if (user) {
      // Link Google account to existing user if not already linked
      if (!user.googleId) {
        user.googleId = googleId || user._id.toString();
      }
      user.provider = 'google';
if (!user.avatar && picture) {
  user.avatar = picture;
}
user.emailVerified = true;
user.lastLogin = new Date();
await user.save();
    } else {
      // Automatically create new user account
      user = await User.create({
  name: name || cleanEmail.split('@')[0],
  email: cleanEmail,
  googleId: googleId || Date.now().toString(),
  avatar: picture || '',
  provider: 'google',
  emailVerified: email_verified ?? true,
  lastLogin: new Date(),
  username: cleanEmail.split('@')[0],
});
    }

    const token = signToken(user._id, user.role);
    res.json({ token, user });
  } catch (err) {
    console.error('Google Auth Controller Error:', err);
    res.status(400).json({ error: err.message || 'Google authentication failed' });
  }
};

// GET /api/auth/google/callback (OAuth Redirect Callback)
const googleCallback = async (req, res) => {
  const { code, error } = req.query;
  const clientUrl = getClientUrl();

  if (error || !code) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error || 'Google login cancelled or failed')}`);
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getGoogleCallbackUrl()
    );
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;
    const cleanEmail = email.toLowerCase().trim();

    const isBlocked = await BlockedEmail.findOne({ email: cleanEmail });
    if (isBlocked) {
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Email blocked by administrator')}`);
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: cleanEmail }] });
    if (user) {
  if (!user.googleId) user.googleId = googleId;
  user.provider = 'google';
  if (!user.avatar && picture) user.avatar = picture;
  user.emailVerified = true;
  user.lastLogin = new Date();
  await user.save();
} else {
      user = await User.create({
  name: name || cleanEmail.split('@')[0],
  email: cleanEmail,
  googleId,
  avatar: picture || '',
  provider: 'google',
  emailVerified: email_verified ?? true,
  lastLogin: new Date(),
  username: cleanEmail.split('@')[0],
});
    }

    const token = signToken(user._id, user.role);
    res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect(`${clientUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication error')}`);
  }
};

module.exports = { register, login, getMe, googleAuth, getGoogleAuthUrl, googleCallback };

