import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Target, PlusCircle, BrainCircuit, FilePenLine, Loader2, 
  Sparkles, AlertTriangle, Kanban, Table, Clock, Search, 
  Trash2, ArrowRight, ExternalLink, Calendar, MapPin, Building2, CheckCircle2
} from 'lucide-react';
import useStore from '../store/useStore';
import API_BASE from '../config/api';

const COLUMNS = [
  { id: 'SAVED',               label: 'Saved',              bg: 'bg-slate-500/5 border-slate-500/10' },
  { id: 'APPLIED',             label: 'Applied',            bg: 'bg-blue-500/5 border-blue-500/10' },
  { id: 'INTERVIEW_SCHEDULED', label: 'Interviewing',       bg: 'bg-warning/5 border-warning/10' },
  { id: 'OFFER_RECEIVED',      label: 'Offer',              bg: 'bg-success/5 border-success/10' },
  { id: 'REJECTED',            label: 'Rejected',           bg: 'bg-danger/5 border-danger/10' }
];

const STATUS_CONFIG = {
  SAVED:                { label: 'Saved',              cls: 'badge-neutral',       kanban: 'SAVED' },
  PENDING_REVIEW:       { label: 'Review Required',    cls: 'badge-warning',       kanban: 'SAVED' },
  APPLYING:             { label: 'Applying...',         cls: 'badge-info animate-pulse', kanban: 'APPLIED' },
  APPLIED:              { label: 'Applied',            cls: 'badge-success',       kanban: 'APPLIED' },
  FAILED:               { label: 'Crawl Error',        cls: 'badge-danger',       kanban: 'REJECTED' },
  INTERVIEWING:         { label: 'Interviewing',       cls: 'badge-warning',       kanban: 'INTERVIEW_SCHEDULED' },
  INTERVIEW_SCHEDULED:  { label: 'Interview Scheduled',cls: 'badge-warning',       kanban: 'INTERVIEW_SCHEDULED' },
  OFFER:                { label: 'Offer Received',     cls: 'badge-success',       kanban: 'OFFER_RECEIVED' },
  OFFER_RECEIVED:       { label: 'Offer Received',     cls: 'badge-success font-black border-accent/20', kanban: 'OFFER_RECEIVED' },
  REJECTED:             { label: 'Rejected',           cls: 'badge-danger',       kanban: 'REJECTED' }
};

