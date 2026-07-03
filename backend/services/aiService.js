import dotenv from 'dotenv';
dotenv.config();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
// Using DeepSeek chat model
const MODEL = 'deepseek-chat';

/**
 * Base AI wrapper function
 */
export const askAI = async (systemPrompt, userPrompt, jsonMode = true) => {
  let finalSystemPrompt = systemPrompt;
  let finalUserPrompt = userPrompt;

  if (userPrompt === undefined) {
    finalSystemPrompt = 'You are a helpful AI assistant.';
    finalUserPrompt = systemPrompt;
  }

  try {
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: finalUserPrompt }
      ],
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek Error:', errorText);
      throw new Error(`AI Request failed with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Failsafe parsing if jsonMode was requested but not strictly honored by the model
    if (jsonMode) {
      // Strip markdown code blocks if the model wraps the JSON response
      if (content.startsWith('```json')) {
        content = content.replace(/^```json/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(content);
    }

    return content;
  } catch (error) {
    console.error('askAI Exception:', error);
    throw error;
  }
};

/**
 * Parses raw text into structured JSON representing a candidate's profile
 */
export const parseResumeText = async (rawText) => {
  const systemPrompt = `You are an elite, highly precise ATS parsing engine. 
Your job is to extract EVERYTHING from the provided raw resume text into the requested JSON schema structure.
Do NOT omit, summarize, aggregate, or skip any job experiences, projects, bullet points, education items, or skills.
You MUST preserve all details exactly as they are in the text.
If any contact field is not found, leave it empty.

JSON Schema:
{
  "fullName": "Full Name",
  "title": "Role Title / Professional Headline",
  "email": "Email Address",
  "phone": "Phone Number",
  "location": "City, State / Location",
  "linkedin": "LinkedIn profile link",
  "github": "GitHub profile link",
  "summary": "Professional summary hook",
  "experience": [
    {
      "position": "Job title / Position",
      "company": "Company Name",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "description": "Factual description/bullet points of achievements, duties, and tools used. Keep them separated by newlines."
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Factual description/bullet points of project goals, achievements, and scope, separated by newlines.",
      "technologies": ["React", "TypeScript", "Node.js"],
      "link": "Optional project URL/link"
    }
  ],
  "skills": [
    {
      "category": "Skill category (e.g. Languages, Frontend, Backend, DevOps, Tools, Methodologies)",
      "items": ["Skill 1", "Skill 2"]
    }
  ],
  "education": [
    {
      "school": "University/School name",
      "degree": "Degree and Major (e.g. B.S. in Computer Science)",
      "graduationDate": "Graduation Date or Year"
    }
  ],
  "certifications": ["Certification name 1", "Certification name 2"]
}

Return ONLY the raw JSON object. Do not wrap in markdown code blocks.`;

  const userPrompt = `Extract all details from the following raw resume text into the predefined JSON schema:\n\n${rawText}`;
  
  const parsed = await askAI(systemPrompt, userPrompt, true);
  
  // Backward compatibility mapping
  if (parsed) {
    if (!parsed.work_history && parsed.experience) {
      parsed.work_history = parsed.experience.map(exp => ({
        company: exp.company || '',
        title: exp.position || '',
        start_date: exp.startDate || '',
        end_date: exp.endDate || '',
        description: exp.description || ''
      }));
    }
    if (!parsed.master_skills && parsed.skills) {
      const allSkills = [];
      parsed.skills.forEach(cat => {
        if (Array.isArray(cat.items)) {
          allSkills.push(...cat.items);
        } else if (typeof cat.items === 'string') {
          allSkills.push(cat.items);
        }
      });
      parsed.master_skills = [...new Set(allSkills)];
    }
    if (!parsed.education_old && parsed.education) {
      parsed.education_old = parsed.education.map(edu => ({
        institution: edu.school || '',
        degree: edu.degree || '',
        field_of_study: '',
        start_date: '',
        graduation_date: edu.graduationDate || ''
      }));
    }
  }
  return parsed;
};

/**
 * Matches a structured resume against a job description
 */
export const analyzeJobMatch = async (resumeJson, jobDescription) => {
  const systemPrompt = `You are an expert technical recruiter and ATS system. Perform an unbiased and detailed match analysis of a candidate's resume against a provided job description.
  Return valid JSON strictly matching this schema:
  {
    "match_percentage": 85,
    "strengths": ["string"],
    "missing_skills": ["string"],
    "extracted_keywords_from_job": ["string"],
    "reasoning": "Markdown formatted bullet points explaining the score."
  }`;

  const userPrompt = `CANDIDATE RESUME JSON:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nExecute Analysis.`;
  
  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Tailors existing base resume points to specifically fit a job description
 */
export const tailorResumeExperience = async (resumeJson, jobDescription) => {
  const systemPrompt = `You are an expert career coach writing hyper-optimized resume bullets. Refine the provided resume JSON's work 'description' fields to specifically target the exact phrasing and priorities of the Job Description. 
  Do NOT fabricate new experience or lie. Emphasize existing truth through the lens of the new job.
  Return valid JSON containing ONLY the array of updated work history.
  {
    "tailored_work_history": [
       {"company":"", "title":"", "start_date":"", "end_date":"", "description":"New tailored bullet points matching the job description perfectly"}
    ]
  }`;

  const userPrompt = `RESUME JSON:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Generates a targeted cover letter
 */
export const generateCoverLetter = async (resumeJson, jobDescription) => {
  const systemPrompt = `You are an expert career counselor. Write a professional, punchy, and compelling cover letter tailored exactly to this job description. Use the candidate's provided background. Do NOT invent experiences. Keep it under 3 paragraphs.
  Return valid JSON containing ONLY the string inside 'cover_letter'.
  {
    "cover_letter": "Dear Hiring Manager..."
  }`;

  const userPrompt = `RESUME JSON:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Analyzes rejection feedback to detect skill gaps
 */
export const analyzeRejectionFeedback = async (feedback, jobDescription, missingSkills) => {
  const systemPrompt = `You are a career strategist. A candidate was rejected from a job. Analyze their rejection feedback, the job description, and the previously identified missing skills to determine key areas of improvement.
  Return valid JSON strictly matching this schema:
  {
    "core_reason": "string (Short summary of why they were rejected)",
    "actionable_advice": ["string"],
    "skills_to_learn": ["string"]
  }`;

  const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nPREVIOUSLY IDENTIFIED GAPS:\n${missingSkills.join(', ')}\n\nREJECTION FEEDBACK / INTERVIEW NOTES:\n${feedback}\n\nExecute Analysis.`;

  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Simulates a Smart Job Board search by generating perfectly matched jobs based on a Resume
 */
export const searchTargetJobs = async (resumeJson, queryOverride = null) => {
  const companyContext = queryOverride 
    ? `CRITICAL REQUIREMENT: You MUST exclusively generate jobs at the company or matching the exact query: "${queryOverride}". Do not generate random companies.`
    : `Discover diverse companies that fit the candidate.`;

  const systemPrompt = `You are a Job Search Aggregator API. Based on the candidate's skills, discover and return 8 highly relevant tech jobs.
  ${companyContext}
  Make the descriptions hyper-realistic, containing standard corporate requirements, responsibilities, and qualifications.
  Return valid JSON containing ONLY:
  {
    "discovered_jobs": [
      { 
        "title": "string", 
        "company": "string (MUST MATCH '${queryOverride || 'Realistic Tech Company'}')", 
        "location": "Remote or City", 
        "description": "string (Multi-paragraph detailed job description)",
        "salary_range": "$120k - $150k"
      }
    ]
  }`;

  const userPrompt = `CANDIDATE PROFILE JSON:\n${JSON.stringify(resumeJson)}\n\nFind 8 perfect job matches obeying the constraints.`;

  return await askAI(systemPrompt, userPrompt, true);
};

export const generateCompanyIntel = async (companyName, roleTitle) => {
  return await generateDeepseekIntel(companyName, roleTitle);
};

/**
 * AI Agent Decision Making - Determines if job should be applied to
 */
export const shouldApplyToJob = async (resumeJson, jobData, userPreferences) => {
  const systemPrompt = `You are an autonomous AI job agent. Analyze if this job matches the candidate's profile and preferences.
  Consider: skills match, experience level, salary expectations, location preferences, company reputation.
  Return JSON:
  {
    "should_apply": boolean,
    "confidence_score": number (0-100),
    "reasoning": "string",
    "red_flags": ["string"],
    "green_flags": ["string"]
  }`;

  const userPrompt = `RESUME: ${JSON.stringify(resumeJson)}\n\nJOB: ${JSON.stringify(jobData)}\n\nPREFERENCES: ${JSON.stringify(userPreferences)}\n\nDecide.`;
  
  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Generate personalized recruiter email
 */
export const generateRecruiterEmail = async (resumeJson, jobData, emailType = 'application_followup') => {
  const systemPrompt = `You are an expert career coach writing professional recruiter emails.
  Write a personalized, concise email (3-4 sentences max) that sounds human and genuine.
  Return JSON:
  {
    "subject": "string",
    "body": "string (plain text, professional tone)"
  }`;

  const userPrompt = `EMAIL TYPE: ${emailType}\nCANDIDATE: ${JSON.stringify(resumeJson)}\nJOB: ${JSON.stringify(jobData)}\n\nGenerate email.`;
  
  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * AI-powered form field understanding
 */
export const callDeepSeek = async (prompt) => {
  return await askAI('You are a helpful AI assistant analyzing web pages and forms.', prompt, false);
};

/**
 * Temporary OpenRouter mock of DeepSeek for testing purposes
 */
export const generateDeepseekIntel = async (companyName, roleTitle) => {
  const systemPrompt = `You are an elite Career Coach and Corporate Intelligence Analyst.
  Provide an intelligence report on the given company and tech role.
  Provide:
  1. A brief background and known general reputation/reviews of the company.
  2. Potential interview process structure for this role.
  3. Actionable study materials or resource links (e.g., LeetCode patterns, system design concepts).
  4. Specific internet sources and URLs to study from.
  
  Return strictly as JSON schema:
  {
    "company_background": "string",
    "cultural_reviews": "string",
    "interview_process": ["string"],
    "study_resources": ["string"],
    "internet_sources": ["string"]
  }`;

  const userPrompt = `COMPANY: ${companyName}\nROLE: ${roleTitle}\nGenerate Intelligence Brief and Internet Sources.`;

  return await askAI(systemPrompt, userPrompt, true);
};

/**
 * Generates an Overleaf-ready LaTeX ATS resume using Jake's Resume template style.
 * Uses plain-text mode (NOT JSON) because LaTeX contains literal newlines/tabs
 * that are illegal inside JSON strings and cause JSON.parse to crash.
 */
export const generateLatexResume = async (resumeJson, targetRole = "Software Engineer") => {
  const systemPrompt = `You are an expert LaTeX developer and elite Career Coach.
Generate a perfectly compiling ATS-friendly LaTeX resume using the standard Jake's Resume template style.
Use the candidate JSON profile data to fill every section accurately.
Tailor all bullet points and the professional summary toward this target role: ${targetRole}.

IMPORTANT RULES:
- Return ONLY the raw LaTeX source code. No JSON, no markdown, no explanation.
- Start your response directly with \\documentclass
- Do NOT use triple backticks or code fences.
- Use these packages as needed: latexsym, fullpage, titlesec, marvosym, verbatim, enumitem, hyperref, fancyhdr, tabularx.`;

  const userPrompt = `CANDIDATE PROFILE:\n${JSON.stringify(resumeJson, null, 2)}\n\nGenerate the complete LaTeX code now.`;

  // Plain-text mode - LaTeX has literal control chars (\n, \t) that break JSON.parse
  const rawLatex = await askAI(systemPrompt, userPrompt, false);

  // Strip accidental code fences
  const cleaned = rawLatex
    .replace(/^```latex\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return { latex_code: cleaned };
};
