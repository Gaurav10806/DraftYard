const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Draft = require('../models/draft');
const Notification = require('../models/Notification');
const AdminSetting = require('../models/AdminSetting');
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

function getStallPatternRegex(pattern) {
  switch (pattern.toLowerCase()) {
    case 'scope creep':
    case 'scope creep syndrome':
      return /scope|feature|kept adding/i;
    case 'solo burnout':
      return /burnout|burned|alone|solo/i;
    case 'lack of consistency':
      return /time|exam|semester|job|internship|deadline/i;
    case 'waiting on data':
      return /data|dataset|accuracy/i;
    case 'perfectionism trap':
    case 'perfectionism':
      return /perfect|polish/i;
    case 'lost motivation':
      return /motivation|interest|boring/i;
    case 'team fell apart':
      return /team|cofounder|co-founder/i;
    case 'technical blocker':
      return /api|bug|technical|cost|gpu/i;
    default:
      return null;
  }
}

function getStallPattern(failureReason) {
  const why = (failureReason || '').toLowerCase();
  if (why.match(/scope|feature|kept adding/)) return "Scope Creep";
  if (why.match(/burnout|burned|alone|solo/)) return "Solo Burnout";
  if (why.match(/motivation|interest|boring/)) return "Lost Motivation";
  if (why.match(/team|cofounder|co-founder/)) return "Team Fell Apart";
  if (why.match(/time|exam|semester|job|internship|deadline/)) return "Lack of Consistency";
  if (why.match(/data|dataset|accuracy/)) return "Waiting on Data";
  if (why.match(/api|bug|technical|cost|gpu/)) return "Technical Blocker";
  if (why.match(/perfect|polish/)) return "Perfectionism Trap";
  return "Lost Motivation";
}

function getAiInsight(draft) {
  const why = (draft.failureReason || '').toLowerCase();
  const tech = (draft.techStack || []).join(', ');
  
  if (why.includes('burnout') || why.includes('alone') || why.includes('solo')) {
    return `Solo developer fatigue detected. The technical foundation in ${tech || 'this stack'} is solid, but the project requires co-founders or specialized collaborators to divide workload and restore momentum.`;
  }
  if (why.includes('scope') || why.includes('feature') || why.includes('kept adding')) {
    return `Features ballooned beyond initial intent. Recommending a hard pivot back to a core MVP, trimming secondary features, and prioritizing user validation before writing more code.`;
  }
  if (why.includes('time') || why.includes('exam') || why.includes('job') || why.includes('busy')) {
    return `Project stalled due to competing priorities. Highly modular codebase allows contributors to pick up small issues without extensive onboarding. Great candidate for community revive.`;
  }
  if (why.includes('market') || why.includes('user') || why.includes('interest') || why.includes('customers')) {
    return `Target audience validation challenge. Technical implementation is mature. Needs product-market fit discovery, marketing distribution strategy, or a developer-marketer co-founder.`;
  }
  if (why.includes('technical') || why.includes('api') || why.includes('gpu') || why.includes('bug')) {
    return `Technical blocker encountered. Code requires optimization or alternative APIs/architectures. A specialized backend or DevOps contributor could easily resolve this issue.`;
  }
  return `Strong core concept built using ${tech || 'modern tech'}. Needs product direction, structural scope definition, and external contributors to accelerate development.`;
}

function getStageLabel(currentStage) {
  const s = (currentStage || '').toLowerCase();
  if (s.includes('idea')) return "Idea";
  if (s.includes('plan')) return "Planning";
  if (s.includes('proto')) return "Prototype";
  if (s.includes('building') || s.includes('almost') || s.includes('50%')) return "Building";
  if (s.includes('launch') || s.includes('abandoned')) return "Shipped";
  return "Building";
}

