const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const Draft = require('../models/draft');
const TeamMember = require('../models/TeamMember');
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

/**
 * Resolve a user's effective role for a given draft.
 * Returns 'Owner' | 'Contributor' | 'Viewer' | null (no access).
 */
async function getEffectiveRole(userId, draftId) {
  if (!userId || !draftId) return null;

  const mongoose = require('mongoose');
  const userIdStr = userId ? userId.toString() : '';
  const userObjId = (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr))
    ? new mongoose.Types.ObjectId(userIdStr)
    : userId;

  const draftIdStr = draftId ? draftId.toString() : '';
  const draftObjId = (draftIdStr && mongoose.Types.ObjectId.isValid(draftIdStr))
    ? new mongoose.Types.ObjectId(draftIdStr)
    : draftId;

  // Check TeamMember table first
  const member = await TeamMember.findOne({
  $and: [
    {
      $or: [{ draftId: draftObjId }, { draftId: draftIdStr }],
    },
    {
      $or: [{ userId: userObjId }, { userId: userIdStr }],
    },
  ],
});
  if (member) return member.role;

  // Fallback: check Draft submittedBy and collaborators
  const draft = await Draft.findById(draftObjId).lean();
  console.log("Logged in user :", userIdStr);
console.log("Draft owner    :", draft?.submittedBy?.toString());
console.log("Draft :", draft);
  if (!draft) return null;

  if (draft.submittedBy && draft.submittedBy.toString() === userIdStr) {
    return 'Owner';
  }
  if (draft.collaborators && draft.collaborators.some(c => c.toString() === userIdStr)) {
    return 'Contributor';
  }

  return null;
}


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

    const role = req.user ? await getEffectiveRole(req.user._id, draftId) : null;
    if (!role || role === 'Viewer') {
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
    console.log("draftId:", req.params.draftId);

    const workspace = await Workspace.findOne({
      draftId: req.params.draftId,
    }).populate("draftId");

    console.log("workspace:", workspace);

    if (!workspace) {
      console.log("NOT FOUND");
      return res.status(404).json({ error: "Workspace not found for this draft" });
    }

    // Access check: user must be Owner, Contributor, or Viewer of this draft
    if (req.user) {
      const role = await getEffectiveRole(req.user._id, req.params.draftId);
      if (!role) {
        return res.status(403).json({ error: 'You do not have access to this workspace' });
      }
    }

    res.json(workspace);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/workspace/:draftId - Update workspace
router.patch('/workspace/:draftId', optionalAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { longDescription, featuresCompleted, currentBlockers, externalLinks, tasks, milestones, attachments } = req.body;

    // Find the draft to verify it exists
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Role-based permission: Viewers cannot write; no auth = denied
    const role = req.user ? await getEffectiveRole(req.user._id, draftId) : null;
    if (!role) {
      return res.status(403).json({ error: 'You are not authorized to update this workspace' });
    }
    if (role === 'Viewer') {
      return res.status(403).json({ error: 'Viewers cannot edit workspace content' });
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
