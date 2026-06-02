import mongoose from 'mongoose';

const agentSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['idle', 'searching', 'matching', 'applying', 'paused', 'completed', 'failed'],
    default: 'idle'
  },
  pending_tasks: { type: Number, default: 0 },
  current_activity: { type: String, default: '' },
  current_url: { type: String, default: '' },
  current_job_title: { type: String, default: '' },
  current_company: { type: String, default: '' },
  
  stats: {
    jobs_searched: { type: Number, default: 0 },
    jobs_matched: { type: Number, default: 0 },
    applications_submitted: { type: Number, default: 0 },
    applications_failed: { type: Number, default: 0 },
    emails_sent: { type: Number, default: 0 },
    jobs_skipped: { type: Number, default: 0 }
  },
  
  activity_log: [{
    timestamp: { type: Date, default: Date.now },
    action: String,
    details: String,
    status: { type: String, enum: ['info', 'success', 'warning', 'error'] }
  }],
  
  browser_state: {
    is_active: { type: Boolean, default: false },
    current_page_title: String,
    current_page_url: String,
    screenshot_url: String
  },
  
  started_at: { type: Date, default: Date.now },
  completed_at: Date,
  error_message: String
}, { timestamps: true });

export default mongoose.model('AgentSession', agentSessionSchema);
