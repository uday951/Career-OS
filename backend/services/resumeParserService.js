import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// No worker needed for Node.js legacy build

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPdf(buffer) {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Extract structured sections from raw resume text
 */
export function extractSections(text) {
  const sections = {
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  const lines = text.split('\n').filter(l => l.trim());
  let currentSection = 'summary';

  const sectionHeaders = [
    { pattern: /^(summary|professional\s*summary|profile|about\s*me)/i, key: 'summary' },
    { pattern: /^(skills|technical\s*skills|core\s*competencies|expertise)/i, key: 'skills' },
    { pattern: /^(experience|work\s*experience|professional\s*experience|employment|work\s*history)/i, key: 'experience' },
    { pattern: /^(education|academic|qualifications|degrees)/i, key: 'education' },
    { pattern: /^(projects|personal\s*projects|key\s*projects)/i, key: 'projects' },
    { pattern: /^(certifications|certificates|licenses)/i, key: 'certifications' },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for section headers
    let matched = false;
    for (const header of sectionHeaders) {
      if (header.pattern.test(trimmed)) {
        currentSection = header.key;
        matched = true;
        break;
      }
    }
    
    if (matched) continue;

    switch (currentSection) {
      case 'summary':
        sections.summary += (sections.summary ? ' ' : '') + trimmed;
        break;
      case 'skills':
        sections.skills.push(...trimmed.split(/[,|•\-]/).map(s => s.trim()).filter(Boolean));
        break;
      case 'experience':
        sections.experience.push(trimmed);
        break;
      case 'education':
        sections.education.push(trimmed);
        break;
      case 'projects':
        sections.projects.push(trimmed);
        break;
      case 'certifications':
        sections.certifications.push(trimmed);
        break;
    }
  }

  return sections;
}

/**
 * Extract contact info from resume text
 */
export function extractContactInfo(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  return {
    email: text.match(emailRegex)?.[0] || '',
    phone: text.match(phoneRegex)?.[0] || '',
    linkedin: text.match(linkedinRegex)?.[0] || '',
    github: text.match(githubRegex)?.[0] || '',
  };
}

/**
 * Extract years of experience from text
 */
export function extractYearsOfExperience(text) {
  const experiencePatterns = [
    /(\d+)[+]?\s*years?\s*(?:of)?\s*experience/i,
    /experience\s*(?:of)?\s*(\d+)[+]?\s*years?/i,
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  
  return 0;
}

/**
 * Full resume parsing pipeline
 */
export async function parseResume(buffer, filename) {
  const rawText = await extractTextFromPdf(buffer);
  
  return {
    raw_text: rawText,
    filename,
    sections: extractSections(rawText),
    contact: extractContactInfo(rawText),
    years_experience: extractYearsOfExperience(rawText),
    word_count: rawText.split(/\s+/).length,
    parsed_at: new Date().toISOString(),
  };
}

export default { parseResume, extractTextFromPdf, extractSections, extractContactInfo };
