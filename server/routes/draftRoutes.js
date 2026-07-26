console.log("🚀 draftRoutes.js loaded");
const express = require('express');
const router = express.Router();
const Draft = require('../models/draft');
const { requireAuth } = require('../middleware/authMiddleware');

// Optional auth — attaches req.user if a valid token is present, never blocks
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user) req.user = user;
  } catch (_) { /* ignore */ }
  next();
};

// POST /api/draft
router.post('/draft', optionalAuth, async (req, res) => {
  console.log("POST /api/draft hit");
  try {
    const body = { ...req.body };
    // If the caller is authenticated, link the draft to their account
    if (req.user) body.submittedBy = req.user._id;
    const draft = new Draft(body);
await draft.save();

console.log("Saved Draft:", draft);
console.log("Collection:", Draft.collection.name);

res.status(201).json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/feed
router.get('/feed', async (req, res) => {
  try {
    const { stack, stage, domain, teamSize } = req.query;
    const filter = {};
    if (stack) filter.techStack = stack;
    if (stage) filter.currentStage = stage;
    if (domain) filter.domain = domain;
    if (teamSize) filter.teamSize = teamSize;

    const drafts = await Draft.find(filter).sort({ createdAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/upvote
router.patch('/draft/:id/upvote', async (req, res) => {
  try {
    const draft = await Draft.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Added for the Revival Board (Member C) ---

// GET /api/revival-board -> projects with raised hands, newest first
router.get('/revival-board', async (req, res) => {
  try {
    const { stack, stage, domain } = req.query;
    const filter = { raisedHands: { $exists: true, $ne: [] } };
    if (stack) filter.techStack = stack;
    if (stage) filter.currentStage = stage;
    if (domain) filter.domain = domain;

    const drafts = await Draft.find(filter).sort({ createdAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/raise-hand -> record someone wanting to revive the project
router.patch('/draft/:id/raise-hand', async (req, res) => {
  try {
    const { name, message, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required to raise your hand' });
    }

    const draft = await Draft.findByIdAndUpdate(
      req.params.id,
      { $push: { raisedHands: { name, message, contact } } },
      { new: true }
    );
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/drafts/mine -> drafts belonging to the authenticated user
router.get('/drafts/mine', requireAuth, async (req, res) => {
  try {
    const drafts = await Draft.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/draft/:id -> single draft by ID
router.get('/draft/:id', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;