const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
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

// POST /api/workspace - Create a new workspace
router.post('/workspace', optionalAuth, async (req, res) => {
  try {
    const { draftId, longDescription, featuresCompleted, currentBlockers, externalLinks, tasks, milestones, attachments } = req.body;

    if (!draftId) {
      return res.status(400).json({ error: 'draftId is required' });
    }

    // Verify that the draft exists
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Verify ownership: user must be authenticated and own the draft
    if (!req.user || draft.submittedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to create a workspace for this draft' });
    }

    // Check if workspace already exists for this draft
    let workspace = await Workspace.findOne({ draftId });
    if (workspace) {
      return res.status(409).json({ error: 'Workspace already exists for this draft' });
    }

    // Create new workspace
    workspace = new Workspace({
      draftId,
      longDescription,
      featuresCompleted,
      currentBlockers,
      externalLinks,
      tasks: tasks || [],
      milestones: milestones || [],
      attachments,
    });

    await workspace.save();
    res.status(201).json(workspace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/workspace/:draftId - Fetch workspace for a specific draft
router.get('/workspace/:draftId', optionalAuth, async (req, res) => {
  try {
    const { draftId } = req.params;

    const workspace = await Workspace.findOne({ draftId }).populate('draftId');
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found for this draft' });
    }

    // Verify ownership: if authenticated and draft belongs to user, allow read
    // Otherwise, only allow if this is the draft owner
    const draft = workspace.draftId;
    if (req.user) {
      if (draft.submittedBy?.toString() !== req.user._id.toString()) {
        // For now, allow anyone to read. In future, could restrict this.
      }
    }

    res.json(workspace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/workspace/:draftId - Update workspace
router.patch('/workspace/:draftId', optionalAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { longDescription, featuresCompleted, currentBlockers, externalLinks, tasks, milestones, attachments } = req.body;

    // Find the draft to verify ownership
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Verify ownership: user must be authenticated and own the draft
    if (!req.user || draft.submittedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to update this workspace' });
    }

    // Find and update the workspace
    let workspace = await Workspace.findOne({ draftId });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found for this draft' });
    }

    // Update fields
    if (longDescription !== undefined) workspace.longDescription = longDescription;
    if (featuresCompleted !== undefined) workspace.featuresCompleted = featuresCompleted;
    if (currentBlockers !== undefined) workspace.currentBlockers = currentBlockers;
    if (externalLinks !== undefined) workspace.externalLinks = externalLinks;
    if (tasks !== undefined) workspace.tasks = tasks;
    if (milestones !== undefined) workspace.milestones = milestones;
    if (attachments !== undefined) workspace.attachments = attachments;

    await workspace.save();
    res.json(workspace);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
