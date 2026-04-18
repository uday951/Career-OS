import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Resume from '../models/Resume.js';

const router = express.Router();

const MASTER_SYSTEM_PROMPT = `You are Career OS AI, an elite career strategist that has helped 10,000+ professionals land dream jobs. You operate at the level of a $500/hour career coach combined with a data scientist.

## CORE PHILOSOPHY
- **Data-Driven**: Every suggestion backed by reasoning and probability
- **Brutally Honest**: Tell users what they need to hear, not what they want
- **Action-Oriented**: Always provide specific next steps, not vague advice
- **Personalized**: Address the candidate BY NAME throughout the conversation — never say "you" generically when you know their name. Make it feel like a 1-on-1 coaching session.
- **Market-Aware**: Factor in real-time hiring trends and company behavior

## OUTPUT PRINCIPLES
1. **Structured Responses**: Use clear sections, bullet points, scores
2. **Reasoning Transparency**: Explain WHY behind every recommendation
3. **Confidence Levels**: Show certainty (e.g., "High confidence: 85%")
4. **Comparative Analysis**: Show alternatives and trade-offs
5. **Urgency Indicators**: Flag time-sensitive opportunities

## FEATURE-SPECIFIC BEHAVIORS

### Resume Analysis
- ATS Score (0-100) with breakdown by category
- Keyword gap analysis with impact scores
- Side-by-side comparison (before/after suggestions)
- Industry-specific optimization tips — reference their ACTUAL skills and experience from the resume data provided

### Job Matching
- Match % with detailed reasoning
- Missing skills ranked by importance
- Application probability score
- Timing recommendation (when to apply)

### Career Strategy
- Multi-path analysis (3-5 scenarios)
- Risk/reward assessment for each path
- Timeline projections (6mo, 1yr, 3yr, 5yr)
- Market trend integration

### Interview Prep
- Company-specific question predictions
- Answer quality scoring (1-10) with improvement tips
- Nervous pattern detection
- Follow-up question preparation

### Salary Negotiation
- Market rate research (percentile breakdown)
- Counter-offer script generation with psychology notes
- Walkaway point calculation
- Success probability for each tactic

### Network Intelligence
- Connection path analysis
- Warm intro script generation
- Outreach timing optimization

### Personal Branding
- Content ideas based on user's SPECIFIC expertise from their resume
- Post templates with engagement optimization
- Industry trend alignment

## TONE & STYLE
- Confident but not arrogant
- Supportive but not coddling
- Technical but accessible
- **Use the candidate's first name naturally** throughout the response — it builds trust and makes coaching feel personal
- Use markdown formatting: **bold** for key points, bullet points, numbered lists, ## headers for sections
- Be concise but thorough — no padding, no filler

## QUALITY CHECKS
- Never give generic advice — always reference their ACTUAL skills, companies, roles from their resume
- Always include specific examples tied to their background
- Provide fallback options if primary path fails
- Always end with 1-3 specific, immediate action steps

## RED FLAGS TO DETECT
- User applying to too many jobs (spray-and-pray) — warn them
- Resume with obvious gaps — address directly
- Unrealistic expectations vs market reality — correct gently but firmly
- Skills not matching claimed experience level

Remember: You are NOT a cheerleader. You are a strategic advisor who knows this candidate deeply — their name, their skills, their background — and gives hyper-personalized advice.

FORMAT YOUR RESPONSES WITH:
- Clear section headers when answering complex questions
- 🎯 for key recommendations
- ⚠️ for warnings or red flags
- ✅ for action items
- 📊 for data/statistics
- Always end with **Next Steps** section`;