export default function JobTracker() {
  const { jobs, setJobs, resumes, setResumes, token } = useStore();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table' | 'timeline'
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Job Form State
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', url: '', description: '' });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchJobs();
    fetchResumes();
  }, [token]);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/jobs`, config);
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/resumes`, config);
      setResumes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/jobs`, formData, config);
      setShowAdd(false);
      setFormData({ title: '', company: '', url: '', description: '' });
      fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkResume = async (applicationId, resumeId) => {
    if (!resumeId) return;
    try {
      await axios.put(`${API_BASE}/api/jobs/${applicationId}/resume`, { resumeId }, config);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerMatchAnalysis = async (applicationId) => {
    setAnalyzingId(applicationId);
    try {
      await axios.post(`${API_BASE}/api/ai/analyze-match`, { applicationId }, config);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Match analysis failed');
    } finally {
      setAnalyzingId(null);
    }
  };

  // Drag and Drop implementation
  const onDragStart = (e, jobId) => {
    e.dataTransfer.setData('text/plain', jobId);
  };

  const onDrop = async (e, columnId) => {
    const jobId = e.dataTransfer.getData('text/plain');
    if (!jobId) return;
    
    try {
      // Find current application to determine status mappings
      const app = jobs.find(j => j.job_id?._id === jobId);
      if (app && app.status !== columnId) {
        await axios.put(`${API_BASE}/api/jobs/${jobId}/status`, { status: columnId }, config);
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to drag and drop update status:', err);
    }
  };

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(app => {
    const title = app.job_id?.title?.toLowerCase() || '';
    const company = app.job_id?.company?.toLowerCase() || '';
    const location = app.job_id?.location?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return title.includes(q) || company.includes(q) || location.includes(q);
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 text-textMain bg-background">
      
      {/* Header and View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shadow-[0_0_15px_rgba(124,58,237,0.25)]">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Applications Pipeline</h1>
            <p className="text-2xs text-textMuted mt-0.5">Track, link profiles, and monitor hiring milestones.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle Buttons */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-white'
              }`}
            >
              <Kanban size={13} />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-white'
              }`}
            >
              <Table size={13} />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-white'
              }`}
            >
              <Clock size={13} />
              <span className="hidden md:inline">Timeline</span>
            </button>
          </div>

          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className="btn-primary text-xs !py-2.5 !px-4 gap-1.5 flex items-center font-bold"
          >
            <PlusCircle size={15} />
            <span>Add Target Job</span>
          </button>
        </div>
      </div>

      {/* Add Target Job Form Drawer */}
      {showAdd && (
        <div className="glass p-6 animate-fade-up border border-primary/10">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
            <PlusCircle className="text-primary" size={16} /> Paste Job Specifications
          </h2>
          <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <input 
              required type="text" placeholder="Job Role / Title (e.g. Frontend developer)" 
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-white focus:border-primary/50" 
              value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} 
            />
            <input 
              required type="text" placeholder="Company Name (e.g. Vercel)" 
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-white focus:border-primary/50" 
              value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} 
            />
            <input 
              type="url" placeholder="Job Application Portal URL (e.g. Greenhouse apply link)" 
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-white focus:border-primary/50 md:col-span-2" 
              value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} 
            />
            <textarea 
              required rows="5" placeholder="Paste full raw job requirements/description here for AI fit matching..." 
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-white focus:border-primary/50 md:col-span-2 leading-relaxed" 
              value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} 
            />
            <div className="md:col-span-2 flex justify-end gap-3">
              <button 
                type="button" onClick={() => setShowAdd(false)}
                className="px-5 py-2 border border-white/[0.08] hover:bg-white/[0.05] rounded-xl font-bold"
              >
                Cancel
              </button>
              <button 
                disabled={loading} type="submit" 
                className="btn-primary !py-2 px-6 font-bold"
              >
                {loading ? 'Saving...' : 'Track Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global Pipeline Search */}
      <div className="relative w-full max-w-md shrink-0 flex items-center">
        <Search size={14} className="absolute left-3.5 text-textDim" />
        <input
          type="text"
          placeholder="Filter pipeline by title, company, or city..."
          className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-xs text-textMain focus:outline-none focus:border-primary/50"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-24 text-textMuted flex flex-col items-center justify-center">
          <Target size={40} className="opacity-20 mb-3" />
          <p className="text-xs font-semibold">Your pipeline is empty</p>
          <p className="text-[10px] text-textDim mt-0.5">Click "Add Target Job" or search in Job Discovery to import roles.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="flex-1">
          {/* VIEW: KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 h-[calc(100vh-270px)] overflow-x-auto custom-scrollbar">
              {COLUMNS.map(col => {
                // Group applications corresponding to this Kanban column
                const colApps = filteredJobs.filter(app => {
                  const mapped = STATUS_CONFIG[app.status]?.kanban || 'SAVED';
                  return mapped === col.id;
                });

                return (
                  <div 
                    key={col.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDrop(e, col.id)}
                    className={`rounded-2xl border border-white/[0.04] p-4 flex flex-col h-full overflow-hidden ${col.bg}`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4 shrink-0">
                      <span className="font-extrabold text-xs text-white">{col.label}</span>
                      <span className="text-[10px] font-bold text-textMuted bg-white/[0.04] px-2 py-0.5 rounded">
                        {colApps.length}
                      </span>
                    </div>

                    {/* Draggable Cards list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                      {colApps.length === 0 ? (
                        <div className="h-full border border-dashed border-white/[0.03] rounded-xl flex items-center justify-center text-center p-4">
                          <p className="text-[9px] text-textDim">Drag applications here</p>
                        </div>
                      ) : (
                        colApps.map(app => {
                          const hasLinkedResume = !!app.resume_id;
                          const isResumeParsed = hasLinkedResume && !!app.resume_id.parsed_data;
                          
                          return (
                            <div
                              key={app._id}
                              draggable
                              onDragStart={e => onDragStart(e, app.job_id?._id)}
                              className="glass p-4 rounded-xl border border-white/[0.04] bg-surface/40 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all flex flex-col gap-3 relative"
                            >
                              <div>
                                <h4 className="font-bold text-xs text-white line-clamp-1">{app.job_id?.title || 'Unknown Role'}</h4>
                                <p className="text-[10px] text-primary font-semibold truncate mt-0.5">{app.job_id?.company}</p>
                                {app.job_id?.location && (
                                  <p className="text-[9px] text-textMuted mt-0.5 flex items-center gap-0.5"><MapPin size={9} />{app.job_id.location}</p>
                                )}
                              </div>

                              {/* Resume linking prompt if missing */}
                              {!hasLinkedResume && (
                                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                                  <span className="text-[9px] text-red-400 font-bold block mb-1.5 flex items-center"><AlertTriangle size={10} className="mr-1"/> Link profile</span>
                                  <div className="flex gap-1.5">
                                    <select 
                                      id={`select-kanban-${app._id}`}
                                      className="flex-1 bg-black/40 border border-white/[0.08] rounded p-1 text-[9px] text-white focus:outline-none"
                                      defaultValue=""
                                    >
                                      <option value="" disabled>Select resume...</option>
                                      {resumes.filter(r => r.parsed_data).map(r => (
                                        <option key={r._id} value={r._id}>{r.title} ({r.ats_score})</option>
                                      ))}
                                    </select>
                                    <button 
                                      onClick={() => handleLinkResume(app._id, document.getElementById(`select-kanban-${app._id}`).value)}
                                      className="bg-primary hover:brightness-110 px-2 py-0.5 rounded text-[9px] font-bold text-white transition-colors"
                                    >
                                      Link
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between border-t border-white/[0.04] pt-2.5 shrink-0 text-[10px] font-bold">
                                {app.match_score !== undefined ? (
                                  <span className={`px-2 py-0.5 rounded text-[9px] ${
                                    app.match_score >= 80 ? 'text-success bg-success/10' : app.match_score >= 60 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'
                                  }`}>
                                    {app.match_score}% Match
                                  </span>
                                ) : (
                                  <span className="text-textDim">Unanalyzed</span>
                                )}
                                <Link
                                  to={`/application/${app._id}`}
                                  className="text-primary hover:underline flex items-center gap-0.5"
                                >
                                  <span>Hub</span>
                                  <ExternalLink size={10} />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="glass overflow-hidden border border-white/[0.05] rounded-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] text-textMuted font-bold uppercase tracking-wider bg-white/[0.01]">
                      <th className="py-3.5 pl-4">Target Job</th>
                      <th className="py-3.5">Company</th>
                      <th className="py-3.5">Linked Resume</th>
                      <th className="py-3.5 text-center">ATS Match</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-xs">
                    {filteredJobs.map((app) => {
                      const status = app.status || 'SAVED';
                      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED;
                      const hasResume = !!app.resume_id;

                      return (
                        <tr key={app._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 pl-4 font-bold text-white max-w-[200px] truncate">
                            {app.job_id?.title}
                            {app.job_id?.location && (
                              <span className="text-[10px] text-textMuted font-medium block mt-0.5">{app.job_id.location}</span>
                            )}
                          </td>
                          <td className="py-4 text-primary font-bold">{app.job_id?.company}</td>
                          <td className="py-4 text-textMuted">
                            {hasResume ? (
                              <span className="underline">{app.resume_id.title} ({app.resume_id.ats_score})</span>
                            ) : (
                              <div className="flex gap-2">
                                <select 
                                  id={`select-table-${app._id}`}
                                  className="bg-black/40 border border-white/[0.08] rounded p-1 text-[10px] text-white focus:outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select resume...</option>
                                  {resumes.filter(r => r.parsed_data).map(r => (
                                    <option key={r._id} value={r._id}>{r.title} ({r.ats_score})</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={() => handleLinkResume(app._id, document.getElementById(`select-table-${app._id}`).value)}
                                  className="bg-primary hover:brightness-110 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                                >
                                  Link
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-center font-bold">
                            {app.match_score !== undefined ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                app.match_score >= 80 ? 'text-success bg-success/10' : app.match_score >= 60 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'
                              }`}>
                                {app.match_score}%
                              </span>
                            ) : (
                              <button 
                                onClick={() => triggerMatchAnalysis(app._id)}
                                disabled={analyzingId === app._id}
                                className="text-primary hover:underline font-bold text-[10px]"
                              >
                                {analyzingId === app._id ? 'Analyzing...' : 'Run Analysis'}
                              </button>
                            )}
                          </td>
                          <td className="py-4">
                            <select
                              value={app.status}
                              onChange={e => {
                                axios.put(`${API_BASE}/api/jobs/${app.job_id?._id}/status`, { status: e.target.value }, config)
                                  .then(fetchJobs);
                              }}
                              className="bg-[#0a0d18] border border-white/[0.08] rounded-lg p-1.5 text-xs text-white focus:outline-none"
                            >
                              {Object.keys(STATUS_CONFIG).map(k => (
                                <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {app.job_id?.job_url && (
                                <a 
                                  href={app.job_id.job_url} target="_blank" rel="noopener noreferrer"
                                  className="p-1.5 border border-white/[0.08] hover:bg-white/[0.05] rounded-lg text-textMuted hover:text-white transition-all"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <Link
                                to={`/application/${app._id}`}
                                className="px-3 py-1.5 bg-primary hover:brightness-110 text-white rounded-lg text-[10px] font-bold transition-all active:scale-[0.97]"
                              >
                                Hub details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: TIMELINE VIEW */}
          {viewMode === 'timeline' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="relative border-l-2 border-white/[0.06] pl-6 ml-4 space-y-8">
                {filteredJobs.map((app, idx) => {
                  const dateStr = app.applied_on ? new Date(app.applied_on).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : new Date(app.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div key={app._id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border border-primary bg-[#030408] flex items-center justify-center text-primary shadow-[0_0_10px_rgba(124,58,237,0.4)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>

                      {/* Timeline Card */}
                      <div className="glass p-5 rounded-2xl hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-textDim font-bold font-mono uppercase tracking-wider">{dateStr}</span>
                          <h4 className="font-extrabold text-sm text-white leading-tight">{app.job_id?.title}</h4>
                          <p className="text-[10px] text-primary font-bold">{app.job_id?.company} &bull; <span className="text-textMuted font-medium">{app.job_id?.location || 'Remote'}</span></p>
                          <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-bold">
                            {app.match_score !== undefined && (
                              <span className="text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded">ATS Match: {app.match_score}%</span>
                            )}
                            <span className={`px-2 py-0.5 rounded border ${STATUS_CONFIG[app.status]?.cls || 'badge-neutral'}`}>
                              {STATUS_CONFIG[app.status]?.label || app.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Link
                            to={`/application/${app._id}`}
                            className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.05] rounded-xl text-xs font-bold text-textMain flex items-center gap-1.5 transition-all"
                          >
                            <span>Application Hub</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
