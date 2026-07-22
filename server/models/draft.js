const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  oneLiner: { type: String, required: true, trim: true },
  domain: { type: String, required: false }, // relaxed for backwards compatibility
  techStack: { type: [String], default: [] },
  teamSize: { type: String, default: 'solo' },
  stageDied: { type: String, default: 'Idea' },
  whyItDied: { type: String, default: '' },
  timeSpent: {
    value: { type: Number, default: 0 },
    unit: { type: String, default: 'weeks' }
  },
  salvageable: { type: String, default: '' },
  openForRevival: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  deathCategory: { type: String, default: null },
  upvotes: { type: Number, default: 0 },

  // New fields for the simplified form
  category: { type: String, default: 'Other' },
  lastWorkedOn: { type: Date, default: Date.now },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },

  // --- Added for the Revival Board (Member C) ---
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

module.exports = mongoose.model('Draft', draftSchema);
