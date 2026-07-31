const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Draft = require('../models/draft');
const Notification = require('../models/Notification');
const BlockedEmail = require('../models/BlockedEmail');
const AdminSetting = require('../models/AdminSetting');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Helper to safely find user by ID, ObjectId, or email without throwing Mongoose CastError
async function findUserSafely(userId) {
  if (!userId) return null;
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const u = await User.findById(userId);
      if (u) return u;
    }
    return await User.findOne({
      $or: [
        { _id: userId },
        { email: userId.toLowerCase() },
        { username: userId },
      ],
    });
  } catch (_) {
    return null;
  }
}

// Helper to match all possible ways a draft belongs to a user
function getUserDraftQuery(user) {
  if (!user) return { _id: null };

  const uId = user._id;
  const uIdStr = user._id ? user._id.toString() : '';
  const uEmail = user.email ? user.email.toLowerCase().trim() : '';

  const conditions = [];

  // Match by User _id (only valid ObjectId or string representation)
  if (uIdStr && mongoose.Types.ObjectId.isValid(uIdStr)) {
    const validObjectId = new mongoose.Types.ObjectId(uIdStr);
    conditions.push({ submittedBy: validObjectId });
    conditions.push({ 'submittedBy._id': validObjectId });
    conditions.push({ 'submittedBy._id': uIdStr });
    conditions.push({ ownerToken: uIdStr });
  }

  // Match by User Email (on string fields: ownerToken & nested submittedBy.email)
  if (uEmail) {
    const emailRegex = new RegExp(`^${uEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    conditions.push({ ownerToken: emailRegex });
    conditions.push({ 'submittedBy.email': emailRegex });
  }

  if (conditions.length === 0) {
    return { _id: null };
  }

  return { $or: conditions };
}

// GET /api/admin/public-settings - Public endpoint for global announcement banner, maintenance status, and signup rules
router.get('/public-settings', async (req, res) => {
  try {
    let settings = await AdminSetting.findOne({ key: 'global' });
    if (!settings) {
      settings = await AdminSetting.create({ key: 'global' });
    }
    res.json({
      maintenanceMode: !!settings.maintenanceMode,
      maintenanceNotice: settings.maintenanceNotice,
      allowRegistrations: settings.allowRegistrations ?? true,
      announcementActive: !!settings.announcementActive,
      announcementText: settings.announcementText,
      announcementType: settings.announcementType || 'info',
      maxDraftsPerUser: settings.maxDraftsPerUser || 50,
      maxFileUploadMb: settings.maxFileUploadMb || 25,
      autoModeration: settings.autoModeration ?? true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protect all admin routes with auth and admin role check
router.use(requireAuth, requireAdmin);

// GET /api/admin/users - Get all users with draft count and warning count (excluding admin accounts)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: 'admin' },
      email: { $ne: 'draftadmin@gmail.com' },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    const userStats = await Promise.all(
      users.map(async (u) => {
        let draftCount = 0;
        try {
          draftCount = await Draft.countDocuments(getUserDraftQuery(u));
        } catch (_) {
          draftCount = 0;
        }

        let warningCount = 0;
        try {
          warningCount = await Notification.countDocuments({
            recipient: u._id,
            type: 'warning',
          });
        } catch (_) {
          warningCount = 0;
        }

        const userObj = u.toJSON();
        return {
          ...userObj,
          fullName: u.name,
          draftCount,
          warningCount,
        };
      })
    );

    res.json(userStats);
  } catch (err) {
    console.error("Error in GET /api/admin/users:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:userId/drafts - Get all drafts owned by a specific user
router.get('/users/:userId/drafts', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await findUserSafely(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const drafts = await Draft.find(getUserDraftQuery(user)).sort({ createdAt: -1 });

    res.json(drafts);
  } catch (err) {
    console.error("Error in GET /api/admin/users/:userId/drafts:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:userId/warn - Send warning notification to user
router.post('/users/:userId/warn', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Warning message is required' });
    }

    const targetUser = await findUserSafely(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      senderName: req.user.name || 'Draftyard Administrator',
      type: 'warning',
      details: {
        message: message.trim(),
      },
    });

    res.json({ message: 'Warning notification sent to user', notification });
  } catch (err) {
    console.error("Error in POST /api/admin/users/:userId/warn:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/drafts/:draftId - Delete a draft with reason message
router.delete('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const { reason } = req.body;

    const draft = mongoose.Types.ObjectId.isValid(draftId)
      ? await Draft.findById(draftId)
      : await Draft.findOne({ $or: [{ _id: draftId }, { id: draftId }] });

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    let ownerId = null;
    if (draft.submittedBy) {
      if (typeof draft.submittedBy === 'object' && draft.submittedBy._id) {
        ownerId = draft.submittedBy._id;
      } else if (mongoose.Types.ObjectId.isValid(draft.submittedBy.toString())) {
        ownerId = draft.submittedBy;
      }
    }
    const draftTitle = draft.projectName;

    // Delete draft
    await Draft.findByIdAndDelete(draft._id);

    // If draft had an associated user owner, send deletion notice notification
    if (ownerId) {
      await Notification.create({
        recipient: ownerId,
        sender: req.user._id,
        senderName: req.user.name || 'Draftyard Administrator',
        type: 'draft_deleted',
        draftName: draftTitle,
        details: {
          message: reason?.trim() || 'Your draft was removed by an administrator for violating terms.',
        },
      });
    }

    res.json({ message: 'Draft deleted successfully' });
  } catch (err) {
    console.error("Error in DELETE /api/admin/drafts/:draftId:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/users/:userId/block - Delete user account, purge drafts & block email
router.post('/users/:userId/block', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for blocking is required' });
    }

    const targetUser = await findUserSafely(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent blocking admin accounts or self
    if (targetUser.role === 'admin' || targetUser.email.toLowerCase() === 'draftadmin@gmail.com') {
      return res.status(403).json({ error: 'Cannot block or delete an administrator account' });
    }

    const userEmail = targetUser.email.toLowerCase();

    // 1. Add email to BlockedEmail collection
    await BlockedEmail.findOneAndUpdate(
      { email: userEmail },
      {
        email: userEmail,
        reason: reason.trim(),
        blockedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    // 2. Delete all drafts belonging to this user
    await Draft.deleteMany(getUserDraftQuery(targetUser));

    // 3. Delete notifications recipient to this user
    await Notification.deleteMany({ recipient: targetUser._id });

    // 4. Delete user document
    await User.findByIdAndDelete(targetUser._id);

    res.json({
      message: `User account ${userEmail} deleted and email permanently blocked.`,
    });
  } catch (err) {
    console.error("Error in POST /api/admin/users/:userId/block:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/blocked-emails - List all blocked emails
router.get('/blocked-emails', async (req, res) => {
  try {
    const blocked = await BlockedEmail.find({})
      .populate('blockedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(blocked);
  } catch (err) {
    console.error("Error in GET /api/admin/blocked-emails:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/blocked-emails/:id - Unblock an email
router.delete('/blocked-emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await BlockedEmail.findByIdAndDelete(id);
    } else {
      await BlockedEmail.deleteOne({ _id: id });
    }
    res.json({ message: 'Email unblocked successfully' });
  } catch (err) {
    console.error("Error in DELETE /api/admin/blocked-emails/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/settings - Retrieve global admin settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await AdminSetting.findOne({ key: 'global' });
    if (!settings) {
      settings = await AdminSetting.create({ key: 'global' });
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings - Save/Update global admin settings
router.put('/settings', async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedBy = req.user._id;

    const settings = await AdminSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: 'Admin settings updated successfully', settings });
  } catch (err) {
    console.error('Error updating admin settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/settings/reset - Reset admin settings to factory defaults
router.post('/settings/reset', async (req, res) => {
  try {
    await AdminSetting.deleteOne({ key: 'global' });
    const newSettings = await AdminSetting.create({
      key: 'global',
      updatedBy: req.user._id,
    });
    res.json({ message: 'Admin settings reset to defaults', settings: newSettings });
  } catch (err) {
    console.error('Error resetting admin settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/system-stats - Comprehensive real-time system metrics
router.get('/system-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalDrafts = await Draft.countDocuments({});
    const blockedCount = await BlockedEmail.countDocuments({});
    const adminCount = await User.countDocuments({ role: 'admin' });
    const warningsSent = await Notification.countDocuments({ type: 'warning' });

    const uptimeSeconds = process.uptime();
    const dbStateMap = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';

    res.json({
      totalUsers,
      totalDrafts,
      blockedCount,
      adminCount,
      warningsSent,
      uptimeSeconds: Math.floor(uptimeSeconds),
      dbStatus,
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    });
  } catch (err) {
    console.error('Error fetching system stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/export-audit - Export system audit report JSON
router.get('/export-audit', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').lean();
    const blocked = await BlockedEmail.find({}).lean();
    const settings = await AdminSetting.findOne({ key: 'global' }).lean();

    const auditReport = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      environment: process.env.NODE_ENV || 'development',
      systemOverview: {
        totalUsers: users.length,
        totalBlocked: blocked.length,
      },
      settings,
      blockedEmails: blocked,
      userListSummary: users.map((u) => ({
        id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=draftyard-system-audit.json');
    res.json(auditReport);
  } catch (err) {
    console.error('Error generating audit export:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

