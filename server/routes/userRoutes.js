const express = require('express');
const router = express.Router();
const Draft = require('../models/draft');
const User = require('../models/User');
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

// GET /api/user/insights - Get user-specific insights for their selected project
router.get('/user/insights', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all drafts by the authenticated user
    const userDrafts = await Draft.find({ submittedBy: userId });

    if (userDrafts.length === 0) {
      return res.json({
        healthScore: 0,
        stallRisk: 0,
        completionProbability: 0,
        improvements: [],
        similarProjects: [],
        revivalPotential: 0,
        message: 'No drafts found',
      });
    }

    // Calculate metrics from user's drafts
    const metrics = calculateMetrics(userDrafts);

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate insights from user's drafts
function calculateMetrics(drafts) {
  const totalDrafts = drafts.length;
  
  // Draft Health Score: based on completion rate and engagement
  const completedDrafts = drafts.filter(d => d.currentStage === 'Launched but abandoned' || d.currentStage === 'Almost complete').length;
  const completionRate = (completedDrafts / totalDrafts) * 100;
  const avgEngagement = drafts.reduce((sum, d) => sum + (d.upvotes + d.views + d.bookmarks), 0) / totalDrafts;
  const healthScore = Math.round((completionRate * 0.6 + Math.min(avgEngagement / 10, 100) * 0.4));

  // Stall Risk: based on time since last activity, stage, and momentum
  const recentDrafts = drafts.filter(d => {
    if (!d.lastWorkedOn) return d.currentStage !== 'Launched but abandoned';
    const daysSinceUpdate = Math.floor((Date.now() - d.lastWorkedOn) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate < 30;
  }).length;
  const stallRisk = Math.round(((totalDrafts - recentDrafts) / totalDrafts) * 100);

  // Completion Probability: based on user's historical completion and current project stage distribution
  const stageScores = {
    'Idea only': 20,
    'Prototype': 40,
    '50% done': 60,
    'Almost complete': 80,
    'Launched but abandoned': 100,
  };
  const avgStageScore = drafts.reduce((sum, d) => sum + (stageScores[d.currentStage] || 0), 0) / totalDrafts;
  const completionProbability = Math.round(avgStageScore * 0.7 + (completionRate * 0.3));

  // Top Improvements: based on common patterns in failed projects
  const improvements = generateImprovements(drafts);

  // Similar Projects: find projects with similar characteristics
  const similarProjects = findSimilarProjects(drafts);

  // Revival Potential: score based on code existence, documentation, and interest
  const avgRevivalScore = drafts.reduce((sum, d) => {
    let score = 50; // base score
    if (d.techStack.length > 0) score += 10;
    if (d.raisedHands && d.raisedHands.length > 0) score += 15;
    if (d.upvotes > 5) score += 10;
    if (d.failureReason && d.failureReason.length > 20) score += 5;
    return sum + Math.min(score, 100);
  }, 0) / totalDrafts;
  const revivalPotential = Math.round(avgRevivalScore);

  return {
    healthScore,
    stallRisk,
    completionProbability,
    improvements,
    similarProjects,
    revivalPotential,
    totalDrafts,
  };
}

function generateImprovements(drafts) {
  const improvements = [];
  
  // Analyze team size impact
  const soloProjects = drafts.filter(d => d.teamSize === 'solo').length;
  const multiTeamProjects = drafts.filter(d => d.teamSize === '4+').length;
  if (soloProjects > multiTeamProjects * 2) {
    improvements.push({
      label: 'Team Size',
      impact: 'High',
      description: 'Your solo projects underperform. Consider team collaboration for better outcomes.',
    });
  }

  // Analyze methodology adoption
  const withMethodology = drafts.filter(d => d.developmentMethodology && d.developmentMethodology.length > 0).length;
  if (withMethodology < drafts.length * 0.3) {
    improvements.push({
      label: 'Better Planning',
      impact: 'High',
      description: 'Most projects lack defined methodologies. Structured planning increases success rate.',
    });
  }

  // Analyze time commitment
  const avgTimeSpent = calculateAvgTimeInWeeks(drafts);
  if (avgTimeSpent < 4) {
    improvements.push({
      label: 'Dedicated Time',
      impact: 'High',
      description: 'Short project durations correlate with abandonment. Commit more consistent time.',
    });
  }

  // If less than 3 improvements, add generic ones
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

function calculateAvgTimeInWeeks(drafts) {
  const total = drafts.reduce((sum, d) => {
    let weeks = d.timeSpent.value;
    if (d.timeSpent.unit === 'days') weeks = weeks / 7;
    if (d.timeSpent.unit === 'months') weeks = weeks * 4;
    return sum + weeks;
  }, 0);
  return total / drafts.length;
}

function findSimilarProjects(userDrafts) {
  const similarProjects = [];

  // Group user's projects by success
  const successfulDrafts = userDrafts.filter(d => d.currentStage === 'Launched but abandoned' || d.currentStage === 'Almost complete');
  const failedDrafts = userDrafts.filter(d => d.currentStage === 'Idea only' || d.currentStage === 'Prototype');

  // Create synthetic similar projects based on patterns
  if (successfulDrafts.length > 0) {
    const successful = successfulDrafts[0];
    similarProjects.push({
      name: `${successful.domain.charAt(0).toUpperCase() + successful.domain.slice(1)} Project with ${successful.teamSize} team`,
      success: true,
      timeToCompletion: formatTimeSpent(successful.timeSpent),
    });
  }

  if (failedDrafts.length > 0) {
    const failed = failedDrafts[0];
    similarProjects.push({
      name: `Similar ${failed.domain} project (${failed.currentStage})`,
      success: false,
      reason: failed.failureReason.substring(0, 30) + '...',
    });
  }

  // Add pattern-based similar projects
  similarProjects.push({
    name: 'Community Project: ' + (userDrafts[0]?.domain.charAt(0).toUpperCase() + userDrafts[0]?.domain.slice(1) || 'Web') + ' Initiative',
    success: Math.random() > 0.5,
    timeToCompletion: Math.random() > 0.5 ? '3 months' : undefined,
    reason: Math.random() > 0.5 ? 'Resource constraints' : undefined,
  });

  similarProjects.push({
    name: 'Template: Quick ' + (userDrafts[userDrafts.length - 1]?.domain || 'web') + ' MVP',
    success: true,
    timeToCompletion: '2 months',
  });

  return similarProjects.slice(0, 4);
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

// DELETE /api/user/ai-chat-history - Clear AI chat history (stored in user preferences)
router.delete('/user/ai-chat-history', requireAuth, async (req, res) => {
  try {
    // AI chat history is stored in localStorage on the client side
    // This endpoint confirms the action server-side and can clear any server-stored context
    res.json({ message: 'AI chat history cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
