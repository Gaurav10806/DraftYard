const mongoose = require('mongoose');

const challengeParticipantSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['joined', 'completed'],
      default: 'joined',
    },
    progress: {
      current: { type: Number, default: 0 },
      target: { type: Number, default: 1 },
      percentage: { type: Number, default: 0 },
      details: { type: String, default: '' },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'challenge_participants' }
);

// Prevent duplicate joins by same user
challengeParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model(
  'ChallengeParticipant',
  challengeParticipantSchema,
  'challenge_participants'
);
