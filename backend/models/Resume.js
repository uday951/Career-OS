import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    default: 'My Resume'
  },
  original_text: {
    type: String,
    required: true
  },
  parsed_data: {
    type: Object, // Structured JSON extracted by AI
    default: {}
  },
  ats_score: {
    type: Number,
    default: 0
  },
  suggestions: {
    type: [String],
    default: []
  },
  is_base_resume: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
