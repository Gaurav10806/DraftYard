const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draft',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: { type: String, required: true },
    userInitials: { type: String, default: '' },
    action: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
