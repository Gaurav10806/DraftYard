const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Challenge = require('../models/Challenge');
const ChallengeParticipant = require('../models/ChallengeParticipant');
const Draft = require('../models/draft');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Extract user ID optionally without blocking unauthenticated requests
async function getOptionalUserId(req) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.id || null;
  } catch {
    return null;
  }
}

// Evaluate and sync user progress against real Draft project data
async function evaluateUserProgress(challenge, userId) {
  if (!challenge || !userId) return null;

  let participant = await ChallengeParticipant.findOne({
    challengeId: challenge._id,
    userId,
  });

  if (!participant) return null;

  const criteria = challenge.completionCriteria || { type: 'create_draft', targetCount: 1 };
  const target = criteria.targetCount || 1;

  // Build query for user's drafts created since challenge start date
  const draftQuery = {
    submittedBy: userId,
    createdAt: { $gte: challenge.startDate },
  };

  if (criteria.domain) {
    draftQuery.domain = criteria.domain;
  }
  if (criteria.category) {
    draftQuery.category = { $regex: new RegExp(criteria.category, 'i') };
  }

  const matchingDrafts = await Draft.find(draftQuery);
  const currentCount = matchingDrafts.length;
  const percentage = Math.min(100, Math.round((currentCount / target) * 100));
  const isCompleted = currentCount >= target;

  participant.progress = {
    current: currentCount,
    target,
    percentage,
    details: `${currentCount}/${target} criteria met`,
  };

  if (isCompleted && participant.status !== 'completed') {
    participant.status = 'completed';
    participant.completedAt = new Date();
  }

  await participant.save();
  return participant;
}

// ── GET /api/challenges/active ────────────────────────────────────────────────
router.get('/challenges/active', async (req, res) => {
  try {
    const now = new Date();
    const userId = await getOptionalUserId(req);

    // 1. Try currently active challenge
    let challenge = await Challenge.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ startDate: -1 });

    // 2. Fallback to next upcoming challenge
    if (!challenge) {
      challenge = await Challenge.findOne({
        startDate: { $gt: now },
      }).sort({ startDate: 1 });
    }

    // 3. Fallback to latest challenge
    if (!challenge) {
      challenge = await Challenge.findOne().sort({ endDate: -1 });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'No challenges found' });
    }

    // Real participant count
    const participantCount = await ChallengeParticipant.countDocuments({
      challengeId: challenge._id,
    });

    const challengeObj = challenge.toObject();
    challengeObj.participantCount = participantCount;

    let userParticipation = null;
    if (userId) {
      userParticipation = await evaluateUserProgress(challenge, userId);
    }

    res.json({
      challenge: challengeObj,
      userParticipation,
    });
  } catch (err) {
    console.error('Error fetching active challenge:', err);
    res.status(500).json({ error: 'Failed to fetch active challenge' });
  }
});

// ── GET /api/challenges ───────────────────────────────────────────────────────
router.get('/challenges', async (req, res) => {
  try {
    const { status, sort, search } = req.query;
    const userId = await getOptionalUserId(req);
    const now = new Date();

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (status === 'expired' || status === 'completed') {
      query.endDate = { $lt: now };
    }

    let sortOptions = { startDate: -1 };
    if (sort === 'endingSoon') {
      sortOptions = { endDate: 1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'popular') {
      sortOptions = { participantCount: -1 };
    }

    const challenges = await Challenge.find(query).sort(sortOptions);

    const challengeIds = challenges.map((c) => c._id);
    const participantCounts = await ChallengeParticipant.aggregate([
      { $match: { challengeId: { $in: challengeIds } } },
      { $group: { _id: '$challengeId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    participantCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    let userParticipationMap = {};
    if (userId) {
      const userParts = await ChallengeParticipant.find({
        userId,
        challengeId: { $in: challengeIds },
      });
      userParts.forEach((p) => {
        userParticipationMap[p.challengeId.toString()] = p;
      });
    }

    const result = challenges.map((ch) => {
      const obj = ch.toObject();
      obj.participantCount = countMap[ch._id.toString()] || 0;
      obj.userParticipation = userParticipationMap[ch._id.toString()] || null;
      return obj;
    });

    res.json({ challenges: result });
  } catch (err) {
    console.error('Error fetching challenges:', err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// ── GET /api/challenges/:id ───────────────────────────────────────────────────
router.get('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userId = await getOptionalUserId(req);
    const participantCount = await ChallengeParticipant.countDocuments({
      challengeId: challenge._id,
    });

    const challengeObj = challenge.toObject();
    challengeObj.participantCount = participantCount;

    let userParticipation = null;
    if (userId) {
      userParticipation = await evaluateUserProgress(challenge, userId);
    }

    res.json({ challenge: challengeObj, userParticipation });
  } catch (err) {
    console.error('Error fetching challenge by ID:', err);
    res.status(500).json({ error: 'Failed to fetch challenge details' });
  }
});

// ── POST /api/challenges/:id/join ─────────────────────────────────────────────
router.post('/challenges/:id/join', requireAuth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const now = new Date();
    if (now > challenge.endDate) {
      return res.status(400).json({ error: 'This challenge has already expired.' });
    }

    const userId = req.user._id;

    // Check if already joined
    const existing = await ChallengeParticipant.findOne({
      challengeId: challenge._id,
      userId,
    });

    if (existing) {
      return res.status(400).json({
        error: 'You have already joined this challenge.',
        userParticipation: existing,
      });
    }

    // Create participant
    const targetCount = challenge.completionCriteria?.targetCount || 1;
    const participant = new ChallengeParticipant({
      challengeId: challenge._id,
      userId,
      joinedAt: new Date(),
      status: 'joined',
      progress: {
        current: 0,
        target: targetCount,
        percentage: 0,
        details: `0/${targetCount} criteria met`,
      },
    });

    await participant.save();

    // Update participant count
    const participantCount = await ChallengeParticipant.countDocuments({
      challengeId: challenge._id,
    });
    challenge.participantCount = participantCount;
    await challenge.save();

    // Evaluate initial progress against user's real drafts
    const updatedParticipant = await evaluateUserProgress(challenge, userId);

    res.status(201).json({
      message: 'Successfully joined challenge!',
      userParticipation: updatedParticipant || participant,
      participantCount,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already joined this challenge.' });
    }
    console.error('Error joining challenge:', err);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

// ── GET /api/challenges/:id/progress ──────────────────────────────────────────
router.get('/challenges/:id/progress', requireAuth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const participant = await evaluateUserProgress(challenge, req.user._id);
    if (!participant) {
      return res.status(404).json({ error: 'User is not participating in this challenge' });
    }

    res.json({ userParticipation: participant });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: 'Failed to check progress' });
  }
});

// ── GET /api/challenges/:id/leaderboard ──────────────────────────────────────
router.get('/challenges/:id/leaderboard', async (req, res) => {
  try {
    const participants = await ChallengeParticipant.find({ challengeId: req.params.id })
      .populate('userId', 'name username avatar')
      .sort({ status: -1, 'progress.percentage': -1, completedAt: 1, joinedAt: 1 })
      .limit(50);

    const leaderboard = participants.map((p) => ({
      _id: p._id,
      user: p.userId
        ? {
            _id: p.userId._id,
            name: p.userId.name,
            username: p.userId.username,
            avatar: p.userId.avatar,
          }
        : { name: 'Anonymous User', username: 'anonymous', avatar: '' },
      joinedAt: p.joinedAt,
      status: p.status,
      completedAt: p.completedAt,
      progress: p.progress,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
