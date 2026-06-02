import { askAI } from './aiService.js';
import MatchScore from '../models/MatchScore.js';

/**
 * Common tech skills lexicon for keyword matching
 */
const SKILLS_LEXICON = [
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'go', 'rust', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'node.js', 'express', 'django', 'flask',
  'spring', 'laravel', 'rails', 'asp.net', 'fastapi',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'github actions',
  'graphql', 'rest', 'grpc', 'websocket',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'git', 'linux', 'agile', 'scrum', 'jira',
  'html', 'css', 'sass', 'tailwind', 'bootstrap',
  'redux', 'zustand', 'mobx', 'rxjs',
  'jest', 'mocha', 'cypress', 'playwright', 'selenium',
  'webpack', 'vite', 'rollup', 'babel',
  'nginx', 'apache', 'rabbitmq', 'kafka',
  'tableau', 'power bi', 'excel', 'sql',
];

/**
 * Extract skills from text using lexicon
 */
export function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILLS_LEXICON.filter(skill => lower.includes(skill.toLowerCase()));
}

/**
 * Calculate keyword density score
 */
export function calculateKeywordMatch(resumeText, jobDescription) {
  const resumeWords = resumeText.toLowerCase().split(/\s+/);
  const jdWords = new Set(jobDescription.toLowerCase().split(/\s+/));
  
  let matches = 0;
  for (const word of resumeWords) {
    if (jdWords.has(word) && word.length > 2) matches++;
  }
  
  const totalUnique = jdWords.size;
  return totalUnique > 0 ? Math.round((matches / Math.min(totalUnique, resumeWords.length)) * 100) : 0;
}

/**
 * AI-powered job match analysis
 */
export async function analyzeJobMatchAI(resumeData, jobData) {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.

Analyze the match between this candidate's resume and the job description.

RESUME:
${typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
Title: ${jobData.title}
Company: ${jobData.company}
Description: ${jobData.description || jobData.job_description || ''}
Skills Required: ${jobData.skills_required || jobData.skills?.join(', ') || 'Not specified'}

Return a JSON object (no markdown, no code blocks) with:
{
  "overall_score": <0-100>,
  "skill_match_score": <0-100>,
  "experience_match_score": <0-100>,
  "education_match_score": <0-100>,
  "keyword_match_score": <0-100>,
  "ats_compatibility_score": <0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "matched_keywords": ["keyword1"],
  "missing_keywords": ["keyword2"],
  "ats_issues": ["Issue description"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "should_apply": true/false,
  "ai_summary": "2-3 sentence analysis"
}`;

  try {
    const response = await askAI(prompt);
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    
    return {
      overall_score: Math.min(100, Math.max(0, parsed.overall_score || 0)),
      skill_match_score: Math.min(100, Math.max(0, parsed.skill_match_score || 0)),
      experience_match_score: Math.min(100, Math.max(0, parsed.experience_match_score || 0)),
      education_match_score: Math.min(100, Math.max(0, parsed.education_match_score || 0)),
      keyword_match_score: Math.min(100, Math.max(0, parsed.keyword_match_score || 0)),
      ats_compatibility_score: Math.min(100, Math.max(0, parsed.ats_compatibility_score || 0)),
      matched_skills: parsed.matched_skills || [],
      missing_skills: parsed.missing_skills || [],
      matched_keywords: parsed.matched_keywords || [],
      missing_keywords: parsed.missing_keywords || [],
      ats_issues: parsed.ats_issues || [],
      recommendations: parsed.recommendations || [],
      should_apply: parsed.should_apply || parsed.overall_score >= 70,
      ai_summary: parsed.ai_summary || '',
    };
  } catch (error) {
    console.error('AI job match error:', error.message);
    // Fallback to basic scoring
    const resumeText = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData);
    const jdText = `${jobData.title} ${jobData.description || ''} ${jobData.skills_required || ''}`;
    const resumeSkills = extractSkills(resumeText);
    const jdSkills = extractSkills(jdText);
    
    const matched = resumeSkills.filter(s => jdSkills.includes(s));
    const missing = jdSkills.filter(s => !resumeSkills.includes(s));
    const score = jdSkills.length > 0 ? Math.round((matched.length / jdSkills.length) * 100) : 50;
    
    return {
      overall_score: score,
      skill_match_score: score,
      experience_match_score: 50,
      education_match_score: 50,
      keyword_match_score: calculateKeywordMatch(resumeText, jdText),
      ats_compatibility_score: score,
      matched_skills: matched,
      missing_skills: missing,
      matched_keywords: [...matched],
      missing_keywords: [...missing],
      ats_issues: ['Fallback analysis used'],
      recommendations: ['Consider adding missing skills to your resume'],
      should_apply: score >= 70,
      ai_summary: `Match score: ${score}% based on skill overlap.`,
    };
  }
}

/**
 * Save match score to database
 */
export async function saveMatchResult(userId, jobId, resumeId, analysis) {
  try {
    const matchScore = await MatchScore.findOneAndUpdate(
      { user_id: userId, job_id: jobId },
      {
        user_id: userId,
        job_id: jobId,
        resume_id: resumeId,
        ...analysis,
      },
      { upsert: true, new: true }
    );
    return matchScore;
  } catch (error) {
    console.error('Save match score error:', error.message);
    throw error;
  }
}

/**
 * Full job matching pipeline
 */
export async function runFullMatch(userId, jobId, resumeId, resumeData, jobData) {
  const analysis = await analyzeJobMatchAI(resumeData, jobData);
  const saved = await saveMatchResult(userId, jobId, resumeId, analysis);
  return saved;
}

export default { analyzeJobMatchAI, saveMatchResult, runFullMatch, extractSkills, calculateKeywordMatch };
