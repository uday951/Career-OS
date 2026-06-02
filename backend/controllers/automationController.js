import AutomationSettings from '../models/AutomationSettings.js';
import MatchScore from '../models/MatchScore.js';
import Report from '../models/Report.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { runFullMatch } from '../services/jobMatcherService.js';
import { generateCoverLetter } from '../services/coverLetterService.js';
import { tailorFullResume } from '../services/resumeTailorService.js';
import { parseResume } from '../services/resumeParserService.js';
import { runNow } from '../services/schedulerService.js';
import { sendDailyReport } from '../services/notificationService.js';
import { encrypt } from '../utils/encryption.js';

// ─── Automation Settings ───────────────────────────────────────────

export async function getSettings(req, res) {
  try {
    let settings = await AutomationSettings.findOne({ user_id: req.user._id }).populate('resume_id');
    if (!settings) {
      settings = await AutomationSettings.create({ user_id: req.user._id });
      // Populate new settings to keep the format consistent
      settings = await AutomationSettings.findById(settings._id).populate('resume_id');
    }
    
    const data = settings.toJSON();
    data.hasCredentials = settings.hasCredentials();
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
}

export async function updateSettings(req, res) {
  try {
    console.log('Received settings update:', req.body);
    
    const allowedFields = [
      'enabled', 'preferred_roles', 'preferred_locations', 'remote_only',
      'salary_min', 'salary_max', 'applications_per_day', 'min_match_score',
      'excluded_companies', 'excluded_job_types', 'auto_apply_enabled',
      'require_human_review', 'email_notifications', 'telegram_notifications',
      'telegram_chat_id', 'search_time', 'timezone', 'days_of_week',
      'resume_id',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let value = req.body[field];
        if (Array.isArray(value)) {
          value = value
            .map(item => (typeof item === 'string' ? item.trim() : item))
            .filter(item => item !== undefined && item !== null && item !== '');
          value = [...new Set(value)];
        }
        if (field === 'resume_id' && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        updates[field] = value;
      }
    }

    console.log('Updates to apply:', updates);

    const settings = await AutomationSettings.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    ).populate('resume_id');
    
    console.log('Settings after save:', {
      preferred_roles: settings.preferred_roles,
      enabled: settings.enabled
    });
    
    const data = settings.toJSON();
    data.hasCredentials = settings.hasCredentials();
    
    res.json(data);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
}

export async function toggleAutomation(req, res) {
  try {
    const { enabled } = req.body;
    const settings = await AutomationSettings.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: { enabled: !!enabled, status: enabled ? 'idle' : 'paused' } },
      { new: true, upsert: true }
    );
    
    const data = settings.toJSON();
    data.hasCredentials = settings.hasCredentials();
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling automation', error: error.message });
  }
}

