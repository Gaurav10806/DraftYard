const express = require('express');
const router = express.Router();
const Draft = require('../models/draft');
const User = require('../models/User');

// GET /api/search?q=... - Global search across drafts, users, technologies
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q?.toString().trim() || '';
    // Drafts search
    const drafts = await Draft.find({ projectName: { $regex: q, $options: 'i' } })
      .limit(20)
      .lean();
    // Users search (public fields)
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name username avatar')
      .limit(20)
      .lean();
    // Technologies search - distinct techStack strings from drafts
    const techAgg = await Draft.aggregate([
      { $unwind: '$techStack' },
      { $match: { techStack: { $regex: q, $options: 'i' } } },
      { $group: { _id: '$techStack' } },
      { $limit: 20 }
    ]);
    const technologies = techAgg.map(t => ({ _id: t._id, name: t._id }));
    res.json({ drafts, users, technologies });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
