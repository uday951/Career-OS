import React, { useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import {
  Cpu, Loader2, MapPin, Globe, Briefcase, Link as LinkIcon,
  CheckCircle2, AlertTriangle, Clock, TrendingUp, Star,
  ChevronDown, ChevronUp, Zap, Target, ArrowRight, Search,
  SlidersHorizontal, X, Filter
} from 'lucide-react';

const DECISION_CONFIG = {
  strong_apply:    { label: 'Strong Apply',     color: 'text-success', bg: 'bg-success/10 border-success/25',  dot: '#10B981' },
  apply_with_prep: { label: 'Apply with Prep',  color: 'text-warning', bg: 'bg-warning/10 border-warning/25',  dot: '#F59E0B' },
  skip_for_now:    { label: 'Skip for Now',     color: 'text-danger',  bg: 'bg-danger/10 border-danger/25',    dot: '#EF4444' },
};

function FitScore({ score }) {
  const color = score >= 72 ? '#10B981' : score >= 55 ? '#F59E0B' : '#EF4444';
  const r = 22, circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function JobMatchCard({ match, rank }) {
  const [expanded, setExpanded] = useState(rank === 1); // auto-open #1
  const dec = DECISION_CONFIG[match.decision] || DECISION_CONFIG.apply_with_prep;

  return (
    <div className={`glass-elevated rounded-2xl overflow-hidden border ${rank === 1 ? 'border-primary/30' : 'border-white/[0.06]'} transition-all duration-300`}>
      {rank === 1 && (
        <div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent" />
      )}

      {/* Card Header — always visible */}
      <div className="p-5 flex items-start gap-4">
        {/* Rank */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rank === 1 ? 'bg-primary/20 text-primary' : 'bg-white/[0.05] text-textMuted'}`}>
          #{rank}
        </div>

        {/* Logo */}
        {match.employer_logo
          ? <img src={match.employer_logo} alt={match.company} className="w-10 h-10 rounded-xl object-contain bg-white/5 p-0.5 shrink-0 border border-white/[0.08]" />
          : <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-textMuted text-xs font-bold">{match.company?.[0]}</div>
        }

        {/* Title / Company */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-textMain text-base leading-tight truncate">{match.job_title}</h3>
          <p className="text-sm text-primary font-semibold mt-0.5">{match.company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {match.location && (
              <span className="flex items-center gap-1 text-2xs text-textMuted"><MapPin size={10} />{match.location}</span>
            )}
            {match.is_remote && (
              <span className="flex items-center gap-1 text-2xs text-success font-bold"><Globe size={10} />Remote</span>
            )}
            {match.job_type && (
              <span className="flex items-center gap-1 text-2xs text-textMuted"><Briefcase size={10} />{match.job_type}</span>
            )}
          </div>
        </div>

        {/* Fit Score ring */}
        <FitScore score={match.fit_score} />
      </div>

      {/* Decision badge + expand toggle */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className={`badge ${dec.bg} ${dec.color} border`}>{dec.label}</span>
        <button onClick={() => setExpanded(v => !v)} className="btn-ghost text-xs gap-1.5">
          {expanded ? <><ChevronUp size={13}/> Hide details</> : <><ChevronDown size={13}/> View strategy</>}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-5 space-y-5 animate-fade-up">

          {/* Why you fit */}
          <div>
            <p className="text-2xs font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={11} /> Why You Fit</p>
            <p className="text-sm text-textMain leading-relaxed bg-success/5 border border-success/15 rounded-xl p-3">{match.why_you_fit}</p>
          </div>

          {/* Competitive Advantage */}
          <div>
            <p className="text-2xs font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1.5"><Star size={11} /> Your Competitive Edge</p>
            <p className="text-sm text-textMain leading-relaxed">{match.competitive_advantage}</p>
          </div>

          {/* Application Strategy */}
          <div>
            <p className="text-2xs font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target size={11} /> Application Strategy</p>
            <p className="text-sm text-textMain leading-relaxed bg-primary/5 border border-primary/15 rounded-xl p-3">{match.application_strategy}</p>
          </div>

          {/* Outreach subject */}
          {match.outreach_subject_line && (
            <div>
              <p className="text-2xs font-bold text-textMuted uppercase tracking-wider mb-2">📧 Outreach Subject Line</p>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 font-mono text-sm text-accent">
                {match.outreach_subject_line}
              </div>
            </div>
          )}

          {/* Red flags */}
          {match.red_flags_to_address?.length > 0 && (
            <div>
              <p className="text-2xs font-bold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle size={11} /> Address Before Applying</p>
              <ul className="space-y-1.5">
                {match.red_flags_to_address.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-textMuted">
                    <AlertTriangle size={12} className="text-warning mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply button */}
          <div className="pt-2">
            {match.apply_url
              ? <a href={match.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <LinkIcon size={15} /> Apply on Company Portal
                </a>
              : <div className="text-xs text-textMuted text-center">No direct apply link available</div>
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const EMPLOYMENT_TYPES = [
  { value: 'any',        label: 'Any Type'   },
  { value: 'FULLTIME',   label: 'Full Time'  },
  { value: 'PARTTIME',   label: 'Part Time'  },
  { value: 'CONTRACTOR', label: 'Contract'   },
  { value: 'INTERN',     label: 'Internship' },
];

export default function ReverseRecruiter() {
  const { token } = useStore();
  const [query, setQuery]               = useState('');
  const [location, setLocation]         = useState('');
  const [employmentType, setEmploymentType] = useState('any');
  const [remoteOnly, setRemoteOnly]     = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const activeFilterCount = [
    location.trim(),
    employmentType !== 'any' ? employmentType : '',
    remoteOnly ? 'remote' : '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setLocation('');
    setEmploymentType('any');
    setRemoteOnly(false);
  };

  const handleRun = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const { data } = await axios.post('http://localhost:5000/api/reverse/jobs', {
        query,
        location:        location.trim() || undefined,
        employment_type: employmentType !== 'any' ? employmentType : undefined,
        remote:          remoteOnly || undefined,
      }, config);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Check your resume and RapidAPI key.');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Cpu size={20} className="text-white" />
            </div>
            <h1 className="page-title">Reverse Recruiter Mode</h1>
          </div>
          <p className="page-subtitle">Flip the system — AI scans live jobs and finds which companies <em>should</em> be hiring you.</p>
        </div>
      </div>

      {/* Search + Filter Form */}
      <div className="glass-elevated rounded-2xl p-6 space-y-4">
        <form onSubmit={handleRun} className="space-y-4">
          {/* Row 1: query + button */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
                Role / Domain <span className="text-textMuted font-normal normal-case">(leave blank to auto-detect from resume)</span>
              </label>
              <input
                className="input"
                placeholder="e.g. React developer, Data scientist, DevOps engineer..."
                value={query} onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`relative btn-secondary py-3 px-4 ${showFilters ? 'border-primary/40 text-primary' : ''}`}
              >
                <SlidersHorizontal size={17} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-2xs font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button type="submit" disabled={loading} className="btn-primary py-3 px-6">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Cpu size={18} /> Find My Jobs</>}
              </button>
            </div>
          </div>

          {/* Row 2: Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/[0.06] animate-fade-up">

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><MapPin size={11} /> Location</span>
                </label>
                <div className="relative">
                  <input
                    className="input pr-8"
                    placeholder="e.g. New York, London, India..."
                    value={location} onChange={e => setLocation(e.target.value)}
                  />
                  {location && (
                    <button type="button" onClick={() => setLocation('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><Briefcase size={11} /> Job Type</span>
                </label>
                <select
                  className="input appearance-none cursor-pointer"
                  value={employmentType}
                  onChange={e => setEmploymentType(e.target.value)}
                >
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Remote Toggle */}
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5"><Globe size={11} /> Remote</span>
                </label>
                <div className="flex gap-2 h-[42px] items-center">
                  {[{v: false, label: 'All Jobs'}, {v: true, label: 'Remote Only'}].map(opt => (
                    <button
                      key={String(opt.v)}
                      type="button"
                      onClick={() => setRemoteOnly(opt.v)}
                      className={`flex-1 h-full rounded-xl border text-sm font-semibold transition-all duration-200 ${
                        remoteOnly === opt.v
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'border-white/[0.08] text-textMuted hover:border-white/20 bg-white/[0.02]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <div className="sm:col-span-3 flex justify-end">
                  <button type="button" onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-textMuted hover:text-danger transition-colors">
                    <X size={12} /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {error && (
          <div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-elevated rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cpu size={30} className="text-accent" />
          </div>
          <h3 className="text-lg font-bold text-textMain mb-2">Scanning Live Market</h3>
          <p className="text-sm text-textMuted">Fetching real jobs → scoring your profile against each → ranking best fits...</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-textMuted">
            <span className="badge badge-neutral">Fetching live jobs</span>
            <ArrowRight size={12} />
            <span className="badge badge-neutral">6D scoring</span>
            <ArrowRight size={12} />
            <span className="badge badge-neutral">Ranking top 5</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6 animate-fade-up">

          {/* Summary Bar */}
          <div className="glass-elevated rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-1">AI Positioning Summary</p>
              <p className="text-sm text-textMain leading-relaxed">{result.candidate_summary}</p>
            </div>
            <div className="flex gap-4 shrink-0 text-center">
              <div>
                <p className="text-2xl font-black text-textMain">{result.total_jobs_fetched}</p>
                <p className="text-2xs text-textMuted">Jobs Analyzed</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div>
                <p className="text-2xl font-black text-primary">{result.top_matches?.length}</p>
                <p className="text-2xs text-textMuted">Top Matches</p>
              </div>
            </div>
          </div>

          {/* Active Filters Applied */}
          {result.filters_applied && Object.keys(result.filters_applied).length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xs text-textMuted font-semibold uppercase tracking-wide flex items-center gap-1">
                <Filter size={10} /> Filtered:
              </span>
              {result.filters_applied.location && (
                <span className="badge badge-info flex items-center gap-1"><MapPin size={10} />{result.filters_applied.location}</span>
              )}
              {result.filters_applied.employment_type && (
                <span className="badge badge-info flex items-center gap-1"><Briefcase size={10} />{result.filters_applied.employment_type}</span>
              )}
              {result.filters_applied.remote && (
                <span className="badge badge-success flex items-center gap-1"><Globe size={10} />Remote Only</span>
              )}
              <span className="text-2xs text-textMuted">· searched "{result.search_query_used}"</span>
            </div>
          )}

          {/* Market Positioning */}
          {result.skill_market_positioning && (
            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> Your Market Positioning
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-2xs text-success font-bold uppercase mb-2">💪 Most Marketable Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skill_market_positioning.most_marketable_skills?.map(s => (
                      <span key={s} className="badge badge-success">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-2xs text-warning font-bold uppercase mb-2">⚠️ Gaps for Top Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skill_market_positioning.skill_gaps_for_top_roles?.map(s => (
                      <span key={s} className="badge badge-warning">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-2xs text-accent font-bold uppercase mb-2">🎯 Add Next</p>
                  <span className="badge badge-info">{result.skill_market_positioning.recommended_skill_to_add_next}</span>
                </div>
              </div>
              {result.overall_recommendation && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-sm text-textMuted leading-relaxed">
                    <strong className="text-textMain">Overall: </strong>{result.overall_recommendation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Job Match Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-textMain flex items-center gap-2">
              <Target size={17} className="text-primary" /> Top {result.top_matches?.length} Matches for You
            </h2>
            {result.top_matches?.map((match, i) => (
              <JobMatchCard key={i} match={match} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-12 text-textMuted">
          <Cpu size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Click "Find My Jobs" to let AI scan the live market for your best opportunities</p>
        </div>
      )}
    </div>
  );
}
