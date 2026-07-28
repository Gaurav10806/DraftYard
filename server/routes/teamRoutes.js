const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const ActivityLog = require('../models/ActivityLog');
const Draft = require('../models/draft');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Helper to check if user is draft owner
async function isOwner(userId, draftId) {
  const draft = await Draft.findById(draftId);
  if (!draft) return false;
  return draft.submittedBy && draft.submittedBy.toString() === userId.toString();
}

// Helper to log team activity
async function logTeamActivity(draftId, user, action) {
  try {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'US';
    await ActivityLog.create({
      draftId,
      user: user._id,
      userName: user.name || user.username || user.email,
      userInitials: initials.slice(0, 2),
      action
    });
  } catch (err) {
    console.error('Failed to log team activity:', err);
  }
}

// GET /api/team/:draftId - Fetch team details
router.get('/team/:draftId', requireAuth, async (req, res) => {
  try {
    const { draftId } = req.params;

    // Check if draft exists
    const draft = await Draft.findById(draftId).populate('submittedBy').populate('collaborators');
    if (!draft) {
      return res.status(404).json({ error: 'Workspace/Draft not found' });
    }

    // Seed TeamMembers if empty for this draft
    let membersCount = await TeamMember.countDocuments({ draftId });
    if (membersCount === 0) {
      const initialMembers = [];
      if (draft.submittedBy) {
        initialMembers.push({
          draftId,
          userId: draft.submittedBy._id,
          role: 'Owner'
        });
      }
      if (draft.collaborators && draft.collaborators.length > 0) {
        draft.collaborators.forEach(c => {
          initialMembers.push({
            draftId,
            userId: c._id,
            role: 'Contributor'
          });
        });
      }
      if (initialMembers.length > 0) {
        await TeamMember.insertMany(initialMembers);
      }
    }

    // Fetch members
    const membersList = await TeamMember.find({ draftId }).populate('userId');
    const members = membersList
      .filter(m => m.userId)
      .map(m => ({
        userId: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        avatar: m.userId.avatar || '',
        role: m.role
      }));

    // Pending join requests (raisedHands)
    const joinRequests = (draft.raisedHands || []).map(r => ({
      id: r._id,
      name: r.name,
      email: r.contact,
      message: r.message,
      createdAt: r.createdAt
    }));

    // Recent activity logs
    const activityLogs = await ActivityLog.find({ draftId }).sort({ createdAt: -1 }).limit(10);
    const activity = activityLogs.map(a => ({
      id: a._id,
      who: a.userName,
      what: a.action,
      when: formatTimeAgo(a.createdAt),
      initials: a.userInitials
    }));

    res.json({
      members,
      joinRequests,
      activity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/:draftId/invite - Invite a user by email
router.post('/team/:draftId/invite', requireAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to invite a member' });
    }

    const validRoles = ['Contributor', 'Viewer'];
    const finalRole = validRoles.includes(role) ? role : 'Contributor';

    // Check if user is draft owner
    const ownerCheck = await isOwner(req.user._id, draftId);
    if (!ownerCheck) {
      return res.status(403).json({ error: 'Only the Owner can invite members to this workspace' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User with this email is not registered on DraftYard yet.' });
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({ draftId, userId: user._id });
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    // Create TeamMember
    const newMember = new TeamMember({
      draftId,
      userId: user._id,
      role: finalRole
    });
    await newMember.save();

    // Add to draft collaborators list
    await Draft.findByIdAndUpdate(draftId, {
      $addToSet: { collaborators: user._id }
    });

    // Log activity
    await logTeamActivity(draftId, req.user, `invited ${user.name} as ${finalRole.toLowerCase()}`);

    res.status(201).json({ message: 'User invited successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/team/:draftId/member/:userId - Update member role
router.patch('/team/:draftId/member/:userId', requireAuth, async (req, res) => {
  try {
    const { draftId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['Contributor', 'Viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user is draft owner
    const ownerCheck = await isOwner(req.user._id, draftId);
    if (!ownerCheck) {
      return res.status(403).json({ error: 'Only the Owner can manage team roles' });
    }

    // Verify workspace member role status
    const member = await TeamMember.findOne({ draftId, userId });
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    if (member.role === 'Owner') {
      return res.status(400).json({ error: 'Cannot change the role of the workspace Owner' });
    }

    member.role = role;
    await member.save();

    const targetUser = await User.findById(userId);
    if (targetUser) {
      await logTeamActivity(draftId, req.user, `changed role of ${targetUser.name} to ${role.toLowerCase()}`);
    }

    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/team/:draftId/member/:userId - Remove member
router.delete('/team/:draftId/member/:userId', requireAuth, async (req, res) => {
  try {
    const { draftId, userId } = req.params;

    // Check if user is draft owner
    const ownerCheck = await isOwner(req.user._id, draftId);
    if (!ownerCheck) {
      return res.status(403).json({ error: 'Only the Owner can remove members' });
    }

    // Verify workspace member remove status
    const member = await TeamMember.findOne({ draftId, userId });
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    if (member.role === 'Owner') {
      return res.status(400).json({ error: 'Cannot remove the workspace Owner' });
    }

    await TeamMember.deleteOne({ draftId, userId });

    // Pull from collaborators
    await Draft.findByIdAndUpdate(draftId, {
      $pull: { collaborators: userId }
    });

    const targetUser = await User.findById(userId);
    if (targetUser) {
      await logTeamActivity(draftId, req.user, `removed ${targetUser.name} from the team`);
    }

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/:draftId/request/approve - Approve join request
router.post('/team/:draftId/request/approve', requireAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email/contact is required to approve request' });
    }

    // Check if user is draft owner
    const ownerCheck = await isOwner(req.user._id, draftId);
    if (!ownerCheck) {
      return res.status(403).json({ error: 'Only the Owner can approve requests' });
    }

    // Look up draft
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Check if user is registered
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: `User (${email}) must register on DraftYard first before joining the team.` });
    }

    // Add to collaborators and remove from raisedHands
    await Draft.findByIdAndUpdate(draftId, {
      $addToSet: { collaborators: user._id },
      $pull: { raisedHands: { contact: email } }
    });

    // Make sure TeamMember entry exists
    const existingMember = await TeamMember.findOne({ draftId, userId: user._id });
    if (!existingMember) {
      await TeamMember.create({
        draftId,
        userId: user._id,
        role: 'Contributor'
      });
    }

    // Log activity
    await logTeamActivity(draftId, user, 'joined as contributor');

    res.json({ message: 'Request approved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/:draftId/request/decline - Decline join request
router.post('/team/:draftId/request/decline', requireAuth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email/contact is required to decline request' });
    }

    // Check if user is draft owner
    const ownerCheck = await isOwner(req.user._id, draftId);
    if (!ownerCheck) {
      return res.status(403).json({ error: 'Only the Owner can decline requests' });
    }

    // Pull from raisedHands
    await Draft.findByIdAndUpdate(draftId, {
      $pull: { raisedHands: { contact: email } }
    });

    res.json({ message: 'Request declined successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to format time relative to now
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm ago';
  return seconds < 10 ? 'just now' : Math.floor(seconds) + 's ago';
}

module.exports = router;
