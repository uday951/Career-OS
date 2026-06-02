import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const credentialSubSchema = new mongoose.Schema({
  email: { type: String, default: '' },
  password: { type: String, default: '' },
}, { _id: false });

const automationSettingsSchema = new mongoose.Schema({
  // Core
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  enabled: { type: Boolean, default: false },
  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  
  // Job preferences
  preferred_roles: [{ type: String, trim: true }],
  preferred_locations: [{ type: String, trim: true }],
  remote_only: { type: Boolean, default: false },
  salary_min: { type: Number, default: 0 },
  salary_max: { type: Number, default: 0 },
  excluded_companies: [{ type: String, trim: true }],
  excluded_job_types: [{ type: String, enum: ['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'] }],
  
  // Application behavior
  applications_per_day: { type: Number, default: 10, min: 1, max: 50 },
  min_match_score: { type: Number, default: 70, min: 0, max: 100 },
  auto_apply_enabled: { type: Boolean, default: false },
  require_human_review: { type: Boolean, default: true },
  
  // Portal credentials (linkedin, indeed, naukri)
  credentials: {
    type: Map,
    of: credentialSubSchema,
    default: new Map(),
  },
  
  // Notifications
  email_notifications: { type: Boolean, default: true },
  telegram_notifications: { type: Boolean, default: false },
  telegram_chat_id: { type: String, default: '' },
  
  // Schedule
  search_time: { type: String, default: '09:00' },
  timezone: { type: String, default: 'America/New_York' },
  days_of_week: { type: [Number], default: [1, 2, 3, 4, 5] },
  
  // Operational
  total_applications_submitted: { type: Number, default: 0 },
  last_run: { type: Date },
  status: {
    type: String,
    enum: ['idle', 'running', 'paused', 'error'],
    default: 'idle',
  },
}, { timestamps: true });

/**
 * Pre-save hook: encrypt credential passwords before persisting
 */
automationSettingsSchema.pre('save', function (next) {
  if (this.credentials && this.credentials.size > 0) {
    this.credentials.forEach((value, key) => {
      if (value && value.password && !value.password.startsWith('enc:')) {
        const encrypted = 'enc:' + encrypt(value.password);
        this.credentials.set(key, { email: value.email, password: encrypted });
      }
    });
  }
  next();
});

/**
 * Decrypt credentials for internal server-side use (auto-apply, etc.)
 */
automationSettingsSchema.methods.getDecryptedCredentials = function () {
  const decrypted = {};
  if (this.credentials && this.credentials.size > 0) {
    this.credentials.forEach((value, key) => {
      let password = (value && value.password) || '';
      if (password.startsWith('enc:')) {
        password = decrypt(password.substring(4)) || '';
      }
      decrypted[key] = { email: (value && value.email) || '', password };
    });
  }
  return decrypted;
};

/**
 * Check if any platform credentials are stored
 */
automationSettingsSchema.methods.hasCredentials = function () {
  if (!this.credentials || this.credentials.size === 0) return false;
  let hasAny = false;
  this.credentials.forEach((value) => {
    if (value && value.email && value.password) hasAny = true;
  });
  return hasAny;
};

/**
 * Override toJSON to mask passwords in API responses
 */
automationSettingsSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.credentials) {
    const cleaned = {};
    for (const [platform, creds] of Object.entries(obj.credentials)) {
      cleaned[platform] = {
        email: (creds && creds.email) || '',
        hasPassword: !!(creds && creds.password),
      };
    }
    obj.credentials = cleaned;
  }
  // Remove encrypted passwords in any nested forms
  if (obj.portal_credentials) delete obj.portal_credentials;
  return obj;
};

export default mongoose.model('AutomationSettings', automationSettingsSchema);
