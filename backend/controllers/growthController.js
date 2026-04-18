import Resume from '../models/Resume.js';
import Application from '../models/Application.js';
import { generateGrowthPlan, generateWeeklyReport } from '../services/growthService.js';

// ─────────────────────────────────────────────────────────────────────────────
// PURE METRICS CALCULATOR
// All numbers come from MongoDB. No AI involved in any calculation.
// ─────────────────────────────────────────────────────────────────────────────
const computeMetrics = (allApps, now) => {
  const MS_PER_DAY = 86400000;
  const weekAgo     = new Date(now - 7  * MS_PER_DAY);
  const twoWeeksAgo = new Date(now - 14 * MS_PER_DAY);

  // ── Partition by creation date ────────────────────────────────────────────
  const thisWeekApps = allApps.filter(a => new Date(a.createdAt) >= weekAgo);
  const lastWeekApps = allApps.filter(a =>
    new Date(a.createdAt) >= twoWeeksAgo && new Date(a.createdAt) < weekAgo
  );

  // ── Applications updated this week (status changes on older apps) ─────────
  const statusChangedThisWeek = allApps.filter(
    a => new Date(a.updatedAt) >= weekAgo && new Date(a.createdAt) < weekAgo
  );

  // ── Average match rate helper ─────────────────────────────────────────────
  const avgMatch = (apps) => {
    const withScore = apps.filter(a => (a.match_analysis?.match_percentage || 0) > 0);
    if (!withScore.length) return 0;
    const sum = withScore.reduce((s, a) => s + a.match_analysis.match_percentage, 0);
    return Math.round(sum / withScore.length);
  };

  // ── This week's best match ────────────────────────────────────────────────
  const bestThisWeek = thisWeekApps.reduce((best, a) => {
    const pct = a.match_analysis?.match_percentage || 0;
    return pct > (best?.match_analysis?.match_percentage || 0) ? a : best;
  }, null);

  // ── This week status breakdown ────────────────────────────────────────────
  const thisWeekByStatus = thisWeekApps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // ── All-time pipeline counts ──────────────────────────────────────────────
  const counts = { SAVED: 0, APPLYING: 0, APPLIED: 0, INTERVIEWING: 0, REJECTED: 0, OFFERED: 0 };
  allApps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  const totalApplied = counts.APPLIED + counts.INTERVIEWING + counts.OFFERED + counts.REJECTED;
  const gotResponse  = counts.INTERVIEWING + counts.OFFERED;
  const responseRate = totalApplied > 0 ? Math.round((gotResponse  / totalApplied) * 100) : 0;
  const rejectRate   = totalApplied > 0 ? Math.round((counts.REJECTED / totalApplied) * 100) : 0;
  const activePipeline = counts.SAVED + counts.APPLYING + counts.APPLIED + counts.INTERVIEWING;

  // ── Status changes this week ──────────────────────────────────────────────
  const changesThisWeek = {
    to_interviewing: statusChangedThisWeek.filter(a => a.status === 'INTERVIEWING').length,
    rejected:        statusChangedThisWeek.filter(a => a.status === 'REJECTED').length,
    offered:         statusChangedThisWeek.filter(a => a.status === 'OFFERED').length,
  };

  // ── Skill pattern analysis ────────────────────────────────────────────────
  const rejectedWithSkillData = allApps.filter(
    a => a.status === 'REJECTED' && a.match_analysis?.missing_skills?.length
  );
  const skillFreq = {};
  rejectedWithSkillData.forEach(a => {
    a.match_analysis.missing_skills.forEach(skill => {
      skillFreq[skill] = (skillFreq[skill] || 0) + 1;
    });
  });
  const topMissingSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, times_missing: count }));

  // ── Return clean, flat metrics object ─────────────────────────────────────
  return {
    report_period: `${weekAgo.toLocaleDateString()} – ${now.toLocaleDateString()}`,

    this_week: {
      applications_added: thisWeekApps.length,
      avg_match_rate:     avgMatch(thisWeekApps),
      best_match_pct:     bestThisWeek?.match_analysis?.match_percentage || 0,
      best_match_role:    bestThisWeek?.job_id?.title    || null,
      best_match_company: bestThisWeek?.job_id?.company  || null,
      status_breakdown:   thisWeekByStatus,
    },

    last_week: {
      applications_added: lastWeekApps.length,
      avg_match_rate:     avgMatch(lastWeekApps),
    },

    pipeline: {
      total:              allApps.length,
      active:             activePipeline,
      total_applied:      totalApplied,
      interviewing:       counts.INTERVIEWING,
      rejected:           counts.REJECTED,
      offered:            counts.OFFERED,
      response_rate_pct:  responseRate,
      rejection_rate_pct: rejectRate,
      status_counts:      counts,
    },

    changes_this_week: changesThisWeek,

    skill_patterns: {
      top_missing:           topMissingSkills,
      rejections_with_data:  rejectedWithSkillData.length,
    },

    resume_ats_score: 0, // filled by controller after resume query
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: Career Growth Engine
// POST /api/growth/plan
// ─────────────────────────────────────────────────────────────────────────────
export const growthPlan = async (req, res, next) => {
  try {
    const { targetRole, resumeId } = req.body;

    if (!targetRole?.trim()) {
      res.status(400);
      throw new Error('targetRole is required.');
    }

    const q = resumeId
      ? { _id: resumeId, user_id: req.user._id }
      : { user_id: req.user._id, parsed_data: { $ne: null } };

    const resume = await Resume.findOne(q).sort({ updatedAt: -1 });
    if (!resume?.parsed_data) {
      res.status(404);
      throw new Error('No parsed resume found. Upload and parse a resume first.');
    }

    const plan = await generateGrowthPlan(resume.parsed_data, targetRole);

    res.json({
      ...plan,
      generated_for: targetRole,
      resume_title: resume.title,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: Weekly Career Report
// GET /api/report/weekly
// Step 1: Fetch all data from MongoDB
// Step 2: Compute all metrics (no AI yet)
// Step 3: Send verified numbers to AI for narrative only
// ─────────────────────────────────────────────────────────────────────────────
export const weeklyReport = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Step 1: Load all applications with job data ───────────────────────
    const allApps = await Application.find({ user_id: userId })
      .populate('job_id', 'title company location')
      .sort({ createdAt: -1 })
      .lean(); // lean() = plain JS objects, faster

    // ── Step 2: Calculate ALL metrics from raw DB data ────────────────────
    const metrics = computeMetrics(allApps, new Date());

    // ── Step 2b: Attach resume ATS score ──────────────────────────────────
    const latestResume = await Resume.findOne({
      user_id: userId,
      parsed_data: { $ne: null }
    }).sort({ updatedAt: -1 }).lean();
    metrics.resume_ats_score = latestResume?.ats_score || 0;

    // ── Step 3: Call AI with ONLY verified numbers ────────────────────────
    const aiReport = await generateWeeklyReport(metrics);

    // ── Step 4: Return AI narrative + raw DB metrics together ─────────────
    res.json({
      // AI-generated narrative fields
      overall_grade:         aiReport.overall_grade,
      grade_reasoning:       aiReport.grade_reasoning,
      headline_insight:      aiReport.headline_insight,
      momentum:              aiReport.momentum,
      wins:                  aiReport.wins,
      concerns:              aiReport.concerns,
      pattern_analysis:      aiReport.pattern_analysis,
      performance_trend:     aiReport.performance_trend,
      next_week_priorities:  aiReport.next_week_priorities,
      motivational_message:  aiReport.motivational_message,
      danger_alert:          aiReport.danger_alert,

      // Raw database metrics (frontend can display independently)
      metrics_summary: {
        applications_this_week:   metrics.this_week.applications_added,
        applications_last_week:   metrics.last_week.applications_added,
        avg_match_rate_this_week: metrics.this_week.avg_match_rate,
        avg_match_rate_last_week: metrics.last_week.avg_match_rate,
        active_pipeline:          metrics.pipeline.active,
        response_rate_pct:        metrics.pipeline.response_rate_pct,
        rejection_rate_pct:       metrics.pipeline.rejection_rate_pct,
        status_changes:           metrics.changes_this_week,
        top_missing_skills:       metrics.skill_patterns.top_missing,
        ats_score:                metrics.resume_ats_score,
      },

      report_period: metrics.report_period,
      generated_at:  new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// BONUS: GET /api/report/metrics — raw metrics without AI (instant)
// Useful for dashboard widgets that don't need narrative
// ─────────────────────────────────────────────────────────────────────────────
export const rawMetrics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const allApps = await Application.find({ user_id: userId })
      .populate('job_id', 'title company')
      .lean();

    const metrics = computeMetrics(allApps, new Date());

    const latestResume = await Resume.findOne({ user_id: userId, parsed_data: { $ne: null } })
      .sort({ updatedAt: -1 }).lean();
    metrics.resume_ats_score = latestResume?.ats_score || 0;

    res.json(metrics);
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// BONUS: PATCH /api/application/:id/status — manual status update
// ─────────────────────────────────────────────────────────────────────────────
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const VALID_STATUSES = ['SAVED', 'APPLYING', 'APPLIED', 'INTERVIEWING', 'REJECTED', 'OFFERED'];
    if (!VALID_STATUSES.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const application = await Application.findOne({ _id: id, user_id: req.user._id });
    if (!application) {
      res.status(404);
      throw new Error('Application not found or access denied.');
    }

    const prevStatus = application.status;
    application.status = status;
    if (notes) application.rejection_feedback = notes;
    if (status === 'APPLIED' && !application.applied_on) {
      application.applied_on = new Date();
    }
    await application.save();

    res.json({
      success: true,
      application_id: id,
      previous_status: prevStatus,
      new_status: status,
      updated_at: application.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};
