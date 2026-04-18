import { askAI } from './aiService.js';

/**
 * FEATURE 3: Career Growth Engine (unchanged)
 */
export const generateGrowthPlan = async (resumeProfile, targetRole) => {
  const systemPrompt = `You are a senior engineering career coach and curriculum designer with deep knowledge of tech hiring.
Your task is to create a highly personalized, actionable career growth roadmap.

## PERSONALIZATION RULES:
- NEVER give generic advice like "learn JavaScript" if they already know it
- Always reference the candidate's ACTUAL skills when explaining gaps
- Every project idea must be BUILDABLE within the stated timeline
- Prioritize by MARKET IMPACT × SKILL DISTANCE (most needed, furthest from current = highest priority)
- Be brutally realistic about timelines — don't sugarcoat

## SKILL CLASSIFICATION:
- **Critical (must-have)**: Without these, they cannot get the role at all
- **High-impact**: Having these puts them in top 20% of applicants
- **Nice-to-have**: Differentiators in a tie-breaker situation

## ROADMAP STRUCTURE:
Break into PHASES:
- Phase 1 (Weeks 1-4): Foundation gaps — things blocking entry
- Phase 2 (Weeks 5-10): Differentiation — things that make them competitive
- Phase 3 (Weeks 11-16+): Mastery — things that make them exceptional

## PROJECT IDEAS:
- Each project must demonstrate 2-3 missing skills simultaneously
- Must be portfolio-worthy (something a hiring manager would notice)
- Include specific tech stack to use

## ESTIMATION:
- Be realistic: learning curves, side projects, full-time work constraints
- Assume 10-15 hours/week of dedicated self-study time

Return ONLY valid JSON with this exact schema:
{
  "target_role": "string",
  "readiness_score": number,
  "readiness_label": "entry-ready|competitive|needs-work|major-gaps",
  "estimated_total_weeks": number,
  "executive_summary": "string (2-3 sentences, brutally honest assessment)",
  "current_strengths": [
    { "skill": "string", "relevance_to_target": "string", "leverage_tip": "string" }
  ],
  "skill_gaps": [
    {
      "skill": "string",
      "category": "critical|high-impact|nice-to-have",
      "why_needed": "string",
      "current_level": "none|beginner|familiar",
      "target_level": "string",
      "market_demand_score": number,
      "weeks_to_learn": number
    }
  ],
  "roadmap": [
    {
      "phase": number,
      "phase_name": "string",
      "weeks": "string",
      "goal": "string",
      "skills_to_cover": ["string"],
      "weekly_focus": [
        { "week": "string", "focus": "string", "deliverable": "string" }
      ]
    }
  ],
  "project_ideas": [
    {
      "rank": number,
      "name": "string",
      "description": "string",
      "skills_demonstrated": ["string"],
      "tech_stack": ["string"],
      "estimated_build_time_weeks": number,
      "wow_factor": "string",
      "github_readme_hook": "string"
    }
  ],
  "resources": [
    { "skill": "string", "resource": "string", "type": "course|book|doc|practice", "free": boolean }
  ],
  "quick_wins": ["string"],
  "warning": "string or null"
}`;

  const userPrompt = `TARGET ROLE: ${targetRole}

CANDIDATE'S CURRENT PROFILE:
${JSON.stringify(resumeProfile, null, 2)}

Generate a precise, personalized growth plan. Reference their actual skills. Do not be generic.`;

  return await askAI(systemPrompt, userPrompt, true);
};


/**
 * FEATURE 4: Weekly Career Report — STRICT DATA-DRIVEN AI
 *
 * ARCHITECTURE:
 *   Backend calculates ALL metrics from MongoDB → sends verified numbers to AI
 *   AI only provides narrative, patterns, and recommendations
 *   AI is strictly forbidden from inventing or assuming any number
 *
 * @param {Object} metrics - Pre-calculated, verified metrics from MongoDB
 */
