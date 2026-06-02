import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import { emailQueue } from '../config/queue.js';
import { emitToUser } from '../config/socket.js';
import AgentSession from '../models/AgentSession.js';
import AgentMemory from '../models/AgentMemory.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import BrowserAgent from '../services/browserAgent.js';
import { applyViaATS, detectATS } from '../services/atsApplyService.js';
import { generateRecruiterEmail } from '../services/aiService.js';

const applyWorker = new Worker('job-apply', async (job) => {
  const { userId, sessionId, applicationId, jobId, resumeId } = job.data;
  let browser = null;

  try {
    const jobData = await Job.findById(jobId);
    const resume = await Resume.findById(resumeId);
    const application = await Application.findById(applicationId);

    if (!jobData || !resume || !application) {
      throw new Error('Required data not found');
    }

    const targetUrl = jobData.job_url || jobData.url;
    if (!targetUrl) throw new Error('Job URL is missing');

    await AgentSession.findByIdAndUpdate(sessionId, {
      status: 'applying',
      current_activity: `Applying to ${jobData.title} at ${jobData.company}`,
      current_url: targetUrl,
      current_job_title: jobData.title,
      current_company: jobData.company,
      'browser_state.is_active': true
    });

    emitToUser(userId, 'activity', {
      action: 'Starting Application',
      details: `${jobData.title} at ${jobData.company}`,
      status: 'info'
    });

    // Build resume data object from parsed resume
    const resumeData = {
      name: resume.parsed_data?.name || '',
      email: resume.parsed_data?.email || '',
      phone: resume.parsed_data?.phone || '',
      skills: resume.parsed_data?.master_skills || [],
      summary: resume.parsed_data?.summary || '',
      years_experience: resume.parsed_data?.years_experience || 0,
      work_history: resume.parsed_data?.work_history || []
    };

    // ── STRATEGY 1: Try programmatic ATS API apply first ─────────────────────
    const atsInfo = detectATS(targetUrl);

    if (atsInfo.ats) {
      emitToUser(userId, 'activity', {
        action: `Using ${atsInfo.ats.charAt(0).toUpperCase() + atsInfo.ats.slice(1)} API`,
        details: `Submitting application directly via ${atsInfo.ats} — no browser needed`,
        status: 'info'
      });

      try {
        // Generate a short cover letter for this application
        let coverLetter = '';
        try {
          const aiCover = await generateRecruiterEmail(resumeData, jobData, 'cover_letter');
          coverLetter = aiCover?.body || '';
        } catch { /* cover letter is optional */ }

        const atsResult = await applyViaATS(targetUrl, resumeData, coverLetter);

        if (atsResult.success) {
          await onApplicationSuccess({
            userId, sessionId, applicationId, jobId,
            jobData, targetUrl, resumeData, screenshot: null, isATS: true, atsName: atsInfo.ats
          });
          return { success: true, method: 'ats_api', ats: atsInfo.ats };
        }
      } catch (atsErr) {
        console.error(`[ApplyWorker] ATS API failed for ${atsInfo.ats}:`, atsErr.message);
        emitToUser(userId, 'activity', {
          action: 'ATS API Failed — Trying Browser',
          details: `${atsErr.message} — falling back to browser automation`,
          status: 'warning'
        });
        // Fall through to browser
      }
    }

    // ── STRATEGY 2: Browser automation ───────────────────────────────────────
    emitToUser(userId, 'activity', {
      action: 'Opening Browser',
      details: `Loading ${targetUrl}`,
      status: 'info'
    });

    browser = new BrowserAgent(userId, sessionId);
    await browser.initialize();

    // Navigate with generous timeout, fallback from networkidle → load
    try {
      await browser.page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (navErr) {
      if (navErr.message.includes('Timeout')) {
        console.log('[ApplyWorker] networkidle timeout, retrying with load...');
        await browser.page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
      } else {
        throw navErr;
      }
    }

    const currentUrl = browser.page.url();
    const pageTitle = await browser.page.title();

    emitToUser(userId, 'activity', {
      action: 'Page Loaded',
      details: pageTitle || currentUrl,
      status: 'success'
    });

    // Detect login walls early — save for review instead of failing
    const LOGIN_KEYWORDS = ['login', 'sign in', 'sign-in', 'signin', 'log in', 'create account', 'register', 'join now'];
    const isLoginWall = LOGIN_KEYWORDS.some(kw =>
      pageTitle.toLowerCase().includes(kw) || currentUrl.toLowerCase().includes(kw)
    );

    if (isLoginWall) {
      const screenshot = await browser.takeScreenshot();
      await onSavedForReview({
        userId, sessionId, applicationId, jobData, targetUrl,
        reason: `Login required — ${currentUrl}`,
        screenshot
      });
      await browser.close();
      const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
      await decrementPendingTasks(sessionId, userId);
      return { skipped: true, reason: 'login_wall' };
    }

    await browser.humanScroll(300);
    await browser.detectAndHandleCaptcha();

    emitToUser(userId, 'activity', {
      action: 'Filling Application Form',
      details: 'AI analyzing and filling form fields',
      status: 'info'
    });

    const formData = { company: jobData.company, title: jobData.title, description: jobData.description };
    const filledFields = await browser.intelligentFormFill(formData, resumeData);

    // Take screenshot of the filled form (before submission)
    const filledFormScreenshot = await browser.takeScreenshot();
    const filledFormScreenshotUrl = `data:image/png;base64,${filledFormScreenshot}`;

    emitToUser(userId, 'screenshot', {
      screenshot: filledFormScreenshotUrl
    });

    // Save the filled-form screenshot and form data immediately
    await Application.findByIdAndUpdate(applicationId, {
      filled_form_screenshot_url: filledFormScreenshotUrl,
      form_submission_data: filledFields
    });

    await AgentSession.findByIdAndUpdate(sessionId, {
      'browser_state.screenshot_url': filledFormScreenshotUrl
    });

    emitToUser(userId, 'activity', {
      action: 'Form Filled - Report Captured',
      details: `${filledFields.length} fields filled with AI-generated values`,
      status: 'success'
    });

    // Try many submit button patterns
    const SUBMIT_SELECTORS = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit Application")',
      'button:has-text("Apply Now")',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Send Application")',
      '[role="button"]:has-text("Submit")',
      '[role="button"]:has-text("Apply")',
      'a:has-text("Apply Now")',
      'a:has-text("Apply for this job")',
      'a[href*="apply"]',
      'button:has-text("Continue")'
    ];

    let submitButton = null;
    let usedSelector = null;
    for (const sel of SUBMIT_SELECTORS) {
      try {
        submitButton = await browser.page.$(sel);
        if (submitButton) { usedSelector = sel; break; }
      } catch { /* try next */ }
    }

    if (submitButton) {
      await browser.humanClick(usedSelector);
      await browser.page.waitForTimeout(5000);
      const finalScreenshot = await browser.takeScreenshot();

      await onApplicationSuccess({
        userId, sessionId, applicationId, jobId,
        jobData, targetUrl, resumeData, screenshot: finalScreenshot, isATS: false
      });

      await browser.close();
      return { success: true, method: 'browser' };

    } else {
      // No submit button — save for manual review with screenshot
      await onSavedForReview({
        userId, sessionId, applicationId, jobData, targetUrl,
        reason: 'No apply button detected on this page',
        screenshot
      });
      await browser.close();
      const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
      await decrementPendingTasks(sessionId, userId);
      return { pending_review: true };
    }

  } catch (error) {
    if (browser) await browser.close();

    console.error('[ApplyWorker] Error:', error.message);

    await Application.findByIdAndUpdate(applicationId, {
      status: 'FAILED',
      error_message: error.message
    });

    await AgentSession.findByIdAndUpdate(sessionId, {
      $inc: { 'stats.applications_failed': 1 },
      'browser_state.is_active': false,
      $push: {
        activity_log: {
          action: 'Application Failed',
          details: error.message,
          status: 'error'
        }
      }
    });

    emitToUser(userId, 'activity', {
      action: 'Application Failed',
      details: error.message,
      status: 'error'
    });

    const { decrementPendingTasks } = await import('../utils/sessionHelper.js');
    await decrementPendingTasks(sessionId, userId);
    throw error;
  }
}, { connection });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function onApplicationSuccess({ userId, sessionId, applicationId, jobId, jobData, targetUrl, resumeData, screenshot, isATS, atsName }) {
  const updateData = {
    status: 'APPLIED',
    applied_on: new Date(),
    application_url: targetUrl
  };
  if (screenshot) {
    updateData.screenshot_url = `data:image/png;base64,${screenshot}`;
  }

  await Application.findByIdAndUpdate(applicationId, updateData);
  await Job.findByIdAndUpdate(jobId, { status: 'applied' });

  // Update memory
  let memory = await AgentMemory.findOne({ user_id: userId });
  if (!memory) memory = await AgentMemory.create({ user_id: userId });
  memory.applied_jobs.push({
    job_id: jobId,
    company: jobData.company,
    title: jobData.title,
    url: targetUrl,
    applied_at: new Date(),
    status: 'APPLIED'
  });
  await memory.save();

  await AgentSession.findByIdAndUpdate(sessionId, {
    $inc: { 'stats.applications_submitted': 1 },
    'browser_state.is_active': false,
    $push: {
      activity_log: {
        action: 'Application Submitted',
        details: `${jobData.title} at ${jobData.company}${isATS ? ` (via ${atsName} API)` : ''}`,
        status: 'success'
      }
    }
  });

  emitToUser(userId, 'activity', {
    action: '✅ Application Submitted',
    details: `${jobData.title} at ${jobData.company}${isATS ? ` — via ${atsName} API` : ''}`,
    status: 'success'
  });

  // Send candidate confirmation email
  try {
    const { sendCandidateNotification } = await import('../services/notificationService.js');
    const subject = `🚀 Applied: ${jobData.title} at ${jobData.company}`;
    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#fafafa;color:#1e293b;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#6366f1;margin:0;font-size:26px;font-weight:800;">Career OS AI</h1>
          <p style="color:#64748b;margin:4px 0 0;font-size:14px;">Autonomous Application Submitted${isATS ? ` via ${atsName} API` : ''}</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
          <h3 style="margin-top:0;color:#0f172a;">Application Summary</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;width:140px;">Position:</td><td style="padding:8px 0;font-weight:700;">${jobData.title}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Company:</td><td style="padding:8px 0;font-weight:700;">${jobData.company}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Location:</td><td style="padding:8px 0;">${jobData.location || 'Remote'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Method:</td><td style="padding:8px 0;color:#16a34a;font-weight:600;">${isATS ? `${atsName} API (Automated)` : 'Browser Automation'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Date:</td><td style="padding:8px 0;">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${targetUrl}" target="_blank" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Job Post</a>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px;">Career OS AI Agent completed this automatically. <a href="${process.env.FRONTEND_URL}/automation" style="color:#6366f1;">View Dashboard</a></p>
      </div>
    `;
    await sendCandidateNotification(userId, subject, html);
  } catch (emailErr) {
    console.error('[ApplyWorker] Confirmation email failed:', emailErr.message);
  }

  // Queue recruiter email
  await emailQueue.add('send-recruiter-email', {
    userId, sessionId, applicationId, jobId, emailType: 'application_followup'
  });
}

async function onSavedForReview({ userId, sessionId, applicationId, jobData, targetUrl, reason, screenshot }) {
  const updateData = {
    status: 'PENDING_REVIEW',
    application_url: targetUrl,
    error_message: reason
  };
  if (screenshot) {
    updateData.screenshot_url = `data:image/png;base64,${screenshot}`;
  }

  await Application.findByIdAndUpdate(applicationId, updateData);

  await AgentSession.findByIdAndUpdate(sessionId, {
    $push: {
      activity_log: {
        action: 'Saved for Manual Review',
        details: `${jobData.title} at ${jobData.company} — ${reason}`,
        status: 'warning'
      }
    }
  });

  emitToUser(userId, 'activity', {
    action: '👆 Saved for Manual Review',
    details: `${jobData.title} at ${jobData.company} — click Apply Now in dashboard`,
    status: 'warning'
  });

  if (screenshot) {
    emitToUser(userId, 'screenshot', {
      screenshot: `data:image/png;base64,${screenshot}`
    });
  }
}

applyWorker.on('completed', (job) => {
  console.log(`✅ Apply job ${job.id} completed`);
});

applyWorker.on('failed', (job, err) => {
  console.error(`❌ Apply job ${job.id} failed:`, err.message);
});

export default applyWorker;
