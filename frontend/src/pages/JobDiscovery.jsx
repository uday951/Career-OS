import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, Bot, Bookmark, Link as LinkIcon, Building2, MapPin, 
  ShieldCheck, Flame, BookOpen, Star, AlertTriangle, CheckCircle, 
  Briefcase, Globe, Clock, SlidersHorizontal, ArrowRight, Copy, ExternalLink, Mail, Sparkles
} from 'lucide-react';
import useStore from '../store/useStore';
import API_BASE from '../config/api';

const JOB_TYPES = [
  { label: 'All Types', value: 'any' },
  { label: 'Full Time', value: 'FULLTIME' },
  { label: 'Part Time', value: 'PARTTIME' },
  { label: 'Internship', value: 'INTERN' },
  { label: 'Contract', value: 'CONTRACTOR' },
];

const JOB_TYPE_META = {
  FULLTIME:   { label: 'Full Time',  color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  PARTTIME:   { label: 'Part Time',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  INTERN:     { label: 'Internship', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  CONTRACTOR: { label: 'Contract',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export default function JobDiscovery() {
  const { token, resumes } = useStore();
  const navigate = useNavigate();
  
  // Data State
  const [discoveredJobs, setDiscoveredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);

  // Filters State
  const [employmentType, setEmploymentType] = useState('any');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [location, setLocation] = useState('');

  // Selected Job & AI Analysis Panel
  const [selectedJob, setSelectedJob] = useState(null);
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null); // Contains match result, cover letter, etc.
  const [emailSending, setEmailSending] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchJobs('');
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/outreach/gmail/status`, config);
      setGmailConnected(data.connected);
    } catch {
      setGmailConnected(false);
    }
  };

  const buildParams = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (employmentType !== 'any') params.set('employment_type', employmentType);
    if (remoteOnly) params.set('remote', 'true');
    if (location.trim()) params.set('location', location.trim());
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchJobs = async (query = '') => {
    setLoading(true);
    setDiscoveredJobs([]);
    setSelectedJob(null);
    setAnalyzedData(null);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/ai/discover-jobs${buildParams(query)}`,
        config
      );
      setDiscoveredJobs(data);
    } catch (err) {
      if (err.response?.data?.error_type === 'RAPIDAPI_KEY_MISSING') {
        setDiscoveredJobs([{ isApiRequirement: true }]);
      } else if (err.response?.data?.error_type === 'RAPIDAPI_KEY_INVALID') {
        setDiscoveredJobs([{ isKeyInvalid: true }]);
      } else {
        alert(err.response?.data?.message || 'Search failed. Make sure you have a parsed resume.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(customQuery);
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setAnalyzedData(null); // Reset analysis panel for new job
  };

  const handleAnalyzeJob = async () => {
    if (!selectedJob) return;
    setAnalyzingJob(true);
    try {
      // POST /api/jobs/auto-apply actually saves the job and runs the match, CL, and intel in parallel, returning the application object
      const { data } = await axios.post(`${API_BASE}/api/jobs/auto-apply`, selectedJob, config);
      setAnalyzedData(data); // Stores the application database object with match_analysis, tailored_cover_letter, etc.
    } catch (err) {
      alert(err.response?.data?.message || 'AI Match Analysis failed. Make sure you have a parsed resume.');
    } finally {
      setAnalyzingJob(false);
    }
  };

  const handleSendOutreach = () => {
    if (!analyzedData) return;
    navigate('/outreach', { state: { selectApplicationId: analyzedData._id } });
  };

  const handleLaunchAgent = async () => {
    if (!analyzedData) return;
    try {
      await axios.post(`${API_BASE}/api/agent/start`, {}, config);
      alert('AI Automation agent started! Go to the Dashboard to monitor live browser submissions.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger agent.');
    }
  };

  // Determine apply automation compatibility
  const getApplyStrategy = (url) => {
    if (!url) return { auto: false, label: 'Assisted Apply' };
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com/jobs/view') || lower.includes('linkedin.com/jobs/search')) {
      return { auto: true, label: 'LinkedIn Easy Apply', platform: 'LinkedIn' };
    }
    if (lower.includes('greenhouse.io/')) {
      return { auto: true, label: 'Greenhouse API Apply', platform: 'Greenhouse' };
    }
    if (lower.includes('lever.co/')) {
      return { auto: true, label: 'Lever API Apply', platform: 'Lever' };
    }
    return { auto: false, label: 'Assisted Apply', platform: 'Company Portal' };
  };

  const activeFiltersCount = [
    employmentType !== 'any',
    remoteOnly,
    location.trim() !== '',
  ].filter(Boolean).length;

  const bestResume = resumes.reduce((m, r) => (r.ats_score > (m?.ats_score || 0) ? r : m), null);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden text-textMain bg-background">
      
      {/* LEFT/CENTER COLUMN: Search and Job Cards */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06] h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Search Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-surface to-surfaceHover border border-white/[0.04] p-6 rounded-2xl shadow-xl shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[50px] pointer-events-none rounded-full" />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Search className="text-primary" size={20} /> Live Job Discovery Aggregator
          </h1>
          <p className="text-2xs text-textMuted mt-1 mb-4">
            Aggregating live roles from LinkedIn, Wellfound, Internshala, Naukri, and Foundit.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search roles, skills, or companies (leave blank for automatic profile matches)..." 
              className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.04]"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
            />
            <button 
              disabled={loading}
              type="submit" 
              className="btn-primary !py-2.5 !px-5 text-xs font-bold shrink-0 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="animate-spin" size={14}/> : <Search size={14}/>}
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Filters Row */}
        <div className="glass border border-white/[0.05] p-3 rounded-xl flex flex-wrap items-center gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-textMuted shrink-0">
            <SlidersHorizontal size={14} className="text-primary" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {JOB_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setEmploymentType(t.value)}
                className={`px-2.5 py-1 rounded-lg text-2xs font-bold border transition-all ${
                  employmentType === t.value
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white/[0.03] text-textMuted border-white/[0.05] hover:border-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/[0.08] hidden sm:block" />

          <button
            onClick={() => setRemoteOnly(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-bold border transition-all ${
              remoteOnly
                ? 'bg-success/20 text-success border-success/30 shadow-md'
                : 'bg-white/[0.03] text-textMuted border-white/[0.05] hover:border-white/20'
            }`}
          >
            <Globe size={12} /> <span>Remote Only</span>
          </button>

          <div className="relative flex items-center">
            <MapPin size={12} className="absolute left-2.5 text-textDim" />
            <input
              type="text"
              placeholder="City or Country..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.08] rounded-lg pl-7 pr-2 py-1 text-2xs text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] w-36 transition-all"
            />
          </div>

          <button
            onClick={() => fetchJobs(customQuery)}
            disabled={loading}
            className="ml-auto bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] px-3.5 py-1 rounded-lg text-2xs font-bold transition-all active:scale-[0.97]"
          >
            Apply
          </button>
        </div>

        {/* Job Cards List */}
        <div className="flex-1 space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-primary font-bold gap-3">
              <Loader2 className="animate-spin" size={36} />
              <p className="text-sm text-textMuted">Compiling matches from search channels...</p>
            </div>
          )}

          {!loading && discoveredJobs.length === 0 && (
            <div className="text-center py-20 text-textMuted flex flex-col items-center justify-center">
              <Search size={36} className="opacity-20 mb-3" />
              <p className="text-xs font-semibold">No results found</p>
              <p className="text-textDim text-[10px] mt-0.5">Broaden search query or update preferred roles in Settings.</p>
            </div>
          )}

          {!loading && discoveredJobs.map((job, idx) => {
            // Check for API warnings
            if (job.isKeyInvalid || job.isApiRequirement) {
              return (
                <div key="api-warning" className="glass p-6 text-center rounded-2xl border-yellow-500/25 relative overflow-hidden">
                  <AlertTriangle size={36} className="mx-auto mb-3 text-warning" />
                  <h3 className="font-bold text-sm text-white">RapidAPI Config Required</h3>
                  <p className="text-2xs text-textMuted max-w-md mx-auto mt-1 leading-relaxed">
                    A free JSearch RapidAPI Key is required to compile live postings from LinkedIn/Indeed. Update the `RAPIDAPI_KEY` parameter in your backend .env file.
                  </p>
                </div>
              );
            }

            const isSelected = selectedJob && selectedJob.title === job.title && selectedJob.company === job.company;
            const typeMeta = JOB_TYPE_META[job.job_type] || { label: job.job_type, color: 'text-gray-400 bg-white/5 border-white/10' };

            return (
              <div 
                key={idx} 
                onClick={() => handleJobClick(job)}
                className={`glass-card p-4 flex gap-4 cursor-pointer relative overflow-hidden transition-all ${
                  isSelected ? 'border-primary/50 bg-primary/[0.02] shadow-[0_0_15px_rgba(124,58,237,0.1)]' : ''
                }`}
              >
                {/* Logo */}
                {job.employer_logo ? (
                  <img src={job.employer_logo} alt={job.company} className="w-10 h-10 rounded-lg object-contain bg-white/5 p-0.5 border border-white/[0.08] shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 text-textMuted font-bold text-xs">
                    {job.company?.[0]}
                  </div>
                )}

                {/* Card Main Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-white truncate leading-tight group-hover:text-primary transition-colors">{job.title}</h4>
                      <p className="text-[10px] text-textMuted mt-0.5 font-bold">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.apply_url && (
                        <a 
                          href={job.apply_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary px-2.5 py-1 rounded-lg text-[10px] font-bold text-primary hover:text-white transition-all active:scale-[0.97]"
                          title="Apply directly on company website"
                        >
                          <span>Apply</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                      {/* Source Tag */}
                      <span className="text-[9px] px-2 py-1 rounded bg-white/[0.04] text-textDim uppercase font-black border border-white/[0.06]">
                        {job.source || 'Aggregator'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                    <span className="flex items-center gap-0.5 text-textMuted"><MapPin size={9} />{job.location}</span>
                    <span className={typeMeta.color}>{typeMeta.label}</span>
                    {job.is_remote && <span className="text-success">Remote</span>}
                    {job.salary_range && job.salary_range !== 'Not disclosed' && <span className="text-yellow-400">{job.salary_range}</span>}
                  </div>

                  <p className="text-textMuted text-[10px] leading-relaxed line-clamp-2 pr-4">{job.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: AI Analysis Panel */}
      <div className="w-[360px] lg:w-[420px] shrink-0 h-full overflow-y-auto custom-scrollbar p-6 bg-surface/30 flex flex-col space-y-6">
        
        {/* Panel Header */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 shrink-0">
          <Bot className="text-primary animate-pulse" size={16} />
          <h2 className="text-xs font-bold text-textMain uppercase tracking-widest">AI Opportunity Analysis</h2>
        </div>

        {/* Empty State */}
        {!selectedJob && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-textMuted px-6 space-y-3">
            <Bot size={40} className="opacity-10 text-primary" />
            <p className="text-xs font-bold text-textMuted">No job selected</p>
            <p className="text-[10px] text-textDim max-w-[200px] leading-relaxed">
              Select a discovered job card from the aggregator list to run DeepSeek match analysis and compose outreach drafts.
            </p>
          </div>
        )}

        {/* Job Overview & AI Analysis Trigger */}
        {selectedJob && !analyzedData && (
          <div className="flex-1 flex flex-col space-y-5 animate-fade-in">
            {/* Job Header Card */}
            <div className="glass p-4 space-y-3">
              <div className="flex gap-3 justify-between items-start">
                <div className="flex gap-3">
                  {selectedJob.employer_logo && (
                    <img src={selectedJob.employer_logo} alt={selectedJob.company} className="w-10 h-10 rounded-lg object-contain bg-white/5 p-0.5 border border-white/[0.08] shrink-0" />
                  )}
                  <div>
                    <h3 className="font-extrabold text-xs text-white leading-tight">{selectedJob.title}</h3>
                    <p className="text-[10px] text-primary font-bold mt-0.5">{selectedJob.company}</p>
                    <p className="text-[9px] text-textMuted mt-0.5">{selectedJob.location}</p>
                  </div>
                </div>
                {selectedJob.apply_url && (
                  <a 
                    href={selectedJob.apply_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2 py-1 rounded text-[10px] font-bold text-textMain transition-all active:scale-[0.97]"
                    title="Visit direct apply page"
                  >
                    <span>Apply Site</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] bg-white/[0.04] px-2 py-0.5 rounded text-textMuted font-bold capitalize">Source: {selectedJob.source || 'Aggregator'}</span>
                {selectedJob.salary_range && <span className="text-[9px] bg-white/[0.04] px-2 py-0.5 rounded text-yellow-400 font-bold">{selectedJob.salary_range}</span>}
              </div>
            </div>

            {/* AI Action trigger */}
            <div className="glass p-6 text-center space-y-4 border border-primary/20 bg-primary/[0.01]">
              <Sparkles size={36} className="mx-auto text-primary animate-pulse" />
              <div>
                <h4 className="font-bold text-xs text-white">Analyze with DeepSeek AI</h4>
                <p className="text-[10px] text-textMuted max-w-[240px] mx-auto mt-1 leading-relaxed">
                  Evaluate ATS match ratios, detect keyword gaps, and generate tailored cover letters and outreach drafts based on your parsed resume.
                </p>
              </div>
              
              {bestResume ? (
                <button
                  onClick={handleAnalyzeJob}
                  disabled={analyzingJob}
                  className="w-full btn-primary !py-2.5 text-xs font-bold gap-1.5 flex items-center justify-center"
                >
                  {analyzingJob ? (
                    <><Loader2 className="animate-spin" size={14}/> <span>Running Fit Analysis...</span></>
                  ) : (
                    <><Bot size={14}/> <span>Run AI Match & Outreach</span></>
                  )}
                </button>
              ) : (
                <div className="text-[10px] text-danger font-semibold bg-danger/10 border border-danger/20 p-3 rounded-lg leading-relaxed">
                  ⚠️ No parsed resume profile found. Go to Resume Studio to upload and parse your resume.
                </div>
              )}
            </div>

            {/* Scrollable Job specs overview */}
            <div className="flex-1 bg-white/[0.01] border border-white/[0.05] rounded-xl p-4 overflow-y-auto custom-scrollbar max-h-56">
              <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Specifications description</span>
              <p className="text-[10px] text-textMuted leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
            </div>
          </div>
        )}

        {/* Analyzed Detail View */}
        {selectedJob && analyzedData && (
          <div className="flex-1 space-y-5 animate-fade-in text-xs">
            
            {/* Match Circle & Summary */}
            <div className="glass p-4 flex items-center gap-4 border-l-4 border-l-primary">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="3.5"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 - ((analyzedData.match_analysis?.match_percentage || 0) / 100) * (2 * Math.PI * 16)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-primary">{analyzedData.match_analysis?.match_percentage || 0}%</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white truncate">{selectedJob.title}</h4>
                <p className="text-[10px] text-textMuted mt-0.5 truncate">Fit Score Rating &bull; {selectedJob.company}</p>
                <p className="text-[9px] text-textDim mt-0.5 italic truncate">Syncing: {bestResume?.title || 'Master profile'}</p>
              </div>
            </div>

            {/* Apply Strategy Card */}
            {(() => {
              const strategy = getApplyStrategy(selectedJob.apply_url);
              return (
                <div className="glass p-4 space-y-3">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block">Apply Strategy Channel</span>
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-lg">
                    <span className="font-bold text-textMain text-2xs">{strategy.label}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                      strategy.auto ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {strategy.auto ? 'Automation Supported' : 'Manual Assisted'}
                    </span>
                  </div>

                  {strategy.auto ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-textMuted leading-relaxed">
                        This job is hosted on {strategy.platform}, which supports direct AI form-filling.
                      </p>
                      <button 
                        onClick={handleLaunchAgent}
                        className="w-full btn-primary !py-2 text-xs font-bold gap-1.5 flex items-center justify-center shadow-lg shadow-primary/20"
                      >
                        <Zap size={12} />
                        <span>Launch Auto Apply Agent</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-textMuted leading-relaxed">
                        This portal requires assisted applying. Open company portal and copy generated answers/cover letter.
                      </p>
                      <a 
                        href={selectedJob.apply_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full btn-primary !py-2 text-xs font-bold gap-1.5 flex items-center justify-center shadow-lg shadow-primary/20"
                      >
                        <span>Open Company Portal</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Missing Skills Gaps */}
            <div className="glass p-4 space-y-2">
              <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block">Identified Skill Gaps</span>
              <div className="flex flex-wrap gap-1.5">
                {analyzedData.match_analysis?.missing_skills && analyzedData.match_analysis.missing_skills.length > 0 ? (
                  analyzedData.match_analysis.missing_skills.map((skill, i) => (
                    <span key={i} className="text-[9px] bg-danger/10 border border-danger/20 text-danger px-2 py-0.5 rounded font-bold">{skill}</span>
                  ))
                ) : (
                  <span className="text-[9px] bg-success/10 border border-success/20 text-success px-2.5 py-1 rounded font-bold flex items-center gap-1"><CheckCircle size={10} /> Perfect Keyword match</span>
                )}
              </div>
            </div>

            {/* Assisted Apply Materials (Cover Letter / Form Answers / Recruiter email) */}
            <div className="glass p-4 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">AI Assisted Materials</span>
                <span className="text-[9px] text-primary">One-Click copies</span>
              </div>

              {/* Cover Letter */}
              {analyzedData.tailored_cover_letter && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-bold text-textMuted">Tailored Cover Letter</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(analyzedData.tailored_cover_letter);
                        alert('Cover letter copied!');
                      }}
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Copy size={9} /> Copy
                    </button>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-lg text-[10px] text-textMuted max-h-24 overflow-y-auto custom-scrollbar font-serif leading-relaxed">
                    {analyzedData.tailored_cover_letter}
                  </div>
                </div>
              )}

              {/* Common Form Answers */}
              <div className="space-y-1.5">
                <span className="font-bold text-textMuted text-2xs block">Common Screening Answers</span>
                <div className="space-y-1 bg-white/[0.02] border border-white/[0.06] p-2 rounded-lg text-[9px] text-textMuted leading-relaxed">
                  <p><strong>Work Authorization:</strong> Authorized, no sponsorship needed.</p>
                  <p><strong>Notice Period:</strong> Available immediately (0 days).</p>
                  <p><strong>Compensation Expected:</strong> Competitive market rate.</p>
                </div>
              </div>

              {/* Recruiter outreach email */}
              <div className="space-y-2 border-t border-white/[0.06] pt-3">
                <span className="font-bold text-textMuted text-2xs block">Personalized Outreach Email</span>
                <p className="text-[9px] text-textDim leading-relaxed">
                  Extract recruiter details, customize templates, and review email before dispatching.
                </p>

                {gmailConnected ? (
                  <button 
                    onClick={handleSendOutreach}
                    className="w-full py-2 bg-gradient-to-r from-primary/30 to-primary/50 border border-primary/40 hover:brightness-110 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                  >
                    <Mail size={12} />
                    <span>Draft Outreach Email</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/settings')}
                    className="w-full py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-textMain rounded-lg text-xs font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                  >
                    <Mail size={12} className="text-textDim" />
                    <span>Connect Gmail for Outreach</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
