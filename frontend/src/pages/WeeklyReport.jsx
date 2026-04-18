import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import {
  BarChart2, Loader2, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Zap, Target, ArrowRight,
  RefreshCw, Flame, Star, ShieldAlert, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GRADE_CONFIG = {
  A: { label: 'Excellent', color: 'text-success', bg: 'bg-success/10 border-success/30', glow: '#10B981' },
  B: { label: 'Good',      color: 'text-info',    bg: 'bg-info/10 border-info/30',       glow: '#3B82F6' },
  C: { label: 'Average',   color: 'text-warning', bg: 'bg-warning/10 border-warning/30', glow: '#F59E0B' },
  D: { label: 'Below Avg', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', glow: '#FB923C' },
  F: { label: 'Critical',  color: 'text-danger',  bg: 'bg-danger/10 border-danger/30',   glow: '#EF4444' },
};

const MOMENTUM_CONFIG = {
  accelerating: { icon: TrendingUp,  color: 'text-success', label: 'Accelerating 🚀' },
  steady:       { icon: Minus,       color: 'text-info',    label: 'Steady ➡️'        },
  slowing:      { icon: TrendingDown,color: 'text-warning', label: 'Slowing ⚠️'       },
  stalled:      { icon: AlertTriangle,color: 'text-danger', label: 'Stalled 🔴'       },
};

const PRIORITY_COLORS = ['#7C3AED', '#06B6D4', '#10B981'];

// ─── Grade Circle ─────────────────────────────────────────────────────────────
function GradeCircle({ grade }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.C;
  return (
    <div className={`w-24 h-24 rounded-2xl border-2 ${cfg.bg} flex flex-col items-center justify-center`}
      style={{ boxShadow: `0 0 30px ${cfg.glow}40` }}>
      <span className={`text-4xl font-black ${cfg.color}`}>{grade}</span>
      <span className={`text-2xs font-bold ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

// ─── Metric Delta ─────────────────────────────────────────────────────────────
function MetricDelta({ label, current, previous, unit = '', inverse = false }) {
  const diff = current - previous;
  const improved = inverse ? diff < 0 : diff > 0;
  const flat = diff === 0;
  const color = flat ? 'text-textMuted' : improved ? 'text-success' : 'text-danger';
  const sign = diff > 0 ? '+' : '';

  return (
    <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <p className="text-2xs text-textMuted uppercase tracking-wider font-semibold mb-2">{label}</p>
      <p className="text-2xl font-black text-textMain tabular-nums">{current}{unit}</p>
      {previous !== undefined && !flat && (
        <p className={`text-xs font-bold mt-1 ${color}`}>
          {sign}{diff}{unit} vs last week
        </p>
      )}
      {flat && <p className="text-xs text-textMuted mt-1">No change</p>}
    </div>
  );
}

// ─── Trend Row ────────────────────────────────────────────────────────────────
function TrendRow({ trend }) {
  const cfg = { up: { icon: TrendingUp, color: 'text-success' }, down: { icon: TrendingDown, color: 'text-danger' }, flat: { icon: Minus, color: 'text-textMuted' } };
  const { icon: Icon, color } = cfg[trend.direction] || cfg.flat;
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      <div className={`w-7 h-7 rounded-lg ${color === 'text-success' ? 'bg-success/10' : color === 'text-danger' ? 'bg-danger/10' : 'bg-white/[0.05]'} flex items-center justify-center shrink-0`}>
        <Icon size={14} className={color} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-textMain">{trend.metric}</p>
          <span className={`text-xs font-bold ${color}`}>{trend.change}</span>
        </div>
        <p className="text-xs text-textMuted mt-0.5">{trend.interpretation}</p>
      </div>
    </div>
  );
}

// ─── Priority Card ────────────────────────────────────────────────────────────
function PriorityCard({ item }) {
  const [open, setOpen] = useState(item.rank === 1);
  const color = PRIORITY_COLORS[item.rank - 1] || PRIORITY_COLORS[2];
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06]" style={{ borderLeftColor: `${color}60`, borderLeftWidth: 3 }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: color }}>
          {item.rank}
        </div>
        <p className="flex-1 text-sm font-semibold text-textMain">{item.action}</p>
        {open ? <ChevronUp size={14} className="text-textMuted shrink-0" /> : <ChevronDown size={14} className="text-textMuted shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 animate-fade-up bg-white/[0.01]">
          <p className="text-xs text-textMuted">{item.rationale}</p>
          <div className="flex items-start gap-1.5 text-xs text-success">
            <Target size={11} className="mt-0.5 shrink-0" />
            <span><strong>Expected:</strong> {item.expected_outcome}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WeeklyReport() {
  const { token } = useStore();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchReport = async () => {
    setLoading(true);
    setReport(null);
    setError('');
    try {
      const { data } = await axios.get(`${API_BASE}/api/report/weekly`, config);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Add some applications and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const grade = report ? (GRADE_CONFIG[report.overall_grade] || GRADE_CONFIG.C) : null;
  const momentum = report ? (MOMENTUM_CONFIG[report.momentum] || MOMENTUM_CONFIG.steady) : null;
  const MomentumIcon = momentum?.icon;
  const m = report?.metrics_summary;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-24 space-y-8">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <BarChart2 size={20} className="text-white" />
            </div>
            <h1 className="page-title">Weekly Career Report</h1>
          </div>
          <p className="page-subtitle">AI-powered weekly analysis of your career progress, patterns, and next actions.</p>
        </div>
        <button onClick={fetchReport} disabled={loading} className="btn-secondary shrink-0">
          {loading ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-elevated rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-info/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart2 size={30} className="text-info" />
          </div>
          <h3 className="text-lg font-bold text-textMain mb-2">Analyzing Your Week</h3>
          <p className="text-sm text-textMuted">Aggregating applications → Computing trends → Generating insights...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 bg-danger/8 border border-danger/20 rounded-xl px-5 py-4 text-danger">
          <AlertTriangle size={18} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Could not generate report</p>
            <p className="text-xs text-danger/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6 animate-fade-up">

          {/* Top Hero — Grade + Momentum + Headline */}
          <div className="glass-elevated rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <GradeCircle grade={report.overall_grade} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`badge border ${grade?.bg} ${grade?.color}`}>{grade?.label}</span>
                {MomentumIcon && (
                  <div className="flex items-center gap-1.5">
                    <MomentumIcon size={14} className={momentum.color} />
                    <span className={`text-xs font-bold ${momentum.color}`}>{momentum.label}</span>
                  </div>
                )}
                {report.report_period && (
                  <span className="text-xs text-textMuted flex items-center gap-1"><Clock size={11} />{report.report_period}</span>
                )}
              </div>
              <h2 className="text-base font-bold text-textMain leading-snug">{report.headline_insight}</h2>
              <p className="text-sm text-textMuted">{report.grade_reasoning}</p>
              {report.motivational_message && (
                <p className="text-sm italic text-primary/80">"{report.motivational_message}"</p>
              )}
            </div>
          </div>

          {/* Danger Alert */}
          {report.danger_alert && (
            <div className="flex items-start gap-3 bg-danger/8 border border-danger/30 rounded-xl px-5 py-4">
              <ShieldAlert size={20} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-danger">⚠️ Alert</p>
                <p className="text-sm text-danger/80 mt-0.5">{report.danger_alert}</p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          {m && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricDelta label="Apps This Week"   current={m.applications_this_week}   previous={m.applications_last_week}   />
              <MetricDelta label="Avg Match Rate"   current={m.avg_match_rate_this_week}  previous={m.avg_match_rate_last_week}  unit="%" />
              <MetricDelta label="Response Rate"    current={m.response_rate_pct}          unit="%"  />
              <MetricDelta label="Active Pipeline"  current={m.active_pipeline}            />
            </div>
          )}

          {/* Status Changes this week */}
          {m && (
            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} /> Status Changes This Week
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Got Interview', value: m.status_changes?.to_interviewing || 0, color: 'text-success', bg: 'bg-success/10', emoji: '📞' },
                  { label: 'Rejected',      value: m.status_changes?.rejected || 0,        color: 'text-danger',  bg: 'bg-danger/10',  emoji: '❌' },
                  { label: 'Offers',        value: m.status_changes?.offered || 0,          color: 'text-warning', bg: 'bg-warning/10', emoji: '🎉' },
                ].map(({ label, value, color, bg, emoji }) => (
                  <div key={label} className={`rounded-xl p-4 ${bg} border border-white/[0.05]`}>
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-2xs text-textMuted font-semibold mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-col: Wins, Concerns, Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Wins */}
            {report.wins?.length > 0 && (
              <div className="glass-elevated rounded-2xl p-5">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star size={14} className="text-success" /> Wins This Week
                </h3>
                <div className="space-y-3">
                  {report.wins.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-textMain">{w.title}</p>
                        <p className="text-xs text-textMuted mt-0.5">{w.detail}</p>
                        <span className={`badge mt-1 ${w.impact === 'high' ? 'badge-success' : w.impact === 'medium' ? 'badge-info' : 'badge-neutral'}`}>
                          {w.impact} impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concerns */}
            {report.concerns?.length > 0 && (
              <div className="glass-elevated rounded-2xl p-5">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-danger" /> Watch Points
                </h3>
                <div className="space-y-3">
                  {report.concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${c.urgency === 'high' ? 'text-danger' : c.urgency === 'medium' ? 'text-warning' : 'text-info'}`} />
                      <div>
                        <p className="text-sm font-semibold text-textMain">{c.title}</p>
                        <p className="text-xs text-textMuted mt-0.5">{c.detail}</p>
                        <p className="text-xs text-primary mt-1">→ {c.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pattern Analysis */}
          {report.pattern_analysis && (
            <div className="glass-elevated rounded-2xl p-5 border-l-2 border-accent/50">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
                <BarChart2 size={14} /> Pattern Analysis
              </h3>
              <p className="text-sm text-textMain leading-relaxed">{report.pattern_analysis}</p>
            </div>
          )}

          {/* Performance Trends */}
          {report.performance_trend?.length > 0 && (
            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> Performance Trends
              </h3>
              <div className="space-y-2">
                {report.performance_trend.map((t, i) => <TrendRow key={i} trend={t} />)}
              </div>
            </div>
          )}

          {/* Next Week Priorities */}
          {report.next_week_priorities?.length > 0 && (
            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target size={14} className="text-primary" /> Next Week — Top Priorities
              </h3>
              <div className="space-y-2">
                {report.next_week_priorities.map((p, i) => <PriorityCard key={i} item={p} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty: no data yet */}
      {!report && !loading && !error && (
        <div className="text-center py-16 text-textMuted">
          <BarChart2 size={44} className="mx-auto mb-4 opacity-20" />
          <p className="text-base font-semibold">No report yet</p>
          <p className="text-sm">Add applications to your pipeline first, then generate your weekly report</p>
        </div>
      )}
    </div>
  );
}
