const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  avatar: { type: String, default: '' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema(
  {
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draft',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done'],
      default: 'Todo',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    dueDate: { type: Date, default: null },
    assignee: { type: String, default: '' },
    labels: { type: [String], default: [] },
    checklist: [checklistItemSchema],
    comments: [commentSchema],
    dependencies: { type: String, default: '' },
    linkedPR: { type: String, default: '' },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
