import React, { useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import {
  TrendingUp, Loader2, Target, Clock, Zap, BookOpen, Code2,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Star,
  ArrowRight, Layers, Lightbulb, Link2, ExternalLink
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const READINESS_CONFIG = {
  'entry-ready':  { label: 'Entry Ready',   color: 'text-success', bg: 'bg-success/10 border-success/30',  barColor: '#10B981' },
  'competitive':  { label: 'Competitive',   color: 'text-info',    bg: 'bg-info/10 border-info/30',        barColor: '#3B82F6' },
  'needs-work':   { label: 'Needs Work',    color: 'text-warning', bg: 'bg-warning/10 border-warning/30',  barColor: '#F59E0B' },
  'major-gaps':   { label: 'Major Gaps',    color: 'text-danger',  bg: 'bg-danger/10 border-danger/30',    barColor: '#EF4444' },
};

const GAP_CAT_CONFIG = {
  'critical':     { label: 'Critical',      cls: 'badge-danger',   icon: '🔴' },
  'high-impact':  { label: 'High Impact',   cls: 'badge-warning',  icon: '🟡' },
  'nice-to-have': { label: 'Nice to Have',  cls: 'badge-neutral',  icon: '🟢' },
};

const RESOURCE_ICONS = { course: '🎓', book: '📚', doc: '📄', practice: '💻' };

// ─── Readiness Ring ───────────────────────────────────────────────────────────
function ReadinessRing({ score, label, barColor }) {
  const r = 58, circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 136 136">
          <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={barColor} strokeWidth="12"
            strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color: barColor }}>{score}</span>
          <span className="text-2xs text-textMuted font-semibold">/ 100</span>
        </div>
      </div>
      <div className="text-sm font-bold text-textMuted mt-2">{label}</div>
    </div>
  );
}

