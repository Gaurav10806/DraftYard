const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['join_request', 'request_accepted', 'request_rejected', 'warning', 'draft_deleted', 'general'],
      required: true,
    },
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draft',
      default: null,
    },
    draftName: {
      type: String,
      default: '',
    },
    details: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' },
      message: { type: String, default: '' },
      skills: { type: [String], default: [] },
      estimatedTime: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
