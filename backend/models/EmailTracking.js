import mongoose from 'mongoose';

const emailTrackingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  
  email_type: { 
    type: String, 
    enum: ['application_followup', 'recruiter_intro', 'interest_email', 'thank_you', 'status_inquiry'],
    required: true
  },
  
  recipient_email: { type: String, required: true },
  recipient_name: String,
  company: String,
  job_title: String,
  
  subject: { type: String, required: true },
  body: { type: String, required: true },
  
  sent_at: { type: Date, default: Date.now },
  gmail_message_id: String,
  gmail_thread_id: String,
  
  status: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'replied', 'bounced', 'failed'],
    default: 'sent'
  },
  
  reply_received: { type: Boolean, default: false },
  reply_at: Date,
  reply_content: String,
  
  ai_generated: { type: Boolean, default: true },
  generation_prompt: String
}, { timestamps: true });

export default mongoose.model('EmailTracking', emailTrackingSchema);
