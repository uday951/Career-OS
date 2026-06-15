import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import { getGmailAuthUrl, handleGmailCallback, sendGmailEmail } from '../services/gmailService.js';
import User from '../models/User.js';
import EmailTracking from '../models/EmailTracking.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Resume from '../models/Resume.js';
import { generateRecruiterEmail } from '../services/aiService.js';

const router = express.Router();

// ─── 1. Gmail OAuth Management ───────────────────────────────────────────

// Get OAuth URL
router.get('/gmail/auth-url', protect, async (req, res) => {
  try {
    const url = await getGmailAuthUrl(req.user._id);
    res.json({ url });
  } catch (error) {
    console.error('[Outreach Route] Error getting Gmail auth URL:', error.message);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

// Callback from redirect (Exchange authorization code for tokens)
router.post('/gmail/callback', protect, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    await handleGmailCallback(code, req.user._id);
    res.json({ message: 'Gmail account connected successfully' });
  } catch (error) {
    console.error('[Outreach Route] Error handling Gmail callback:', error.message);
    res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
});

// Check connection status
router.get('/gmail/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ connected: !!(user && user.gmail_refresh_token) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check Gmail status' });
  }
});

// Disconnect Gmail
router.post('/gmail/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { gmail_refresh_token: 1, gmail_access_token: 1 }
    });
    res.json({ message: 'Gmail disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disconnect Gmail' });
  }
});


// ─── 2. Email Open Tracking ──────────────────────────────────────────────

// Tracking pixel endpoint
router.get('/track-open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  try {
    const tracking = await EmailTracking.findById(trackingId);
    if (tracking && tracking.status === 'sent') {
      tracking.status = 'opened';
      await tracking.save();
      console.log(`[Outreach Tracker] Email to ${tracking.recipient_email} was opened (ID: ${trackingId})`);
    }
  } catch (error) {
    console.error('[Outreach Tracker] Failed to track open event:', error.message);
  }

  // Always return a 1x1 transparent PNG pixel
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );
  
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.end(pixel);
});

// Helper to extract/guess email
function extractRecruiterEmail(jobData) {
  if (jobData.recruiter_email) return jobData.recruiter_email;
  
  const description = jobData.description || '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = description.match(emailRegex);
  
  if (emails && emails.length > 0) {
    return emails[0];
  }
  
  const domain = jobData.company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return domain ? `careers@${domain}.com` : null;
}

// Generate outreach draft via DeepSeek
router.post('/generate-draft', protect, async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!application.resume_id || !application.resume_id.parsed_data) {
      return res.status(400).json({ message: 'Please upload and parse your resume first before generating outreach.' });
    }

    const resume = application.resume_id;
    const jobData = application.job_id;

    const resumeJson = {
      name: resume.parsed_data.name || 'Candidate',
      email: resume.parsed_data.email || '',
      skills: resume.parsed_data.master_skills || [],
      summary: resume.parsed_data.summary || '',
      years_experience: resume.parsed_data.years_experience || 0
    };

    const emailContent = await generateRecruiterEmail(resumeJson, jobData, 'application_followup');
    const recipientEmail = extractRecruiterEmail(jobData);

    res.json({
      recipient_email: recipientEmail || '',
      recipient_name: jobData.recruiter_name || `Hiring Team at ${jobData.company}`,
      subject: emailContent.subject,
      body: emailContent.body
    });
  } catch (error) {
    next(error);
  }
});

// Send manual outreach email via Gmail OAuth
router.post('/send-outreach', protect, async (req, res, next) => {
  try {
    const { applicationId, recipient_email, recipient_name, subject, body } = req.body;

    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.gmail_refresh_token) {
      return res.status(400).json({ message: 'Gmail not connected. Please connect your Gmail in Auto-Apply settings.' });
    }

    const trackingId = new mongoose.Types.ObjectId();

    // Dispatch email
    let emailResult;
    try {
      emailResult = await sendGmailEmail({
        userId: req.user._id,
        to: recipient_email,
        subject,
        body,
        trackingId,
        resumeId: application.resume_id?._id
      });
    } catch (gmailErr) {
      console.error('[Gmail Dispatch Error]:', gmailErr);
      return res.status(400).json({ 
        message: `Gmail delivery failed: ${gmailErr.message || gmailErr}. Please reconnect Gmail in Settings.` 
      });
    }

    // Create or update EmailTracking record
    let tracking = await EmailTracking.findOne({ user_id: req.user._id, application_id: applicationId });
    if (tracking) {
      tracking.recipient_email = recipient_email;
      tracking.recipient_name = recipient_name;
      tracking.company = application.job_id?.company || '';
      tracking.job_title = application.job_id?.title || '';
      tracking.subject = subject;
      tracking.body = body;
      tracking.gmail_message_id = emailResult.messageId;
      tracking.gmail_thread_id = emailResult.threadId;
      tracking.status = 'sent';
      await tracking.save();
    } else {
      tracking = await EmailTracking.create({
        _id: trackingId,
        user_id: req.user._id,
        application_id: applicationId,
        email_type: 'recruiter_intro',
        recipient_email,
        recipient_name,
        company: application.job_id?.company || '',
        job_title: application.job_id?.title || '',
        subject,
        body,
        gmail_message_id: emailResult.messageId,
        gmail_thread_id: emailResult.threadId,
        status: 'sent',
        ai_generated: true
      });
    }

    // Update Application status
    application.status = 'APPLIED';
    application.applied_on = new Date();
    await application.save();

    res.json({ success: true, tracking });
  } catch (error) {
    next(error);
  }
});

// Get outreach history for current user
router.get('/history', protect, async (req, res, next) => {
  try {
    const emails = await EmailTracking.find({ user_id: req.user._id })
      .sort({ sent_at: -1 })
      .limit(50);
    res.json({ emails });
  } catch (error) {
    next(error);
  }
});

// Get outreach stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const total = await EmailTracking.countDocuments({ user_id: req.user._id });
    const opened = await EmailTracking.countDocuments({ user_id: req.user._id, status: 'opened' });
    const replied = await EmailTracking.countDocuments({ user_id: req.user._id, status: 'replied' });
    const delivered = await EmailTracking.countDocuments({ user_id: req.user._id, status: 'delivered' });
    const sent = await EmailTracking.countDocuments({ user_id: req.user._id, status: 'sent' });
    const pending = 0; // Drafts not tracked in EmailTracking database right now

    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
    const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;

    res.json({
      sent,
      delivered,
      opened,
      replied,
      pending,
      total,
      openRate,
      replyRate
    });
  } catch (error) {
    next(error);
  }
});

export default router;
