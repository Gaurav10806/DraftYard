const express = require('express');
const router = express.Router();
const Burial = require('../models/burial');

// POST /api/bury
router.post('/bury', async (req, res) => {
  try {
    const burial = new Burial(req.body);
    await burial.save();

    // Ask Django to classify the death reason
    try {
      const response = await fetch('http://localhost:8000/api/ml/classify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          burials: [{ id: burial._id.toString(), whyItDied: burial.whyItDied }]
        })
      });
      const result = await response.json();
      burial.deathCategory = result[0].deathCategory;
      await burial.save();
    } catch (mlError) {
      console.error('ML classification failed, continuing without it:', mlError.message);
    }

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

// --- Added for the Revival Board (Member C) ---

// GET /api/revival-board -> only projects open for revival, newest first
router.get('/revival-board', async (req, res) => {
  try {
    const { stack, stage, domain } = req.query;
    const filter = { openForRevival: true };
    if (stack) filter.techStack = stack;
    if (stage) filter.stageDied = stage;
    if (domain) filter.domain = domain;

    const burials = await Burial.find(filter).sort({ createdAt: -1 });
    res.json(burials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bury/:id/raise-hand -> record someone wanting to revive the project
router.patch('/bury/:id/raise-hand', async (req, res) => {
  try {
    const { name, message, contact } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required to raise your hand' });
    }

    const burial = await Burial.findByIdAndUpdate(
      req.params.id,
      { $push: { raisedHands: { name, message, contact } } },
      { new: true }
    );
    if (!burial) return res.status(404).json({ error: 'Burial not found' });
    res.json(burial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;