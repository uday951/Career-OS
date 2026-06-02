import { askAI } from './aiService.js';

/**
 * Generate a personalized cover letter
 */
export async function generateCoverLetter({
  companyName,
  jobTitle,
  hiringManager = 'Hiring Manager',
  resumeSummary,
  jobDescription,
  userName = 'Applicant',
  tone = 'professional', // professional, enthusiastic, concise
}) {
  const toneGuide = {
    professional: 'Maintain a formal, professional tone.'
      + ' Be confident but not arrogant. Focus on qualifications.',
    enthusiastic: 'Show genuine enthusiasm for the role and company.'
      + ' Be warm and engaging while staying professional.',
    concise: 'Be direct and to the point. Maximum 3 short paragraphs.'
      + ' Focus on key qualifications only.',
  };

  const prompt = `Write a personalized cover letter for a job application.

COMPANY: ${companyName}
JOB TITLE: ${jobTitle}
HIRING MANAGER: ${hiringManager}
APPLICANT NAME: ${userName}

RESUME SUMMARY:
${resumeSummary || 'Experienced professional with relevant qualifications.'}

JOB DESCRIPTION:
${jobDescription || 'Not provided'}

TONE GUIDELINES:
${toneGuide[tone] || toneGuide.professional}

Requirements:
- Do NOT use placeholders like [Your Name] or [Company Name]
- Reference specific skills from the resume that match the job
- Show understanding of the company's needs
- Include a call to action
- Keep it to 3-4 paragraphs
- No markdown formatting

Return ONLY the cover letter text, no JSON, no markdown, no extra commentary.`;

  try {
    const response = await askAI(prompt);
    const text = typeof response === 'string' ? response : response.text || '';
    return text.trim();
  } catch (error) {
    console.error('Cover letter generation error:', error.message);
    return `Dear ${hiringManager},

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my background and qualifications, I believe I would be a valuable addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my skills align with the needs of ${companyName}.

Thank you for your time and consideration.

Best regards,
${userName}`;
  }
}

/**
 * Generate multiple cover letter variations
 */
export async function generateCoverLetterVariations(params, count = 3) {
  const variations = [];
  const tones = ['professional', 'enthusiastic', 'concise'];
  
  for (let i = 0; i < Math.min(count, tones.length); i++) {
    const letter = await generateCoverLetter({ ...params, tone: tones[i] });
    variations.push({ tone: tones[i], content: letter });
  }
  
  return variations;
}

export default { generateCoverLetter, generateCoverLetterVariations };
