import { askAI } from './aiService.js';

/**
 * Tailor resume summary for a specific job
 */
export async function tailorSummary(resumeSummary, jobDescription) {
  const prompt = `Rewrite this professional summary to be ATS-optimized for the target job.

CURRENT SUMMARY:
${resumeSummary}

JOB DESCRIPTION:
${jobDescription}

Requirements:
- Keep it 3-4 sentences
- Naturally incorporate key keywords from the job description
- Maintain professional tone
- Focus on achievements and value
- Do NOT make up experience the candidate doesn't have

Return ONLY the rewritten summary text, no JSON, no markdown.`;

  try {
    const response = await askAI(prompt);
    return (typeof response === 'string' ? response : response.text || '').trim();
  } catch (error) {
    console.error('Tailor summary error:', error.message);
    return resumeSummary;
  }
}

/**
 * Tailor experience descriptions for a specific job
 */
export async function tailorExperience(experiences, jobDescription) {
  if (!experiences || experiences.length === 0) return [];
  
  const expText = Array.isArray(experiences) ? experiences.join('\n') : experiences;
  
  const prompt = `Rewrite these work experience bullet points to be more relevant to the target job, while keeping all facts accurate.

CURRENT EXPERIENCE:
${expText}

JOB DESCRIPTION:
${jobDescription}

Requirements:
- Rewrite bullet points to emphasize skills mentioned in the job description
- Use strong action verbs
- Include quantified achievements where possible
- Keep it truthful - don't fabricate experience
- Optimize for ATS keyword scanning
- Maximum 6 bullet points per role

Return ONLY the rewritten experience as a JSON array of strings (no markdown, no code blocks):
["Rewritten bullet 1", "Rewritten bullet 2"]`;

  try {
    const response = await askAI(prompt);
    const text = typeof response === 'string' ? response : response.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Tailor experience error:', error.message);
    return Array.isArray(experiences) ? experiences : [experiences];
  }
}

/**
 * Tailor skills list to highlight relevant ones
 */
export function tailorSkills(skills, jobDescription) {
  if (!skills || skills.length === 0) return [];
  
  const jdLower = jobDescription.toLowerCase();
  
  // Sort skills: relevant ones first, then others
  const scored = skills.map(skill => ({
    skill,
    score: jdLower.includes(skill.toLowerCase()) ? 1 : 0,
  }));
  
  return scored.sort((a, b) => b.score - a.score).map(s => s.skill);
}

/**
 * Full resume tailoring pipeline
 */
export async function tailorFullResume(resumeData, jobDescription) {
  const result = { ...resumeData };
  
  if (resumeData.sections?.summary || resumeData.summary) {
    const summary = resumeData.sections?.summary || resumeData.summary;
    result.tailored_summary = await tailorSummary(summary, jobDescription);
  }
  
  if (resumeData.sections?.experience && resumeData.sections.experience.length > 0) {
    result.tailored_experience = await tailorExperience(resumeData.sections.experience, jobDescription);
  }
  
  if (resumeData.sections?.skills && resumeData.sections.skills.length > 0) {
    result.tailored_skills = tailorSkills(resumeData.sections.skills, jobDescription);
  }
  
  result.tailored_at = new Date().toISOString();
  
  return result;
}

export default { tailorFullResume, tailorSummary, tailorExperience, tailorSkills };