export async function saveCredentials(req, res) {
  try {
    const { platform, email, password } = req.body;
    
    if (!platform || !email || !password) {
      return res.status(400).json({ message: 'Platform, email, and password required' });
    }
    
    const validPlatforms = ['linkedin', 'indeed', 'naukri'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ message: `Invalid platform. Valid: ${validPlatforms.join(', ')}` });
    }
    
    let settings = await AutomationSettings.findOne({ user_id: req.user._id });
    if (!settings) {
      settings = await AutomationSettings.create({ user_id: req.user._id });
    }
    
    if (!settings.credentials) {
      settings.credentials = new Map();
    }
    
    settings.credentials.set(platform.toLowerCase(), { email, password });
    await settings.save();
    
    res.json({ message: `${platform} credentials saved successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error saving credentials', error: error.message });
  }
}

// ─── Match Scores ──────────────────────────────────────────────────

export async function getMatchScores(req, res) {
  try {
    const { job_id, min_score, limit = 20, skip = 0 } = req.query;
    
    const filter = { user_id: req.user._id };
    if (job_id) filter.job_id = job_id;
    if (min_score) filter.overall_score = { $gte: parseInt(min_score) };
    
    const scores = await MatchScore.find(filter)
      .populate('job_id', 'title company location salary_min salary_max')
      .sort({ overall_score: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await MatchScore.countDocuments(filter);
    
    res.json({ scores, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching match scores', error: error.message });
  }
}

export async function analyzeMatch(req, res) {
  try {
    const { job_id, resume_id } = req.body;
    
    if (!job_id) {
      return res.status(400).json({ message: 'Job ID is required' });
    }
    
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    let resume;
    if (resume_id) {
      resume = await Resume.findById(resume_id);
    } else {
      resume = await Resume.findOne({ user_id: req.user._id }).sort({ createdAt: -1 });
    }
    
    if (!resume) {
      return res.status(404).json({ message: 'No resume found. Upload a resume first.' });
    }
    
    const matchResult = await runFullMatch(
      req.user._id, job._id, resume._id,
      resume.original_text || resume.parsed_data || '',
      job
    );
    
    res.json(matchResult);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing match', error: error.message });
  }
}

// ─── Resume Tailoring ──────────────────────────────────────────────

export async function tailorResume(req, res) {
  try {
    const { resume_id, job_id } = req.body;
    
    let resume;
    if (resume_id) {
      resume = await Resume.findById(resume_id);
    } else {
      resume = await Resume.findOne({ user_id: req.user._id }).sort({ createdAt: -1 });
    }
    
    if (!resume) {
      return res.status(404).json({ message: 'No resume found' });
    }
    
    let jobDescription = '';
    if (job_id) {
      const job = await Job.findById(job_id);
      if (job) {
        jobDescription = `${job.title} ${job.description || ''} ${job.skills_required || ''}`;
      }
    } else if (req.body.job_description) {
      jobDescription = req.body.job_description;
    }
    
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job ID or job description required' });
    }
    
    const resumeData = {
      summary: resume.summary || '',
      sections: {
        experience: resume.experience || resume.parsed_data?.sections?.experience || [],
        skills: resume.skills || resume.parsed_data?.sections?.skills || [],
      },
    };
    
    const tailored = await tailorFullResume(resumeData, jobDescription);
    
    res.json({ original_resume_id: resume._id, tailored });
  } catch (error) {
    res.status(500).json({ message: 'Error tailoring resume', error: error.message });
  }
}

// ─── Cover Letters ─────────────────────────────────────────────────

export async function generateLetter(req, res) {
  try {
    const { company_name, job_title, job_id, job_description, tone } = req.body;
    
    if (!company_name || !job_title) {
      return res.status(400).json({ message: 'Company name and job title required' });
    }
    
    let jd = job_description || '';
    let resumeText = '';
    
    if (job_id) {
      const job = await Job.findById(job_id);
      if (job) {
        jd = jd || `${job.title} ${job.description || ''} ${job.skills_required || ''}`;
      }
    }
    
    const resume = await Resume.findOne({ user_id: req.user._id }).sort({ createdAt: -1 });
    if (resume) {
      resumeText = resume.original_text || resume.parsed_data?.sections || '';
    }
    
    const letter = await generateCoverLetter(company_name, job_title, jd, resumeText, tone);
    
    res.json({ letter });
  } catch (error) {
    res.status(500).json({ message: 'Error generating cover letter', error: error.message });
  }
}

// ─── Reports ───────────────────────────────────────────────────────

export async function getReports(req, res) {
  try {
    const { limit = 10, skip = 0 } = req.query;
    
    const reports = await Report.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments({ user_id: req.user._id });
    
    res.json({ reports, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
}

export async function getReport(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report || report.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
}

export async function runAutomation(req, res) {
  try {
    const result = await runNow(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error running automation', error: error.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const settings = await AutomationSettings.findOne({ user_id: req.user._id });
    const totalJobs = await Job.countDocuments({ user_id: req.user._id });
    const totalApplications = await Application.countDocuments({ user_id: req.user._id });
    
    // Outreach metrics
    const { default: EmailTracking } = await import('../models/EmailTracking.js');
    const emailsSent = await EmailTracking.countDocuments({ user_id: req.user._id });
    const repliesReceived = await EmailTracking.countDocuments({ user_id: req.user._id, reply_received: true });
    const recruiterEmailsFound = await Job.countDocuments({
      user_id: req.user._id,
      recruiter_email: { $exists: true, $ne: null, $ne: '' }
    });

    // Calculate average match score across applications
    const avgMatch = await Application.aggregate([
      { $match: { user_id: req.user._id, match_score: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$match_score' } } }
    ]);
    const averageMatchScore = avgMatch.length > 0 ? Math.round(avgMatch[0].avgScore) : 0;
    
    // Calculate status breakdown
    const apps = await Application.find({ user_id: req.user._id });
    const statusBreakdown = {};
    for (const app of apps) {
      const statusKey = app.status ? app.status.toLowerCase() : 'saved';
      statusBreakdown[statusKey] = (statusBreakdown[statusKey] || 0) + 1;
    }

    const recentApplications = await Application.find({ user_id: req.user._id })
      .populate('job_id')
      .sort({ createdAt: -1 })
      .limit(5);

    const topMatches = await Application.find({ user_id: req.user._id })
      .populate('job_id')
      .sort({ match_score: -1 })
      .limit(5);

    res.json({
      stats: {
        automation_enabled: settings?.enabled || false,
        automation_status: settings?.status || 'idle',
        total_jobs: totalJobs,
        total_applications: totalApplications,
        total_applications_submitted: settings?.total_applications_submitted || 0,
        average_match_score: averageMatchScore,
        last_run: settings?.last_run || null,
        emails_sent: emailsSent,
        replies_received: repliesReceived,
        recruiter_emails_found: recruiterEmailsFound,
      },
      status_breakdown: statusBreakdown,
      recent_applications: recentApplications,
      top_matches: topMatches.map(app => ({
        _id: app._id,
        job_id: app.job_id,
        overall_score: app.match_score || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
}
