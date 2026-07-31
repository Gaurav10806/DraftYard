const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Draft = require('../models/draft');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /api/user/profile - Get current user's profile
router.get('/user/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'name username email avatar')
      .populate('following', 'name username email avatar');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Expose 'name' as 'fullName' so the client stays consistent
    const obj = user.toJSON();
    obj.fullName = obj.name;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/user/profile/:id - Fetch public profile of any user by ID
router.get('/user/profile/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const user = await User.findById(id)
      .select('-password')
      .populate('followers', 'name username email avatar')
      .populate('following', 'name username email avatar');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const obj = user.toJSON();
    obj.fullName = obj.name || obj.username || 'Developer';
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/user/profile - Update current user's profile
router.patch('/user/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, username, bio, github, linkedin, portfolio, avatar } = req.body;
    
    const updateFields = {};
    // 'fullName' from client maps to 'name' in the DB schema
    if (fullName !== undefined) updateFields.name = fullName;
    if (username !== undefined) updateFields.username = username;
    if (bio !== undefined) updateFields.bio = bio;
    if (github !== undefined) updateFields.github = github;
    if (linkedin !== undefined) updateFields.linkedin = linkedin;
    if (portfolio !== undefined) updateFields.portfolio = portfolio;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return fullName alias
    const obj = user.toJSON();
    obj.fullName = obj.name;
    res.json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/user/follow/:userId - Follow a user
router.post('/user/follow/:userId', requireAuth, async (req, res) => {
  try {
    const userIdToFollow = req.params.userId;
    const currentUserId = req.user._id;

    // Can't follow yourself
    if (userIdToFollow === currentUserId.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if user to follow exists
    const userToFollow = await User.findById(userIdToFollow);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to following list (current user)
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userIdToFollow }
    });

    // Add to followers list (target user)
    await User.findByIdAndUpdate(userIdToFollow, {
      $addToSet: { followers: currentUserId }
    });

    res.json({ message: 'Successfully followed user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/unfollow/:userId - Unfollow a user
router.delete('/user/unfollow/:userId', requireAuth, async (req, res) => {
  try {
    const userIdToUnfollow = req.params.userId;
    const currentUserId = req.user._id;

    // Remove from following list (current user)
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userIdToUnfollow }
    });

    // Remove from followers list (target user)
    await User.findByIdAndUpdate(userIdToUnfollow, {
      $pull: { followers: currentUserId }
    });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/followers - Get current user's followers
router.get('/user/followers', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name username email avatar bio');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = (user.followers || []).map(f => {
      const obj = f.toJSON ? f.toJSON() : { ...f._doc };
      obj.fullName = obj.name;
      return obj;
    });
    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/following - Get current user's following list
router.get('/user/following', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'name username email avatar bio');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = (user.following || []).map(f => {
      const obj = f.toJSON ? f.toJSON() : { ...f._doc };
      obj.fullName = obj.name;
      return obj;
    });
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/search - Search for users to follow
router.get('/users/search', requireAuth, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name username email avatar bio')
    .limit(20);

    res.json(users.map(u => { const o = u.toJSON(); o.fullName = o.name; return o; }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/suggestions - Get suggested users to follow
router.get('/users/suggestions', requireAuth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const excludeIds = [req.user._id, ...(currentUser.following || [])];

    const suggestions = await User.find({
      _id: { $nin: excludeIds },
    })
    .select('name username email avatar bio')
    .sort({ createdAt: -1 })
    .limit(6);

    res.json(suggestions.map(u => { const o = u.toJSON(); o.fullName = o.name; return o; }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/skills - Add a skill
router.post('/user/skills', requireAuth, async (req, res) => {
  try {
    const { skill } = req.body;
    if (!skill || !skill.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { skills: skill.trim() } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/skills - Remove a skill
router.delete('/user/skills', requireAuth, async (req, res) => {
  try {
    const { skill } = req.body;
    if (!skill) return res.status(400).json({ error: 'Skill name is required' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { skills: skill } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/insights - Get real user-specific insights & community analysis
router.get('/user/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all drafts created by the authenticated user
    const userDrafts = await Draft.find({ submittedBy: userId });

    // Query real similar community projects from MongoDB matching user's domains/tech stacks
    const userDomains = Array.from(new Set(userDrafts.map(d => d.domain).filter(Boolean)));
    const userTechs = Array.from(new Set(userDrafts.flatMap(d => d.techStack || [])));

    const similarCommunityDrafts = await Draft.find({
      submittedBy: { $ne: userId },
      ...(userDomains.length > 0 ? { domain: { $in: userDomains } } : {})
    })
      .select('projectName domain currentStage failureReason upvotes raisedHands timeSpent')
      .limit(4);

    const formattedSimilar = similarCommunityDrafts.map(d => ({
      name: d.projectName,
      domain: d.domain,
      success: d.currentStage === 'Shipped' || d.currentStage === 'Launched but abandoned' || d.currentStage === 'Almost complete',
      timeToCompletion: d.timeSpent?.value ? `${d.timeSpent.value} ${d.timeSpent.unit || 'weeks'}` : '3 weeks',
      reason: d.failureReason ? d.failureReason.slice(0, 45) : 'Stalled due to resource constraints',
    }));

    if (userDrafts.length === 0) {
      return res.json({
        healthScore: 0,
        stallRisk: 0,
        completionProbability: 0,
        improvements: [
          { label: 'Create First Draft', impact: 'High', description: 'Submit your first draft to unlock tailored AI health & revival insights.' },
          { label: 'Specify Tech Stack', impact: 'Medium', description: 'Adding complete tech stack tags improves community match accuracy.' },
          { label: 'Define Stall Reasons', impact: 'Medium', description: 'Documenting project bottlenecks helps collaborators assist you effectively.' },
        ],
        similarProjects: formattedSimilar,
        revivalPotential: 0,
        totalDrafts: 0,
        totalUpvotes: 0,
        totalRaisedHands: 0,
        topDomain: 'N/A',
        topTech: 'N/A',
        message: 'No drafts found for user',
      });
    }

    const totalDrafts = userDrafts.length;

    // Calculate Real Metrics
    const completedDrafts = userDrafts.filter(d => d.currentStage === 'Shipped' || d.currentStage === 'Launched but abandoned' || d.currentStage === 'Almost complete').length;
    const completionRate = (completedDrafts / totalDrafts) * 100;
    
    const totalUpvotes = userDrafts.reduce((sum, d) => sum + (d.upvotes || 0), 0);
    const totalRaisedHands = userDrafts.reduce((sum, d) => sum + (d.raisedHands ? d.raisedHands.length : 0), 0);
    const avgEngagement = userDrafts.reduce((sum, d) => sum + ((d.upvotes || 0) + (d.views || 0) + (d.bookmarks || 0)), 0) / totalDrafts;

    const healthScore = Math.min(100, Math.max(10, Math.round(completionRate * 0.5 + Math.min(avgEngagement * 5, 50))));

    // Stall Risk
    const recentDrafts = userDrafts.filter(d => {
      if (!d.lastWorkedOn) return d.currentStage !== 'Launched but abandoned';
      const daysSinceUpdate = Math.floor((Date.now() - new Date(d.lastWorkedOn).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate < 30;
    }).length;

    const stallRisk = Math.min(95, Math.max(15, Math.round(((totalDrafts - recentDrafts) / totalDrafts) * 100)));

    // Completion Probability
    const stageScores = {
      'Idea only': 25,
      'Prototype': 45,
      '50% done': 65,
      'Almost complete': 85,
      'Launched but abandoned': 90,
      'Shipped': 100,
    };
    const avgStageScore = userDrafts.reduce((sum, d) => sum + (stageScores[d.currentStage] || 35), 0) / totalDrafts;
    const completionProbability = Math.min(98, Math.max(15, Math.round(avgStageScore * 0.65 + completionRate * 0.35)));

    // Revival Potential
    const avgRevivalScore = userDrafts.reduce((sum, d) => {
      let score = 50;
      if (d.techStack && d.techStack.length > 0) score += 10;
      if (d.raisedHands && d.raisedHands.length > 0) score += 20;
      if (d.upvotes > 3) score += 10;
      if (d.failureReason && d.failureReason.length > 15) score += 10;
      return sum + Math.min(score, 100);
    }, 0) / totalDrafts;
    const revivalPotential = Math.min(100, Math.max(20, Math.round(avgRevivalScore)));

    // Top domain and tech stack
    const domainCounts = {};
    userDrafts.forEach(d => { if (d.domain) domainCounts[d.domain] = (domainCounts[d.domain] || 0) + 1; });
    const topDomain = Object.keys(domainCounts).sort((a, b) => domainCounts[b] - domainCounts[a])[0] || 'Web';

    const techCounts = {};
    userDrafts.forEach(d => (d.techStack || []).forEach(t => { techCounts[t] = (techCounts[t] || 0) + 1; }));
    const topTech = Object.keys(techCounts).sort((a, b) => techCounts[b] - techCounts[a])[0] || 'React';

    // Improvements
    const improvements = generateImprovements(userDrafts);

    res.json({
      healthScore,
      stallRisk,
      completionProbability,
      revivalPotential,
      totalDrafts,
      totalUpvotes,
      totalRaisedHands,
      topDomain,
      topTech,
      improvements,
      similarProjects: formattedSimilar.length > 0 ? formattedSimilar : findFallbackSimilar(userDrafts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateImprovements(drafts) {
  const improvements = [];
  
  // Analyze team size impact
  const soloProjects = drafts.filter(d => d.teamSize === 'solo').length;
  const multiTeamProjects = drafts.filter(d => d.teamSize === '4+').length;
  if (soloProjects > multiTeamProjects * 2) {
    improvements.push({
      label: 'Team Collaboration',
      impact: 'High',
      description: 'Your solo projects have higher stall rates. Consider opening your project for community revival.',
    });
  }

  // Analyze failure reasons
  const withFailureReason = drafts.filter(d => d.failureReason && d.failureReason.length > 10).length;
  if (withFailureReason < drafts.length) {
    improvements.push({
      label: 'Document Stall Reasons',
      impact: 'High',
      description: 'Clearly specifying why a project stalled increases incoming join requests by 3x.',
    });
  }

  // Analyze tech stack tags
  const withTech = drafts.filter(d => d.techStack && d.techStack.length > 0).length;
  if (withTech < drafts.length) {
    improvements.push({
      label: 'Add Tech Stack Tags',
      impact: 'Medium',
      description: 'Tagging frameworks (React, Node, etc.) helps AI match developers with your exact stack.',
    });
  }

  while (improvements.length < 3) {
    const generic = [
      { label: 'Documentation', impact: 'Medium', description: 'Better documentation helps revival potential.' },
      { label: 'Code Quality', impact: 'Medium', description: 'Maintain readable code for easier revival.' },
      { label: 'Community Feedback', impact: 'Medium', description: 'Gather user feedback earlier in development.' },
    ];
    const notAdded = generic.find(g => !improvements.find(i => i.label === g.label));
    if (notAdded) improvements.push(notAdded);
    else break;
  }

  return improvements.slice(0, 3);
}

function findFallbackSimilar(userDrafts) {
  return [
    {
      name: 'Community Open Revival Project',
      domain: userDrafts[0]?.domain || 'Web',
      success: true,
      timeToCompletion: '4 weeks',
    },
    {
      name: 'Collaborative Starter Workspace',
      domain: 'SaaS',
      success: false,
      reason: 'Stalled due to frontend polish',
    }
  ];
}

function formatTimeSpent(timeSpent) {
  const { value, unit } = timeSpent;
  const unitDisplay = unit === 'weeks' ? 'w' : unit === 'days' ? 'd' : 'm';
  return `${value}${unitDisplay}`;
}

// ===== Data & Privacy =====

// GET /api/user/export - Export all user data as JSON
router.get('/user/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');
    const drafts = await Draft.find({ submittedBy: userId });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        skills: user.skills,
        createdAt: user.createdAt,
      },
      drafts: drafts.map(d => ({
        projectName: d.projectName,
        oneLiner: d.oneLiner,
        domain: d.domain,
        techStack: d.techStack,
        teamSize: d.teamSize,
        currentStage: d.currentStage,
        failureReason: d.failureReason,
        timeSpent: d.timeSpent,
        upvotes: d.upvotes,
        views: d.views,
        createdAt: d.createdAt,
      })),
      stats: {
        totalDrafts: drafts.length,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        skills: user.skills?.length || 0,
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="draftyard-export-${userId}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/export-projects - Export only user's drafts/projects as JSON
router.get('/user/export-projects', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const drafts = await Draft.find({ submittedBy: userId }).sort({ createdAt: -1 });

    const projectsData = {
      exportedAt: new Date().toISOString(),
      totalProjects: drafts.length,
      projects: drafts.map(d => ({
        projectName: d.projectName,
        oneLiner: d.oneLiner,
        domain: d.domain,
        techStack: d.techStack,
        teamSize: d.teamSize,
        currentStage: d.currentStage,
        failureReason: d.failureReason,
        developmentMethodology: d.developmentMethodology,
        timeSpent: d.timeSpent,
        isAnonymous: d.isAnonymous,
        projectLink: d.projectLink,
        upvotes: d.upvotes,
        views: d.views,
        raisedHands: d.raisedHands?.length || 0,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="draftyard-projects-${userId}.json"`);
    res.json(projectsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications - Fetch user's notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userIdStr = req.user._id ? req.user._id.toString() : '';
    const userObjId = (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr))
      ? new mongoose.Types.ObjectId(userIdStr)
      : req.user._id;

    const notifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { recipient: userObjId },
        { recipient: userIdStr }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name username avatar email')
      .populate('draftId', 'projectName domain');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const userIdStr = req.user._id ? req.user._id.toString() : '';
    const userObjId = (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr))
      ? new mongoose.Types.ObjectId(userIdStr)
      : req.user._id;

    await Notification.updateMany({
      $or: [
        { recipient: req.user._id },
        { recipient: userObjId },
        { recipient: userIdStr }
      ],
      read: false
    }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const userIdStr = req.user._id ? req.user._id.toString() : '';
    const userObjId = (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr))
      ? new mongoose.Types.ObjectId(userIdStr)
      : req.user._id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { recipient: req.user._id },
          { recipient: userObjId },
          { recipient: userIdStr }
        ]
      },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/:id/respond - Accept or Reject a join request
router.post('/notifications/:id/respond', requireAuth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "accept" or "reject"' });
    }

    const userIdStr = req.user._id ? req.user._id.toString() : '';
    const userObjId = (userIdStr && mongoose.Types.ObjectId.isValid(userIdStr))
      ? new mongoose.Types.ObjectId(userIdStr)
      : req.user._id;

    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { recipient: req.user._id },
        { recipient: userObjId },
        { recipient: userIdStr }
      ]
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.type !== 'join_request') {
      return res.status(400).json({ error: 'Notification is not a join request' });
    }

    const isAccept = action === 'accept';
    notification.status = isAccept ? 'accepted' : 'rejected';
    notification.read = true;
    await notification.save();

    if (isAccept) {
      // Add sender to draft collaborators if sender user exists
      if (notification.sender) {
        await Draft.findByIdAndUpdate(notification.draftId, {
          $addToSet: { collaborators: notification.sender },
        });

        // Ensure TeamMember entry exists
        const TeamMember = require('../models/TeamMember');
        await TeamMember.findOneAndUpdate(
          { draftId: notification.draftId, userId: notification.sender },
          { role: 'Contributor' },
          { upsert: true, new: true }
        );

        // Notify applicant about acceptance
        await Notification.create({
          recipient: notification.sender,
          sender: req.user._id,
          senderName: req.user.name || 'Project Owner',
          type: 'request_accepted',
          draftId: notification.draftId,
          draftName: notification.draftName,
          details: {
            name: req.user.name,
            message: `Your request to join "${notification.draftName}" was accepted! You now have access to manage the workspace.`,
          },
          status: 'accepted',
          read: false,
        });
      }
    } else {
      // Notify applicant about rejection
      if (notification.sender) {
        await Notification.create({
          recipient: notification.sender,
          sender: req.user._id,
          senderName: req.user.name || 'Project Owner',
          type: 'request_rejected',
          draftId: notification.draftId,
          draftName: notification.draftName,
          details: {
            name: req.user.name,
            message: `Your request to join "${notification.draftName}" was rejected by the project owner.`,
          },
          status: 'rejected',
          read: false,
        });
      }
    }

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
