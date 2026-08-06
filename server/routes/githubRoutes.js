const express = require('express');
const router = express.Router();
const {
  getGithubAuthUrl,
  githubCallback,
  getGithubStatus,
  disconnectGithub,
  getUserRepos,
  importGithubRepo,
} = require('../controllers/githubController');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /auth/github
router.get('/github', requireAuth, getGithubAuthUrl);

// GET /auth/github/callback
router.get('/github/callback', githubCallback);

// GET /auth/github/status
router.get('/github/status', requireAuth, getGithubStatus);

// POST /auth/github/disconnect
router.post('/github/disconnect', requireAuth, disconnectGithub);

// GET /github/repos (mounted under /github in server.js)
router.get('/repos', requireAuth, getUserRepos);

// POST /github/import
router.post('/import', requireAuth, importGithubRepo);

module.exports = router;
