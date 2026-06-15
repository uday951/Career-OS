import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { 
  Play, Pause, Activity, Zap, CheckCircle2, AlertCircle, 
  Mail, Briefcase, Search, Target, Clock, Globe, Settings, FileText, ChevronRight 
} from 'lucide-react';

export default function AIAgentDashboard() {
  const { token, user } = useStore();
  const [agentStatus, setAgentStatus] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const socketRef = useRef(null);
  const activityEndRef = useRef(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAgentStatus();
    fetchApplications();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/jobs`, config);
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]);

  const initializeSocket = () => {
    socketRef.current = io(API_BASE, {
      transports: ['polling', 'websocket'],
      auth: { token }
    });

    socketRef.current.emit('join-agent-room', user._id);

    socketRef.current.on('activity', (data) => {
      setActivityLog(prev => [...prev, {
        ...data,
        timestamp: new Date()
      }]);
      fetchAgentStatus(true);
      if (data.action.includes('Submitted') || data.action.includes('Failed') || data.action.includes('Email')) {
        fetchApplications();
      }
    });

    socketRef.current.on('screenshot', (data) => {
      setScreenshot(data.screenshot);
      fetchApplications();
      fetchAgentStatus(true);
    });

    socketRef.current.on('agent-started', () => {
      setIsRunning(true);
      fetchAgentStatus();
    });

    socketRef.current.on('agent-stopped', () => {
      setIsRunning(false);
      fetchAgentStatus();
    });
  };

  const fetchAgentStatus = async (skipLogUpdate = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/agent/status`, config);
      setAgentStatus(data);
      setIsRunning(['searching', 'matching', 'applying'].includes(data.status));
      if (!skipLogUpdate && data.activity_log) {
        setActivityLog(data.activity_log.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  };

  const startAgent = async () => {
    try {
      await axios.post(`${API_BASE}/api/agent/start`, {}, config);
      setActivityLog([{
        action: 'AI Agent Starting',
        details: 'Initializing autonomous job search',
        status: 'info',
        timestamp: new Date()
      }]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to start agent';
      alert(errorMsg);
      
      // Add helpful error to activity log
      setActivityLog([{
        action: 'Failed to Start',
        details: errorMsg,
        status: 'error',
        timestamp: new Date()
      }]);
    }
  };

  const stopAgent = async () => {
    try {
      await axios.post(`${API_BASE}/api/agent/stop`, {}, config);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to stop agent');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={14} className="text-success" />;
      case 'error': return <AlertCircle size={14} className="text-danger" />;
      case 'warning': return <AlertCircle size={14} className="text-warning" />;
      default: return <Activity size={14} className="text-info" />;
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-primary" size={28} />
            AI Agent Dashboard
          </h1>
          <p className="text-textMuted mt-1">Real-time autonomous job application system</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/automation/settings" className="btn-ghost gap-2">
            <Settings size={16} />
            Settings
          </a>
          <button
            onClick={isRunning ? stopAgent : startAgent}
            className={`btn-primary gap-2 ${isRunning ? 'bg-danger hover:bg-danger/80' : ''}`}
          >
            {isRunning ? <><Pause size={16} /> Stop Agent</> : <><Play size={16} /> Start Agent</>}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {agentStatus && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 rounded-xl border-l-4 border-slate-500/40 hover:scale-[1.03] transition-all duration-300">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <Search size={14} className="text-slate-400" />
              Jobs Searched
            </div>
            <div className="text-2xl font-bold text-textMain">{agentStatus.stats?.jobs_searched || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-primary/40 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.1)]">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <Target size={14} className="text-primary" />
              Jobs Matched
            </div>
            <div className="text-2xl font-bold text-primary">{agentStatus.stats?.jobs_matched || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-warning/40 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <AlertCircle size={14} className="text-warning" />
              Jobs Skipped
            </div>
            <div className="text-2xl font-bold text-warning">{agentStatus.stats?.jobs_skipped || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-success/40 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <Briefcase size={14} className="text-success" />
              Applied
            </div>
            <div className="text-2xl font-bold text-success">{agentStatus.stats?.applications_submitted || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-danger/40 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <AlertCircle size={14} className="text-danger" />
              App Failed
            </div>
            <div className="text-2xl font-bold text-danger">{agentStatus.stats?.applications_failed || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-accent/40 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
              <Mail size={14} className="text-accent" />
              Emails Sent
            </div>
            <div className="text-2xl font-bold text-accent">{agentStatus.stats?.emails_sent || 0}</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Live Activity Feed */}
        <div className="glass-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-primary" size={18} />
            <h2 className="text-lg font-bold">Live Activity Feed</h2>
            {isRunning && <div className="w-2 h-2 rounded-full bg-success animate-pulse" />}
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {activityLog.length === 0 ? (
              <div className="text-center py-12 text-textMuted text-sm">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                No activity yet. Start the agent to begin.
              </div>
            ) : (
              activityLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-textMain truncate">{log.action}</span>
                      <span className="text-2xs text-textMuted whitespace-nowrap">{formatTime(log.timestamp)}</span>
                    </div>
                    <p className="text-xs text-textMuted mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={activityEndRef} />
          </div>
        </div>

        {/* Browser Preview */}
        <div className="glass-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-accent" size={18} />
            <h2 className="text-lg font-bold">Browser Preview</h2>
          </div>

          {screenshot ? (
            <div className="rounded-lg overflow-hidden border border-white/[0.1]">
              <img src={screenshot} alt="Browser screenshot" className="w-full" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="text-center text-textMuted">
                <Globe size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Browser preview will appear here</p>
                <p className="text-xs mt-1">when agent starts applying</p>
              </div>
            </div>
          )}

          {agentStatus?.current_url && (
            <div className="mt-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <p className="text-2xs text-textMuted">Current URL:</p>
              <p className="text-xs text-primary truncate">{agentStatus.current_url}</p>
            </div>
          )}
        </div>
      </div>

      {/* Setup Instructions (if no activity) */}
      {!isRunning && activityLog.length === 0 && (
        <div className="glass-elevated rounded-2xl p-6 border-l-4 border-primary">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Quick Setup Guide
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div>
                <p className="font-semibold text-textMain">Upload Your Resume</p>
                <p className="text-textMuted text-xs">Go to AI Resumes → Upload PDF → AI will parse your skills and experience</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div>
                <p className="font-semibold text-textMain">Configure Settings</p>
                <p className="text-textMuted text-xs">Click Settings → Add preferred roles (e.g., "Software Engineer") → Set locations → Enable automation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div>
                <p className="font-semibold text-textMain">Start the Agent</p>
                <p className="text-textMuted text-xs">Click "Start Agent" → AI will search jobs, match against your resume, and apply automatically</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => window.location.href = '/resumes'} className="btn-ghost text-xs">
              <FileText size={14} />
              Upload Resume
            </button>
            <button onClick={() => window.location.href = '/automation/settings'} className="btn-primary text-xs">
              <Settings size={14} />
              Configure Settings
            </button>
          </div>
        </div>
      )}

      {/* Current Activity Banner */}
      {agentStatus && (
        <div className={`glass-elevated rounded-xl p-4 border-l-4 transition-all duration-300 ${
          agentStatus.status === 'searching' ? 'border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.1)]' :
          agentStatus.status === 'matching' ? 'border-primary shadow-[0_0_10px_rgba(124,58,237,0.1)]' :
          agentStatus.status === 'applying' ? 'border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.1)]' :
          agentStatus.status === 'completed' ? 'border-success shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
          agentStatus.status === 'failed' ? 'border-danger shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
          agentStatus.status === 'paused' ? 'border-warning shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
          'border-slate-600'
        }`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                agentStatus.status === 'searching' ? 'bg-sky-500/20 text-sky-400' :
                agentStatus.status === 'matching' ? 'bg-primary/20 text-primary' :
                agentStatus.status === 'applying' ? 'bg-teal-500/20 text-teal-400' :
                agentStatus.status === 'completed' ? 'bg-success/20 text-success' :
                agentStatus.status === 'failed' ? 'bg-danger/20 text-danger' :
                agentStatus.status === 'paused' ? 'bg-warning/20 text-warning' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {isRunning ? (
                  <Activity className="animate-pulse" size={16} />
                ) : agentStatus.status === 'completed' ? (
                  <CheckCircle2 size={16} />
                ) : agentStatus.status === 'failed' ? (
                  <AlertCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-textMuted font-medium uppercase tracking-wider">
                    Agent Status: <span className="font-bold">{agentStatus.status}</span>
                  </p>
                  {isRunning && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary animate-pulse">
                      Active Run
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-textMain mt-0.5">
                  {agentStatus.current_activity || 'Ready to start'}
                </p>
                {agentStatus.current_job_title && isRunning && (
                  <p className="text-xs text-textMuted mt-0.5">
                    Target: <span className="text-textMain font-medium">{agentStatus.current_job_title}</span> at <span className="text-textMain font-medium">{agentStatus.current_company}</span>
                  </p>
                )}
                {agentStatus.status === 'failed' && agentStatus.error_message && (
                  <p className="text-xs text-danger mt-0.5 font-medium">
                    Error: {agentStatus.error_message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Show queue progress if running */}
            {isRunning && agentStatus.pending_tasks !== undefined && (
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-lg">
                <Clock size={12} className="text-textMuted" />
                <span className="text-xs text-textMuted">
                  Tasks in pipeline: <strong className="text-textMain font-bold">{agentStatus.pending_tasks}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Applications & Report Table */}
      <div className="glass-elevated rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Briefcase className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-textMain">Live Applications & Report</h2>
          </div>
          <button 
            onClick={fetchApplications}
            className="btn-ghost text-xs gap-1.5"
          >
            <Clock size={14} /> Refresh Report
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 text-textMuted text-sm bg-white/[0.01] rounded-xl border border-white/[0.03]">
            <Briefcase size={36} className="mx-auto mb-3 opacity-40" />
            No applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-textMuted font-semibold">
                  <th className="pb-3 pl-2">Job Details</th>
                  <th className="pb-3">Date Applied</th>
                  <th className="pb-3 text-center">Match Score</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-sm">
                {applications.map((app) => {
                  const statusColors = {
                    SAVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                    APPLYING: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                    APPLIED: 'bg-success/10 text-success border-success/20',
                    FAILED: 'bg-danger/10 text-danger border-danger/20',
                    INTERVIEWING: 'bg-warning/10 text-warning border-warning/20',
                    OFFERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
                    PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  };
                  const statusLabels = {
                    SAVED: 'Saved',
                    APPLYING: 'Applying…',
                    APPLIED: '✅ Applied',
                    FAILED: '❌ Failed',
                    INTERVIEWING: 'Interviewing',
                    OFFERED: '🎉 Offered',
                    REJECTED: 'Rejected',
                    PENDING_REVIEW: '👆 Apply Manually',
                  };
                  const statusCls = statusColors[app.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                  const statusLabel = statusLabels[app.status] || app.status;
                  
                  return (
                    <tr key={app._id} className={`hover:bg-white/[0.02] transition-colors group ${app.status === 'PENDING_REVIEW' ? 'bg-amber-500/[0.03]' : ''}`}>
                      <td className="py-4 pl-2">
                        <div className="font-semibold text-textMain">{app.job_id?.title || 'Unknown Role'}</div>
                        <div className="text-xs text-textMuted flex items-center gap-1.5 mt-0.5">
                          <span>{app.job_id?.company}</span>
                          <span>&bull;</span>
                          <span>{app.job_id?.location || 'Remote'}</span>
                        </div>
                        {app.status === 'PENDING_REVIEW' && app.application_url && (
                          <a
                            href={app.application_url || app.job_id?.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline mt-0.5 inline-block truncate max-w-[180px]"
                          >
                            {app.application_url || app.job_id?.job_url}
                          </a>
                        )}
                      </td>
                      <td className="py-4 text-textMuted text-xs">
                        {app.applied_on ? new Date(app.applied_on).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Pending'}
                      </td>
                      <td className="py-4 text-center font-semibold text-xs">
                        {app.match_score !== undefined ? (
                          <span className={`px-2 py-0.5 rounded ${
                            app.match_score >= 85 ? 'text-success' : app.match_score >= 70 ? 'text-warning' : 'text-danger'
                          }`}>
                            {app.match_score}%
                          </span>
                        ) : '--'}
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusCls}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {app.screenshot_url && (
                            <button
                              onClick={() => setSelectedScreenshot({
                                title: app.job_id?.title,
                                company: app.job_id?.company,
                                url: app.screenshot_url
                              })}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-textMain transition-all active:scale-[0.97]"
                            >
                              Screenshot
                            </button>
                          )}
                          {/* For PENDING_REVIEW: show direct apply link */}
                          {app.status === 'PENDING_REVIEW' && (app.application_url || app.job_id?.job_url) && (
                            <a
                              href={app.application_url || app.job_id?.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/80 text-white hover:bg-amber-500 transition-all flex items-center gap-1 active:scale-[0.97]"
                            >
                              Apply Now <ChevronRight size={12} />
                            </a>
                          )}
                          <a
                            href={`/application/${app._id}`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primaryHover hover:shadow-glow-violet transition-all flex items-center gap-1 active:scale-[0.97]"
                          >
                            Details <ChevronRight size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div 
            className="relative max-w-4xl w-full glass-elevated border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-lg text-textMain">Application Submission Screenshot</h3>
                <p className="text-xs text-textMuted">{selectedScreenshot.title} at {selectedScreenshot.company}</p>
              </div>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="text-textMuted hover:text-textMain text-sm font-bold bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.04] custom-scrollbar">
              <img 
                src={selectedScreenshot.url} 
                alt="Form submission receipt" 
                className="w-full h-auto block" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
