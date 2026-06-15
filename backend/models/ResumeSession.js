import mongoose from 'mongoose';

const resumeSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalResume: {
    rawText: { type: String, default: '' },
    parsedJSON: { type: Object, default: {} },
    uploadedAt: { type: Date, default: Date.now }
  },
  jobDescription: {
    rawText: { type: String, default: '' },
    parsedKeywords: { type: [String], default: [] },
    companyName: { type: String, default: '' },
    roleTitle: { type: String, default: '' }
  },
  atsReports: [{
    version: { type: String, required: true },
    score: { type: Number, required: true },
    breakdown: {
      keywordMatch: { type: Number, default: 0 },
      skillsAlignment: { type: Number, default: 0 },
      experienceRelevance: { type: Number, default: 0 },
      formatScore: { type: Number, default: 0 }
    },
    missingKeywords: { type: [String], default: [] },
    presentKeywords: { type: [String], default: [] },
    semanticMatches: [{
      resumeWord: { type: String },
      jdWord: { type: String }
    }],
    suggestions: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now }
  }],
  resumeVersions: [{
    versionName: { type: String, required: true },
    strategy: { type: String, default: '' }, // A: ATS-Maximized, B: Human-Optimized, C: Hybrid Executive
    content: { type: Object, required: true }, // The structured resume data
    atsScore: { type: Number, default: 0 },
    claudeReasoning: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  generatedPDFs: [{
    templateName: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    gridfsId: { type: mongoose.Schema.Types.ObjectId },
    atsScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  optimizationHistory: [{
    section: { type: String, required: true },
    originalContent: { type: String, default: '' },
    optimizedContent: { type: String, default: '' },
    improvement: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const ResumeSession = mongoose.model('ResumeSession', resumeSessionSchema);

export default ResumeSession;
