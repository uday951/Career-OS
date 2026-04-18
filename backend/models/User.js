import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true
  },
  password_hash: {
    type: String,
    required: [true, 'Please add a password']
  },
  google_id: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  profile_picture: {
    type: String
  },
  base_profile: {
    work_history: [{
      company: String,
      title: String,
      start_date: Date,
      end_date: Date,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      field_of_study: String,
      graduation_date: Date
    }],
    master_skills: [String]
  },
  settings: {
    target_roles: [String],
    preferred_industries: [String]
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);

export default User;
