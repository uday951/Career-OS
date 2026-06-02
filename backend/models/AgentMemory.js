import mongoose from 'mongoose';

const agentMemorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  applied_jobs: [{
    job_id: String,
    company: String,
    title: String,
    url: String,
    applied_at: Date,
    status: String
  }],
  
  recruiter_interactions: [{
    recruiter_email: String,
    recruiter_name: String,
    company: String,
    last_contact: Date,
    email_thread_id: String,
    status: String
  }],
  
  successful_patterns: [{
    company_type: String,
    job_title_pattern: String,
    success_rate: Number,
    avg_response_time: Number
  }],
  
  failed_applications: [{
    company: String,
    reason: String,
    error_type: String,
    timestamp: Date
  }],
  
  resume_versions: [{
    version_id: String,
    used_for_companies: [String],
    success_rate: Number
  }]
}, { timestamps: true });

agentMemorySchema.index({ user_id: 1, 'applied_jobs.company': 1 });

export default mongoose.model('AgentMemory', agentMemorySchema);
