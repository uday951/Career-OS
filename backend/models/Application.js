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
    enum: [
      'SAVED', 'APPLYING', 'APPLIED', 'AWAITING_RESPONSE', 
      'RECRUITER_CONTACTED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 
      'REJECTED', 'PENDING_REVIEW', 'FAILED', 'INTERVIEWING', 'OFFER'
    ],
    default: 'SAVED'
  },
  match_score: {
    type: Number
  },
  error_message: {
    type: String
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
  screenshot_url: {
    type: String  // Post-submission screenshot
  },
  filled_form_screenshot_url: {
    type: String  // Screenshot of the filled form before submission
  },
  form_submission_data: [{
    field_label: { type: String },
    field_type: { type: String },
    value: { type: String }
  }],
  application_url: {
    type: String  // The direct URL where the job can be applied
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