// Helper: convert project name to slug (mirrors client-side slugify)
function toSlug(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}


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
    const adminSettings = await AdminSetting.findOne({ key: 'global' });
    if (adminSettings) {
      const isUserAdmin = req.user && (req.user.role === 'admin' || req.user.email?.toLowerCase() === 'draftadmin@gmail.com');
      // 1. Maintenance Mode Enforcement
      if (adminSettings.maintenanceMode && !isUserAdmin) {
        return res.status(503).json({
          error: adminSettings.maintenanceNotice || 'Platform is in maintenance mode. Core services are read-only.',
        });
      }

      // 2. Max Drafts Quota Enforcement
      if (req.user && !isUserAdmin) {
        const userDraftCount = await Draft.countDocuments({ submittedBy: req.user._id });
        const maxLimit = adminSettings.maxDraftsPerUser || 50;
        if (userDraftCount >= maxLimit) {
          return res.status(400).json({
            error: `Draft submission limit reached (${userDraftCount}/${maxLimit}). Please delete or archive old drafts before creating new ones.`,
          });
        }
      }
    }

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

// GET /api/draft/by-slug/:slug — fetch a single draft by its slugified project name
router.get('/draft/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    // Fetch all drafts and find the one whose slugified name matches
    // We use a lean query and iterate in JS (avoids storing a redundant slug field)
    const drafts = await Draft.find({}).lean();
    const match = drafts.find(d => toSlug(d.projectName) === slug);
    if (!match) return res.status(404).json({ error: 'Draft not found' });
    // Augment with computed fields identical to /api/feed processing
    const stallPatternVal = getStallPattern(match.failureReason);
    const aiInsight = getAiInsight(match);
    const stageVal = getStageLabel(match.currentStage);
    const upvotes = match.upvotes || 0;
    const views = match.views || 0;
    const bookmarks = match.bookmarks || 0;
    const h = Math.abs((match.projectName || '').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
    const raisedHandsCount = (match.raisedHands || []).length;
    const revivalScore = Math.min(100, 55 + upvotes * 0.05 + raisedHandsCount * 10 + bookmarks * 0.5);
    res.json({
      ...match,
      id: match._id.toString(),
      stallPattern: stallPatternVal,
      aiInsight,
      stage: stageVal,
      upvotes,
      views,
      bookmarks,
      revivalScore: Math.round(revivalScore),
      contributors: (match.collaborators ? match.collaborators.length : 0) + 1,
      stallAnalyzed: h % 3 !== 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// GET /api/feed/trending
router.get('/feed/trending', async (req, res) => {
  try {
    const pipeline = [];
    
    pipeline.push({
      $addFields: {
        raisedHandsCount: { $size: { $ifNull: ["$raisedHands", []] } }
      }
    });
    
    pipeline.push({
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: [{ $ifNull: ["$upvotes", 0] }, 1] },
            { $multiply: [{ $ifNull: ["$bookmarks", 0] }, 2] },
            { $multiply: [{ $ifNull: ["$views", 0] }, 0.1] },
            { $multiply: ["$raisedHandsCount", 5] }
          ]
        }
      }
    });
    
    pipeline.push({ $sort: { trendingScore: -1, createdAt: -1 } });
    pipeline.push({ $limit: 8 });
    
    const drafts = await Draft.aggregate(pipeline);
    
    const processed = drafts.map((draft) => {
      const stallPatternVal = getStallPattern(draft.failureReason);
      const aiInsight = getAiInsight(draft);
      const stageVal = getStageLabel(draft.currentStage);
      const bookmarks = draft.bookmarks || 0;
      const upvotes = draft.upvotes || 0;
      const views = draft.views || 0;
      const h = Math.abs(draft.projectName.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
      
      return {
        ...draft,
        id: draft._id.toString(),
        stallPattern: stallPatternVal,
        aiInsight,
        stage: stageVal,
        upvotes,
        views,
        bookmarks,
        contributors: (draft.collaborators ? draft.collaborators.length : 0) + 1,
        stallAnalyzed: h % 3 !== 0,
      };
    });
    
    res.json(processed);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid draft ID format' });
    }

    const { currentStage } = req.body;
    const draft = await Draft.findById(id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Verify owner or contributor access
    const ownerId = draft.submittedBy?._id ? draft.submittedBy._id.toString() : draft.submittedBy?.toString();
    const isOwner = ownerId === req.user._id.toString() || req.user.role === 'admin';

    const TeamMember = require('../models/TeamMember');
    const teamMemberRecord = await TeamMember.findOne({ draftId: id, userId: req.user._id });
    const isContributor = teamMemberRecord && (teamMemberRecord.role === 'Owner' || teamMemberRecord.role === 'Contributor');

    if (!isOwner && !isContributor) {
      return res.status(403).json({ error: 'Only workspace owners or contributors can update this stage' });
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

// GET /api/drafts/stats -> statistics about all drafts
router.get('/drafts/stats', async (req, res) => {
  try {
    const totalDrafts = await Draft.countDocuments();
    const openForRevival = await Draft.countDocuments({ raisedHands: { $exists: true, $ne: [] } });
    
    // Count drafts revived in the last 7 days (based on raisedHands createdAt)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const revivedThisWeek = await Draft.countDocuments({
      'raisedHands.createdAt': { $gte: weekAgo }
    });
    
    // Calculate average revival rate
    const avgRevivalRate = totalDrafts > 0 
      ? Math.round((openForRevival / totalDrafts) * 100) 
      : 0;
    
    res.json({
      totalDrafts,
      openForRevival,
      revivedThisWeek,
      avgRevivalRate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stack-intelligence -> dynamic stack intelligence analytics
router.get('/stack-intelligence', async (req, res) => {
  try {
    const drafts = await Draft.find({}).lean();
    
    // Group drafts by technology name (normalized lowercase)
    const techGroups = {};
    for (const draft of drafts) {
      const stack = draft.techStack || [];
      for (const rawTech of stack) {
        if (!rawTech || typeof rawTech !== 'string') continue;
        const trimmed = rawTech.trim();
        if (!trimmed) continue;
        const norm = trimmed.toLowerCase();
        
        if (!techGroups[norm]) {
          techGroups[norm] = {
            rawName: trimmed,
            drafts: [],
            casingCount: {}
          };
        }
        techGroups[norm].drafts.push(draft);
        techGroups[norm].casingCount[trimmed] = (techGroups[norm].casingCount[trimmed] || 0) + 1;
      }
    }

    // Predefined metadata mapping for premium aesthetics
    const PREDEFINED_TECH_METADATA = {
      react: { icon: "⚛️", category: "Frontend Library", slug: "react" },
      django: { icon: "🐍", category: "Backend Framework", slug: "django" },
      nextjs: { icon: "▲", category: "React Framework", slug: "nextjs" },
      nodejs: { icon: "⬢", category: "Runtime", slug: "nodejs" },
      fastapi: { icon: "🚀", category: "Python Framework", slug: "fastapi" },
      postgres: { icon: "🐘", category: "Database", slug: "postgres" },
      postgresql: { icon: "🐘", category: "Database", slug: "postgres" },
      mongodb: { icon: "🍃", category: "Database", slug: "mongodb" },
      express: { icon: "🚂", category: "Node Framework", slug: "express" },
      python: { icon: "🐍", category: "Language", slug: "python" },
      typescript: { icon: "🟦", category: "Language", slug: "typescript" },
      flutter: { icon: "🦋", category: "Mobile Framework", slug: "flutter" },
      java: { icon: "☕", category: "Language", slug: "java" },
      vue: { icon: "💚", category: "Frontend Framework", slug: "vue" },
      svelte: { icon: "🧡", category: "Frontend Framework", slug: "svelte" },
      docker: { icon: "🐳", category: "DevOps", slug: "docker" },
      kubernetes: { icon: "☸️", category: "DevOps", slug: "kubernetes" },
      aws: { icon: "☁️", category: "Cloud Platform", slug: "aws" },
      redis: { icon: "🔴", category: "Database", slug: "redis" },
      firebase: { icon: "🔥", category: "Backend service", slug: "firebase" }
    };

    // Predefined AI Insights static templates
    const AI_INSIGHTS = {
      react: {
        bestFor: ["Interactive product UIs", "Component-driven dashboards", "Solo & small-team builds"],
        failureReasons: ["State sprawl", "Prop drilling in mid-size apps", "Tooling fatigue"],
        considerFor: ["Content-heavy sites", "SEO-critical marketing", "Server-rendered SaaS"],
      },
      nextjs: {
        bestFor: ["Full-stack SaaS", "SEO-critical marketing sites", "Content-heavy apps"],
        failureReasons: ["Caching confusion", "Deploy env drift", "Overuse of server components"],
        considerFor: ["Pure client SPAs", "Static docs sites"],
      },
      django: {
        bestFor: ["Content-heavy backends", "Admin-driven enterprise apps", "Rapid CRUD MVPs"],
        failureReasons: ["Scope creep", "Async workflows outgrow WSGI", "ORM performance tuning"],
        considerFor: ["AI / ML APIs", "Async-first backends", "High-performance edge APIs"],
      },
      fastapi: {
        bestFor: ["AI / ML inference APIs", "High-performance async services", "Type-first Python teams"],
        failureReasons: ["Auth boilerplate", "ORM choice fatigue", "Missing admin UI"],
        considerFor: ["Content-heavy CRUD apps", "Teams needing batteries-included admin"],
      },
      express: {
        bestFor: ["REST APIs", "Lightweight backend services", "Rapid MVPs & small teams"],
        failureReasons: ["Weak documentation", "Poor architecture planning", "Callback / error handling drift"],
        considerFor: ["AI / ML projects", "High-performance async APIs", "Type-first backends"],
      },
      nodejs: {
        bestFor: ["JavaScript-first backends", "Realtime services", "Shared TypeScript across stack"],
        failureReasons: ["Async error handling", "Package sprawl", "Runtime version drift"],
        considerFor: ["Edge-native APIs", "Secure-by-default runtimes"],
      },
      postgres: {
        bestFor: ["Transactional SaaS", "Analytics-heavy products", "Long-lived data models"],
        failureReasons: ["Migration discipline", "Index tuning", "N+1 query patterns"],
        considerFor: ["Managed Postgres with auth & realtime out of the box"],
      },
      mongodb: {
        bestFor: ["Early prototypes", "Flexible schemas", "Event / log stores"],
        failureReasons: ["Schema drift", "Complex joins", "Consistency edge cases"],
        considerFor: ["Relational workloads that need SQL & strong consistency"],
      },
      typescript: {
        bestFor: ["Long-lived codebases", "Cross-stack shared types", "Team-scale projects"],
        failureReasons: ["Type gymnastics", "Config sprawl", "Slow feedback loops"],
        considerFor: ["Throwaway scripts & prototypes"],
      },
      python: {
        bestFor: ["Data & ML pipelines", "Scripting & automation", "AI-first backends"],
        failureReasons: ["Env management", "Slow cold starts", "Runtime type errors"],
        considerFor: ["Unified TS frontend + backend teams"],
      },
      flutter: {
        bestFor: ["Cross-platform mobile", "Design-heavy consumer apps", "Solo-dev mobile output"],
        failureReasons: ["Native bridges", "iOS polish gaps", "Package ecosystem gaps"],
        considerFor: ["JS-native mobile teams with web reuse"],
      },
      java: {
        bestFor: ["Enterprise backends", "Long-lived legacy integrations", "JVM ecosystems"],
        failureReasons: ["Verbosity", "Startup time", "Slow iteration"],
        considerFor: ["Modern JVM languages like Kotlin"],
      },
    };

    const RECOMMENDATIONS = {
      react: { name: "Next.js", slug: "nextjs", domain: "AI SaaS", reasons: ["Higher completion", "Server components reduce boilerplate", "Faster time to ship", "Great DX for content-heavy apps"] },
      django: { name: "FastAPI", slug: "fastapi", domain: "AI SaaS", reasons: ["Higher completion rate", "Faster time to ship", "Better performance for ML/AI integrations", "Growing developer community"] },
      nextjs: { name: "React", slug: "react", domain: "Consumer apps", reasons: ["Simpler surface area", "Less framework churn", "Great for pure client UIs", "Wider hiring pool"] },
      nodejs: { name: "Deno", slug: "deno", domain: "Edge APIs", reasons: ["Batteries included", "Secure by default", "Native TypeScript", "Simpler tooling"] },
      fastapi: { name: "Django", slug: "django", domain: "Enterprise CRUD", reasons: ["Battle-tested admin", "Great for content-heavy apps", "Stable ORM", "Wide plugin ecosystem"] },
      postgres: { name: "Supabase", slug: "supabase", domain: "SaaS", reasons: ["Managed Postgres", "Auth included", "Realtime built-in", "Great DX"] },
      mongodb: { name: "PostgreSQL", slug: "postgres", domain: "SaaS", reasons: ["Higher completion", "Stronger consistency", "SQL familiarity", "Better long-term maintenance"] },
      express: { name: "FastAPI", slug: "fastapi", domain: "APIs", reasons: ["Type-first", "Better docs", "Async by default", "Cleaner validation"] },
      python: { name: "TypeScript", slug: "typescript", domain: "Web", reasons: ["Unified frontend/backend", "Static typing", "Fast tooling", "Large ecosystem"] },
      typescript: { name: "React", slug: "react", domain: "Web", reasons: ["Best paired with TS", "Great DX", "Wide adoption", "Predictable"] },
      flutter: { name: "React Native", slug: "rn", domain: "Mobile", reasons: ["JS ecosystem", "OTA updates", "Wide hiring", "Web reuse"] },
      java: { name: "Kotlin", slug: "kotlin", domain: "Enterprise", reasons: ["Modern syntax", "Interop with Java", "Coroutines", "Growing ecosystem"] }
    };

    const STAGE_PROGRESS = {
      'Idea only': 10,
      'Prototype': 35,
      '50% done': 50,
      'Almost complete': 80,
      'Launched but abandoned': 100
    };

    const getRelativeTime = (date) => {
      if (!date) return 'Recently';
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hr ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks < 4) return `${diffWeeks} wk ago`;
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} mo ago`;
    };

    // Cutoff for growth calculation (e.g. 180 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180);

    const techList = Object.keys(techGroups).map(norm => {
      const group = techGroups[norm];
      const count = group.drafts.length;

      // Determine display name by most common casing used in database
      let displayName = group.rawName;
      let maxCount = 0;
      for (const [casing, c] of Object.entries(group.casingCount)) {
        if (c > maxCount) {
          maxCount = c;
          displayName = casing;
        }
      }

      // Calculate completion rate
      let totalProgress = 0;
      let successCount = 0;
      let failureCount = 0;
      let totalDays = 0;
      let countWithHands = 0;
      let totalUpvotes = 0;
      let totalBookmarks = 0;
      let totalViews = 0;
      let recentCount = 0;

      for (const draft of group.drafts) {
        const progress = STAGE_PROGRESS[draft.currentStage] || 35;
        totalProgress += progress;

        if (['Almost complete', 'Launched but abandoned'].includes(draft.currentStage)) {
          successCount++;
        }
        if (['Idea only', 'Prototype'].includes(draft.currentStage)) {
          failureCount++;
        }

        totalUpvotes += draft.upvotes || 0;
        totalBookmarks += draft.bookmarks || 0;
        totalViews += draft.views || 0;

        if (draft.createdAt && new Date(draft.createdAt) >= cutoffDate) {
          recentCount++;
        }

        if (draft.raisedHands && draft.raisedHands.length > 0) {
          const draftCreated = new Date(draft.createdAt);
          // Find earliest raised hand date
          const earliestHand = draft.raisedHands.reduce((earliest, h) => {
            const hDate = new Date(h.createdAt);
            return hDate < earliest ? hDate : earliest;
          }, new Date(draft.raisedHands[0].createdAt || draft.updatedAt));
          
          const diffMs = Math.abs(earliestHand - draftCreated);
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          totalDays += diffDays;
          countWithHands++;
        }
      }

      const completion = Math.round(totalProgress / count);
      const successRate = Math.round((successCount / count) * 100);
      const failureRate = Math.round((failureCount / count) * 100);
      const revived = Math.round((countWithHands / count) * 100);
      const avgRevivalDays = countWithHands > 0 ? Math.round(totalDays / countWithHands) : 14;

      // Community Rating out of 5 based on engagements (average metrics)
      const avgUpvotes = totalUpvotes / count;
      const avgBookmarks = totalBookmarks / count;
      // Formula: base 3.5, add points based on engagement, capped at 5.0
      const rating = Math.max(3.5, Math.min(5.0, Number((3.5 + (avgUpvotes * 0.003) + (avgBookmarks * 0.005)).toFixed(1))));

      // Growth percentage
      // e.g. growth is based on recent projects ratio, normalized to show logical percentage
      const priorCount = count - recentCount;
      const growth = Math.max(1, Math.min(99, Math.round((recentCount / Math.max(1, priorCount)) * 100))) || 5;

      // Metadata mappings
      const meta = PREDEFINED_TECH_METADATA[norm] || {
        icon: "💻",
        category: "Tool / Language",
        slug: norm.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      // Survival funnel rates
      const reachesPrototype = group.drafts.filter(d => ['Prototype', '50% done', 'Almost complete', 'Launched but abandoned'].includes(d.currentStage)).length;
      const reachesBuilding = group.drafts.filter(d => ['50% done', 'Almost complete', 'Launched but abandoned'].includes(d.currentStage)).length;
      const reachesTesting = group.drafts.filter(d => ['Almost complete', 'Launched but abandoned'].includes(d.currentStage)).length;
      const reachesShipped = group.drafts.filter(d => ['Launched but abandoned'].includes(d.currentStage)).length;

      const survival = [
        { stage: "Idea", pct: 100 },
        { stage: "Prototype", pct: Math.round((reachesPrototype / count) * 100) },
        { stage: "Building", pct: Math.round((reachesBuilding / count) * 100) },
        { stage: "Testing", pct: Math.round((reachesTesting / count) * 100) },
        { stage: "Shipped", pct: Math.round((reachesShipped / count) * 100) },
      ];

      // Projects Using (top 5 by engagement score)
      const mappedProjects = group.drafts.map(d => {
        const score = Math.round((STAGE_PROGRESS[d.currentStage] || 35) * 0.8 + Math.min(20, (d.upvotes || 0) * 0.05));
        
        // Map database stage to UI stage
        let uiStage = 'Building';
        if (d.currentStage === 'Idea only') uiStage = 'Planning';
        else if (d.currentStage === 'Prototype' || d.currentStage === '50% done') uiStage = 'Building';
        else if (d.currentStage === 'Almost complete') uiStage = 'Testing';
        else if (d.currentStage === 'Launched but abandoned') uiStage = 'Shipped';

        return {
          name: d.projectName,
          domain: d.domain ? d.domain.charAt(0).toUpperCase() + d.domain.slice(1) : 'General',
          stage: uiStage,
          score,
          updated: getRelativeTime(d.updatedAt || d.createdAt),
          engagement: (d.upvotes || 0) + (d.bookmarks || 0) * 2 + (d.views || 0) * 0.05
        };
      });
      const topProjects = mappedProjects
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5)
        .map(({ engagement, ...p }) => p);

      // Recommendations mapping
      const defaultRec = RECOMMENDATIONS[meta.slug] || {
        name: "TypeScript",
        slug: "typescript",
        domain: "Web Development",
        reasons: ["Unified typing", "Reduced runtime errors", "Enhanced productivity"]
      };

      // Summary
      const basicSummary = `${displayName} is utilized in ${count} projects. Its projects show a ${completion}% average progress rate and a community rating of ${rating}/5.`;
      const summary = AI_INSIGHTS[meta.slug]?.bestFor ? 
        `${displayName} is highly popular, powering many projects in DraftYard. ${AI_INSIGHTS[meta.slug].bestFor[0]} remains a key application, with projects maintaining a ${completion}% completion pace.` 
        : basicSummary;

      // Extract real failure reasons from database drafts if available
      const dbFailureReasons = Array.from(new Set(group.drafts.map(d => d.failureReason).filter(f => f && f !== 'None' && f !== 'Unknown'))).slice(0, 3);
      const challenges = AI_INSIGHTS[meta.slug]?.failureReasons || (dbFailureReasons.length > 0 ? dbFailureReasons : ["Scope creep", "Integration issues", "Resource constraints"]);

      return {
        slug: meta.slug,
        name: displayName,
        icon: meta.icon,
        category: meta.category,
        projects: count,
        completion,
        successRate,
        failureRate,
        revived,
        rating,
        growth,
        avgRevivalDays,
        summary,
        challenges,
        recommendation: {
          ...defaultRec,
          delta: 5 // placeholder delta, will calculate after all tech is computed
        },
        survival,
        similar: [], // filled later
        projectsUsing: topProjects
      };
    });

    // Populate recommendation deltas and similar/related technologies
    const allTechMap = {};
    techList.forEach(t => { allTechMap[t.slug] = t; });

    techList.forEach(t => {
      // Calculate dynamic recommendation delta
      const recommendedTech = allTechMap[t.recommendation.slug];
      if (recommendedTech) {
        t.recommendation.delta = Math.max(1, recommendedTech.completion - t.completion);
      } else {
        // Fallback: use a random offset or standard 4-8%
        t.recommendation.delta = Math.max(2, Math.min(15, Math.round((100 - t.completion) * 0.15)));
      }

      // Generate similar technologies (same category)
      const sameCategory = techList.filter(x => x.category === t.category && x.slug !== t.slug);
      t.similar = sameCategory.slice(0, 4).map(x => ({
        name: x.name,
        slug: x.slug,
        survival: x.completion,
        trend: Array.from({ length: 10 }, (_, i) => ({ x: i, y: Math.max(10, x.projects + Math.round(Math.sin(i * 0.8) * 2)) }))
      }));

      // If similar is empty, populate with top technologies
      if (t.similar.length === 0) {
        const topPopular = techList.filter(x => x.slug !== t.slug).sort((a, b) => b.projects - a.projects).slice(0, 4);
        t.similar = topPopular.map(x => ({
          name: x.name,
          slug: x.slug,
          survival: x.completion,
          trend: Array.from({ length: 10 }, (_, i) => ({ x: i, y: Math.max(10, x.projects + Math.round(Math.sin(i * 0.8) * 2)) }))
        }));
      }
    });

    res.json(techList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/draft/:id - Delete draft and related workspace items
router.delete('/draft/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findById(id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Verify workspace membership (only Owner can delete project)
    if (draft.submittedBy?.toString() !== req.user._id.toString()) {
  return res.status(403).json({
    error: 'Only the workspace owner can delete this draft'
  });
}

    await Draft.findByIdAndDelete(id);

    // Cascade deletions to clean up database
    const Workspace = require('../models/Workspace');
    await Workspace.deleteMany({ draftId: id });

    const Task = require('../models/Task');
    await Task.deleteMany({ draftId: id });

    const TeamMember = require('../models/TeamMember');
    await TeamMember.deleteMany({ draftId: id });

    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.deleteMany({ draftId: id });

    res.json({ message: 'Project and all related workspace data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;