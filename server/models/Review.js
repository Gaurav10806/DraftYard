const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectName: { type: String, default: '', trim: true },
    oneLinePitch: { type: String, required: true, trim: true },
    additionalContext: { type: String, default: '', trim: true },
    
    // AI Analysis Results (populated after analysis)
    score: { type: Number, default: null },
    verdict: { type: String, enum: ['Worth Building', 'Needs Refinement', 'Reconsider'], default: null },
    summary: { type: String, default: '' },
    overallAnalysis: { type: String, default: '' },
    scoreDimensions: [
      {
        dimension: String,
        score: Number,
        reason: String,
      }
    ],
    
    // Matched Drafts
    similarProjects: [
      {
        id: String,
        projectName: String,
        oneLiner: String,
        priority: { type: String, enum: ['High', 'Medium', 'Low'] },
        similarity: Number,
        similarityPct: Number,
        matchedKeywords: [String],
        techStack: [String],
        currentStage: String,
        failureReason: String,
        revivalStatus: String,
        openForRevival: Boolean,
        scoreBreakdown: {
          semantic: Number,
          tech: Number,
          tags: Number,
          category: Number,
          stage: Number,
          quality: Number,
        },
        rankingReasons: [String],
        retrievalReasons: [String],
        isCurrentProject: Boolean,
      }
    ],
    
    // Recommendations & Stack
    recommendedStack: {
      frontend: { type: String, default: '' },
      backend: { type: String, default: '' },
      database: { type: String, default: '' },
      ai: { type: String, default: '' },
      hosting: { type: String, default: '' },
    },
    
    // Risk Assessment
    risks: {
      feasibility: { label: String, note: String },
      competition: { label: String, note: String },
      complexity: { label: String, note: String },
      scalability: { label: String, note: String },
      market: { headline: String, note: String },
    },
    
    // Suggestions
    suggestions: [String],
    roadmap: [
      {
        week: String,
        label: String,
      }
    ],
    finalNote: { type: String, default: '' },
    
    // Metadata
    aiAnalysisUsed: { type: Boolean, default: false },
    aiAnalysisError: { type: String, default: null },
    matchError: { type: String, default: null },
    
    communityStatistics: {
      totalDrafts: Number,
      retrievedMatches: Number,
      highestSimilarity: Number,
      averageSimilarity: Number,
      confidenceScore: String,
      commonFailure: String,
      commonTech: String,
      avgProjectStage: String,
      mostSuccessfulCategory: String,
      avgCompletionRate: Number,
      stageDistribution: mongoose.Schema.Types.Mixed,
      techFrequency: [{ name: String, count: Number }],
      failureFrequency: [{ name: String, count: Number }],
      completionStatistics: {
        averageProgress: Number,
        progressRange: String,
        totalCount: Number,
      },
    },
  },
  { timestamps: true, collection: 'reviews' }
);

module.exports = mongoose.model('Review', reviewSchema, 'reviews');
