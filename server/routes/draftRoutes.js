const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Draft = require('../models/draft');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/authMiddleware');

function getRawHexId(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    return mongoose.Types.ObjectId.isValid(val) ? val : null;
  }
  if (typeof val === 'object') {
    if (val._id) {
      const idStr = val._id.toString();
      if (mongoose.Types.ObjectId.isValid(idStr)) return idStr;
    }
    const str = val.toString();
    if (mongoose.Types.ObjectId.isValid(str)) return str;
  }
  return null;
}

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

// GET /api/insights/global -> Real platform-wide insights calculated from MongoDB
router.get('/insights/global', async (req, res) => {
  try {
    const allDrafts = await Draft.find({}).lean();
    const total = allDrafts.length;

    if (total === 0) {
      return res.json({
        total: 0,
        revivalRate: 0,
        avgWeeksSpent: 0,
        domains: [],
        techStacks: [],
        whyDied: [],
        stages: [],
        totalRaisedHands: 0,
        recentBurials: [],
      });
    }

    const revivalCount = allDrafts.filter(d => (d.raisedHands && d.raisedHands.length > 0) || d.openForRevival).length;
    const revivalRate = Math.round((revivalCount / total) * 100);
    const totalRaisedHands = allDrafts.reduce((sum, d) => sum + (d.raisedHands ? d.raisedHands.length : 0), 0);

    const domainMap = {};
    allDrafts.forEach(d => {
      if (d.domain) domainMap[d.domain] = (domainMap[d.domain] || 0) + 1;
    });
    const domains = Object.entries(domainMap)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);

    const techMap = {};
    allDrafts.forEach(d => {
      (d.techStack || []).forEach(t => {
        techMap[t] = (techMap[t] || 0) + 1;
      });
    });
    const techStacks = Object.entries(techMap)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const reasonBuckets = [
      { label: "Lost motivation", keywords: ["motivation", "interest", "boring", "burnout", "burned"] },
      { label: "Scope creep", keywords: ["scope", "feature", "kept adding"] },
      { label: "Team fell apart", keywords: ["team", "cofounder", "co-founder", "stopped showing"] },
      { label: "Ran out of time", keywords: ["time", "exams", "semester", "job", "internship", "deadline"] },
      { label: "Technical blocker", keywords: ["accuracy", "bug", "technical", "api", "cost", "gpu"] },
      { label: "No users / market", keywords: ["users", "market", "traction", "no one", "competition"] },
    ];
    const whyMap = {};
    reasonBuckets.forEach(b => { whyMap[b.label] = 0; });
    let otherCount = 0;

    allDrafts.forEach(d => {
      const why = (d.failureReason || "").toLowerCase();
      const matched = reasonBuckets.find(b => b.keywords.some(k => why.includes(k)));
      if (matched) whyMap[matched.label]++;
      else otherCount++;
    });

    const whyDied = Object.entries(whyMap)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
    if (otherCount > 0) {
      whyDied.push({ name: "Other / Unspecified", value: otherCount, pct: Math.round((otherCount / total) * 100) });
    }

    const stageMap = {};
    allDrafts.forEach(d => {
      const s = d.currentStage || "Prototype";
      stageMap[s] = (stageMap[s] || 0) + 1;
    });
    const stages = Object.entries(stageMap)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);

    const totalDays = allDrafts.reduce((sum, d) => {
      if (!d.timeSpent || !d.timeSpent.value) return sum + 21;
      const m = d.timeSpent.unit === "months" ? 30 : d.timeSpent.unit === "weeks" ? 7 : 1;
      return sum + d.timeSpent.value * m;
    }, 0);
    const avgWeeksSpent = Math.round(totalDays / total / 7) || 4;

    const recentBurials = allDrafts
      .slice(0, 6)
      .map(d => ({
        id: d._id,
        projectName: d.projectName,
        oneLiner: d.oneLiner,
        domain: d.domain,
        techStack: d.techStack || [],
        upvotes: d.upvotes || 0,
        raisedHands: d.raisedHands ? d.raisedHands.length : 0,
        currentStage: d.currentStage,
        failureReason: d.failureReason || "Stalled in early development",
      }));

    res.json({
      total,
      revivalRate,
      totalRaisedHands,
      avgWeeksSpent,
      domains,
      techStacks,
      whyDied,
      stages,
      recentBurials,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/draft
router.post('/draft', optionalAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    // If the caller is authenticated, link the draft to their account
    if (req.user) body.submittedBy = req.user._id;
    const draft = new Draft(body);
    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/feed
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const { search, category, techStack, stage, status, openForRevival, sort, page = 1, limit = 10 } = req.query;
    const userId = req.user?._id; // Get authenticated user ID
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 per page
    const skip = (pageNum - 1) * pageSize;
    
    const pipeline = [];

    // Build match stage
    const matchStage = {};

    // Search - search across projectName, oneLiner, description, techStack, tags
    if (search) {
      matchStage.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { oneLiner: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { techStack: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Category filter
    if (category) {
      matchStage.category = category;
    }

    // Tech Stack filter - can be comma-separated or single value
    if (techStack) {
      const stacks = Array.isArray(techStack) ? techStack : [techStack];
      matchStage.techStack = { $in: stacks };
    }

    // Stage filter - can be comma-separated or single value
    if (stage) {
      const stages = Array.isArray(stage) ? stage : [stage];
      matchStage.currentStage = { $in: stages };
    }

    // Status filter
    if (status) {
      matchStage.status = status;
    }

    // Open for Revival filter
    if (openForRevival === 'true') {
      matchStage.$or = matchStage.$or ? [...matchStage.$or, { openForRevival: true }, { raisedHands: { $exists: true, $ne: [] } }] : [{ openForRevival: true }, { raisedHands: { $exists: true, $ne: [] } }];
    }

    pipeline.push({ $match: matchStage });

    // Populate submittedBy
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'submittedBy',
        foreignField: '_id',
        as: 'submittedBy'
      }
    });
    
    pipeline.push({
      $unwind: {
        path: '$submittedBy',
        preserveNullAndEmptyArrays: true
      }
    });

    // Filter by submittedBy name if search is present (optional additional filtering)
    if (search) {
      pipeline.push({
        $addFields: {
          submittedByMatch: {
            $cond: [
              {
                $or: [
                  { $regexMatch: { input: { $ifNull: ['$submittedBy.name', ''] }, regex: search, options: 'i' } },
                  { $regexMatch: { input: { $ifNull: ['$submittedBy.username', ''] }, regex: search, options: 'i' } }
                ]
              },
              1,
              0
            ]
          }
        }
      });
    }

    // Determine sorting
    let sortObj = { createdAt: -1 }; // Default: newest first
    if (sort) {
      switch (sort.toLowerCase()) {
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        case 'oldest':
          sortObj = { createdAt: 1 };
          break;
        case 'mostviewed':
        case 'popular':
          sortObj = { views: -1 };
          break;
        case 'mostliked':
          sortObj = { likes: -1 };
          break;
        case 'recentlyupdated':
          sortObj = { updatedAt: -1 };
          break;
        case 'upvotes':
          sortObj = { upvotes: -1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    // Count total
    const countPipeline = [...pipeline];
    const totalResult = await Draft.aggregate([...countPipeline, { $count: 'total' }]);
    const total = totalResult[0]?.total || 0;

    // Add sort, skip, limit
    pipeline.push({ $sort: sortObj });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    // Project only required fields + include liked status if user is authenticated
    const projectStage = {
      _id: 1,
      projectName: 1,
      oneLiner: 1,
      domain: 1,
      techStack: 1,
      currentStage: 1,
      likes: 1,
      views: 1,
      bookmarks: 1,
      upvotes: 1,
      createdAt: 1,
      updatedAt: 1,
      openForRevival: 1,
      tags: 1,
      difficulty: 1,
      failureReason: 1,
      raisedHands: 1,
      revivalScore: { $size: { $ifNull: ['$raisedHands', []] } },
      submittedBy: {
        _id: '$submittedBy._id',
        name: '$submittedBy.name',
        username: '$submittedBy.username',
        avatar: '$submittedBy.avatar'
      }
    };

    // Add liked/bookmarked status if user is authenticated
    if (userId) {
      projectStage.liked = { $cond: [{ $in: [userId, { $ifNull: ['$likedBy', []] }] }, true, false] };
      projectStage.bookmarked = { $cond: [{ $in: [userId, { $ifNull: ['$bookmarkedBy', []] }] }, true, false] };
    } else {
      projectStage.liked = { $literal: false };
      projectStage.bookmarked = { $literal: false };
    }

    pipeline.push({ $project: projectStage });

    const drafts = await Draft.aggregate(pipeline);

    res.json({
      data: drafts,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        hasMore: skip + pageSize < total
      }
    });
  } catch (err) {
     console.error("===== FEED ERROR =====");
  console.error(err);
  console.error(err.stack);

  return res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
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

    const drafts = await Draft.find(filter)
      .populate({
        path: 'submittedBy',
        select: 'name username avatar'
      })
      .populate({
        path: 'collaborators',
        select: 'name username avatar'
      })
      .sort({ createdAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/drafts/mine -> drafts belonging to the authenticated user
router.get('/drafts/mine', requireAuth, async (req, res) => {
  try {
    const drafts = await Draft.find({ submittedBy: req.user._id })
      .populate({
        path: 'submittedBy',
        select: 'name username avatar'
      })
      .populate({
        path: 'collaborators',
        select: 'name username avatar'
      })
      .sort({ createdAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/draft/:id -> single draft by ID
router.get('/draft/:id', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id)
      .populate({
        path: 'submittedBy',
        select: 'name username avatar'
      })
      .populate({
        path: 'collaborators',
        select: 'name username avatar'
      });
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/draft/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStage } = req.body;
    const draft = await Draft.findById(id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Verify workspace membership (only owner can update stage)
    if (draft.submittedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the workspace owner can update this draft' });
    }

    const previousStage = draft.currentStage;
    if (currentStage && currentStage !== previousStage) {
      draft.currentStage = currentStage;
      await draft.save();

      // Log in ActivityLog
      const ActivityLog = require('../models/ActivityLog');
      const initials = req.user.name ? req.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'US';
      await ActivityLog.create({
        draftId: id,
        user: req.user._id,
        userName: req.user.name || req.user.username || req.user.email,
        userInitials: initials.slice(0, 2),
        action: `updated stage to ${currentStage}`
      });
    }

    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/draft/:id/collaborate - Add a collaborator to a draft
router.post('/draft/:id/collaborate', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Check if already a collaborator
    if (draft.collaborators.includes(userId)) {
      return res.status(400).json({ error: 'You are already a collaborator on this draft' });
    }

    // Add user to collaborators
    await Draft.findByIdAndUpdate(draftId, {
      $addToSet: { collaborators: userId }
    });

    // Also register in TeamMember
    const TeamMember = require('../models/TeamMember');
    const existingMember = await TeamMember.findOne({ draftId, userId });
    if (!existingMember) {
      await TeamMember.create({
        draftId,
        userId,
        role: 'Contributor'
      });
    }

    // Log in ActivityLog
    const ActivityLog = require('../models/ActivityLog');
    const initials = req.user.name ? req.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'US';
    await ActivityLog.create({
      draftId: draftId,
      user: userId,
      userName: req.user.name || req.user.username || req.user.email,
      userInitials: initials.slice(0, 2),
      action: 'joined as contributor'
    });

    res.json({ message: 'Successfully joined as collaborator' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/draft/:id/collaborate - Remove yourself as collaborator
router.delete('/draft/:id/collaborate', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user._id;

    await Draft.findByIdAndUpdate(draftId, {
      $pull: { collaborators: userId }
    });

    res.json({ message: 'Successfully left collaboration' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/user/collaborations - Get all drafts user is collaborating on
router.get('/user/collaborations', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const collaborations = await Draft.find({ 
      collaborators: userId 
    })
    .populate('submittedBy', 'fullName username email')
    .populate('collaborators', 'fullName username email avatar')
    .sort({ updatedAt: -1 });

    res.json(collaborations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH /api/draft/:id/like -> like/unlike a draft
router.patch('/draft/:id/like', optionalAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user?._id;

    // If not authenticated, just increment likes without tracking user
    if (!userId) {
      const draft = await Draft.findByIdAndUpdate(
        draftId,
        { $inc: { likes: 1 } },
        { new: true }
      )
        .populate({ path: 'submittedBy', select: 'name username avatar' })
        .populate({ path: 'collaborators', select: 'name username avatar' });
      
      if (!draft) return res.status(404).json({ error: 'Draft not found' });
      return res.json(draft);
    }

    // For authenticated users, check if already liked and toggle
    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const userLikedIndex = draft.likedBy?.indexOf(userId) ?? -1;
    
    if (userLikedIndex !== -1) {
      // Unlike
      await Draft.findByIdAndUpdate(
        draftId,
        { $pull: { likedBy: userId }, $inc: { likes: -1 } }
      );
    } else {
      // Like
      await Draft.findByIdAndUpdate(
        draftId,
        { $push: { likedBy: userId }, $inc: { likes: 1 } }
      );
    }

    const updatedDraft = await Draft.findById(draftId)
      .populate({ path: 'submittedBy', select: 'name username avatar' })
      .populate({ path: 'collaborators', select: 'name username avatar' });
    
    res.json(updatedDraft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/bookmark -> bookmark/unbookmark a draft (requires auth)
router.patch('/draft/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const userBookmarkedIndex = draft.bookmarkedBy?.indexOf(userId) ?? -1;
    
    if (userBookmarkedIndex !== -1) {
      // Unbookmark
      await Draft.findByIdAndUpdate(
        draftId,
        { $pull: { bookmarkedBy: userId }, $inc: { bookmarks: -1 } }
      );
    } else {
      // Bookmark
      await Draft.findByIdAndUpdate(
        draftId,
        { $push: { bookmarkedBy: userId }, $inc: { bookmarks: 1 } }
      );
    }

    const updatedDraft = await Draft.findById(draftId)
      .populate({ path: 'submittedBy', select: 'name username avatar' })
      .populate({ path: 'collaborators', select: 'name username avatar' });
    
    res.json(updatedDraft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/view -> increment view count (session-based)
router.patch('/draft/:id/view', optionalAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user?._id;
    const sessionId = req.body.sessionId; // Client provides session ID

    if (!sessionId) {
      // If no session ID, just increment (fallback)
      const draft = await Draft.findByIdAndUpdate(
        draftId,
        { $inc: { views: 1 } },
        { new: true }
      )
        .populate({ path: 'submittedBy', select: 'name username avatar' })
        .populate({ path: 'collaborators', select: 'name username avatar' });
      
      if (!draft) return res.status(404).json({ error: 'Draft not found' });
      return res.json(draft);
    }

    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Track views by userId or sessionId to prevent double counting
    const viewKey = userId ? userId.toString() : sessionId;
    const viewedBefore = draft.viewedBy?.includes(viewKey) || false;

    if (!viewedBefore) {
      await Draft.findByIdAndUpdate(
        draftId,
        { $push: { viewedBy: viewKey }, $inc: { views: 1 } }
      );
    }

    const updatedDraft = await Draft.findById(draftId)
      .populate({ path: 'submittedBy', select: 'name username avatar' })
      .populate({ path: 'collaborators', select: 'name username avatar' });
    
    res.json(updatedDraft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/raise-hand -> record someone wanting to revive the project (updated)
router.patch('/draft/:id/raise-hand', optionalAuth, async (req, res) => {
  try {
    const { name, message, contact, skills, estimatedTime } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required to raise your hand' });
    }

    const draftId = req.params.id;
    const userId = req.user?._id;

    // Find draft by ObjectId or by slug/projectName match
    const isObjectId = mongoose.Types.ObjectId.isValid(draftId);
    const draft = isObjectId
      ? await Draft.findById(draftId)
      : await Draft.findOne({ projectName: { $regex: new RegExp(`^${draftId.replace(/-/g, ' ')}$`, 'i') } });

    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const parsedSkills = Array.isArray(skills) ? skills : [];
    const parsedTime = typeof estimatedTime === 'string' ? estimatedTime : '';

    const ownerIdHex = getRawHexId(draft.submittedBy);
    const senderIdHex = getRawHexId(userId);
    const isDifferentUser = !senderIdHex || ownerIdHex !== senderIdHex;

    // Check if user already raised hand
    const alreadyRaised = draft.raisedHands?.some(rh => getRawHexId(rh.userId) === senderIdHex);
    
    if (alreadyRaised && userId) {
      // Update existing raise hand
      const updatedDraft = await Draft.findByIdAndUpdate(
        draft._id,
        {
          $set: {
            'raisedHands.$[elem].name': name,
            'raisedHands.$[elem].message': message || '',
            'raisedHands.$[elem].contact': contact || '',
            'raisedHands.$[elem].skills': parsedSkills,
            'raisedHands.$[elem].estimatedTime': parsedTime,
            'raisedHands.$[elem].updatedAt': new Date(),
          }
        },
        {
          arrayFilters: [{ 'elem.userId': userId }],
          new: true
        }
      )
        .populate({ path: 'submittedBy', select: 'name username avatar' })
        .populate({ path: 'collaborators', select: 'name username avatar' });

      // Create or update pending notification for draft owner
      if (ownerIdHex && isDifferentUser) {
        try {
          const recipientObjId = new mongoose.Types.ObjectId(ownerIdHex);
          const senderObjId = senderIdHex ? new mongoose.Types.ObjectId(senderIdHex) : null;
          await Notification.create({
            recipient: recipientObjId,
            sender: senderObjId,
            senderName: name,
            type: 'join_request',
            draftId: draft._id,
            draftName: draft.projectName,
            details: {
              name,
              contact: contact || '',
              message: message || '',
              skills: parsedSkills,
              estimatedTime: parsedTime,
            },
            status: 'pending',
            read: false,
          });
          console.log(`[Notification] Updated/Created join_request for recipient ${ownerIdHex}`);
        } catch (notifErr) {
          console.error('[Notification Error] Failed to create notification:', notifErr);
        }
      }
      
      return res.json(updatedDraft);
    }

    // Add new raise hand
    const updatedDraft = await Draft.findByIdAndUpdate(
      draft._id,
      {
        $push: {
          raisedHands: {
            name,
            message: message || '',
            contact: contact || '',
            skills: parsedSkills,
            estimatedTime: parsedTime,
            userId: userId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      },
      { new: true }
    )
      .populate({ path: 'submittedBy', select: 'name username avatar' })
      .populate({ path: 'collaborators', select: 'name username avatar' });
    
    if (!updatedDraft) return res.status(404).json({ error: 'Draft not found' });

    // Emit notification for draft owner if recipient is not the sender
    if (ownerIdHex && isDifferentUser) {
      try {
        const recipientObjId = new mongoose.Types.ObjectId(ownerIdHex);
        const senderObjId = senderIdHex ? new mongoose.Types.ObjectId(senderIdHex) : null;
        await Notification.create({
          recipient: recipientObjId,
          sender: senderObjId,
          senderName: name,
          type: 'join_request',
          draftId: draft._id,
          draftName: draft.projectName,
          details: {
            name,
            contact: contact || '',
            message: message || '',
            skills: parsedSkills,
            estimatedTime: parsedTime,
          },
          status: 'pending',
          read: false,
        });
        console.log(`[Notification] Created join_request for recipient ${ownerIdHex}`);
      } catch (notifErr) {
        console.error('[Notification Error] Failed to create notification:', notifErr);
      }
    }

    res.json(updatedDraft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/draft/:id/open -> mark a draft as open for revival (requires auth)
router.patch('/draft/:id/open', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user._id;

    // Only the draft owner can mark it as open for revival
    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    
    if (draft.submittedBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the draft owner can mark it as open for revival' });
    }

    const updatedDraft = await Draft.findByIdAndUpdate(
      draftId,
      { openForRevival: !draft.openForRevival },
      { new: true }
    )
      .populate({ path: 'submittedBy', select: 'name username avatar' })
      .populate({ path: 'collaborators', select: 'name username avatar' });
    
    res.json(updatedDraft);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/draft/:id/status -> check if user has liked/bookmarked (requires auth)
router.get('/draft/:id/status', requireAuth, async (req, res) => {
  try {
    const draftId = req.params.id;
    const userId = req.user._id;

    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const liked = draft.likedBy?.includes(userId) || false;
    const bookmarked = draft.bookmarkedBy?.includes(userId) || false;
    const raised = draft.raisedHands?.some(rh => rh.userId?.toString() === userId.toString()) || false;

    res.json({ liked, bookmarked, raised });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/compass-feed/:mode - Real data for each compass mode
router.get('/compass-feed/:mode', async (req, res) => {
  try {
    const mode = req.params.mode;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (mode === 'Collaborate') {
      const openCollabs = await Draft.countDocuments({ raisedHands: { $exists: true, $ne: [] } });
      const newContributors = await require('../models/User').countDocuments({ createdAt: { $gte: weekAgo } });
      const topCollabDrafts = await Draft.find({ raisedHands: { $exists: true, $ne: [] } })
        .sort({ createdAt: -1 })
        .limit(1)
        .select('projectName');

      return res.json({
        items: [
          { key: 'openCollabs', title: 'Open Collaborations', sub: `${openCollabs} projects seeking help`, route: '/feed' },
          { key: 'newContributors', title: 'New Contributors', sub: `${newContributors} joined this week`, route: '/feed' },
          { key: 'teamFormations', title: 'Top Revival Projects', sub: topCollabDrafts[0]?.projectName ? `"${topCollabDrafts[0].projectName}"` : 'Browse revival projects', route: '/feed' },
        ],
        cta: { label: 'Open Revival Board', route: '/feed' }
      });
    }

    if (mode === 'Explore') {
      const totalDrafts = await Draft.countDocuments();
      const allStacks = await Draft.aggregate([
        { $unwind: '$techStack' },
        { $group: { _id: '$techStack', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]);
      const topStacks = allStacks.map(s => s._id).join(', ') || 'React, Node.js';
      const recentCount = await Draft.countDocuments({ createdAt: { $gte: weekAgo } });

      return res.json({
        items: [
          { key: 'trending', title: 'Trending Drafts', sub: `${recentCount} new drafts this week`, route: '/feed' },
          { key: 'featured', title: 'Featured Ideas', sub: `${totalDrafts} total community drafts`, route: '/feed' },
          { key: 'stacks', title: 'Rising Tech Stacks', sub: topStacks ? topStacks + ' trending' : 'React, Node.js trending', route: '/feed' },
        ],
        cta: { label: 'Explore More', route: '/feed' }
      });
    }

    if (mode === 'Learn') {
      const totalDrafts = await Draft.countDocuments();
      const stalledCount = await Draft.countDocuments({ currentStage: { $in: ['Idea only', 'Prototype'] } });
      const stallPct = totalDrafts > 0 ? Math.round((stalledCount / totalDrafts) * 100) : 0;
      const recentDrafts = await Draft.countDocuments({ createdAt: { $gte: weekAgo } });

      return res.json({
        items: [
          { key: 'weekly', title: 'Weekly Highlights', sub: `${recentDrafts} drafts added this week`, route: '/insights' },
          { key: 'insights', title: 'Community Insights', sub: `${totalDrafts} projects analyzed`, route: '/insights' },
          { key: 'mistakes', title: 'Common Mistakes', sub: `${stallPct}% of projects stall early`, route: '/insights-lab' },
        ],
        cta: { label: 'Open Insights', route: '/insights' }
      });
    }

    if (mode === 'Build') {
      const activeThisWeek = await Draft.countDocuments({ updatedAt: { $gte: weekAgo } });
      const milestones = await Draft.countDocuments({ currentStage: 'Almost complete' });
      const totalDrafts = await Draft.countDocuments();

      return res.json({
        items: [
          { key: 'activity', title: 'Live Build Activity', sub: `${activeThisWeek} drafts updated this week`, route: '/feed' },
          { key: 'resumed', title: 'In Progress', sub: `${totalDrafts} total projects in community`, route: '/feed' },
          { key: 'milestones', title: 'Milestones Hit', sub: `${milestones} drafts almost complete`, route: '/feed' },
        ],
        cta: { label: 'View Activity', route: '/feed' }
      });
    }

    if (mode === 'Publish') {
      const launched = await Draft.countDocuments({ currentStage: 'Launched but abandoned' });
      const withRaisedHands = await Draft.countDocuments({ 'raisedHands.0': { $exists: true } });
      const topDraft = await Draft.findOne({ upvotes: { $gt: 0 } }).sort({ upvotes: -1 }).select('projectName upvotes');

      return res.json({
        items: [
          { key: 'launches', title: 'Recent Launches', sub: `${launched} projects launched`, route: '/feed' },
          { key: 'revivals', title: 'Revival Stories', sub: `${withRaisedHands} projects with revival interest`, route: '/feed' },
          { key: 'top', title: 'Top Performers', sub: topDraft ? `"${topDraft.projectName}" — ${topDraft.upvotes} upvotes` : 'See top drafts', route: '/feed' },
        ],
        cta: { label: 'View Showcase', route: '/feed' }
      });
    }

    res.status(400).json({ error: 'Unknown mode' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;