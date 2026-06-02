import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  metrics: {
    jobs_scanned: { type: Number, default: 0 },
    jobs_matched: { type: Number, default: 0 },
    applications_submitted: { type: Number, default: 0 },
    applications_failed: { type: Number, default: 0 },
    avg_match_score: { type: Number, default: 0 },
    interviews_generated: { type: Number, default: 0 },
    responses_received: { type: Number, default: 0 },
  },
  top_matches: [{
    job_title: String,
    company: String,
    match_score: Number,
    status: String,
  }],
  skills_in_demand: [{ type: String }],
  missing_skills_identified: [{ type: String }],
  summary: { type: String },
  recommendations: [{ type: String }],
  generated_by: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },
}, { timestamps: true });

reportSchema.index({ user_id: 1, createdAt: -1 });
export default mongoose.model('Report', reportSchema);
