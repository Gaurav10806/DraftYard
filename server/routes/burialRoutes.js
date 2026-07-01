const express = require('express');
const router = express.Router();
const Burial = require('../models/burial');

// POST /api/bury
router.post('/bury', async (req, res) => {
  try {
    const burial = new Burial(req.body);
    await burial.save();
    res.status(201).json(burial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/feed
router.get('/feed', async (req, res) => {
  try {
    const { stack, stage, domain, teamSize, openForRevival } = req.query;
    const filter = {};
    if (stack) filter.techStack = stack;
    if (stage) filter.stageDied = stage;
    if (domain) filter.domain = domain;
    if (teamSize) filter.teamSize = teamSize;
    if (openForRevival) filter.openForRevival = openForRevival === 'true';

    const burials = await Burial.find(filter).sort({ createdAt: -1 });
    res.json(burials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bury/:id/upvote
router.patch('/bury/:id/upvote', async (req, res) => {
  try {
    const burial = await Burial.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!burial) return res.status(404).json({ error: 'Burial not found' });
    res.json(burial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;