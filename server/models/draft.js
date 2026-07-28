const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  oneLiner: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  category: { type: String, default: '', trim: true },
  domain: { type: String, enum: ['web', 'mobile', 'ml', 'game', 'hardware', 'other'], required: true },
  techStack: { type: [String], default: [] },
  teamSize: { type: String, enum: ['solo', '2-3', '4+'], required: true },
  currentStage: { type: String, enum: ['Idea only', 'Prototype', '50% done', 'Almost complete', 'Launched but abandoned'], required: true },
  stage: { type: String, default: '' },
  status: { type: String, default: 'active' },
  failureReason: { type: String, required: true, trim: true },
  developmentMethodology: { type: String, default: '' },
  timeSpent: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['days', 'weeks', 'months'], required: true }
  },
  estimatedTime: { type: String, default: '' },
  difficulty: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  upvotes: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  views: { type: Number, default: 0 },
  viewedBy: { type: [String], default: [] }, // Stores userId or sessionId
  bookmarks: { type: Number, default: 0 },
  bookmarkedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  collaborators: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  tags: { type: [String], default: [] },
  openForRevival: { type: Boolean, default: false },
  lastWorkedOn: { type: String, default: null },
  raisedHands: {
    type: [
      {
        name: { type: String, required: true, trim: true },
        message: { type: String, default: '', trim: true },
        contact: { type: String, default: '', trim: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
}, { timestamps: true, collection: 'drafts' });

module.exports = mongoose.model('Draft', draftSchema, 'drafts');