import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import { emailQueue } from '../config/queue.js';
import { emitToUser } from '../config/socket.js';
import AgentSession from '../models/AgentSession.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { shouldApplyToJob } from '../services/aiService.js';
import AutomationSettings from '../models/AutomationSettings.js';

const matchWorker = new Worker('job-match', async (job) => {
  const { userId, sessionId, jobId, resumeId } = job.data;
  
  try {
    const jobData = await Job.findById(jobId);
    const resume = await Resume.findById(resumeId);
    const settings = await AutomationSettings.findOne({ user_id: userId });

    if (!jobData || !resume) {
      throw new Error('Job or Resume not found');
    }

    await AgentSession.findByIdAndUpdate(sessionId, {
      status: 'matching',
      current_activity: `Analyzing ${jobData.title} at ${jobData.company}`,
      current_job_title: jobData.title,
      current_company: jobData.company,
      $push: {
        activity_log: {
          action: 'Matching Job',
          details: `${jobData.title} at ${jobData.company}`,
          status: 'info'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Analyzing Match',
      details: `${jobData.title} at ${jobData.company}`,
      status: 'info'
    });

    const resumeJson = {
      name: resume.parsed_data?.name || 'Candidate',
      email: resume.parsed_data?.email || '',
      phone: resume.parsed_data?.phone || '',
      skills: resume.parsed_data?.master_skills || [],
      summary: resume.parsed_data?.summary || '',
      years_experience: resume.parsed_data?.years_experience || 0,
      work_history: resume.parsed_data?.work_history || []
    };

    const preferences = {
      min_salary: settings?.salary_min || 0,
      max_salary: settings?.salary_max || 999999,
      preferred_locations: settings?.preferred_locations || [],
      remote_only: settings?.remote_only || false,
      excluded_companies: settings?.excluded_companies || []
    };

    const decision = await shouldApplyToJob(resumeJson, jobData, preferences);

    const matchScore = decision.confidence_score;

    await Job.findByIdAndUpdate(jobId, {
      ai_match_score: matchScore,
      ai_decision: decision.should_apply ? 'apply' : 'skip',
      ai_reasoning: decision.reasoning
    });

    emitToUser(userId, 'activity', {
      action: 'Match Score Calculated',
      details: `${matchScore}% match - ${decision.should_apply ? 'Will Apply' : 'Skipped'}`,
      status: decision.should_apply ? 'success' : 'warning'
    });

    if (decision.should_apply && matchScore >= (settings?.min_match_score || 70)) {
      const autoApply = settings?.auto_apply_enabled && !settings?.require_human_review;
      const application = await Application.create({
        user_id: userId,
        job_id: jobId,
        resume_id: resumeId,
        status: autoApply ? 'APPLYING' : 'PENDING_REVIEW',
        match_score: matchScore,
        match_analysis: {
          match_percentage: matchScore,
          strengths: decision.green_flags || [],
          missing_skills: decision.red_flags || [],
          reasoning: decision.reasoning
        }
      });

      await AgentSession.findByIdAndUpdate(sessionId, {
        $inc: { 'stats.jobs_matched': 1 }
      });

      if (autoApply) {
        await emailQueue.add('send-recruiter-email', {
          userId,
          sessionId,
          applicationId: application._id,
          jobId,
          emailType: 'recruiter_intro'
        });

        emitToUser(userId, 'activity', {
          action: 'Queued for AI Outreach',
          details: `${jobData.title} at ${jobData.company} — ${matchScore}% match`,
          status: 'success'
        });
      } else {
        emitToUser(userId, 'activity', {
          action: 'Saved for Review',
          details: `${jobData.title} at ${jobData.company} — ${matchScore}% match (auto-apply disabled)`,
          status: 'info'
        });
        const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
        await decrementPendingTasks(sessionId, userId);
      }
    } else {
      await AgentSession.findByIdAndUpdate(sessionId, {
        $inc: { 'stats.jobs_skipped': 1 },
        $push: {
          activity_log: {
            action: 'Job Skipped',
            details: `${jobData.title} - ${decision.reasoning}`,
            status: 'warning'
          }
        }
      });
      const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
      await decrementPendingTasks(sessionId, userId);
    }

    return { matchScore, shouldApply: decision.should_apply };

  } catch (error) {
    await AgentSession.findByIdAndUpdate(sessionId, {
      $push: {
        activity_log: {
          action: 'Match Failed',
          details: error.message,
          status: 'error'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Match Failed',
      details: error.message,
      status: 'error'
    });

    const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
    await decrementPendingTasks(sessionId, userId);

    throw error;
  }
}, { connection });

matchWorker.on('completed', (job) => {
  console.log(`✅ Match job ${job.id} completed`);
});

matchWorker.on('failed', (job, err) => {
  console.error(`❌ Match job ${job.id} failed:`, err.message);
});

export default matchWorker;
