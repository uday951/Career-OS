import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import { matchQueue } from '../config/queue.js';
import { emitToUser } from '../config/socket.js';
import AgentSession from '../models/AgentSession.js';
import AgentMemory from '../models/AgentMemory.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import { scrapeJobs } from '../services/playwrightJobScraper.js';

// Blocked domains for direct ATS (mostly generic portals requiring logins)
const BLOCKED_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
  'bebee.com', 'monster.com', 'careerbuilder.com', 'simplyhired.com',
  'dice.com', 'jobscan.co', 'workday.com', 'taleo.net',
  'successfactors.com', 'icims.com', 'bamboohr.com',
  'oraclecloud.com', 'myworkdayjobs.com', 'jobs.oracle.com',
  'theirstack.com', 'jooble.org', 'jobs.google.com',
  'otta.com', 'hireez.com', 'jobgether.com'
];

const ATS_ALLOWED_DOMAINS = [
  'greenhouse.io', 'lever.co', 'workable.com', 'smartrecruiters.com',
  'ashbyhq.com', 'boards.greenhouse.io', 'job-boards.greenhouse.io',
  'jobs.lever.co', 'apply.workable.com', 'careers.smartrecruiters.com'
];

function classifyUrl(url) {
  if (!url) return { ok: false, isATS: false };
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const isATS = ATS_ALLOWED_DOMAINS.some(d => hostname.includes(d));
    if (isATS) return { ok: true, isATS: true };
    const isBlocked = BLOCKED_DOMAINS.some(d => hostname.includes(d));
    return { ok: !isBlocked, isATS: false };
  } catch {
    return { ok: false, isATS: false };
  }
}

const searchWorker = new Worker('job-search', async (job) => {
  const { userId, sessionId, preferences } = job.data;
  
  try {
    await AgentSession.findByIdAndUpdate(sessionId, {
      status: 'searching',
      current_activity: 'Crawling job boards (LinkedIn, Internshala, Wellfound, Naukri, Foundit)',
      $push: {
        activity_log: {
          action: 'Job Search Started',
          details: `Searching for: ${preferences.preferred_roles.join(', ')}`,
          status: 'info'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Job Search Started',
      details: `Initiating Playwright crawler for LinkedIn, Internshala, Wellfound, Naukri, Foundit`,
      status: 'info'
    });

    const resume = await Resume.findOne({ user_id: userId }).sort({ createdAt: -1 });
    if (!resume) throw new Error('No resume found');

    let memory = await AgentMemory.findOne({ user_id: userId });
    if (!memory) memory = await AgentMemory.create({ user_id: userId });

    const appliedCompanies = memory.applied_jobs.map(j => j.company.toLowerCase());

    // Execute Playwright and DeepSeek scraper
    const jobSearchResults = await scrapeJobs(preferences);

    emitToUser(userId, 'activity', {
      action: 'Search Results Ready',
      details: `Retrieved ${jobSearchResults.length} job listings with recruiter details`,
      status: 'info'
    });

    let jobsFound = 0;
    let jobsMatched = 0;

    for (const jobData of jobSearchResults) {
      if (appliedCompanies.includes(jobData.company.toLowerCase())) {
        emitToUser(userId, 'activity', {
          action: 'Job Skipped',
          details: `Already applied to ${jobData.company}`,
          status: 'warning'
        });
        await AgentSession.findByIdAndUpdate(sessionId, {
          $inc: { 'stats.jobs_skipped': 1 }
        });
        continue;
      }

      jobsFound++;

      const savedJob = await Job.create({
        user_id: userId,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        job_url: jobData.job_url,
        source: jobData.source || 'scraper',
        status: 'discovered',
        recruiter_name: jobData.recruiter_name,
        recruiter_email: jobData.recruiter_email,
        skills_required: jobData.skills_required,
        experience_required: jobData.experience_required,
        salary: jobData.salary
      });

      emitToUser(userId, 'activity', {
        action: 'Job Found',
        details: `${jobData.title} at ${jobData.company} (Recruiter: ${jobData.recruiter_name})`,
        status: 'success'
      });

      await AgentSession.findByIdAndUpdate(sessionId, {
        $inc: {
          pending_tasks: 1,
          'stats.jobs_searched': 1
        }
      });

      await matchQueue.add('match-job', {
        userId,
        sessionId,
        jobId: savedJob._id,
        resumeId: resume._id
      });

      jobsMatched++;
      // Small pause to spacing execution
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    await AgentSession.findByIdAndUpdate(sessionId, {
      $push: {
        activity_log: {
          action: 'Search Completed',
          details: `Scraped ${jobsFound} jobs, queued ${jobsMatched} for AI match scoring.`,
          status: 'success'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Search Completed',
      details: `${jobsFound} jobs loaded and matching evaluation running.`,
      status: 'success'
    });

    const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
    await decrementPendingTasks(sessionId, userId);

    return { jobsFound, jobsMatched };

  } catch (error) {
    await AgentSession.findByIdAndUpdate(sessionId, {
      status: 'failed',
      error_message: error.message,
      pending_tasks: 0,
      $push: {
        activity_log: {
          action: 'Search Failed',
          details: error.message,
          status: 'error'
        }
      }
    });
    throw error;
  }
}, { connection });

searchWorker.on('completed', (job) => {
  console.log(`✅ Search job ${job.id} completed`);
});

searchWorker.on('failed', (job, err) => {
  console.error(`❌ Search job ${job.id} failed:`, err.message);
});

export default searchWorker;