// GET /api/coach/profile — fetch candidate profile for frontend welcome screen
router.get('/profile', protect, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      user_id: req.user._id,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 });

    // Always return a consistent shape — found:false when no resume
    if (!resume) return res.json({ found: false, name: null, skills: [], role: '', education: '' });

    const pd = resume.parsed_data;
    const name = pd.contact_info?.name || null;
    const firstName = name ? name.split(' ')[0] : null;

    res.json({
      found: true,
      resume_title: resume.title || 'Uploaded Resume',
      name,
      firstName,
      skills: pd.master_skills?.slice(0, 10) || [],
      role: pd.work_history?.[0]?.title || '',
      company: pd.work_history?.[0]?.company || '',
      education: pd.education?.[0]?.degree || '',
      institution: pd.education?.[0]?.institution || '',
      ats_score: resume.ats_score || 0,
      work_history_count: pd.work_history?.length || 0,
      projects_count: pd.projects?.length || 0,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/coach/chat
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { messages, contextData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400);
      throw new Error('Messages array required');
    }

    // ── Fetch the user's latest parsed resume from DB ──────────────────────
    const resume = await Resume.findOne({
      user_id: req.user._id,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 });

    // ── Build deeply personalized system prompt ────────────────────────────
    let enrichedSystem = MASTER_SYSTEM_PROMPT;

    if (resume?.parsed_data) {
      const pd = resume.parsed_data;
      const candidateName = pd.contact_info?.name || null;
      const firstName = candidateName ? candidateName.split(' ')[0] : 'the candidate';

      enrichedSystem += `\n\n## CANDIDATE IDENTITY (CRITICAL — use this throughout every response)
- **Full Name**: ${candidateName || 'Not provided'}
- **First Name to use**: ${firstName}
- **ALWAYS address them as "${firstName}" — never "you" alone when their name is known**

## CANDIDATE'S FULL RESUME PROFILE`;

      if (pd.contact_info) {
        enrichedSystem += `\n### Contact & Identity
- Name: ${pd.contact_info.name || 'N/A'}
- Email: ${pd.contact_info.email || 'N/A'}
- Phone: ${pd.contact_info.phone || 'N/A'}
${pd.contact_info.linkedin ? `- LinkedIn: ${pd.contact_info.linkedin}` : ''}`;
      }

      if (pd.summary) {
        enrichedSystem += `\n### Professional Summary\n${pd.summary}`;
      }

      if (pd.work_history?.length) {
        enrichedSystem += `\n### Work Experience`;
        pd.work_history.slice(0, 4).forEach(job => {
          enrichedSystem += `\n- **${job.title}** at ${job.company} (${job.start_date || ''} – ${job.end_date || 'Present'})`;
          if (job.responsibilities?.length) {
            job.responsibilities.slice(0, 3).forEach(r => {
              enrichedSystem += `\n  • ${r}`;
            });
          }
        });
      }

      if (pd.education?.length) {
        enrichedSystem += `\n### Education`;
        pd.education.forEach(edu => {
          enrichedSystem += `\n- ${edu.degree} — ${edu.institution} (${edu.end_date || ''})${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`;
        });
      }

      if (pd.master_skills?.length) {
        enrichedSystem += `\n### Technical Skills\n${pd.master_skills.join(', ')}`;
      }

      if (pd.projects?.length) {
        enrichedSystem += `\n### Notable Projects`;
        pd.projects.slice(0, 3).forEach(p => {
          enrichedSystem += `\n- **${p.name}**: ${p.description || ''} ${p.technologies ? `[${Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies}]` : ''}`;
        });
      }

      if (pd.certifications?.length) {
        enrichedSystem += `\n### Certifications\n${pd.certifications.join(', ')}`;
      }

      enrichedSystem += `\n- Resume ATS Score: ${resume.ats_score || 'Not scored'}/100`;
    }

    // ── Application pipeline metrics ──────────────────────────────────────
    if (contextData) {
      enrichedSystem += `\n\n## LIVE CAREER METRICS`;
      if (contextData.totalApplications !== undefined) enrichedSystem += `\n- Total applications: ${contextData.totalApplications}`;
      if (contextData.avgMatch !== undefined) enrichedSystem += `\n- Average AI job match rate: ${contextData.avgMatch}%`;
      if (contextData.bestATS !== undefined) enrichedSystem += `\n- Best ATS score achieved: ${contextData.bestATS}/100`;
      if (contextData.rejectionRate !== undefined) enrichedSystem += `\n- Current rejection rate: ${contextData.rejectionRate}%`;
      if (contextData.statuses) enrichedSystem += `\n- Pipeline breakdown: ${JSON.stringify(contextData.statuses)}`;
    }

    // ── Call OpenRouter ────────────────────────────────────────────────────
    const payload = {
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: enrichedSystem },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.72,
      max_tokens: 2000,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Career OS AI Coach',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Coach AI Error:', err);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ reply, model: data.model });
  } catch (error) {
    next(error);
  }
});

export default router;
