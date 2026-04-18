import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import {
  Target, FileText, Briefcase, Zap, TrendingUp, TrendingDown,
  Clock, CheckCircle2, XCircle, Flame, ArrowRight, Search,
  BarChart2, Sparkles, ChevronRight, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_CONFIG = {
  SAVED:        { label: 'Saved',        cls: 'badge-neutral' },
  APPLIED:      { label: 'Applied',      cls: 'badge-info' },
  INTERVIEWING: { label: 'Interviewing', cls: 'badge-warning' },
  OFFER:        { label: 'Offer',        cls: 'badge-success' },
  REJECTED:     { label: 'Rejected',     cls: 'badge-danger' },
};

function StatCard({ icon: Icon, label, value, sub, subColor = 'text-textMuted', accent, loading }) {
  return (
    <div className="stat-card group">
      {/* Glow on hover */}
      <div className={`glow-orb w-32 h-32 -top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent === 'violet' ? 'bg-primary/40' : accent === 'cyan' ? 'bg-accent/30' : accent === 'green' ? 'bg-success/30' : 'bg-danger/30'}`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent === 'violet' ? 'bg-primary/15 text-primary' : accent === 'cyan' ? 'bg-accent/15 text-accent' : accent === 'green' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            <Icon size={15} />
          </div>
        </div>
        {loading
          ? <div className="skeleton h-9 w-24 mb-3" />
          : <div className="text-3xl font-bold text-textMain tracking-tight mb-3">{value}</div>
        }
        <p className={`text-xs font-medium flex items-center gap-1.5 ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-36" />
        <div className="skeleton h-3 w-24" />
      </div>
      <div className="skeleton h-5 w-14 rounded-full" />
    </div>
  );
}

function MatchBar({ pct }) {
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2.5">
      <div className="progress-bar flex-1 w-16">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, description, colorCls }) {
  return (
    <Link to={to} className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-textMain">{label}</p>
        <p className="text-xs text-textMuted truncate">{description}</p>
      </div>
      <ChevronRight size={16} className="text-textMuted group-hover:text-textMain group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

export default function Dashboard() {
  const { resumes, jobs, token, user } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const cfg = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [j, r] = await Promise.all([
          axios.get('http://localhost:5000/api/jobs', cfg).catch(() => ({ data: [] })),
          axios.get('http://localhost:5000/api/resumes', cfg).catch(() => ({ data: [] })),
        ]);
        useStore.getState().setJobs(j.data);
        useStore.getState().setResumes(r.data);
      } finally { setLoading(false); }
    };
    if (token) load();
  }, [token]);

  // Metrics
  const total = jobs.length;
  const active = jobs.filter(j => ['SAVED', 'APPLIED', 'INTERVIEWING'].includes(j.status)).length;
  const rejected = jobs.filter(j => j.status === 'REJECTED').length;
  const rejectRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
  const bestResume = resumes.reduce((m, r) => (r.ats_score > (m?.ats_score || 0) ? r : m), null);
  const matched = jobs.filter(j => j.match_analysis?.match_percentage);
  const avgMatch = matched.length ? Math.round(matched.reduce((s, j) => s + j.match_analysis.match_percentage, 0) / matched.length) : 0;

  // Streak
  const getStreak = () => {
    const dates = [...new Set(jobs.map(j => new Date(j.createdAt).toLocaleDateString()))];
    const todayStr = new Date().toLocaleDateString();
    const yestStr = new Date(Date.now() - 86400000).toLocaleDateString();
    if (!dates.includes(todayStr) && !dates.includes(yestStr)) return 0;
    let ptr = dates.includes(todayStr) ? new Date() : new Date(Date.now() - 86400000);
    let s = 0;
    while (dates.includes(ptr.toLocaleDateString())) { s++; ptr = new Date(ptr - 86400000); }
    return s;
  };
  const streak = getStreak();

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-sm text-textMuted mb-1">{greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</p>
          <h1 className="page-title text-3xl">Career Dashboard</h1>
          <p className="page-subtitle">Your AI-powered career command center</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-3 bg-warning/8 border border-warning/20 px-5 py-3 rounded-xl shrink-0">
            <Flame size={22} className="text-warning" />
            <div>
              <p className="text-xs font-bold text-warning/80 uppercase tracking-wider">Apply Streak</p>
              <p className="text-xl font-black text-warning leading-tight">{streak} day{streak !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          icon={Briefcase}
          label="Total Pipeline"
          value={total}
          sub={<><Clock size={11} /> {active} active applications</>}
          subColor="text-info"
          accent="violet"
        />
        <StatCard
          loading={loading}
          icon={Target}
          label="Avg AI Match"
          value={`${avgMatch}%`}
          sub={<><TrendingUp size={11} /> From {matched.length} scanned roles</>}
          subColor="text-success"
          accent="cyan"
        />
        <StatCard
          loading={loading}
          icon={FileText}
          label="Best ATS Score"
          value={bestResume ? `${bestResume.ats_score}/100` : '—'}
          sub={<><CheckCircle2 size={11} /> {bestResume?.title || 'No resume parsed yet'}</>}
          subColor="text-textMuted"
          accent="green"
        />
        <StatCard
          loading={loading}
          icon={XCircle}
          label="Rejection Rate"
          value={`${rejectRate}%`}
          sub={<><TrendingDown size={11} /> {rejected} rejection{rejected !== 1 ? 's' : ''} logged</>}
          subColor={rejectRate > 40 ? 'text-danger' : 'text-textMuted'}
          accent="red"
        />
      </div>

      {/* Match funnel + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Pipeline */}
        <div className="lg:col-span-2 glass-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <BarChart2 size={18} className="text-primary" />
              <h2 className="text-base font-bold text-textMain">Recent Pipeline</h2>
            </div>
            <Link to="/jobs" className="btn-ghost text-xs gap-1.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                <Briefcase size={24} className="text-textMuted/50" />
              </div>
              <p className="font-semibold text-textMain mb-1.5">Pipeline is empty</p>
              <p className="text-sm text-textMuted mb-4 max-w-xs">Start discovering and saving jobs to build your AI-tracked pipeline.</p>
              <Link to="/discover" className="btn-primary text-sm">
                <Search size={15} /> Discover Jobs
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Status</th>
                    <th>AI Match</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 6).map(job => {
                    const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.SAVED;
                    return (
                      <tr key={job._id} className="group">
                        <td className="py-3.5">
                          <p className="font-semibold text-textMain text-sm leading-tight">{job.job_id?.title}</p>
                          <p className="text-xs text-textMuted mt-0.5">{job.job_id?.company}</p>
                        </td>
                        <td><span className={cfg.cls}>{cfg.label}</span></td>
                        <td>
                          {job.match_analysis?.match_percentage
                            ? <MatchBar pct={job.match_analysis.match_percentage} />
                            : <span className="text-xs text-textMuted">Not scanned</span>
                          }
                        </td>
                        <td>
                          <Link to={`/application/${job.job_id?._id}`} className="btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Hub <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Zap size={18} className="text-warning" />
            <h2 className="text-base font-bold text-textMain">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <QuickAction
              to="/discover"
              icon={Search}
              label="Discover Jobs"
              description="Live roles from 50+ portals"
              colorCls="bg-primary/15 text-primary"
            />
            <QuickAction
              to="/resumes"
              icon={FileText}
              label="AI Resumes"
              description="Build Overleaf LaTeX resume"
              colorCls="bg-accent/15 text-accent"
            />
            <QuickAction
              to="/jobs"
              icon={Target}
              label="Job Pipeline"
              description="Generate cover letters & match"
              colorCls="bg-success/15 text-success"
            />
          </div>

          {/* Status breakdown */}
          {total > 0 && (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Status Breakdown</p>
              <div className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => {
                  const count = jobs.filter(j => j.status === key).length;
                  if (!count) return null;
                  const pct = Math.round((count / total) * 100);
                  const colors = { SAVED: '#64748B', APPLIED: '#3B82F6', INTERVIEWING: '#F59E0B', OFFER: '#10B981', REJECTED: '#EF4444' };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-textMuted font-medium">{label}</span>
                        <span className="font-bold tabular-nums" style={{ color: colors[key] }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill h-full" style={{ width: `${pct}%`, background: colors[key] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state for no resumes */}
          {resumes.length === 0 && !loading && (
            <div className="mt-5 p-4 rounded-xl bg-warning/8 border border-warning/20 flex items-start gap-3">
              <AlertCircle size={16} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-warning">No resume uploaded</p>
                <p className="text-xs text-textMuted mt-0.5">Upload & parse a resume to unlock AI matching.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight strip */}
      {avgMatch > 0 && (
        <div className="glass-elevated rounded-2xl p-5 flex items-center gap-5 border-l-2 border-primary relative overflow-hidden">
          <div className="glow-orb w-48 h-48 bg-primary/20 -top-16 -right-16" />
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 z-10">
            <Sparkles size={18} />
          </div>
          <div className="z-10 flex-1">
            <p className="text-sm font-bold text-textMain">AI Insight</p>
            <p className="text-xs text-textMuted mt-0.5">
              Your average match rate of <strong className="text-primary">{avgMatch}%</strong> across {matched.length} role{matched.length !== 1 ? 's' : ''}.
              {avgMatch < 65 ? ' Consider adding more skills to your resume to improve your fit.' : ' You are well-positioned — keep applying to high-match roles.'}
            </p>
          </div>
          <Link to="/discover" className="btn-secondary text-xs shrink-0 z-10">
            Discover More <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
