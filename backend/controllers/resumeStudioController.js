import mongoose from 'mongoose';
import ResumeSession from '../models/ResumeSession.js';
import { extractTextFromPdf as extractText } from '../services/resumeParserService.js';
import { parseResumeText, askAI } from '../services/aiService.js';
import {
  runSemanticATSAnalysis,
  optimizeFullResume,
  generateResumeVersions,
  optimizeSection,
  generateCoverLetter,
  getDeepSeekStream
} from '../services/claudeService.js';
import { compileHTMLPDF, uploadPDFToGridFS, downloadPDFFromGridFS } from '../services/pdfService.js';

/**
 * Upload & Parse base resume
 */
export async function uploadResumeSession(req, res, next) {
  try {
    const { title } = req.body;
    let rawText = req.body.originalText || '';

    if (req.file) {
      rawText = await extractText(req.file.buffer);
    }

    if (!rawText || rawText.trim() === '') {
      res.status(400);
      throw new Error('Please provide resume text or a PDF file');
    }

    // Call DeepSeek to parse to structured JSON
    const parsedJSON = await parseResumeText(rawText);

    const session = await ResumeSession.create({
      user_id: req.user._id,
      originalResume: {
        rawText,
        parsedJSON,
        uploadedAt: new Date()
      }
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

/**
 * Run Semantic ATS analysis
 */
export async function analyzeResumeATS(req, res, next) {
  try {
    const { sessionId, jobDescription, companyName, roleTitle } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    const analysis = await runSemanticATSAnalysis(session.originalResume.parsedJSON, jobDescription);

    session.jobDescription = {
      rawText: jobDescription,
      parsedKeywords: analysis.missingCriticalKeywords || [],
      companyName: companyName || '',
      roleTitle: roleTitle || ''
    };

    session.atsReports.push({
      version: `ATS Report v${session.atsReports.length + 1}`,
      score: analysis.atsScore || 0,
      breakdown: analysis.breakdown || {},
      missingKeywords: analysis.missingCriticalKeywords || [],
      presentKeywords: analysis.presentKeywords || [],
      semanticMatches: analysis.semanticMatches || [],
      suggestions: analysis.topRecommendations || [],
      generatedAt: new Date()
    });

    await session.save();
    res.json({ session, analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * Optimize Full Resume
 */
export async function optimizeResume(req, res, next) {
  try {
    const { sessionId } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    if (!session.jobDescription?.rawText) {
      res.status(400);
      throw new Error('Please run ATS analysis with a target Job Description first.');
    }

    const optimizedContent = await optimizeFullResume(session.originalResume.parsedJSON, session.jobDescription.rawText);

    session.resumeVersions.push({
      versionName: `Auto-Optimized v${session.resumeVersions.length + 1}`,
      strategy: 'A',
      content: optimizedContent,
      atsScore: session.atsReports[session.atsReports.length - 1]?.score || 85,
      claudeReasoning: 'DeepSeek complete alignment and ATS optimization using power verbs.',
      createdAt: new Date()
    });

    await session.save();
    res.json({ session, optimized: optimizedContent });
  } catch (error) {
    next(error);
  }
}

/**
 * Single section rewrite
 */
export async function optimizeResumeSection(req, res, next) {
  try {
    const { sessionId, sectionName, sectionContent } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    if (!session.jobDescription?.rawText) {
      res.status(400);
      throw new Error('Job description is required on this session before optimizing.');
    }

    const result = await optimizeSection(sectionName, sectionContent, session.jobDescription.rawText);

    session.optimizationHistory.push({
      section: sectionName,
      originalContent: typeof sectionContent === 'object' ? JSON.stringify(sectionContent) : sectionContent,
      optimizedContent: result.optimizedContent,
      improvement: result.improvementExplanation,
      timestamp: new Date()
    });

    await session.save();
    res.json({ session, optimizedSection: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate 3 strategic versions
 */
export async function generateVersions(req, res, next) {
  try {
    const { sessionId } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    if (!session.jobDescription?.rawText) {
      res.status(400);
      throw new Error('Please run ATS analysis with a target Job Description first.');
    }

    const versionsResult = await generateResumeVersions(session.originalResume.parsedJSON, session.jobDescription.rawText);

    session.resumeVersions = []; // Reset or push
    for (const v of versionsResult.versions) {
      session.resumeVersions.push({
        versionName: v.versionName,
        strategy: v.strategy,
        content: v.content,
        atsScore: v.atsScore || 80,
        claudeReasoning: v.claudeReasoning,
        createdAt: new Date()
      });
    }

    await session.save();
    res.json(session.resumeVersions);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch all versions
 */
export async function getVersions(req, res, next) {
  try {
    const session = await ResumeSession.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }
    res.json(session.resumeVersions);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate Puppeteer (Playwright) PDF
 */
export async function generatePDF(req, res, next) {
  try {
    const { sessionId, resumeData, templateName } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    // Compile A4 PDF Buffer
    const pdfBuffer = await compileHTMLPDF(resumeData, templateName);
    
    // Upload to GridFS
    const filename = `${resumeData.fullName || 'Resume'}_${templateName}.pdf`;
    const gridfsId = await uploadPDFToGridFS(pdfBuffer, filename);

    session.generatedPDFs.push({
      templateName,
      fileUrl: `/api/resume/pdf/${gridfsId}/download`,
      gridfsId,
      atsScore: req.body.atsScore || 80,
      createdAt: new Date()
    });

    await session.save();
    res.status(201).json({ success: true, pdfId: gridfsId, fileUrl: `/api/resume/pdf/${gridfsId}/download` });
  } catch (error) {
    next(error);
  }
}

/**
 * Stream PDF download from GridFS
 */
export async function downloadPDF(req, res, next) {
  try {
    const { id } = req.params;
    await downloadPDFFromGridFS(id, res);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user session history
 */
export async function getSessions(req, res, next) {
  try {
    const sessions = await ResumeSession.find({ user_id: req.user._id }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
}

/**
 * Cover Letter generation
 */
export async function createCoverLetter(req, res, next) {
  try {
    const { sessionId } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }

    if (!session.jobDescription?.rawText) {
      res.status(400);
      throw new Error('Job description required before generating cover letter.');
    }

    const coverLetter = await generateCoverLetter(session.originalResume.parsedJSON, session.jobDescription.rawText);
    res.json(coverLetter);
  } catch (error) {
    next(error);
  }
}

/**
 * Streaming optimization (Server-Sent Events)
 */
export async function optimizeSectionStream(req, res, next) {
  try {
    const { sessionId, sectionName, sectionContent } = req.body;

    const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `You are a professional resume strategist. Write a highly compelling rewrite for the following resume section: "${sectionName}".
    Return plain text optimized formatting. Do NOT wrap in JSON. Use strong action verbs and clean bullets.`;
    const userPrompt = `ORIGINAL CONTENT:\n${sectionContent}\n\nTARGET JOB DESCRIPTION:\n${session.jobDescription.rawText}`;

    const stream = await getDeepSeekStream(systemPrompt, userPrompt);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Extract content from DeepSeek server-sent chunk lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          if (line.includes('[DONE]')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          } catch (err) {
            // ignore JSON parse errors for incomplete streaming structures
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('SSE streaming error:', error);
    res.end();
  }
}

/**
 * Delete a resume session
 */
export async function deleteSession(req, res, next) {
  try {
    const session = await ResumeSession.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Resume Session not found');
    }
    res.json({ success: true, message: 'Resume Session deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Chat-based Resume Optimization / Parsing
 */
export async function chatOptimizeResume(req, res, next) {
  try {
    const { prompt, sessionId } = req.body;
    let rawText = '';
    let baseResume = null;
    let session = null;

    if (req.file) {
      rawText = await extractText(req.file.buffer);
    }

    if (sessionId) {
      session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
      if (session) {
        baseResume = req.body.currentResume || session.originalResume?.parsedJSON;
      }
    }

    const systemPrompt = `You are CareerOS Co-Pilot, an elite executive resume coach.
You help candidates edit, write, parse, and optimize their resume.
You MUST respond with a JSON object containing EXACTLY two fields:
1. "reply": A friendly, helpful conversational chatbot response in markdown (2-3 paragraphs max) explaining the changes you made, professional tips, and guidance.
2. "updatedResume": The complete updated resume JSON object reflecting the edits or parsing requested by the user.

CRITICAL INSTRUCTIONS FOR "updatedResume":
- ZERO INFORMATION LOSS: Do NOT omit, summarize, aggregate, or truncate any work experiences, roles, projects, schools, degrees, certifications, or skills from the uploaded PDF text or current resume state.
- EXHAUSTIVE TRANSCRIPTION: Extract and include every single bullet point, job role, project details, school, dates, and technology details. Never replace items with placeholders, "etc.", or generic summaries.
- If the user asks for optimization/rewriting, enhance and improve the style and impact of the bullet points using strong action verbs, but keep every single role, project, and key detail intact.
- Ensure contact details (email, phone, location, linkedin, github) are fully populated if present in the source text.

Ensure the "updatedResume" adheres perfectly to the following structured resume schema:
{
  "fullName": "Name",
  "title": "Title",
  "email": "Email",
  "phone": "Phone",
  "location": "Location",
  "linkedin": "LinkedIn link",
  "github": "GitHub link",
  "summary": "Summary text",
  "experience": [
    { "position": "Title", "company": "Company", "startDate": "Start Date", "endDate": "End Date or Present", "description": "Bullet points separated by newlines" }
  ],
  "projects": [
    { "name": "Project Name", "description": "Bullet points describing project goal/scope separated by newlines", "technologies": ["Tech1", "Tech2"], "link": "Optional project link" }
  ],
  "skills": [
    { "category": "Category name (e.g., Languages, Frameworks, Cloud & DevOps)", "items": ["Skill1", "Skill2"] }
  ],
  "education": [
    { "school": "School Name", "degree": "Degree/Major", "graduationDate": "Date" }
  ]
}

Return ONLY the raw JSON object. Do not wrap in markdown code blocks.`;

    let userPrompt = '';
    if (rawText) {
      userPrompt = `USER UPLOADED PDF RESUME TEXT:\n${rawText}\n\nUSER PROMPT/INSTRUCTION:\n${prompt || 'Parse this resume and optimize it.'}`;
    } else if (baseResume) {
      userPrompt = `CURRENT RESUME STATE:\n${JSON.stringify(baseResume, null, 2)}\n\nUSER PROMPT/INSTRUCTION:\n${prompt}\n\nTARGET JOB DESCRIPTION (IF ANY):\n${session?.jobDescription?.rawText || ''}`;
    } else {
      res.status(400);
      throw new Error('Please upload a PDF resume or provide an active session resume.');
    }

    // Call askAI to execute
    const result = await askAI(systemPrompt, userPrompt, true);

    // If a new session was created (i.e. uploaded PDF via chat)
    if (rawText && !sessionId) {
      session = await ResumeSession.create({
        user_id: req.user._id,
        originalResume: {
          rawText,
          parsedJSON: result.updatedResume,
          uploadedAt: new Date()
        }
      });
    } else if (session) {
      session.optimizationHistory.push({
        section: 'AI Chat Command',
        originalContent: JSON.stringify(baseResume?.summary || 'Prior Version'),
        optimizedContent: JSON.stringify(result.updatedResume),
        improvement: `User prompt: "${prompt}"`,
        timestamp: new Date()
      });
      await session.save();
    }

    res.json({
      session,
      reply: result.reply,
      updatedResume: result.updatedResume
    });

  } catch (error) {
    next(error);
  }
}
