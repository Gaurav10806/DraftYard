const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rewards: [
      {
        icon: { type: String, default: 'Trophy' }, // Trophy, Star, Medal, Award, Crown, Zap
        label: { type: String, required: true },
        value: { type: String, default: '' },
      },
    ],
    eligibilityRules: [{ type: String, trim: true }],
    completionCriteria: {
      type: {
        type: String,
        enum: ['create_draft', 'publish_feed', 'tech_stack_built', 'revival_raised', 'any_project'],
        default: 'create_draft',
      },
      targetCount: { type: Number, default: 1 },
      domain: { type: String, default: '' },
      category: { type: String, default: '' },
      techStack: [{ type: String }],
      description: { type: String, required: true },
    },
    participantCount: { type: Number, default: 0 },
    badge: { type: String, default: 'Exclusive Challenge Badge' },
  },
  { timestamps: true, collection: 'challenges' }
);

// Virtual property to calculate challenge status based on current date
challengeSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startDate) return 'Upcoming';
  if (now > this.endDate) return 'Expired';
  return 'Active';
});

challengeSchema.set('toJSON', { virtuals: true });
challengeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Challenge', challengeSchema, 'challenges');
