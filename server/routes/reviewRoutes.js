const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /api/review - Create a new review
router.post('/review', requireAuth, async (req, res) => {
  try {
    const {
      projectName,
      oneLinePitch,
      additionalContext,
    } = req.body;

    if (!oneLinePitch || !oneLinePitch.trim()) {
      return res.status(400).json({ error: 'One-line pitch is required' });
    }

    const review = new Review({
      userId: req.user._id,
      projectName: projectName || '',
      oneLinePitch: oneLinePitch.trim(),
      additionalContext: additionalContext || '',
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/review/:id - Update review with AI analysis
router.patch('/review/:id', requireAuth, async (req, res) => {
  try {
    const {
      score,
      verdict,
      summary,
      similarProjects,
      recommendedStack,
      risks,
      suggestions,
      roadmap,
      finalNote,
      aiAnalysisUsed,
      aiAnalysisError,
      matchError,
      communityStatistics,
      overallAnalysis,
      scoreDimensions,
    } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only allow owner to update
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update analysis fields
    if (typeof score === 'number') review.score = score;
    if (verdict) review.verdict = verdict;
    if (summary) review.summary = summary;
    if (similarProjects) review.similarProjects = similarProjects;
    if (recommendedStack) review.recommendedStack = recommendedStack;
    if (risks) review.risks = risks;
    if (suggestions) review.suggestions = suggestions;
    if (roadmap) review.roadmap = roadmap;
    if (finalNote) review.finalNote = finalNote;
    if (typeof aiAnalysisUsed === 'boolean') review.aiAnalysisUsed = aiAnalysisUsed;
    if (aiAnalysisError !== undefined) review.aiAnalysisError = aiAnalysisError;
    if (matchError !== undefined) review.matchError = matchError;
    if (communityStatistics) review.communityStatistics = communityStatistics;
    if (overallAnalysis) review.overallAnalysis = overallAnalysis;
    if (scoreDimensions) review.scoreDimensions = scoreDimensions;

    await review.save();
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/reviews - Get all reviews for logged-in user, sorted by newest first
router.get('/reviews', requireAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/review/:id - Get a single review
router.get('/review/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only allow owner to view
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/review/:id - Delete a review
router.delete('/review/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only allow owner to delete
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/review/:id/rename - Rename a review
router.patch('/review/:id/rename', requireAuth, async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only allow owner to rename
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    review.projectName = projectName.trim();
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