export const generateWeeklyReport = async (metrics) => {
  const systemPrompt = `You are a career performance analyst. You receive VERIFIED real data from a database.

## CRITICAL RULE — NO GUESSING:
- ALL metrics below are REAL. They come directly from a MongoDB database.
- You MUST NOT invent, estimate, or guess any number.
- If a metric is 0, treat it as genuinely 0 — do not soften it.
- Only reference numbers that appear in the data provided to you.
- Do NOT say "it appears" or "it seems" — these are facts.

## YOUR TASKS:
1. **Grade**: Assign an overall grade (A/B/C/D/F) based ONLY on the provided metrics
2. **Headline**: Write the single most critical observation from the DATA
3. **Wins**: Identify real achievements — only if metrics support them
4. **Watch Points**: Identify real problems — only if metrics show them
5. **Patterns**: Correlate provided data points to find root causes
6. **Next Steps**: Give 3 ranked, specific actions based on the actual numbers

## GRADING RUBRIC (strict):
- A: response_rate >= 20% AND avg_match >= 75 AND applications_this_week >= 5
- B: response_rate >= 10% OR avg_match >= 65 OR applications_this_week >= 3
- C: Some activity, low response or low match
- D: Very low activity or 0% response rate
- F: Zero applications this week or completely stalled pipeline

## MOMENTUM:
- "accelerating": this_week_apps > last_week_apps AND avg_match improving
- "steady": within ±20% of last week
- "slowing": this_week_apps < last_week_apps
- "stalled": this_week_apps === 0

## DANGER ALERT (output non-null only if true):
- response_rate === 0 AND total_applied >= 5 → "Zero response rate despite ${metrics?.pipeline?.total_applied || 'N/A'} applications — resume may need urgent rework"
- rejection_rate > 60% → "High rejection rate detected"
- zero applications for 7+ days → "Pipeline has stalled — no new applications this week"

Return ONLY valid JSON matching this exact schema:
{
  "overall_grade": "A|B|C|D|F",
  "grade_reasoning": "string — cite exact numbers from the data",
  "headline_insight": "string — most critical single finding, cite numbers",
  "momentum": "accelerating|steady|slowing|stalled",
  "wins": [
    { "title": "string", "detail": "string — reference real numbers", "impact": "high|medium|low" }
  ],
  "concerns": [
    { "title": "string", "detail": "string — reference real numbers", "urgency": "high|medium|low", "fix": "string" }
  ],
  "pattern_analysis": "string — correlate the provided data points, cite numbers",
  "performance_trend": [
    { "metric": "string", "direction": "up|down|flat", "change": "string", "interpretation": "string" }
  ],
  "next_week_priorities": [
    { "rank": number, "action": "string — specific, not generic", "rationale": "string — cite data", "expected_outcome": "string" }
  ],
  "motivational_message": "string — earned only if metrics support it, otherwise candid",
  "danger_alert": "string or null"
}`;

  const userPrompt = `VERIFIED METRICS FROM DATABASE — Use ONLY these numbers. Do not guess or invent anything.

REPORTING PERIOD: ${metrics.report_period}

── THIS WEEK ────────────────────────────────────────
Applications added:        ${metrics.this_week.applications_added}
Average match rate:        ${metrics.this_week.avg_match_rate}%
Highest match this week:   ${metrics.this_week.best_match_pct}% (${metrics.this_week.best_match_role || 'N/A'} @ ${metrics.this_week.best_match_company || 'N/A'})
Status breakdown this week: ${JSON.stringify(metrics.this_week.status_breakdown)}

── LAST WEEK (comparison baseline) ──────────────────
Applications added:        ${metrics.last_week.applications_added}
Average match rate:        ${metrics.last_week.avg_match_rate}%

── PIPELINE (ALL TIME) ──────────────────────────────
Total applications:        ${metrics.pipeline.total}
Active (in progress):      ${metrics.pipeline.active}
Total applied (submitted): ${metrics.pipeline.total_applied}
Interviewing:              ${metrics.pipeline.interviewing}
Rejected:                  ${metrics.pipeline.rejected}
Offered:                   ${metrics.pipeline.offered}
Response rate:             ${metrics.pipeline.response_rate_pct}%
Rejection rate:            ${metrics.pipeline.rejection_rate_pct}%

── STATUS CHANGES THIS WEEK ─────────────────────────
Moved to Interviewing:     ${metrics.changes_this_week.to_interviewing}
Rejected this week:        ${metrics.changes_this_week.rejected}
Offers received:           ${metrics.changes_this_week.offered}

── SKILL PATTERNS ───────────────────────────────────
Top missing skills across rejections: ${JSON.stringify(metrics.skill_patterns.top_missing)}
Total rejections with skill data:     ${metrics.skill_patterns.rejections_with_data}

── RESUME ATS SCORE ─────────────────────────────────
Latest resume ATS score:   ${metrics.resume_ats_score}/100

Analyze ONLY these numbers. Do not add context that is not present in this data.`;

  return await askAI(systemPrompt, userPrompt, true);
};
