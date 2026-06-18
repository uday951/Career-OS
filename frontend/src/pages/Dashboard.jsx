import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Activity, Zap, CheckCircle2, AlertCircle, 
  Mail, Briefcase, Search, Target, Clock, Globe, Settings, 
  FileText, ChevronRight, Sparkles, Loader2, Lock, Flame, ArrowRight,
  TrendingUp, BarChart2, Calendar
} from 'lucide-react';
import useStore from '../store/useStore';
import API_BASE from '../config/api';

const STATUS_CONFIG = {
  SAVED:                { label: 'Saved',              cls: 'badge-neutral' },
  APPLYING:             { label: 'Applying...',         cls: 'badge-info animate-pulse' },
  APPLIED:              { label: 'Applied',            cls: 'badge-success' },
  FAILED:               { label: 'Crawl Error',        cls: 'badge-danger' },
  INTERVIEWING:         { label: 'Interviewing',       cls: 'badge-warning' },
  INTERVIEW_SCHEDULED:  { label: 'Interview Scheduled',cls: 'badge-warning' },
  OFFER:                { label: 'Offer Received',     cls: 'badge-success' },
  OFFER_RECEIVED:       { label: 'Offer Received',     cls: 'badge-success font-black border-accent/30' },
  REJECTED:             { label: 'Rejected',           cls: 'badge-danger' },
  PENDING_REVIEW:       { label: 'Review Required',    cls: 'badge-warning' }
};

