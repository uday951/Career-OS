import mongoose from 'mongoose';

const matchScoreSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  overall_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  skill_match_score: {
    type: Number,
    min: 0,
    max: 100,
  },
  experience_match_score: {
    type: Number,
    min: 0,
    max: 100,
  },
  education_match_score: {
    type: Number,
    min: 0,
    max: 100,
  },
  keyword_match_score: {
    type: Number,
    min: 0,
    max: 100,
  },
  matched_skills: [{ type: String }],
  missing_skills: [{ type: String }],
  matched_keywords: [{ type: String }],
  missing_keywords: [{ type: String }],
  ats_compatibility_score: {
    type: Number,
    min: 0,
    max: 100,
  },
  ats_issues: [{ type: String }],
  recommendations: [{ type: String }],
  should_apply: { type: Boolean, default: false },
  ai_summary: { type: String },
  raw_analysis: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

matchScoreSchema.index({ user_id: 1, job_id: 1 }, { unique: true });
matchScoreSchema.index({ overall_score: -1 });

export default mongoose.model('MatchScore', matchScoreSchema);
