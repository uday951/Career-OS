import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { parseResumeText, analyzeJobMatch, tailorResumeExperience, generateCoverLetter, analyzeRejectionFeedback, searchTargetJobs, generateCompanyIntel, generateLatexResume } from '../services/aiService.js';

// @desc    Process a raw resume document using AI to extract structured info
// @route   POST /api/ai/parse-resume/:resumeId
// @access  Private
export const processResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.resumeId, user_id: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found");
    }

    const structuredData = await parseResumeText(resume.original_text);

    // Give an arbitrary base ATS score based on length of skills (Placeholder logic for base model)
    const baseScore = Math.min(60 + (structuredData.master_skills?.length || 0) * 2, 85);

    resume.parsed_data = structuredData;
    resume.ats_score = baseScore;
    await resume.save();

    res.json(resume);
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze match between a resume and a job description
// @route   POST /api/ai/analyze-match
// @access  Private
export const runMatchAnalysis = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id');

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    if (!application.resume_id?.parsed_data) {
      res.status(400);
      throw new Error('Resume has not been parsed yet. Please run parse-resume first.');
    }

    const aiResult = await analyzeJobMatch(application.resume_id.parsed_data, application.job_id.description);

    application.match_analysis = {
      match_percentage: aiResult.match_percentage,
      strengths: aiResult.strengths,
      missing_skills: aiResult.missing_skills,
      reasoning: aiResult.reasoning
    };

    // Store the keywords found back onto the Job model for reference 
    const job = await Job.findById(application.job_id._id);
    job.extracted_keywords = aiResult.extracted_keywords_from_job || [];
    await job.save();

    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new tailored resume version for a specific job
// @route   POST /api/ai/tailor
// @access  Private
export const generateTailoredResume = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id');

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    const tailoredData = await tailorResumeExperience(application.resume_id.parsed_data, application.job_id.description);

    // Create a NEW resume record that is heavily tailored, so historical accuracy is preserved
    const newResume = await Resume.create({
      user_id: req.user._id,
      title: `${application.job_id.company} - Tailored Resume`,
      original_text: application.resume_id.original_text,
      parsed_data: {
        ...application.resume_id.parsed_data,
        work_history: tailoredData.tailored_work_history
      },
      is_base_resume: false,
      ats_score: Math.min((application.resume_id.ats_score || 70) + 15, 99) // Tailoring artificial boost
    });

    // Link new resume to application
    application.resume_id = newResume._id;
    await application.save();

    res.json({ newResume, application });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate cover letter for specific application
// @route   POST /api/ai/cover-letter
// @access  Private
export const createCoverLetter = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id })
      .populate('job_id')
      .populate('resume_id');

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    if (!application.resume_id?.parsed_data) {
      res.status(400);
      throw new Error('Resume has not been parsed yet. Please run parse-resume first.');
    }

    const aiResult = await generateCoverLetter(application.resume_id.parsed_data, application.job_id.description);
    application.tailored_cover_letter = aiResult.cover_letter;
    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze and learn from rejection
// @route   POST /api/ai/feedback
// @access  Private
export const learnFromRejection = async (req, res, next) => {
  try {
    const { applicationId, feedback } = req.body;
    const application = await Application.findOne({ _id: applicationId, user_id: req.user._id }).populate('job_id');

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    application.rejection_feedback = feedback;
    application.status = 'REJECTED';

    const aiResult = await analyzeRejectionFeedback(
      feedback, 
      application.job_id.description, 
      application.match_analysis?.missing_skills || []
    );

    application.feedback_analysis = {
      core_reason: aiResult.core_reason,
      actionable_advice: aiResult.actionable_advice,
      skills_to_learn: aiResult.skills_to_learn
    };

    await application.save();

    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Discover real matching jobs based on parsed resume
// @route   GET /api/ai/discover-jobs
// @access  Private
export const discoverMatchingJobs = async (req, res, next) => {
  try {
    const latestResume = await Resume.findOne({
      user_id: req.user._id,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 });

    let searchQuery = req.query.q;
    const filters = {
      employment_type: req.query.employment_type || 'any',
      remote: req.query.remote || 'false',
      location: req.query.location || 'any',
    };

    if (!searchQuery) {
      if (!latestResume) {
        res.status(400);
        throw new Error("No parsed resume found to base the auto-search on.");
      }
      const parsed = latestResume.parsed_data;
      const topSkill = parsed.master_skills?.[0] || '';
      const latestTitle = parsed.work_history?.[0]?.title || '';
      searchQuery = latestTitle || topSkill || 'developer';
    }

    let realJobs = [];
    try {
      const { searchRealJobs } = await import('../services/jobSearchService.js');
      realJobs = await searchRealJobs(searchQuery, filters);
      
      if (realJobs.length > 0) {
        return res.json(realJobs.map(j => ({ ...j, source: 'real_global' })));
      }
      
      return res.json([]);
    } catch (err) {
      if (err.message === "RAPIDAPI_KEY_MISSING") {
        return res.status(403).json({ error_type: 'RAPIDAPI_KEY_MISSING', message: 'Global Search requires an API Key.' });
      }
      if (err.message === "RAPIDAPI_KEY_INVALID") {
        return res.status(403).json({ error_type: 'RAPIDAPI_KEY_INVALID', message: 'Your API Key was actively REJECTED by RapidAPI. Did you click the Subscribe button on the JSearch Basic Free Tier?' });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Generate massive company background, reviews, and study resources
// @route   POST /api/ai/company-intel
// @access  Private
export const getCompanyIntel = async (req, res, next) => {
  try {
    const { company, role } = req.body;
    
    if (!company || !role) {
      res.status(400);
      throw new Error("Please provide company and role");
    }

    const intel = await generateCompanyIntel(company, role);
    res.json(intel);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Overleaf-ready LaTeX ATS Resume
// @route   POST /api/ai/latex-resume
// @access  Private
export const createLatexResume = async (req, res, next) => {
  try {
    const { resumeId, targetRole } = req.body;
    const resume = await Resume.findOne({ _id: resumeId, user_id: req.user._id });

    if (!resume || !resume.parsed_data) {
      res.status(400);
      throw new Error("Parsed resume not found");
    }

    const aiResult = await generateLatexResume(resume.parsed_data, targetRole);
    res.json(aiResult);
  } catch (error) {
    next(error);
  }
};