export default function Dashboard() {
  const { token, user, resumes, setResumes, jobs, setJobs } = useStore();
  const navigate = useNavigate();

  // Component States
  const [agentStatus, setAgentStatus] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [emails, setEmails] = useState([]);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'outreach'
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const logContainerRef = useRef(null);
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch initial data
  useEffect(() => {
    if (!token) return;

    const loadAllData = async () => {
      try {
        const [jRes, rRes, aStatus, dStats, eRes] = await Promise.all([
          axios.get(`${API_BASE}/api/jobs`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/resumes`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/api/agent/status`, config).catch(() => ({ data: null })),
          axios.get(`${API_BASE}/api/automation/dashboard`, config).catch(() => ({ data: null })),
          axios.get(`${API_BASE}/api/agent/emails`, config).catch(() => ({ data: { emails: [] } }))
        ]);

        setJobs(jRes.data);
        setResumes(rRes.data);
        if (dStats && dStats.data) {
          setDashboardStats(dStats.data);
        }
        if (eRes && eRes.data) {
          setEmails(eRes.data.emails || []);
        }

        if (aStatus && aStatus.data) {
          setAgentStatus(aStatus.data);
          setIsRunning(['searching', 'matching', 'applying'].includes(aStatus.data.status));
          if (aStatus.data.activity_log) {
            setActivityLog(aStatus.data.activity_log.map(log => ({
              ...log,
              timestamp: new Date(log.timestamp)
            })));
          }
          if (aStatus.data.browser_state?.screenshot_url) {
            setScreenshot(aStatus.data.browser_state.screenshot_url);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom || activityLog.length <= 1) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [activityLog]);

  const initializeSocket = () => {
    socketRef.current = io(API_BASE, {
      transports: ['polling', 'websocket'],
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-agent-room', user._id);
    });

    socketRef.current.on('activity', (data) => {
      setActivityLog(prev => [...prev, {
        ...data,
        timestamp: new Date()
      }]);
      fetchAgentStatus(true);
      fetchDashboardStats();
      if (data.action.includes('Submitted') || data.action.includes('Failed') || data.action.includes('Email') || data.action.includes('Outreach')) {
        fetchJobs();
      }
    });

    socketRef.current.on('screenshot', (data) => {
      setScreenshot(data.screenshot);
      fetchJobs();
      fetchAgentStatus(true);
      fetchDashboardStats();
    });

    socketRef.current.on('agent-started', () => {
      setIsRunning(true);
      fetchAgentStatus();
      fetchDashboardStats();
    });

    socketRef.current.on('agent-stopped', () => {
      setIsRunning(false);
      fetchAgentStatus();
      fetchDashboardStats();
    });
  };

  const fetchDashboardStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/automation/dashboard`, config);
      setDashboardStats(data);
    } catch (error) {
      console.error('Failed to refresh dashboard stats:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const [jData, eData] = await Promise.all([
        axios.get(`${API_BASE}/api/jobs`, config),
        axios.get(`${API_BASE}/api/agent/emails`, config)
      ]);
      setJobs(jData.data);
      setEmails(eData.data.emails || []);
      fetchDashboardStats();
    } catch (error) {
      console.error('Failed to refresh applications/emails:', error);
    }
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
      if (data.browser_state?.screenshot_url) {
        setScreenshot(data.browser_state.screenshot_url);
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
        details: 'Initializing autonomous job search crawler',
        status: 'info',
        timestamp: new Date()
      }]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to start agent';
      alert(errorMsg);
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
      case 'success': return <CheckCircle2 size={13} className="text-success" />;
      case 'error': return <AlertCircle size={13} className="text-danger" />;
      case 'warning': return <AlertCircle size={13} className="text-warning" />;
      default: return <Activity size={13} className="text-info" />;
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Compute metrics
  const todayStr = new Date().toDateString();
  const jobsFoundToday = jobs.filter(j => new Date(j.createdAt).toDateString() === todayStr).length;
  
  const applicationsSent = jobs.filter(j => 
    ['APPLIED', 'INTERVIEWING', 'INTERVIEW_SCHEDULED', 'OFFER', 'OFFER_RECEIVED', 'REJECTED'].includes(j.status)
  ).length;

  const recruiterEmailsSent = emails.length;

  const interviewsScheduled = jobs.filter(j => 
    ['INTERVIEWING', 'INTERVIEW_SCHEDULED'].includes(j.status)
  ).length;

  const replies = emails.filter(e => e.status === 'replied' || e.reply_received).length;
  const successRate = recruiterEmailsSent > 0 ? Math.round((replies / recruiterEmailsSent) * 100) : 0;

  const bestResume = resumes.reduce((m, r) => (r.ats_score > (m?.ats_score || 0) ? r : m), null);
  const atsScore = bestResume?.ats_score || 0;

  const getProfileStrength = () => {
    if (!bestResume || !bestResume.parsed_data) return 20;
    let score = 25; // Base for upload
    const data = bestResume.parsed_data;
    if (bestResume.title) score += 10;
    if (data.work_history && data.work_history.length > 0) score += 20;
    if (data.education && data.education.length > 0) score += 15;
    if (data.master_skills && data.master_skills.length > 0) score += 15;
    if (data.summary) score += 15;
    return Math.min(score, 100);
  };
  const profileStrength = getProfileStrength();

  const matchedJobs = jobs.filter(j => j.match_analysis?.match_percentage);
  const avgMatch = matchedJobs.length ? Math.round(matchedJobs.reduce((s, j) => s + j.match_analysis.match_percentage, 0) / matchedJobs.length) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 text-textMain">
      
      {/* Jumbotron Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface to-[#0a0d18] border border-white/[0.05] p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="space-y-2 relative z-10">
          <p className="text-2xs font-extrabold tracking-widest text-primary uppercase">MISSION CONTROL CENTER</p>
          <h1 className="text-3xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-textMain via-slate-100 to-textMuted">
            AI Job Search Co-Pilot
          </h1>
          <p className="text-xs text-textMuted max-w-xl">
            Monitor crawls, analyze ATS relevance, draft auto-tailored cover letters, and dispatch recruiter outreach campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button 
            onClick={() => navigate('/settings')}
            className="btn-secondary text-xs !py-3 !px-5"
          >
            <Settings size={15} />
            <span>Configure Agent</span>
          </button>
          <button
            onClick={isRunning ? stopAgent : startAgent}
            className={`btn-primary text-xs !py-3 !px-5 ${isRunning ? 'bg-danger/80 hover:bg-danger text-white shadow-none' : ''}`}
          >
            {isRunning ? (
              <><Pause size={15} /> <span>Stop AI Crawler</span></>
            ) : (
              <><Play size={15} /> <span>Start AI Agent</span></>
            )}
          </button>
        </div>
      </div>

      {/* Main 7-Module Stats Command Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="glass-card p-4 border-t-2 border-t-blue-500">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Search size={12} className="text-blue-400" /> Jobs Found</p>
          <p className="text-2xl font-black text-textMain">{jobsFoundToday}</p>
          <span className="text-[9px] text-textDim">Discovered today</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-primary">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={12} className="text-primary" /> Applied</p>
          <p className="text-2xl font-black text-textMain">{applicationsSent}</p>
          <span className="text-[9px] text-textDim">Submitted pipeline</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-accent">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail size={12} className="text-accent" /> Outreach</p>
          <p className="text-2xl font-black text-textMain">{recruiterEmailsSent}</p>
          <span className="text-[9px] text-textDim">Recruiters contacted</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-warning">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={12} className="text-warning" /> Interviews</p>
          <p className="text-2xl font-black text-textMain">{interviewsScheduled}</p>
          <span className="text-[9px] text-textDim">Meetings scheduled</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-success">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Success Rate</p>
          <p className="text-2xl font-black text-success">{successRate}%</p>
          <span className="text-[9px] text-textDim">Response / Outreach</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-violet-400">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target size={12} className="text-violet-400" /> ATS Score</p>
          <p className="text-2xl font-black text-violet-400">{atsScore}</p>
          <span className="text-[9px] text-textDim">Best profile rating</span>
        </div>
        <div className="glass-card p-4 border-t-2 border-t-emerald-500">
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5"><Flame size={12} className="text-emerald-500" /> Profile Strength</p>
          <p className="text-2xl font-black text-emerald-500">{profileStrength}%</p>
          <span className="text-[9px] text-textDim">Profile completeness</span>
        </div>
      </div>

      {/* Split Console + Browser Simulator Viewport */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Live Activity Center */}
        <div className="glass-elevated p-6 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="text-primary animate-pulse" size={18} />
              <h2 className="text-base font-bold text-textMain">Live Activity Center</h2>
              {isRunning && <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />}
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-textDim bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">Telemetry log</span>
          </div>

          <div ref={logContainerRef} className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 text-2xs font-mono">
            {activityLog.length === 0 ? (
              <div className="text-center py-24 text-textDim flex flex-col items-center justify-center">
                <Clock size={32} className="opacity-20 mb-3" />
                <p className="font-semibold text-textMuted text-xs">Console is standby</p>
                <p className="text-textDim text-[10px] mt-1 max-w-[240px]">Start the AI Agent to trace job aggregate scans and easy-applies.</p>
              </div>
            ) : (
              activityLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] transition-all">
                  <div className="mt-0.5 shrink-0">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-textMain truncate text-xs">{log.action}</span>
                      <span className="text-textDim whitespace-nowrap">{formatTime(log.timestamp)}</span>
                    </div>
                    <p className="text-textMuted mt-0.5 leading-relaxed text-xs">{log.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Browser Simulator Viewport */}
        <div className="glass-elevated p-6 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Globe className="text-accent" size={18} />
              <h2 className="text-base font-bold text-textMain">Live Browser Simulator</h2>
            </div>
            {agentStatus?.current_url && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">Playwright viewport</span>
            )}
          </div>

          {/* Browser Shell Mockup */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 shadow-inner">
            {/* Top address bar */}
            <div className="bg-white/[0.03] px-4 py-2 flex items-center gap-2 border-b border-white/[0.06] shrink-0 select-none">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-2 bg-black/45 rounded-md border border-white/[0.06] px-2.5 py-0.5 text-[10px] text-textMuted font-mono truncate flex items-center gap-1.5">
                <Lock size={9} className="text-success shrink-0" />
                {agentStatus?.current_url || 'chrome://dashboard-viewport'}
              </div>
            </div>

            {/* Simulated browser page content */}
            <div className="flex-1 overflow-auto bg-[#181820] flex items-center justify-center p-1 relative">
              {screenshot ? (
                <img src={screenshot} alt="Agent browser preview" className="max-w-full max-h-full object-contain mx-auto" />
              ) : (
                <div className="text-center text-textMuted p-6 max-w-sm flex flex-col items-center justify-center">
                  <Globe size={40} className="opacity-20 mb-3 text-textMuted" />
                  <p className="text-xs font-bold text-textMain">No active browser session</p>
                  <p className="text-[10px] text-textMuted mt-1 leading-relaxed">
                    When the AI crawler executes applies on company portals, screenshots will render here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Main Stats, Pipelines Table, and Action Panels */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Pipeline & Outreach Records Tab */}
        <div className="lg:col-span-2 glass-elevated p-6 flex flex-col min-h-[460px]">
          <div className="flex items-center justify-between mb-5 border-b border-white/[0.06] pb-3 shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`pb-2 text-sm font-bold transition-all relative ${
                  activeTab === 'pipeline' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-textMuted hover:text-textMain'
                }`}
              >
                Applications Pipeline ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('outreach')}
                className={`pb-2 text-sm font-bold transition-all relative ${
                  activeTab === 'outreach' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-textMuted hover:text-textMain'
                }`}
              >
                Recruiter Outreach ({emails.length})
              </button>
            </div>
            <button 
              onClick={fetchJobs}
              className="btn-secondary !py-1 px-3 text-xs"
            >
              Sync Dashboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'pipeline' ? (
              jobs.length === 0 ? (
                <div className="text-center py-20 text-textMuted flex flex-col items-center justify-center">
                  <Briefcase size={32} className="opacity-20 mb-3" />
                  <p className="text-xs font-semibold text-textMuted">No applications yet</p>
                  <p className="text-[10px] text-textDim mt-1">Discovered target jobs will appear in this pipeline list.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] text-textMuted font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Job Details</th>
                        <th className="pb-3">Crawl Date</th>
                        <th className="pb-3 text-center">Fit %</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs">
                      {jobs.slice(0, 10).map((app) => {
                        const status = app.status || 'SAVED';
                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED;
                        return (
                          <tr key={app._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3.5 pl-2 max-w-[200px]">
                              <div className="font-bold text-textMain truncate">{app.job_id?.title || 'Unknown Role'}</div>
                              <div className="text-[10px] text-textMuted mt-0.5 flex items-center gap-1.5">
                                <span className="font-semibold text-primary">{app.job_id?.company}</span>
                                <span>&bull;</span>
                                <span className="text-textDim">{app.job_id?.location || 'Remote'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 text-textMuted">
                              {app.applied_on ? new Date(app.applied_on).toLocaleDateString() : 'Awaiting Crawl'}
                            </td>
                            <td className="py-3.5 text-center font-bold">
                              {app.match_score !== undefined ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  app.match_score >= 80 ? 'text-success bg-success/10' : app.match_score >= 60 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'
                                }`}>
                                  {app.match_score}%
                                </span>
                              ) : '--'}
                            </td>
                            <td className="py-3.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.cls}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {app.screenshot_url && (
                                  <button
                                    onClick={() => setSelectedScreenshot({
                                      title: app.job_id?.title,
                                      company: app.job_id?.company,
                                      url: app.screenshot_url
                                    })}
                                    className="px-2.5 py-1 border border-white/[0.08] hover:bg-white/[0.05] rounded-lg text-[10px] font-bold text-textMain transition-all active:scale-[0.97]"
                                  >
                                    View Screen
                                  </button>
                                )}
                                <Link
                                  to={`/application/${app._id}`}
                                  className="px-2.5 py-1 bg-primary hover:brightness-110 text-white rounded-lg text-[10px] font-bold transition-all active:scale-[0.97]"
                                >
                                  Hub
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              emails.length === 0 ? (
                <div className="text-center py-20 text-textMuted flex flex-col items-center justify-center">
                  <Mail size={32} className="opacity-20 mb-3" />
                  <p className="text-xs font-semibold text-textMuted">No outreach sent yet</p>
                  <p className="text-[10px] text-textDim mt-1">Connect Gmail and trigger applications to dispatch outreach emails.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] text-textMuted font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Recruiter & Company</th>
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Date Sent</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs">
                      {emails.slice(0, 10).map((email) => {
                        const statusColors = {
                          sent: 'bg-white/[0.04] text-textMuted border-white/[0.08]',
                          delivered: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                          opened: 'bg-warning/10 text-warning border-warning/20',
                          replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black animate-pulse',
                          failed: 'bg-danger/10 text-danger border-danger/20',
                        };
                        const statusCls = statusColors[email.status] || 'bg-white/[0.04] text-textMuted border-white/[0.08]';
                        return (
                          <tr key={email._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3.5 pl-2 max-w-[200px]">
                              <div className="font-bold text-textMain truncate">{email.recipient_name || 'Hiring Team'}</div>
                              <div className="text-[10px] text-textDim mt-0.5 truncate">{email.recipient_email}</div>
                            </td>
                            <td className="py-3.5 text-textMuted max-w-[250px]">
                              <div className="font-semibold text-textMain truncate">{email.subject}</div>
                              <div className="text-[10px] text-textDim truncate mt-0.5">{email.company} &bull; {email.job_title}</div>
                            </td>
                            <td className="py-3.5 text-textMuted">
                              {new Date(email.sent_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${statusCls}`}>
                                {email.status}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedEmail(email)}
                                  className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] rounded-lg text-[10px] font-bold text-textMain transition-all active:scale-[0.97]"
                                >
                                  Read
                                </button>
                                {email.application_id && (
                                  <Link
                                    to={`/application/${email.application_id}`}
                                    className="px-2.5 py-1 bg-primary hover:brightness-110 text-white rounded-lg text-[10px] font-bold transition-all active:scale-[0.97]"
                                  >
                                    Hub
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar Actions & Insights */}
        <div className="space-y-6">
          
          {/* Quick Shortcuts */}
          <div className="glass-elevated p-6 space-y-4">
            <h3 className="text-base font-bold text-textMain flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Quick Shortcuts
            </h3>
            <div className="space-y-3">
              <Link to="/discover" className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Search size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-textMain">Job Discovery</p>
                  <p className="text-[10px] text-textMuted truncate">Scan job aggregates & easy applies</p>
                </div>
                <ChevronRight size={14} className="text-textDim group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/resumes" className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <FileText size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-textMain">Resume Studio</p>
                  <p className="text-[10px] text-textMuted truncate">Edit resume details & download LaTeX</p>
                </div>
                <ChevronRight size={14} className="text-textDim group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/portfolio" className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-textMain">AI Portfolio Studio</p>
                  <p className="text-[10px] text-textMuted truncate">Deploy premium website & compile PDFs</p>
                </div>
                <ChevronRight size={14} className="text-textDim group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/settings" className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Settings size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-textMain">Settings Panel</p>
                  <p className="text-[10px] text-textMuted truncate">Scheduler config & credentials vault</p>
                </div>
                <ChevronRight size={14} className="text-textDim group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* AI Crawler Insights */}
          <div className="glass-elevated p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none rounded-full" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary shrink-0 animate-pulse" />
              <h4 className="text-sm font-bold text-textMain">Crawler Fit Insights</h4>
            </div>
            {avgMatch > 0 ? (
              <div className="text-xs space-y-2 text-textMuted leading-relaxed">
                <p>
                  Your average candidate matching rating is <strong className="text-primary">{avgMatch}%</strong> based on {matchedJobs.length} crawled jobs.
                </p>
                <p>
                  {avgMatch < 65 
                    ? '⚠️ Fit rating is relatively low. Synced keywords in your Resume Studio to optimize match ratios.' 
                    : '✅ Excellent profile keyword relevancy! Your agent is ready to trigger easy applies.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-textMuted leading-relaxed">
                No match telemetry compiled yet. Sync resumes and click "Trigger Job Search Agent" to begin compiling profile fits.
              </p>
            )}
            
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-2xs">
              <div className="flex items-center gap-1.5 text-textMuted">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Job search agent: Standby</span>
              </div>
              <span className="font-bold text-primary">Pro Account Active</span>
            </div>
          </div>

        </div>

      </div>

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div 
            className="relative max-w-4xl w-full glass-elevated border border-white/20 p-5 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-base text-textMain">Playwright Form Screen</h3>
                <p className="text-xs text-textMuted">{selectedScreenshot.title} at {selectedScreenshot.company}</p>
              </div>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg text-textMain transition-all"
              >
                Close
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-white/[0.08] bg-black/40 custom-scrollbar">
              <img 
                src={selectedScreenshot.url} 
                alt="Playwright screen" 
                className="w-full h-auto block" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Email View Modal */}
      {selectedEmail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedEmail(null)}
        >
          <div 
            className="relative max-w-2xl w-full glass-elevated border border-white/25 p-6 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-base text-textMain">Outreach Email Details</h3>
                <p className="text-xs text-textMuted font-semibold mt-0.5">Sent to {selectedEmail.recipient_name} ({selectedEmail.recipient_email}) &bull; {selectedEmail.company}</p>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg text-textMain transition-all"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-textMain text-xs">
              <div>
                <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest block mb-1">Subject</span>
                <p className="font-bold bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.06]">{selectedEmail.subject}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest block mb-1">Email Body</span>
                <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>

              {selectedEmail.reply_received && (
                <div className="border-t border-white/[0.06] pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-bold text-success uppercase tracking-widest">Recruiter Reply</span>
                  </div>
                  <div className="bg-success/5 p-3.5 rounded-lg border border-success/20 leading-relaxed italic">
                    "{selectedEmail.reply_content}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
