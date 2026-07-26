const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  oneLiner: { type: String, required: true, trim: true },
  domain: { type: String, enum: ['web', 'mobile', 'ml', 'game', 'hardware', 'other'], required: true },
  techStack: { type: [String], default: [] },
  teamSize: { type: String, enum: ['solo', '2-3', '4+'], required: true },
  currentStage: { type: String, enum: ['Idea only', 'Prototype', '50% done', 'Almost complete', 'Launched but abandoned'], required: true },
  failureReason: { type: String, required: true, trim: true },
  developmentMethodology: { type: String, default: '' },
  timeSpent: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['days', 'weeks', 'months'], required: true }
  },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  upvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },
  lastWorkedOn: { type: Date, default: null },
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
}, { timestamps: true, collection: 'burials' });

module.exports = mongoose.model('Draft', draftSchema, 'burials');