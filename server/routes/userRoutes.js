const express = require('express');
const router = express.Router();
const Draft = require('../models/draft');
const { requireAuth } = require('../middleware/authMiddleware');

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

module.exports = router;
