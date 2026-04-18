import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { analyzeJobMatch, generateCoverLetter, generateDeepseekIntel } from '../services/aiService.js';

// @desc    Save a new job and initialize application pipeline
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res, next) => {
  try {
    const { title, company, location, url, description } = req.body;

    const job = await Job.create({
      user_id: req.user._id,
      title,
      company,
      location,
      url,
      description
    });

    // Create tracking application link, auto-linking the user's latest parsed resume
    const latestResume = await (await import('../models/Resume.js')).default.findOne({
      user_id: req.user._id,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 });

    const application = await Application.create({
      user_id: req.user._id,
      job_id: job._id,
      resume_id: latestResume?._id || null,
      status: 'SAVED'
    });

    res.status(201).json({ job, application });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user jobs (via applications)
// @route   GET /api/jobs
// @access  Private
export const getMyJobs = async (req, res, next) => {
  try {
    const applications = await Application.find({ user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id')
      .sort({ updatedAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Link a resume to an application
// @route   PUT /api/jobs/:id/resume
// @access  Private
export const linkResume = async (req, res, next) => {
  try {
    const { resumeId } = req.body;
    const application = await Application.findOne({ _id: req.params.id, user_id: req.user._id });

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    application.resume_id = resumeId;
    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PUT /api/jobs/:id/status
// @access  Private
export const updateJobStatus = async (req, res, next) => {
  try {
    const { status, rejection_feedback } = req.body;
    
    const application = await Application.findOne({ 
      job_id: req.params.id, 
      user_id: req.user._id 
    });

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    application.status = status;
    if (rejection_feedback) {
      application.rejection_feedback = rejection_feedback;
    }

    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Auto apply to a job, analyzing and tailoring cover letter instantly
// @route   POST /api/jobs/auto-apply
// @access  Private
export const autoApplyJob = async (req, res, next) => {
  try {
    const { title, company, location, description, salary_range } = req.body;
    
    // Find candidate's parsed resume
    const ResumeModel = (await import('../models/Resume.js')).default;
    const latestResume = await ResumeModel.findOne({
      user_id: req.user._id,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 });

    if (!latestResume) {
      res.status(400);
      throw new Error("No parsed resume found. Cannot auto-apply.");
    }

    const job = await Job.create({
      user_id: req.user._id,
      title, company, location, description, url: 'Auto-Discovered',
    });

    const application = await Application.create({
      user_id: req.user._id,
      job_id: job._id,
      resume_id: latestResume._id,
      status: 'APPLIED', // Skips SAVED straight to Applied
      applied_on: new Date()
    });

    // Run AI Parallel processing for speed including DeepSeek Intel
    const [matchResult, clResult, intelResult] = await Promise.all([
      analyzeJobMatch(latestResume.parsed_data, description),
      generateCoverLetter(latestResume.parsed_data, description),
      generateDeepseekIntel(company, title).catch(() => ({})) // Failsafe if DeepSeek times out
    ]);

    application.match_analysis = {
      match_percentage: matchResult.match_percentage,
      strengths: matchResult.strengths,
      missing_skills: matchResult.missing_skills,
      reasoning: matchResult.reasoning
    };
    
    application.intelligence_materials = intelResult;
    application.tailored_cover_letter = clResult.cover_letter;
    await application.save();

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const getApplicationByJob = async (req, res, next) => {
  try {
    const application = await Application.findOne({
      user_id: req.user._id,
      job_id: req.params.jobId
    }).populate('job_id');

    if (!application) {
      res.status(404);
      throw new Error("Application not found.");
    }
    res.json(application);
  } catch (error) {
    next(error);
  }
};
