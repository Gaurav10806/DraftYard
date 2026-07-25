const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    draftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Draft',
      required: true,
      unique: true,
      index: true,
    },
    longDescription: { type: String, default: '' },
    featuresCompleted: { type: String, default: '' },
    currentBlockers: { type: String, default: '' },
    externalLinks: { type: String, default: '' },
    tasks: [
      {
        id: String,
        title: String,
        status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
        priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
        assignee: String,
      },
    ],
    milestones: [
      {
        id: String,
        label: String,
        progress: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workspace', workspaceSchema);
