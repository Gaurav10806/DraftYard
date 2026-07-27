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
    const { name, message, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required to raise your hand' });
    }

    const draftId = req.params.id;
    const userId = req.user?._id;

    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Check if user already raised hand
    const alreadyRaised = draft.raisedHands?.some(rh => rh.userId?.toString() === userId?.toString());
    
    if (alreadyRaised && userId) {
      // Update existing raise hand
      const updatedDraft = await Draft.findByIdAndUpdate(
        draftId,
        {
          $set: {
            'raisedHands.$[elem].message': message,
            'raisedHands.$[elem].contact': contact,
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
      
      return res.json(updatedDraft);
    }

    // Add new raise hand
    const updatedDraft = await Draft.findByIdAndUpdate(
      draftId,
      {
        $push: {
          raisedHands: {
            name,
            message: message || '',
            contact: contact || '',
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

module.exports = router;