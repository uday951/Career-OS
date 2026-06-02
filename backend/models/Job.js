import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  url: {
    type: String
  },
  job_url: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  extracted_keywords: {
    type: [String],
    default: []
  },
  recruiter_name: {
    type: String
  },
  recruiter_email: {
    type: String
  },
  skills_required: {
    type: [String],
    default: []
  },
  experience_required: {
    type: String
  },
  salary: {
    type: String
  }
}, {
  timestamps: true
});

const Job = mongoose.model('Job', jobSchema);

export default Job;
