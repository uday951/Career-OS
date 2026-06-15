import dotenv from 'dotenv';
dotenv.config();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

/**
 * Helper to call DeepSeek API
 */
async function callDeepSeek(systemPrompt, userPrompt, jsonMode = true) {
  try {
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
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
      console.error('DeepSeek Service Error:', errorText);
      throw new Error(`AI Request failed with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    if (jsonMode) {
      if (content.startsWith('```json')) {
        content = content.replace(/^```json/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(content);
    }

    return content;
  } catch (error) {
    console.error('callDeepSeek exception:', error);
    throw error;
  }
}

/**
 * 1. Semantic ATS Analysis Engine
 */
export async function runSemanticATSAnalysis(resumeJson, jobDescription) {
  const systemPrompt = `You are CareerOS's ATS Intelligence Engine. Analyze the candidate's resume against the job description with precision.
  Detect implicit skills, semantic synonyms (e.g. 'led' = 'managed' = 'spearheaded'), and seniority matches.
  Always respond in strict JSON.
  Return this exact JSON structure:
  {
    "atsScore": number (0-100),
    "breakdown": {
      "keywordMatch": number (0-100),
      "skillsAlignment": number (0-100), 
      "experienceRelevance": number (0-100),
      "formatScore": number (0-100)
    },
    "presentKeywords": string[],
    "missingCriticalKeywords": string[],
    "semanticMatches": [{"resumeWord": string, "jdWord": string}],
    "skillGaps": string[],
    "seniorityMatch": "under" | "match" | "over",
    "topRecommendations": string[],
    "estimatedInterviewProbability": number (0-100)
  }`;

  const userPrompt = `RESUME:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}`;
  return await callDeepSeek(systemPrompt, userPrompt, true);
}

/**
 * 2. Intelligent Resume Rewriter (Full Optimize)
 */
export async function optimizeFullResume(resumeJson, jobDescription) {
  const systemPrompt = `You are an elite resume writer with 15+ years placing candidates at FAANG, McKinsey, Goldman Sachs. Rewrite this resume for the target role while:
  - Quantifying every achievement (add realistic estimated metrics where reasonable)
  - Using strong action verbs from the job description
  - Embedding ATS keywords naturally (never keyword stuffing)
  - Matching the seniority tone of the job posting
  - Preserving 100% factual accuracy
  - Formatting bullets as: [Action Verb] + [Task] + [Measurable Result]
  
  CRITICAL INFORMATION INTEGRITY RULES:
  - ZERO INFORMATION LOSS: Do NOT delete, drop, combine, or summarize any work experiences, roles, projects, schools, degrees, certifications, or skill categories.
  - Keep all items from the input resume intact in the output, simply optimizing their phrasing, terminology, and description to match the target job description.
  
  Always respond in strict JSON. Return the optimized resume content in the exact same schema structure as the input resume.
  JSON Schema matches:
  {
    "fullName": "Name",
    "title": "Role Title",
    "email": "Email",
    "phone": "Phone",
    "location": "Location",
    "linkedin": "LinkedIn",
    "github": "GitHub",
    "summary": "3-sentence Hook",
    "experience": [
      {
        "position": "Title",
        "company": "Company",
        "startDate": "Start Date",
        "endDate": "End Date",
        "description": "Bullet points separated by newlines"
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "description": "Bullet points separated by newlines",
        "technologies": ["tech1", "tech2"],
        "link": "Optional link"
      }
    ],
    "education": [
      {
        "degree": "Degree",
        "school": "School",
        "graduationDate": "Graduation Date"
      }
    ],
    "skills": [
      {
        "category": "Category name",
        "items": ["skill1", "skill2"]
      }
    ],
    "certifications": ["Cert 1"]
  }`;

  const userPrompt = `ORIGINAL RESUME JSON:\n${JSON.stringify(resumeJson)}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}`;
  return await callDeepSeek(systemPrompt, userPrompt, true);
}

/**
 * 3. Multi-Version Strategy Engine
 */
export async function generateResumeVersions(resumeJson, jobDescription) {
  const systemPrompt = `You are an expert recruitment advisor. Generate 3 strategically different resume versions for the target job description based on the user's resume:
  - Version A: ATS-Maximized (focuses heavily on keyword density, matching criteria, and standardized headers)
  - Version B: Human-Optimized (prioritizes narrative flow, compelling career story, and readable layout)
  - Version C: Hybrid Executive (uses C-suite language, board-level framing, leadership qualities, and business value metrics)
  
  CRITICAL INFORMATION INTEGRITY RULES FOR ALL VERSIONS:
  - ZERO INFORMATION LOSS: Do NOT delete, drop, combine, or summarize any work experiences, roles, projects, schools, degrees, certifications, or skill categories.
  - Keep all items from the input resume intact in the content property of each version, simply tailoring the language, tone, and emphasis to fit the chosen strategy.
  
  Provide the reasoning for each version's choices.
  Always respond in strict JSON.
  Return this exact JSON structure:
  {
    "versions": [
      {
        "versionName": "ATS-Maximized",
        "strategy": "A",
        "atsScore": number,
        "claudeReasoning": "Detailed explanation of keyword choices and structure alignment.",
        "content": { ...optimized resume JSON matching same structure as input... }
      },
      {
        "versionName": "Human-Optimized",
        "strategy": "B",
        "atsScore": number,
        "claudeReasoning": "Detailed explanation of narrative layout and framing.",
        "content": { ...optimized resume JSON matching same structure as input... }
      },
      {
        "versionName": "Hybrid Executive",
        "strategy": "C",
        "atsScore": number,
        "claudeReasoning": "Detailed explanation of executive vocabulary and high-impact metrics used.",
        "content": { ...optimized resume JSON matching same structure as input... }
      }
    ]
  }`;

  const userPrompt = `RESUME DATA:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}`;
  return await callDeepSeek(systemPrompt, userPrompt, true);
}

/**
 * 4. Smart Section Optimizer (Single Section)
 */
export async function optimizeSection(sectionName, sectionContent, jobDescription) {
  let sectionGuideline = '';
  if (sectionName.toLowerCase() === 'summary') {
    sectionGuideline = 'Write a 3-sentence executive summary that hooks in 6 seconds.';
  } else if (sectionName.toLowerCase() === 'experience' || sectionName.toLowerCase() === 'work_history') {
    sectionGuideline = 'Use the STAR method. Start with a power verb. End with a number (estimated metric).';
  } else if (sectionName.toLowerCase() === 'skills') {
    sectionGuideline = 'Cluster by category. Surface hidden skills from bullet context.';
  } else if (sectionName.toLowerCase() === 'projects') {
    sectionGuideline = 'Frame as business/technical impact, not just a technical description.';
  } else {
    sectionGuideline = 'Refine the formatting and content for alignment with the job description.';
  }

  const systemPrompt = `You are a FAANG executive recruiter. Rewrite/optimize the provided resume section based on this guideline: "${sectionGuideline}".
  Ensure it fits the target job description naturally.
  Always respond in strict JSON.
  Return this exact JSON structure:
  {
    "optimizedContent": "string (the optimized section content, formatting, or bullet points)",
    "improvementExplanation": "string (short description of what was added or improved and why)"
  }`;

  const userPrompt = `SECTION NAME: ${sectionName}\n\nORIGINAL CONTENT:\n${typeof sectionContent === 'object' ? JSON.stringify(sectionContent) : sectionContent}\n\nJOB DESCRIPTION:\n${jobDescription}`;
  return await callDeepSeek(systemPrompt, userPrompt, true);
}

/**
 * 5. Cover Letter Generator
 */
export async function generateCoverLetter(resumeJson, jobDescription) {
  const systemPrompt = `You are an elite career advisor. Generate a highly personalized and compelling Cover Letter matching the target job description based on the resume data.
  Keep it professional, narrative-focused, and under 300 words.
  Always respond in strict JSON.
  Return this exact JSON structure:
  {
    "subject": "string",
    "body": "string (multiline cover letter body text)"
  }`;

  const userPrompt = `RESUME DATA:\n${JSON.stringify(resumeJson)}\n\nJOB DESCRIPTION:\n${jobDescription}`;
  return await callDeepSeek(systemPrompt, userPrompt, true);
}

/**
 * Streaming rewrite service for SSE integration
 */
export async function getDeepSeekStream(systemPrompt, userPrompt) {
  try {
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true
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
      throw new Error(`Streaming failed with status ${response.status}`);
    }

    return response.body;
  } catch (error) {
    console.error('getDeepSeekStream exception:', error);
    throw error;
  }
}
