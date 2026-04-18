import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import {
  Shield, Loader2, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Zap, Target, XCircle, ChevronDown, ChevronUp, Sparkles, Clock,
  ArrowRight, BarChart2, Search, FileText, User, Briefcase, GraduationCap, Code2
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DECISION_CONFIG = {
  apply_now:       { label: 'Apply Now',       color: 'text-success', bg: 'bg-success/10 border-success/30',  icon: CheckCircle2 },
  prepare_first:   { label: 'Prepare First',   color: 'text-warning', bg: 'bg-warning/10 border-warning/30',  icon: Clock        },
  skip_or_upskill: { label: 'Skip / Upskill',  color: 'text-danger',  bg: 'bg-danger/10 border-danger/30',    icon: XCircle      },
};

const SEVERITY_COLOR = { critical: 'text-danger', high: 'text-warning', medium: 'text-info' };
const EFFORT_COLOR   = { low: 'text-success', medium: 'text-warning', high: 'text-danger' };

function ProbabilityRing({ value, label, color }) {
  const r = 52, circ = 2 * Math.PI * r;
  const fill = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{value}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-textMuted">{label}</span>
    </div>
  );
}

function DimensionBar({ label, score }) {
  const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-textMuted font-medium">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score}%`, background: color, transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const [showKeywords, setShowKeywords] = useState(false);
  const dec = DECISION_CONFIG[result.decision] || DECISION_CONFIG.prepare_first;
  const DecIcon = dec.icon;

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Decision Banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${dec.bg}`}>
        <DecIcon size={32} className={dec.color} />
        <div className="flex-1">
          <div className={`text-lg font-black ${dec.color}`}>{dec.label}</div>
          <p className="text-sm text-textMuted mt-0.5">{result.decision_reasoning}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xs text-textMuted uppercase tracking-wide">Analyzed</p>
          <p className="text-xs font-mono text-textMuted">{new Date(result.analyzed_at).toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Probability Rings */}
      <div className="glass-elevated rounded-2xl p-6">
        <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-6 flex items-center gap-2">
          <BarChart2 size={15} /> Hiring Probability
        </h3>
        <div className="flex items-center justify-center gap-12">
          <ProbabilityRing value={result.selection_probability} label="Selection Chance" color="#10B981" />
          <div className="w-px h-20 bg-white/[0.06]" />
          <ProbabilityRing value={result.rejection_probability} label="Rejection Risk" color="#EF4444" />
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="glass-elevated rounded-2xl p-6">
        <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-5 flex items-center gap-2">
          <Target size={15} /> Scoring Breakdown
        </h3>
        <div className="space-y-4">
          <DimensionBar label="ATS Keyword Match" score={result.dimension_scores?.ats_keyword_match} />
          <DimensionBar label="Skills Alignment" score={result.dimension_scores?.skills_alignment} />
          <DimensionBar label="Experience Level Fit" score={result.dimension_scores?.experience_level_fit} />
          <DimensionBar label="Project Strength" score={result.dimension_scores?.project_strength} />
          <DimensionBar label="Education Relevance" score={result.dimension_scores?.education_relevance} />
          <DimensionBar label="Application Timing" score={result.dimension_scores?.application_timing} />
        </div>
      </div>

      {/* 2-col: Rejections + Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Rejection Reasons */}
        <div className="glass-elevated rounded-2xl p-5">
          <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={15} /> Top Rejection Risks
          </h3>
          <div className="space-y-4">
            {result.top_rejection_reasons?.map((r, i) => (
              <div key={i} className="border-l-2 border-white/[0.1] pl-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-white/[0.06] text-xs font-black flex items-center justify-center text-textMuted">{r.rank}</span>
                  <span className={`text-2xs font-bold uppercase tracking-wide ${SEVERITY_COLOR[r.severity]}`}>{r.severity}</span>
                </div>
                <p className="text-sm font-semibold text-textMain">{r.reason}</p>
                <p className="text-xs text-textMuted">→ {r.fix}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="glass-elevated rounded-2xl p-5">
          <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={15} /> Strengths to Lead With
          </h3>
          <div className="space-y-2.5">
            {result.strengths_to_highlight?.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                <p className="text-sm text-textMain">{s}</p>
              </div>
            ))}
          </div>
          {/* ATS Headline */}
          {result.ats_optimized_headline && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-2xs text-textMuted uppercase tracking-wider mb-1.5">Optimized Resume Headline</p>
              <p className="text-sm font-semibold text-primary italic">"{result.ats_optimized_headline}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Improvement Actions */}
      <div className="glass-elevated rounded-2xl p-5">
        <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={15} /> Improvement Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.improvement_actions?.map((a, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xs font-bold uppercase ${EFFORT_COLOR[a.effort]}`}>{a.effort} effort</span>
                <span className="text-success text-xs font-bold">+{a.impact_increase}%</span>
              </div>
              <p className="text-sm font-semibold text-textMain mb-1">{a.action}</p>
              <p className="text-2xs text-textMuted">{a.timeline}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Gap */}
      <div className="glass-elevated rounded-2xl p-5">
        <button onClick={() => setShowKeywords(v => !v)} className="w-full flex items-center justify-between text-sm font-bold text-textMuted uppercase tracking-wider">
          <span className="flex items-center gap-2"><Search size={15}/> Keyword Gap Analysis</span>
          {showKeywords ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showKeywords && (
          <div className="mt-4 space-y-3 animate-fade-up">
            <div>
              <p className="text-2xs text-success font-bold uppercase mb-1.5">✅ Matched</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keyword_gap_analysis?.matched_keywords?.map(k => (
                  <span key={k} className="badge badge-success">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-2xs text-danger font-bold uppercase mb-1.5">❌ Missing (Critical)</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keyword_gap_analysis?.missing_critical?.map(k => (
                  <span key={k} className="badge badge-danger">{k}</span>
                ))}
              </div>
            </div>
            {result.keyword_gap_analysis?.missing_nice_to_have?.length > 0 && (
              <div>
                <p className="text-2xs text-warning font-bold uppercase mb-1.5">⚠️ Nice to Have</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keyword_gap_analysis?.missing_nice_to_have?.map(k => (
                    <span key={k} className="badge badge-warning">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ShadowMode() {
  const { token } = useStore();
  const [jobTitle, setJobTitle]           = useState('');
  const [companyName, setCompanyName]     = useState('');
  const [jobDesc, setJobDesc]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState('');
  const [resumeProfile, setResumeProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch resume profile on mount
  useEffect(() => {
    axios.get(`${API_BASE}/api/coach/profile`, config)
      .then(({ data }) => setResumeProfile(data.found ? data : null))
      .catch(() => setResumeProfile(null))
      .finally(() => setProfileLoading(false));
  }, [token]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (jobDesc.trim().length < 50) return setError('Please paste a full job description (at least 50 characters).');
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/shadow/analyze`, {
        jobTitle, companyName, jobDescription: jobDesc
      }, config);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Make sure you have a parsed resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-24 space-y-8">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-glow-violet">
              <Shield size={20} className="text-white" />
            </div>
            <h1 className="page-title">Shadow Application Mode</h1>
          </div>
          <p className="page-subtitle">Simulate the real-world hiring outcome before you apply. Get brutally honest analysis powered by AI.</p>
        </div>
      </div>

      {/* Resume Profile Card */}
      {profileLoading ? (
        <div className="glass-elevated rounded-2xl p-4 flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-40" />
            <div className="skeleton h-3 w-64" />
          </div>
        </div>
      ) : resumeProfile ? (
        <div className="glass-elevated rounded-2xl p-4 border-l-2 border-primary/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText size={13} className="text-primary" />
              </div>
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider">Simulating with Resume</p>
            </div>
            {resumeProfile.resume_title && (
              <span className="text-xs font-semibold text-primary/70 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                {resumeProfile.resume_title}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {resumeProfile.name && (
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-textMuted shrink-0" />
                <span className="font-semibold text-textMain">{resumeProfile.name}</span>
              </div>
            )}
            {resumeProfile.role && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase size={14} className="text-textMuted shrink-0" />
                <span className="text-textMain">
                  {resumeProfile.role}
                  {resumeProfile.company && <span className="text-textMuted"> @ {resumeProfile.company}</span>}
                </span>
              </div>
            )}
            {resumeProfile.education && (
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap size={14} className="text-textMuted shrink-0" />
                <span className="text-textMuted">
                  {resumeProfile.education}{resumeProfile.institution ? ` · ${resumeProfile.institution}` : ''}
                </span>
              </div>
            )}
            {resumeProfile.ats_score > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Target size={14} className="text-textMuted shrink-0" />
                <span className="text-textMuted">ATS Score: <span className="font-bold text-success">{resumeProfile.ats_score}/100</span></span>
              </div>
            )}
            {resumeProfile.work_history_count > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-textMuted shrink-0" />
                <span className="text-textMuted">{resumeProfile.work_history_count} jobs · {resumeProfile.projects_count || 0} projects parsed</span>
              </div>
            )}
          </div>
          {resumeProfile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.05]">
              <span className="text-2xs text-textMuted font-semibold mr-1 self-center">Skills:</span>
              {resumeProfile.skills.slice(0, 10).map(s => (
                <span key={s} className="badge badge-neutral">{s}</span>
              ))}
              {resumeProfile.skills.length > 10 && (
                <span className="text-2xs text-textMuted self-center">+{resumeProfile.skills.length - 10} more</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-warning/8 border border-warning/20 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <div>
            <p className="text-sm font-semibold text-warning">No parsed resume found</p>
            <p className="text-xs text-textMuted">Upload and parse a resume from the <strong>AI Resumes</strong> page first.</p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="glass-elevated rounded-2xl p-6">
        <form onSubmit={handleAnalyze} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">Job Title</label>
              <input className="input" placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">Company Name</label>
              <input className="input" placeholder="e.g. Google, Stripe, Startup"
                value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
              Job Description <span className="text-danger">*</span>
            </label>
            <textarea
              className="input resize-none h-52 font-mono text-xs leading-relaxed"
              placeholder="Paste the full job description here — requirements, responsibilities, qualifications..."
              value={jobDesc} onChange={e => setJobDesc(e.target.value)} required
            />
            <p className="text-2xs text-textMuted mt-1">{jobDesc.length} characters · Minimum 50</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
            {loading
              ? <><Loader2 className="animate-spin" size={19} /> Simulating Hiring Outcome...</>
              : <><Shield size={19} /> Run Shadow Simulation</>
            }
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-elevated rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield size={30} className="text-primary" />
          </div>
          <h3 className="text-lg font-bold text-textMain mb-2">Running 6-Dimension Analysis</h3>
          <p className="text-sm text-textMuted">Scanning ATS match · Skills gap · Experience fit · Project strength...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && <ResultCard result={result} />}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-10 text-textMuted">
          <Shield size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Paste a job description above to run your shadow simulation</p>
        </div>
      )}
    </div>
  );
}
