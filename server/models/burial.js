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
}, { timestamps: true });

module.exports = mongoose.model('Burial', burialSchema);