import Resume from '../models/Resume.js';
import { analyzeShadowApplication, analyzeReverseRecruiter } from '../services/intelligenceService.js';
import { searchRealJobs } from '../services/jobSearchService.js';

/**
 * POST /api/shadow/analyze
 */
export const shadowAnalyze = async (req, res, next) => {
  try {
    const { jobDescription, jobTitle, companyName, resumeId } = req.body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      res.status(400);
      throw new Error('Please provide a detailed job description (minimum 50 characters).');
    }

    const query = resumeId
      ? { _id: resumeId, user_id: req.user._id }
      : { user_id: req.user._id, parsed_data: { $ne: null } };

    const resume = await Resume.findOne(query).sort({ updatedAt: -1 });

    if (!resume?.parsed_data) {
      res.status(404);
      throw new Error('No parsed resume found. Please upload and parse a resume first.');
    }

    const result = await analyzeShadowApplication(
      resume.parsed_data,
      jobDescription,
      jobTitle,
      companyName
    );

    res.json({
      ...result,
      resume_title: resume.title,
      analyzed_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};


/**
 * POST /api/reverse/jobs
 */
export const reverseRecruiter = async (req, res, next) => {
  try {
    const { resumeId, query, location, employment_type, remote } = req.body;

    const resumeQuery = resumeId
      ? { _id: resumeId, user_id: req.user._id }
      : { user_id: req.user._id, parsed_data: { $ne: null } };

    const resume = await Resume.findOne(resumeQuery).sort({ updatedAt: -1 });

    if (!resume?.parsed_data) {
      res.status(404);
      throw new Error('No parsed resume found. Please upload and parse a resume first.');
    }

    const pd = resume.parsed_data;

    // Build search query — prefer explicit query, else auto-detect from resume
    const searchQuery = query?.trim()
      || pd.work_history?.[0]?.title
      || pd.master_skills?.[0]
      || 'software developer';

    // Build filters object — only include non-empty values
    const filters = {};
    if (location?.trim())       filters.location        = location.trim();
    if (employment_type?.trim() && employment_type !== 'any') filters.employment_type = employment_type.trim();
    if (remote === true || remote === 'true') filters.remote = 'true';

    let liveJobs = [];
    try {
      liveJobs = await searchRealJobs(searchQuery, filters);
    } catch (err) {
      if (err.message === 'RAPIDAPI_KEY_MISSING') {
        return res.status(503).json({ message: 'RAPIDAPI_KEY_MISSING: Set your RapidAPI key to use Reverse Recruiter.' });
      }
      throw err;
    }

    if (liveJobs.length === 0) {
      res.status(404);
      throw new Error('No live jobs found for your profile with the selected filters. Try broadening the location or removing filters.');
    }

    const result = await analyzeReverseRecruiter(pd, liveJobs);

    const enrichedMatches = (result.top_matches || []).map(match => {
      const originalJob = liveJobs[match.job_index];
      return {
        ...match,
        apply_url:     originalJob?.apply_url     || '',
        employer_logo: originalJob?.employer_logo || '',
        location:      originalJob?.location      || '',
        is_remote:     originalJob?.is_remote     || false,
        salary_range:  originalJob?.salary_range  || '',
        job_type:      originalJob?.job_type      || '',
      };
    });

    res.json({
      ...result,
      top_matches:          enrichedMatches,
      total_jobs_fetched:   liveJobs.length,
      search_query_used:    searchQuery,
      filters_applied:      filters,
      resume_title:         resume.title,
      analyzed_at:          new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

