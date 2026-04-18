import { askAI } from './aiService.js';

/**
 * FEATURE 1: Shadow Application Mode
 * Simulates real-world hiring outcome before the user applies.
 * Uses a structured scoring rubric across 6 dimensions.
 */
export const analyzeShadowApplication = async (resumeProfile, jobDescription, jobTitle, companyName) => {
  const systemPrompt = `You are an expert ATS system, hiring manager simulator, and talent acquisition analyst.
Your task is to deeply analyze a candidate's resume profile against a specific job description and predict real-world hiring outcomes.

## SCORING RUBRIC (use ALL six dimensions):
1. **ATS Keyword Match** (0-100): How well the resume keywords match job requirements. Count exact and semantic matches.
2. **Skills Alignment** (0-100): Technical and soft skill overlap. Penalize for missing must-have skills.
3. **Experience Level Fit** (0-100): Does years of experience + seniority match the role's requirement?
4. **Project & Portfolio Strength** (0-100): Are their projects relevant to this job's domain?
5. **Education Relevance** (0-100): Degree level, field, institution prestige for this role.
6. **Application Timing** (0-100): Is candidate slightly junior (good for growth), on-level, or overqualified?

## PROBABILITY CALCULATION:
- Weighted average: ATS(25%) + Skills(30%) + Experience(20%) + Projects(15%) + Education(5%) + Timing(5%)
- selection_probability = weighted_score (capped 5-95, never 0 or 100 — that is unrealistic)
- rejection_probability = 100 - selection_probability

## REJECTION REASONS:
- Identify TOP 3 specific reasons this candidate would be rejected
- Be specific — reference ACTUAL skills gaps, not generic phrases
- Rank by impact (most damaging first)

## IMPROVEMENT ACTIONS:
- Provide exactly 4 concrete, actionable improvements
- Each must be specific to THIS candidate's profile vs THIS job
- Include estimated impact on selection probability (e.g., "+8% if added")

## DECISION:
- "apply_now": score >= 70
- "prepare_first": score 50-69
- "skip_or_upskill": score < 50

Return ONLY a valid JSON object with this exact schema:
{
  "selection_probability": number,
  "rejection_probability": number,
  "decision": "apply_now" | "prepare_first" | "skip_or_upskill",
  "decision_reasoning": "string",
  "dimension_scores": {
    "ats_keyword_match": number,
    "skills_alignment": number,
    "experience_level_fit": number,
    "project_strength": number,
    "education_relevance": number,
    "application_timing": number
  },
  "top_rejection_reasons": [
    { "rank": 1, "reason": "string", "severity": "critical|high|medium", "fix": "string" },
    { "rank": 2, "reason": "string", "severity": "critical|high|medium", "fix": "string" },
    { "rank": 3, "reason": "string", "severity": "critical|high|medium", "fix": "string" }
  ],
  "improvement_actions": [
    { "action": "string", "effort": "low|medium|high", "impact_increase": number, "timeline": "string" },
    { "action": "string", "effort": "low|medium|high", "impact_increase": number, "timeline": "string" },
    { "action": "string", "effort": "low|medium|high", "impact_increase": number, "timeline": "string" },
    { "action": "string", "effort": "low|medium|high", "impact_increase": number, "timeline": "string" }
  ],
  "strengths_to_highlight": ["string", "string", "string"],
  "keyword_gap_analysis": {
    "matched_keywords": ["string"],
    "missing_critical": ["string"],
    "missing_nice_to_have": ["string"]
  },
  "ats_optimized_headline": "string"
}`;

  const userPrompt = `ANALYZE THIS APPLICATION:

JOB TITLE: ${jobTitle || 'Not specified'}
COMPANY: ${companyName || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${JSON.stringify(resumeProfile, null, 2)}

Run the full analysis using all six scoring dimensions. Be brutally honest and specific.`;

  return await askAI(systemPrompt, userPrompt, true);
};


/**
 * FEATURE 2: Reverse Recruiter Mode
 * Scans available jobs and identifies which companies SHOULD be hiring this candidate.
 * Returns ranked opportunities with strategy per job.
 */
export const analyzeReverseRecruiter = async (resumeProfile, jobsList) => {
  const systemPrompt = `You are a senior talent acquisition strategist running in REVERSE RECRUITER mode.
Instead of candidates applying to jobs, you identify which jobs SHOULD be hunting this candidate.

## YOUR TASK:
Analyze the candidate profile against all provided jobs and:
1. Score each job for fit (0-100) using the same 6-dimension rubric
2. Select the TOP 5 best-fit jobs
3. For each: explain WHY the company would want this person specifically
4. Provide a custom application strategy per job

## SCORING RUBRIC:
Same as ATS analysis — ATS(25%) + Skills(30%) + Experience(20%) + Projects(15%) + Education(5%) + Timing(5%)

## DECISION PER JOB:
- "strong_apply": fit >= 72 — candidate has real competitive advantage
- "apply_with_prep": fit 55-71 — apply but shore up weaknesses first
- "skip_for_now": fit < 55 — not worth effort at current skill level

## STRATEGY GENERATION:
- For "strong_apply": name exactly what to lead with in cover letter/interview
- For "apply_with_prep": name the 1-2 things to address before applying
- Always suggest a specific outreach angle (what makes this candidate stand out)

Return ONLY valid JSON:
{
  "total_jobs_analyzed": number,
  "candidate_summary": "string (2 sentences about candidate's competitive positioning)",
  "top_matches": [
    {
      "job_index": number,
      "job_title": "string",
      "company": "string",
      "fit_score": number,
      "decision": "strong_apply" | "apply_with_prep" | "skip_for_now",
      "why_you_fit": "string (specific, references actual candidate skills/experience)",
      "competitive_advantage": "string (what makes them stand out vs other applicants)",
      "application_strategy": "string (exactly what to do — cover letter angle, what to highlight)",
      "red_flags_to_address": ["string"],
      "outreach_subject_line": "string (for LinkedIn/email cold outreach)"
    }
  ],
  "skill_market_positioning": {
    "most_marketable_skills": ["string"],
    "skill_gaps_for_top_roles": ["string"],
    "recommended_skill_to_add_next": "string"
  },
  "overall_recommendation": "string"
}`;

  // Send only top 20 jobs to avoid token overflow
  const jobsToAnalyze = jobsList.slice(0, 20).map((j, idx) => ({
    index: idx,
    title: j.title,
    company: j.company,
    description: j.description?.substring(0, 600),
    location: j.location,
    job_type: j.job_type,
  }));

  const userPrompt = `CANDIDATE PROFILE:
${JSON.stringify(resumeProfile, null, 2)}

AVAILABLE JOBS TO ANALYZE (${jobsToAnalyze.length} total):
${JSON.stringify(jobsToAnalyze, null, 2)}

Identify the TOP 5 jobs this candidate should pursue. Be specific about WHY each company would want them.`;

  return await askAI(systemPrompt, userPrompt, true);
};
