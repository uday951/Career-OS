import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { Link } from 'react-router-dom';
import {
  Zap, Settings, BarChart3, Clock, CheckCircle2, XCircle,
  TrendingUp, Target, Play, Pause, Loader2, ChevronRight,
  AlertCircle, Briefcase, FileText, Activity
} from 'lucide-react';

const STATUS_COLORS = {
  SAVED: 'bg-gray-500/20 text-gray-400',
  APPLYING: 'bg-teal-500/20 text-teal-400',
  APPLIED: 'bg-blue-500/20 text-blue-400',
  FAILED: 'bg-rose-500/20 text-rose-400',
  INTERVIEWING: 'bg-amber-500/20 text-amber-400',
  OFFER: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  PENDING_REVIEW: 'bg-purple-500/20 text-purple-400',
};

function StatCard({ icon: Icon, label, value, sub, accent, loading }) {
  const colorMap = {
    violet: 'bg-primary/15 text-primary',
    cyan: 'bg-accent/15 text-accent',
    green: 'bg-success/15 text-success',
    red: 'bg-danger/15 text-danger',
    amber: 'bg-warning/15 text-warning',
  };
  const glowMap = {
    violet: 'bg-primary/40',
    cyan: 'bg-accent/30',
    green: 'bg-success/30',
    red: 'bg-danger/30',
    amber: 'bg-warning/30',
  };
  const iconCls = colorMap[accent] || colorMap.violet;
  const glowCls = glowMap[accent] || glowMap.violet;

  return (
    <div className="stat-card group">
      <div className={`glow-orb w-32 h-32 -top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${glowCls}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconCls}`}>
            <Icon size={15} />
          </div>
        </div>
        {loading
          ? <div className="skeleton h-9 w-24 mb-3" />
          : <div className="text-3xl font-bold text-textMain tracking-tight mb-3">{value}</div>
        }
        <p className="text-xs font-medium text-textMuted">{sub}</p>
      </div>
    </div>
  );
}

