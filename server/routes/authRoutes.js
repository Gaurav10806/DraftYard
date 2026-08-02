const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  googleAuth,
  getGoogleAuthUrl,
  googleCallback,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
// Google OAuth routes
router.post('/google', googleAuth);
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

module.exports = router;
