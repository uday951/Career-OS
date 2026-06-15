import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import {
  BarChart3, Loader2, AlertCircle, ChevronDown, FileText,
  Calendar, Clock, TrendingUp, Target, Briefcase, CheckCircle2, XCircle
} from 'lucide-react';

const REPORT_TYPE_CONFIG = {
  daily: { label: 'Daily', color: 'text-primary bg-primary/10 border-primary/20' },
  weekly: { label: 'Weekly', color: 'text-accent bg-accent/10 border-accent/20' },
  monthly: { label: 'Monthly', color: 'text-success bg-success/10 border-success/20' },
};

export default function ReportHistory() {
  const { token } = useStore();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const { data } = await axios.get(`${API_BASE}/api/automation/reports${params}`, config);
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const generateReport = async () => {
    try {
      await axios.post(`${API_BASE}/api/automation/reports/generate`, {}, config);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate report');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="text-primary" size={28} />
            Report History
          </h1>
          <p className="text-textMuted mt-1">Track automation performance over time</p>
        </div>
        <button onClick={generateReport} className="btn-primary text-xs gap-2">
          <FileText size={14} /> Generate Report
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-danger">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Reports' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ].map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              filter === tab.value
                ? 'bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10'
                : 'bg-white/[0.03] text-textMuted border-white/[0.08] hover:border-white/[0.2]'
            }`}>{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <BarChart3 size={28} className="text-textMuted/50" />
          </div>
          <p className="text-lg font-bold text-textMain mb-1">No reports yet</p>
          <p className="text-sm text-textMuted mb-6">Reports are generated automatically when automation runs.</p>
          <button onClick={generateReport} className="btn-primary text-sm gap-2">
            <FileText size={15} /> Generate Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const typeCfg = REPORT_TYPE_CONFIG[report.type] || REPORT_TYPE_CONFIG.daily;
            const isExpanded = expanded === report._id;
            const m = report.metrics || {};

            return (
              <div key={report._id} className="glass-elevated rounded-2xl overflow-hidden transition-all">
                <button onClick={() => setExpanded(isExpanded ? null : report._id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeCfg.color}`}>
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span className="text-sm font-semibold text-textMain">
                          {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-textMuted">
                        <span className="flex items-center gap-1">
                          <Target size={11} className="text-primary" /> {m.jobs_scanned} scanned
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-success" /> {m.applications_submitted} submitted
                        </span>
                        {m.avg_match_score > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp size={11} className="text-info" /> {m.avg_match_score}% avg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-textMuted">{new Date(report.createdAt).toLocaleDateString()}</span>
                    <ChevronDown size={16} className={`text-textMuted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-white/[0.06] animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.06]">
                        <p className="text-2xl font-bold text-textMain">{m.jobs_scanned}</p>
                        <p className="text-2xs text-textMuted mt-1 uppercase tracking-wider">Jobs Scanned</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.06]">
                        <p className="text-2xl font-bold text-success">{m.jobs_matched}</p>
                        <p className="text-2xs text-textMuted mt-1 uppercase tracking-wider">Jobs Matched</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.06]">
                        <p className="text-2xl font-bold text-primary">{m.applications_submitted}</p>
                        <p className="text-2xs text-textMuted mt-1 uppercase tracking-wider">Submitted</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-4 text-center border border-white/[0.06]">
                        <p className={`text-2xl font-bold ${m.applications_failed > 0 ? 'text-danger' : 'text-textMain'}`}>
                          {m.applications_failed}
                        </p>
                        <p className="text-2xs text-textMuted mt-1 uppercase tracking-wider">Failed</p>
                      </div>
                    </div>

                    {report.summary && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-primary mb-1.5">Summary</p>
                        <p className="text-sm text-textMuted">{report.summary}</p>
                      </div>
                    )}

                    {report.top_matches?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Top Matches</p>
                        <div className="space-y-2">
                          {report.top_matches.map((match, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-4 py-2.5 border border-white/[0.04]">
                              <div>
                                <p className="text-sm font-semibold text-textMain">{match.job_title}</p>
                                <p className="text-xs text-textMuted">{match.company}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold">{match.match_score}%</span>
                                <span className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                                  match.status === 'APPLIED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                }`}>{match.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.recommendations?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Recommendations</p>
                        <ul className="space-y-1.5">
                          {report.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-textMuted">
                              <span className="text-primary mt-0.5">&bull;</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