export default function AutomationDashboard() {
  const { token } = useStore();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/automation/dashboard`, config);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomation = async () => {
    const newState = !dashboardData?.stats?.automation_enabled;
    try {
      await axios.patch(`${API_BASE}/api/automation/settings/toggle`, { enabled: newState }, config);
      setDashboardData(prev => prev ? {
        ...prev,
        stats: { ...prev.stats, automation_enabled: newState, automation_status: newState ? 'idle' : 'paused' }
      } : prev);
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await axios.post(`${API_BASE}/api/automation/run`, {}, config);
      setTimeout(fetchDashboard, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start automation');
    } finally {
      setRunning(false);
    }
  };

  const stats = dashboardData?.stats;
  const statusBreakdown = dashboardData?.status_breakdown || {};
  const recentApps = dashboardData?.recent_applications || [];
  const topMatches = dashboardData?.top_matches || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-primary" size={28} />
            Automation Hub
          </h1>
          <p className="text-textMuted mt-1">AI-powered job application automation engine</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/automation/settings" className="btn-secondary text-xs gap-2">
            <Settings size={15} /> Configure
          </Link>
          <Link to="/automation/reports" className="btn-ghost text-xs gap-2">
            <BarChart3 size={15} /> Reports
          </Link>
        </div>
      </div>

      <div className={`rounded-2xl p-5 flex items-center gap-4 border ${
        stats?.automation_enabled
          ? 'bg-success/8 border-success/20'
          : 'bg-white/[0.03] border-white/[0.08]'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          stats?.automation_enabled ? 'bg-success/15 text-success' : 'bg-white/[0.05] text-textMuted'
        }`}>
          {stats?.automation_status === 'running' ? (
            <Loader2 className="animate-spin" size={22} />
          ) : stats?.automation_enabled ? (
            <Activity size={22} />
          ) : (
            <Pause size={22} />
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-textMain">
            Automation is {stats?.automation_enabled ? 'Active' : 'Paused'}
          </p>
          <p className="text-sm text-textMuted">
            {stats?.automation_enabled
              ? `Status: ${stats.automation_status} · Last run: ${stats.last_run ? new Date(stats.last_run).toLocaleString() : 'Never'}`
              : 'Enable automation to start automatically applying to matched jobs daily.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunNow}
            disabled={running || !stats?.automation_enabled}
            className="btn-primary text-xs gap-2"
          >
            {running ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
            Run Now
          </button>
          <button
            onClick={handleToggleAutomation}
            className={`text-xs px-4 py-2 rounded-lg font-bold border transition-all ${
              stats?.automation_enabled
                ? 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'
                : 'bg-success/10 text-success border-success/30 hover:bg-success/20'
            }`}
          >
            {stats?.automation_enabled ? 'Pause' : 'Enable'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-danger text-sm">{error}</p>
            <p className="text-xs text-textMuted mt-1">Make sure the backend server is running.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          icon={Briefcase}
          label="Total Jobs"
          value={stats?.total_jobs || 0}
          sub="In database"
          accent="violet"
        />
        <StatCard
          loading={loading}
          icon={FileText}
          label="Applications"
          value={stats?.total_applications || 0}
          sub={`${stats?.total_applications_submitted || 0} via automation`}
          accent="cyan"
        />
        <StatCard
          loading={loading}
          icon={Target}
          label="Avg Match Score"
          value={`${stats?.average_match_score || 0}%`}
          sub="Across all matches"
          accent="green"
        />
        <StatCard
          loading={loading}
          icon={Clock}
          label="Auto Runs"
          value={stats?.last_run ? 'Today' : 'Never'}
          sub={stats?.last_run ? new Date(stats.last_run).toLocaleDateString() : 'No runs yet'}
          accent="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Activity size={18} className="text-primary" />
              <h2 className="text-base font-bold text-textMain">Recent Applications</h2>
            </div>
            <Link to="/jobs" className="btn-ghost text-xs gap-1.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-36" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} className="text-textMuted/50" />
              </div>
              <p className="font-semibold text-textMain mb-1">No applications yet</p>
              <p className="text-sm text-textMuted">Configure and run automation to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentApps.map((app, i) => {
                const statCls = STATUS_COLORS[app.status] || 'bg-gray-500/20 text-gray-400';
                return (
                  <div key={app._id || i} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Briefcase size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textMain truncate">{app.job_id?.title || 'Unknown Role'}</p>
                      <p className="text-xs text-textMuted truncate">{app.job_id?.company} &middot; {app.job_id?.location || 'Remote'}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statCls}`}>
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-elevated rounded-2xl p-6">
            <h3 className="text-sm font-bold text-textMain mb-4">Status Breakdown</h3>
            {Object.keys(statusBreakdown).length === 0 ? (
              <p className="text-xs text-textMuted text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]) => {
                  const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
                  const pct = Math.round((count / total) * 100);
                  const colorMap = {
                    saved: '#64748B', applied: '#3B82F6', interviewing: '#F59E0B',
                    offer: '#10B981', rejected: '#EF4444', pending_review: '#8B5CF6'
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-textMuted font-medium capitalize">{status.replace(/_/g, ' ')}</span>
                        <span className="font-bold tabular-nums" style={{ color: colorMap[status] || '#64748B' }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill h-full" style={{ width: `${pct}%`, background: colorMap[status] || '#64748B' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {topMatches.length > 0 && (
            <div className="glass-elevated rounded-2xl p-6">
              <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-success" /> Top Matches
              </h3>
              <div className="space-y-3">
                {topMatches.map((match, i) => (
                  <div key={match._id || i} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-textMain truncate">{match.job_id?.title}</p>
                      <p className="text-2xs text-textMuted">{match.job_id?.company}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="progress-bar w-12">
                        <div className="progress-fill" style={{
                          width: `${match.overall_score}%`,
                          background: match.overall_score >= 80 ? '#10B981' : match.overall_score >= 60 ? '#F59E0B' : '#EF4444'
                        }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums">{match.overall_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-elevated rounded-2xl p-6">
        <h2 className="text-base font-bold text-textMain mb-5 flex items-center gap-2.5">
          <Zap size={18} className="text-warning" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/automation/settings" className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Settings size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-textMain">Automation Settings</p>
              <p className="text-xs text-textMuted truncate">Configure roles, locations, thresholds</p>
            </div>
            <ChevronRight size={16} className="text-textMuted group-hover:text-textMain transition-all shrink-0" />
          </Link>
          <Link to="/automation/reports" className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <BarChart3 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-textMain">Report History</p>
              <p className="text-xs text-textMuted truncate">View daily/weekly automation reports</p>
            </div>
            <ChevronRight size={16} className="text-textMuted group-hover:text-textMain transition-all shrink-0" />
          </Link>
          <Link to="/discover" className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
              <Target size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-textMain">Discover Jobs</p>
              <p className="text-xs text-textMuted truncate">Find new roles for automation</p>
            </div>
            <ChevronRight size={16} className="text-textMuted group-hover:text-textMain transition-all shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
