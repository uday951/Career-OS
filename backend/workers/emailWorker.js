import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { connection } from '../config/queue.js';
import { emitToUser } from '../config/socket.js';
import AgentSession from '../models/AgentSession.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import EmailTracking from '../models/EmailTracking.js';
import { generateRecruiterEmail } from '../services/aiService.js';
import { sendGmailEmail } from '../services/gmailService.js';

const emailWorker = new Worker('recruiter-email', async (job) => {
  const { userId, sessionId, applicationId, jobId, emailType } = job.data;
  
  try {
    const jobData = await Job.findById(jobId);
    const resume = await Resume.findOne({ user_id: userId }).sort({ createdAt: -1 });

    if (!jobData || !resume) {
      throw new Error('Job or Resume not found');
    }

    emitToUser(userId, 'activity', {
      action: 'Generating Recruiter Email',
      details: `Creating tailored outreach for ${jobData.company} via DeepSeek`,
      status: 'info'
    });

    const resumeJson = {
      name: resume.parsed_data?.name || 'Candidate',
      email: resume.parsed_data?.email || '',
      skills: resume.parsed_data?.master_skills || [],
      summary: resume.parsed_data?.summary || '',
      years_experience: resume.parsed_data?.years_experience || 0
    };

    // Generate outreach subject & body using DeepSeek
    const emailContent = await generateRecruiterEmail(resumeJson, jobData, emailType || 'application_followup');
    
    // Resolve recruiter email (stored on job model or extract/guess fallback)
    const recruiterEmail = await findRecruiterEmail(jobData);

    if (!recruiterEmail) {
      await AgentSession.findByIdAndUpdate(sessionId, {
        $push: {
          activity_log: {
            action: 'No Recruiter Email Found',
            details: `Could not formulate contact email for ${jobData.company}`,
            status: 'warning'
          }
        }
      });

      emitToUser(userId, 'activity', {
        action: 'No Recruiter Email Found',
        details: `Skipping outreach for ${jobData.company}`,
        status: 'warning'
      });

      const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
      await decrementPendingTasks(sessionId, userId);
      return { skipped: true };
    }

    emitToUser(userId, 'activity', {
      action: 'Sending Email',
      details: `Sending outreach with PDF Resume to ${recruiterEmail}`,
      status: 'info'
    });

    // Pre-generate tracking ID for pixel injection
    const trackingId = new mongoose.Types.ObjectId();

    // Dispatch via Gmail API
    const emailResult = await sendGmailEmail({
      userId,
      to: recruiterEmail,
      subject: emailContent.subject,
      body: emailContent.body,
      trackingId,
      resumeId: resume._id
    });

    // Create persistent email tracking record
    await EmailTracking.create({
      _id: trackingId,
      user_id: userId,
      application_id: applicationId,
      email_type: emailType || 'recruiter_intro',
      recipient_email: recruiterEmail,
      recipient_name: jobData.recruiter_name || `Hiring Team at ${jobData.company}`,
      company: jobData.company,
      job_title: jobData.title,
      subject: emailContent.subject,
      body: emailContent.body,
      gmail_message_id: emailResult.messageId,
      gmail_thread_id: emailResult.threadId,
      status: 'sent',
      ai_generated: true
    });

    await AgentSession.findByIdAndUpdate(sessionId, {
      $inc: { 'stats.emails_sent': 1 },
      $push: {
        activity_log: {
          action: 'Recruiter Email Sent',
          details: `Outreach sent to ${recruiterEmail} (${jobData.company})`,
          status: 'success'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Email Sent Successfully',
      details: `Outreach active for ${jobData.company} (${recruiterEmail})`,
      status: 'success'
    });

    const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
    await decrementPendingTasks(sessionId, userId);

    return { success: true, emailId: emailResult.messageId, threadId: emailResult.threadId };

  } catch (error) {
    if (sessionId) {
      try {
        await AgentSession.findByIdAndUpdate(sessionId, {
          $push: {
            activity_log: {
              action: 'Email Failed',
              details: `Outreach failed: ${error.message}`,
              status: 'error'
            }
          }
        });
      } catch (logErr) {
        console.error('Failed to log email error to session:', logErr);
      }
    }

    emitToUser(userId, 'activity', {
      action: 'Email Failed',
      details: error.message,
      status: 'error'
    });

    const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
    await decrementPendingTasks(sessionId, userId);

    throw error;
  }
}, { connection });

async function findRecruiterEmail(jobData) {
  if (jobData.recruiter_email) return jobData.recruiter_email;
  
  const description = jobData.description || '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = description.match(emailRegex);
  
  if (emails && emails.length > 0) {
    return emails[0];
  }
  
  // Construct domain fallback from company name
  const domain = jobData.company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return domain ? `careers@${domain}.com` : null;
}

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

export default emailWorker;
