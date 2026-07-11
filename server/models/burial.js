const mongoose = require('mongoose');

const burialSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  oneLiner: { type: String, required: true, trim: true },
  domain: { type: String, enum: ['web', 'mobile', 'ml', 'game', 'hardware', 'other'], required: true },
  techStack: { type: [String], default: [] },
  teamSize: { type: String, enum: ['solo', '2-3', '4+'], required: true },
  stageDied: { type: String, enum: ['Idea only', 'Prototype', '50% done', 'Almost complete', 'Launched but abandoned'], required: true },
  whyItDied: { type: String, required: true, trim: true },
  timeSpent: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['days', 'weeks', 'months'], required: true }
  },
  salvageable: { type: String, default: '' },
  openForRevival: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  deathCategory: { type: String, default: null },
  upvotes: { type: Number, default: 0 },
  projectLink: { type: String, default: '' },
  ownerToken: { type: String, default: null },
  // --- Added for the Revival Board (Member C) ---
  // Everyone who has "raised their hand" wanting to revive this project
  raisedHands: {
    type: [
      {
        name: { type: String, required: true, trim: true },
        message: { type: String, default: '', trim: true },
        contact: { type: String, default: '', trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Burial', burialSchema);