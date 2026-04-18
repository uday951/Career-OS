import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Job'
  },
  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume' // The specific configured resume used for this app
  },
  status: {
    type: String,
    enum: ['SAVED', 'APPLYING', 'APPLIED', 'INTERVIEWING', 'REJECTED', 'OFFERED'],
    default: 'SAVED'
  },
  match_analysis: {
    match_percentage: Number,
    strengths: [String],
    missing_skills: [String],
    reasoning: String
  },
  tailored_cover_letter: {
    type: String
  },
  rejection_feedback: {
    type: String
  },
  feedback_analysis: {
    core_reason: String,
    actionable_advice: [String],
    skills_to_learn: [String]
  },
  applied_on: {
    type: Date
  },
  intelligence_materials: {
    company_background: String,
    cultural_reviews: String,
    interview_process: [String],
    study_resources: [String],
    internet_sources: [String]
  }
}, {
  timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