// ─── Phase Timeline ───────────────────────────────────────────────────────────
function PhaseCard({ phase, isLast }) {
  const [open, setOpen] = useState(phase.phase === 1);
  const colors = ['from-primary/30 to-violet-600/20', 'from-accent/30 to-blue-600/20', 'from-success/30 to-emerald-600/20'];
  const dotColors = ['#7C3AED', '#06B6D4', '#10B981'];

  return (
    <div className="relative flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: dotColors[phase.phase - 1] || dotColors[2] }}>
          {phase.phase}
        </div>
        {!isLast && <div className="w-px flex-1 mt-2 min-h-8" style={{ background: `${dotColors[phase.phase - 1]}40` }} />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <button onClick={() => setOpen(v => !v)}
          className="w-full text-left glass-elevated rounded-2xl p-5 hover:bg-white/[0.05] transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{phase.weeks}</span>
              </div>
              <h3 className="text-base font-bold text-textMain">{phase.phase_name}</h3>
              <p className="text-sm text-textMuted mt-1">{phase.goal}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                {phase.skills_to_cover?.slice(0, 3).map(s => (
                  <span key={s} className="badge badge-neutral text-2xs">{s}</span>
                ))}
                {phase.skills_to_cover?.length > 3 && (
                  <span className="badge badge-neutral text-2xs">+{phase.skills_to_cover.length - 3}</span>
                )}
              </div>
              {open ? <ChevronUp size={16} className="text-textMuted" /> : <ChevronDown size={16} className="text-textMuted" />}
            </div>
          </div>
        </button>

        {/* Week-by-week breakdown */}
        {open && phase.weekly_focus?.length > 0 && (
          <div className="mt-3 space-y-2 pl-1 animate-fade-up">
            {phase.weekly_focus.map((w, i) => (
              <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-14 shrink-0">
                  <span className="text-2xs font-bold text-textMuted">{w.week}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-textMain">{w.focus}</p>
                  {w.deliverable && (
                    <p className="text-xs text-accent mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {w.deliverable}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Project Idea Card ────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">
            #{project.rank}
          </span>
          <h4 className="font-bold text-textMain text-sm">{project.name}</h4>
        </div>
        <span className="badge badge-neutral text-2xs shrink-0">{project.estimated_build_time_weeks}w build</span>
      </div>
      <p className="text-xs text-textMuted leading-relaxed">{project.description}</p>
      <div>
        <p className="text-2xs text-accent font-bold uppercase mb-1.5">✨ WOW Factor</p>
        <p className="text-xs text-textMain italic">"{project.wow_factor}"</p>
      </div>
      <div>
        <p className="text-2xs text-textMuted font-bold uppercase mb-1.5">Skills Demonstrated</p>
        <div className="flex flex-wrap gap-1">
          {project.skills_demonstrated?.map(s => <span key={s} className="badge badge-violet">{s}</span>)}
        </div>
      </div>
      <div>
        <p className="text-2xs text-textMuted font-bold uppercase mb-1.5">Stack</p>
        <div className="flex flex-wrap gap-1">
          {project.tech_stack?.map(t => <span key={t} className="badge badge-neutral font-mono">{t}</span>)}
        </div>
      </div>
      {project.github_readme_hook && (
        <div className="pt-2 border-t border-white/[0.05]">
          <p className="text-2xs text-textMuted font-bold uppercase mb-1">GitHub README Hook</p>
          <p className="text-xs font-mono text-textMuted bg-white/[0.04] rounded-lg px-3 py-2">
            "{project.github_readme_hook}"
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const POPULAR_ROLES = [
  'Senior Full Stack Developer', 'AI/ML Engineer', 'DevOps / SRE Engineer',
  'Data Scientist', 'Backend Engineer (Node.js)', 'Frontend Engineer (React)',
  'Product Manager', 'Cloud Solutions Architect',
];

export default function GrowthEngine() {
  const { token } = useStore();
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading]       = useState(false);
  const [plan, setPlan]             = useState(null);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState('roadmap');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const handleGenerate = async (role) => {
    const r = role || targetRole;
    if (!r?.trim()) return setError('Enter a target role.');
    setLoading(true);
    setPlan(null);
    setError('');
    setTargetRole(r);
    try {
      const { data } = await axios.post('http://localhost:5000/api/growth/plan', { targetRole: r }, config);
      setPlan(data);
      setActiveTab('roadmap');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate plan. Ensure you have a parsed resume.');
    } finally {
      setLoading(false);
    }
  };

  const readiness = plan ? (READINESS_CONFIG[plan.readiness_label] || READINESS_CONFIG['needs-work']) : null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-24 space-y-8">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-glow-success">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="page-title">Career Growth Engine</h1>
          </div>
          <p className="page-subtitle">AI-powered personalized roadmap from where you are to where you want to be.</p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-elevated rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
            Target Role <span className="text-danger">*</span>
          </label>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder='e.g. "Senior AI Engineer", "Staff Backend Engineer at a FAANG"'
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !targetRole.trim()}
              className="btn-primary px-7 shrink-0"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><TrendingUp size={17} /> Generate Plan</>}
            </button>
          </div>
        </div>

        {/* Quick picks */}
        <div>
          <p className="text-2xs text-textMuted uppercase tracking-wider font-semibold mb-2">Popular targets</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ROLES.map(r => (
              <button key={r} onClick={() => handleGenerate(r)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-textMuted hover:text-textMain hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-elevated rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp size={30} className="text-success" />
          </div>
          <h3 className="text-lg font-bold text-textMain mb-2">Building Your Growth Plan</h3>
          <p className="text-sm text-textMuted">Analyzing resume → Mapping skill gaps → Designing roadmap → Crafting project ideas...</p>
        </div>
      )}

      {/* Results */}
      {plan && !loading && (
        <div className="space-y-6 animate-fade-up">

          {/* Summary Bar */}
          <div className="glass-elevated rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
            <ReadinessRing
              score={plan.readiness_score}
              label={readiness?.label}
              barColor={readiness?.barColor}
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`badge ${readiness?.bg} ${readiness?.color} border text-sm px-3 py-1.5`}>
                  {readiness?.label}
                </span>
                <span className="badge badge-neutral">
                  <Clock size={11} /> ~{plan.estimated_total_weeks} weeks to goal
                </span>
                <span className="badge badge-neutral">
                  <Target size={11} /> {plan.generated_for}
                </span>
              </div>
              <p className="text-sm text-textMuted leading-relaxed">{plan.executive_summary}</p>
              {plan.warning && (
                <div className="flex items-center gap-2 bg-warning/8 border border-warning/20 rounded-xl px-3 py-2 text-xs text-warning">
                  <AlertTriangle size={12} className="shrink-0" /> {plan.warning}
                </div>
              )}
              {plan.quick_wins?.length > 0 && (
                <div>
                  <p className="text-2xs text-success font-bold uppercase mb-1.5">⚡ Quick Wins (Do This Week)</p>
                  <div className="space-y-1">
                    {plan.quick_wins.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-textMuted">
                        <CheckCircle2 size={11} className="text-success mt-0.5 shrink-0" /> {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-fit">
            {[
              { id: 'roadmap',  label: 'Roadmap',    icon: Layers    },
              { id: 'gaps',     label: 'Skill Gaps', icon: Target    },
              { id: 'projects', label: 'Projects',   icon: Code2     },
              { id: 'resources',label: 'Resources',  icon: BookOpen  },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === id ? 'bg-primary/15 text-primary border border-primary/20' : 'text-textMuted hover:text-textMain'
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-1 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-textMain">Phase-by-Phase Roadmap</h2>
                <span className="text-xs text-textMuted">{plan.roadmap?.length} phases · {plan.estimated_total_weeks} total weeks</span>
              </div>
              {plan.roadmap?.map((phase, i) => (
                <PhaseCard key={i} phase={phase} isLast={i === plan.roadmap.length - 1} />
              ))}
            </div>
          )}

          {/* Skill Gaps Tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-6 animate-fade-up">

              {/* Strengths */}
              {plan.current_strengths?.length > 0 && (
                <div className="glass-elevated rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-success" /> Current Strengths to Leverage
                  </h3>
                  <div className="space-y-3">
                    {plan.current_strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-success/5 border border-success/10">
                        <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-textMain">{s.skill}</p>
                          <p className="text-xs text-textMuted">{s.relevance_to_target}</p>
                          <p className="text-xs text-success mt-0.5">→ {s.leverage_tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps table */}
              <div className="glass-elevated rounded-2xl p-5">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target size={14} className="text-danger" /> Skill Gaps
                </h3>
                <div className="space-y-3">
                  {['critical', 'high-impact', 'nice-to-have'].map(cat => {
                    const gaps = plan.skill_gaps?.filter(g => g.category === cat);
                    if (!gaps?.length) return null;
                    const catCfg = GAP_CAT_CONFIG[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{catCfg.icon}</span>
                          <span className={`badge ${catCfg.cls}`}>{catCfg.label}</span>
                          <span className="text-xs text-textMuted">{gaps.length} gap{gaps.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2 pl-2">
                          {gaps.map((g, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-textMain">{g.skill}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xs text-textMuted">Demand:</span>
                                  <span className="font-bold text-xs" style={{ color: g.market_demand_score >= 80 ? '#10B981' : g.market_demand_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                                    {g.market_demand_score}/100
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-textMuted">{g.why_needed}</p>
                              <div className="flex items-center gap-3 text-2xs">
                                <span className="text-textMuted">Level: <span className="text-textMain font-semibold">{g.current_level} → {g.target_level}</span></span>
                                <span className="text-textMuted">Est: <span className="text-accent font-semibold">{g.weeks_to_learn}w</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-textMain">Portfolio-Worthy Project Ideas</h2>
                <span className="text-xs text-textMuted">Ranked by impact</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.project_ideas?.map((p, i) => <ProjectCard key={i} project={p} />)}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="animate-fade-up glass-elevated rounded-2xl p-5">
              <h2 className="text-base font-bold text-textMain mb-4">Curated Learning Resources</h2>
              <div className="space-y-2">
                {plan.resources?.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                    <span className="text-lg shrink-0">{RESOURCE_ICONS[r.type] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textMain">{r.resource}</p>
                      <p className="text-xs text-textMuted">{r.skill}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge ${r.free ? 'badge-success' : 'badge-neutral'}`}>
                        {r.free ? 'Free' : 'Paid'}
                      </span>
                      <span className="badge badge-neutral capitalize">{r.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!plan && !loading && (
        <div className="text-center py-16 text-textMuted">
          <TrendingUp size={44} className="mx-auto mb-4 opacity-20" />
          <p className="text-base font-semibold mb-1">Enter your target role above</p>
          <p className="text-sm">Get a personalized skill gap analysis, week-by-week roadmap, and project ideas</p>
        </div>
      )}
    </div>
  );
}
