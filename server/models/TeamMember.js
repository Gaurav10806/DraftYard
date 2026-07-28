const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draft',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Owner', 'Contributor', 'Viewer'],
      default: 'Contributor',
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate team members in the same workspace
teamMemberSchema.index({ draftId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
