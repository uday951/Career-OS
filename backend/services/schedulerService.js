import cron from 'node-cron';
import AutomationSettings from '../models/AutomationSettings.js';

// Store active jobs
const activeJobs = new Map();

/**
 * Start the daily automation scheduler
 */
export async function startScheduler() {
  console.log('[Scheduler] Initializing...');
  
  // Check every minute if any automation should run
  // This allows flexible scheduling without complex cron patterns
  const job = cron.schedule('* * * * *', async () => {
    await checkAndRunAutomations();
  });
  
  activeJobs.set('main-check', job);
  console.log('[Scheduler] Main check job started (every minute)');

  // Check every 10 minutes for recruiter replies
  const repliesJob = cron.schedule('*/10 * * * *', async () => {
    await checkAllGmailReplies();
  });
  activeJobs.set('gmail-replies', repliesJob);
  console.log('[Scheduler] Gmail replies check job started (every 10 minutes)');
  
  return job;
}

/**
 * Check and register replies for all users with Gmail connected
 */
async function checkAllGmailReplies() {
  try {
    const { default: User } = await import('../models/User.js');
    const { checkGmailReplies } = await import('./gmailService.js');
    
    const users = await User.find({ gmail_refresh_token: { $exists: true, $ne: null } });
    if (users.length === 0) return;
    
    console.log(`[Scheduler] Checking Gmail replies for ${users.length} connected users...`);
    for (const user of users) {
      try {
        await checkGmailReplies(user._id);
      } catch (err) {
        console.error(`[Scheduler] Failed checking replies for user ${user._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Scheduler] checkAllGmailReplies failed:', error.message);
  }
}

/**
 * Check all enabled automations and run if it's time
 */
async function checkAndRunAutomations() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0=Sunday, 6=Saturday
    
    const settings = await AutomationSettings.find({
      enabled: true,
      status: { $ne: 'running' },
    }).populate('user_id');
    
    for (const setting of settings) {
      try {
        // Parse scheduled time
        const [schedHour, schedMinute] = (setting.search_time || '09:00').split(':').map(Number);
        
        // Check if it's time to run
        if (currentHour !== schedHour || currentMinute !== schedMinute) continue;
        
        // Check day of week
        const days = setting.days_of_week || [1, 2, 3, 4, 5]; // Mon-Fri by default
        if (!days.includes(currentDay)) continue;
        
        // Check if already ran today
        if (setting.last_run) {
          const lastRun = new Date(setting.last_run);
          const today = new Date();
          if (lastRun.toDateString() === today.toDateString()) {
            console.log(`[Scheduler] Already ran today for user ${setting.user_id?._id}`);
            continue;
          }
        }
        
        console.log(`[Scheduler] Starting automation for user ${setting.user_id?._id}`);
        
        // Mark as running
        setting.status = 'running';
        await setting.save();
        
        // Execute automation in background
        executeAutomationForUser(setting).catch(async (error) => {
          console.error(`[Scheduler] Automation error for user ${setting.user_id?._id}:`, error.message);
          setting.status = 'error';
          setting.last_run = new Date();
          await setting.save();
        });
      } catch (err) {
        console.error('[Scheduler] Error processing setting:', err.message);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Check error:', error.message);
  }
}

/**
 * Execute the full automation pipeline for a user
 */
async function executeAutomationForUser(setting) {
  const { default: Job } = await import('../models/Job.js');
  const { default: Resume } = await import('../models/Resume.js');
  const { default: Application } = await import('../models/Application.js');
  const { default: AgentSession } = await import('../models/AgentSession.js');
  const { applyQueue } = await import('../config/queue.js');
  const { runFullMatch } = await import('./jobMatcherService.js');
  const { generateCoverLetter } = await import('./coverLetterService.js');
  const { sendDailyReport } = await import('./notificationService.js');
  
  const userId = setting.user_id._id || setting.user_id;
  
  // 1. Get selected resume, or latest fallback
  let resume = null;
  if (setting.resume_id) {
    resume = await Resume.findOne({ _id: setting.resume_id, user_id: userId });
  }
  if (!resume) {
    resume = await Resume.findOne({ user_id: userId }).sort({ createdAt: -1 });
  }
  if (!resume) {
    console.log(`[Scheduler] No resume found for user ${userId}`);
    setting.status = 'idle';
    await setting.save();
    return;
  }
  
  // 2. Get unmatched jobs
  const existingApps = await Application.find({ user_id: userId }).distinct('job_id');
  const unmatchedJobs = await Job.find({
    user_id: userId,
    _id: { $nin: existingApps },
  }).limit(setting.applications_per_day || 10);
  
  if (unmatchedJobs.length === 0) {
    console.log(`[Scheduler] No new jobs to process for user ${userId}`);
    setting.status = 'idle';
    await setting.save();
    return;
  }
  
  // Create an AgentSession for tracking this automated run
  const session = await AgentSession.create({
    user_id: userId,
    status: 'matching',
    current_activity: 'Scheduled automation run matching jobs'
  });
  
  let applied = 0;
  let failed = 0;
  
  // 3. Process each job
  for (const job of unmatchedJobs) {
    try {
      if (applied >= (setting.applications_per_day || 10)) break;
      
      // Match analysis
      const matchResult = await runFullMatch(
        userId, job._id, resume._id,
        resume.original_text || resume.parsed_data,
        job
      );
      
      if (matchResult.should_apply && setting.auto_apply_enabled) {
        // Generate cover letter
        const coverLetter = await generateCoverLetter({
          companyName: job.company,
          jobTitle: job.title,
          resumeSummary: resume.original_text?.substring(0, 1000),
          jobDescription: job.description,
        });
        
        const autoApply = !setting.require_human_review;
        
        // Create application
        const application = await Application.create({
          user_id: userId,
          job_id: job._id,
          resume_id: resume._id,
          status: autoApply ? 'APPLYING' : 'PENDING_REVIEW',
          tailored_cover_letter: coverLetter,
          match_score: matchResult.overall_score,
          match_analysis: {
            match_percentage: matchResult.overall_score,
            strengths: matchResult.strengths || [],
            missing_skills: matchResult.missing_skills || [],
            reasoning: matchResult.reasoning || ''
          },
          applied_on: autoApply ? undefined : new Date(),
        });
        
        if (autoApply) {
          await applyQueue.add('apply-job', {
            userId: userId.toString(),
            sessionId: session._id.toString(),
            applicationId: application._id.toString(),
            jobId: job._id.toString(),
            resumeId: resume._id.toString()
          });
          
          await AgentSession.findByIdAndUpdate(session._id, {
            $inc: { 'stats.jobs_matched': 1 },
            $push: {
              activity_log: {
                action: 'Job Enqueued for Auto-Apply',
                details: `${job.title} at ${job.company}`,
                status: 'info'
              }
            }
          });
        } else {
          await AgentSession.findByIdAndUpdate(session._id, {
            $inc: { 'stats.jobs_matched': 1 },
            $push: {
              activity_log: {
                action: 'Awaiting Review',
                details: `${job.title} at ${job.company} requires approval`,
                status: 'info'
              }
            }
          });
        }
        
        applied++;
      } else {
        await AgentSession.findByIdAndUpdate(session._id, {
          $inc: { 'stats.jobs_skipped': 1 }
        });
      }
    } catch (err) {
      console.error(`[Scheduler] Error processing job ${job._id}:`, err.message);
      failed++;
    }
  }
  
  // 4. Update settings
  setting.status = 'idle';
  setting.last_run = new Date();
  setting.total_applications_submitted = (setting.total_applications_submitted || 0) + applied;
  await setting.save();
  
  // Mark session matching phase completed
  await AgentSession.findByIdAndUpdate(session._id, {
    status: applied > 0 && !setting.require_human_review ? 'applying' : 'completed',
    completed_at: new Date(),
    pending_tasks: applied,
    $push: {
      activity_log: {
        action: 'Automation Scheduler Matching Completed',
        details: `Scanned ${unmatchedJobs.length} jobs, matched ${applied} for apply pipeline.`,
        status: 'success'
      }
    }
  });
  
  // 5. Send report
  try {
    await sendDailyReport(userId, {
      jobs_scanned: unmatchedJobs.length,
      jobs_matched: applied + failed,
      applications_submitted: applied,
      applications_failed: failed,
      period_start: new Date(Date.now() - 86400000),
      period_end: new Date(),
    });
  } catch (err) {
    console.error('[Scheduler] Report send error:', err.message);
  }
  
  console.log(`[Scheduler] Completed for user ${userId}: ${applied} applied, ${failed} failed`);
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler() {
  for (const [name, job] of activeJobs.entries()) {
    job.stop();
    console.log(`[Scheduler] Stopped job: ${name}`);
  }
  activeJobs.clear();
}

/**
 * Run automation immediately for a specific user
 */
export async function runNow(userId) {
  const setting = await AutomationSettings.findOne({ user_id: userId });
  if (!setting) throw new Error('No automation settings found');
  
  setting.status = 'running';
  await setting.save();
  
  executeAutomationForUser(setting).catch(async (error) => {
    console.error(`[Scheduler] Immediate run error:`, error.message);
    setting.status = 'error';
    await setting.save();
  });
  
  return { message: 'Automation started' };
}

export default { startScheduler, stopScheduler, runNow };
