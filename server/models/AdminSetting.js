const mongoose = require('mongoose');

const adminSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    // Platform & Maintenance Controls
    maintenanceMode: { type: Boolean, default: false },
    maintenanceNotice: {
      type: String,
      default: 'DraftYard is currently undergoing scheduled maintenance. Core services remain in read-only mode.',
    },
    allowRegistrations: { type: Boolean, default: true },
    maxDraftsPerUser: { type: Number, default: 50 },
    maxFileUploadMb: { type: Number, default: 25 },
    autoModeration: { type: Boolean, default: true },

    // System Announcement Banner
    announcementActive: { type: Boolean, default: false },
    announcementText: {
      type: String,
      default: '🚀 DraftYard Platform Update: AI Insights & Stack Intelligence enhancements are live!',
    },
    announcementType: {
      type: String,
      enum: ['info', 'warning', 'success', 'destructive'],
      default: 'info',
    },

    // AI & LLM Engine Settings
    defaultAiModel: { type: String, default: 'gemini-1.5-pro' },
    maxDailyAiQueriesPerUser: { type: Number, default: 100 },
    aiTemperature: { type: Number, default: 0.7 },
    mlBackendUrl: { type: String, default: process.env.ML_API_URL || process.env.ML_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://draftyard-production.up.railway.app' : 'http://localhost:8000') },
    aiAutoSuggestions: { type: Boolean, default: true },

    // Security & Audit
    enforceStrongPasswords: { type: Boolean, default: true },
    sessionLifetimeHours: { type: Number, default: 24 },
    auditLogging: { type: Boolean, default: true },
    masterApiKey: { type: String, default: 'dy_live_admin_sec_8f93a1094b8e' },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
