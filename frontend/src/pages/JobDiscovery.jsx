import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { useNavigate } from 'react-router-dom';
import {
  Search, Loader2, Bot, Bookmark, Link as LinkIcon, Building2, MapPin,
  ShieldCheck, Flame, BookOpen, Star, AlertTriangle, CheckCircle,
  Briefcase, Globe, Clock, GraduationCap, ChevronDown, SlidersHorizontal
} from 'lucide-react';

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
  const { token } = useStore();
  const navigate = useNavigate();
  const [discoveredJobs, setDiscoveredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Filters
  const [employmentType, setEmploymentType] = useState('any');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [location, setLocation] = useState('');

  // Interactions
  const [preparingId, setPreparingId] = useState(null);
  const [preparedJobs, setPreparedJobs] = useState({});
  const [intelLoadingId, setIntelLoadingId] = useState(null);
  const [intelData, setIntelData] = useState({});

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchJobs(''); }, []);

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

  const handleSearchClick = (e) => {
    e.preventDefault();
    fetchJobs(customQuery);
  };

  const handlePrepareApplication = async (jobData, idx) => {
    setPreparingId(idx);
    try {
      const { data } = await axios.post(`${API_BASE}/api/jobs/auto-apply`, jobData, config);
      setPreparedJobs(prev => ({ ...prev, [idx]: data }));
      navigate(`/application/${data.job_id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Preparation failed');
    } finally {
      setPreparingId(null);
    }
  };

  const handleFetchIntel = async (company, role, idx) => {
    if (intelData[idx]) {
      setIntelData(prev => { const n = { ...prev }; delete n[idx]; return n; });
      return;
    }
    setIntelLoadingId(idx);
    try {
      const { data } = await axios.post(`${API_BASE}/api/ai/company-intel`, { company, role }, config);
      setIntelData(prev => ({ ...prev, [idx]: data }));
    } catch {
      alert('Could not fetch intelligence for this company');
    } finally {
      setIntelLoadingId(null);
    }
  };

  const activeFiltersCount = [
    employmentType !== 'any',
    remoteOnly,
    location.trim() !== '',
  ].filter(Boolean).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-24">

      {/* Search Header */}
      <div className="bg-surface border border-white/10 p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Search className="mr-3 text-primary" size={28} /> Global Opportunity Engine
        </h1>
        <p className="text-textMuted mb-6 max-w-2xl">
          Leave blank to auto-discover jobs from your resume, or search directly for roles and companies.
        </p>

        <form onSubmit={handleSearchClick} className="flex gap-3 w-full">
          <input 
            type="text" 
            placeholder="e.g. React Developer, Google, TCS internship..." 
            className="flex-1 bg-black/40 border border-white/20 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-primary/50 text-base transition-colors"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
          />
          <button 
            disabled={loading}
            type="submit" 
            className="bg-primary hover:bg-primary/80 transition-colors px-8 rounded-xl font-bold text-white flex items-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Search size={18}/> Search</>}
          </button>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="glass border border-white/10 rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-textMuted shrink-0">
          <SlidersHorizontal size={16} className="text-primary" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {/* Employment Type */}
        <div className="flex items-center gap-2 flex-wrap">
          {JOB_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setEmploymentType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                employmentType === t.value
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-textMuted border-white/10 hover:border-white/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-white/10" />

        {/* Remote Toggle */}
        <button
          onClick={() => setRemoteOnly(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            remoteOnly
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-white/5 text-textMuted border-white/10 hover:border-white/30'
          }`}
        >
          <Globe size={14} /> Remote Only
        </button>

        {/* Location Input */}
        <div className="relative flex items-center">
          <MapPin size={14} className="absolute left-3 text-textMuted" />
          <input
            type="text"
            placeholder="Location (e.g. New York, India)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 w-48 transition-colors"
          />
        </div>

        {/* Apply Filters button */}
        <button
          onClick={() => fetchJobs(customQuery)}
          disabled={loading}
          className="ml-auto btn-primary px-5 py-2 text-xs font-bold shrink-0 flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>}
          Apply Filters
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setEmploymentType('any'); setRemoteOnly(false); setLocation(''); }}
            className="text-xs text-textMuted hover:text-white transition-colors underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-primary font-bold flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={48} />
          Fetching Live Global Roles...
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 gap-6">
        {discoveredJobs.length === 0 && !loading && (
          <div className="text-center py-16 px-6">
            <Search size={48} className="mx-auto text-textMuted mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
            <p className="text-textMuted text-sm">Try adjusting your filters or broadening your search query.</p>
          </div>
        )}

        {discoveredJobs.map((job, idx) => {
          if (job.isKeyInvalid) {
            return (
              <div key="api-error" className="glass-card p-12 text-center rounded-2xl relative overflow-hidden border-orange-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                <AlertTriangle size={64} className="mx-auto mb-6 text-orange-400" />
                <h2 className="text-3xl font-black text-white mb-4">API Key Rejected (Status 403)</h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-10 text-lg">
                  Your key was read but RapidAPI rejected it — you haven't subscribed to the free JSearch tier yet.
                </p>
                <div className="bg-black/40 border border-white/10 rounded-xl max-w-lg mx-auto p-6 text-left mb-8">
                  <ol className="space-y-4 text-sm text-gray-300">
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">1</span> Go to <a href="https://rapidapi.com/letscrape-6bRBa3QG1q/api/jsearch/pricing" target="_blank" className="text-primary hover:underline ml-1 font-semibold">JSearch on RapidAPI</a></li>
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">2</span> Click the blue "Subscribe" button on the Basic (Free) tier.</li>
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">3</span> Come back and reload.</li>
                  </ol>
                </div>
                <button onClick={() => window.location.reload()} className="btn-primary px-8 py-3 font-bold">
                  I Clicked Subscribe (Reload)
                </button>
              </div>
            );
          }

          if (job.isApiRequirement) {
            return (
              <div key="api-req" className="glass-card p-12 text-center rounded-2xl relative overflow-hidden border-orange-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                <AlertTriangle size={64} className="mx-auto mb-6 text-orange-400" />
                <h2 className="text-3xl font-black text-white mb-4">Unlock Global Portals</h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-10 text-lg">
                  A free RapidAPI key is required to access LinkedIn, Indeed, ZipRecruiter live job data.
                </p>
                <div className="bg-black/40 border border-white/10 rounded-xl max-w-lg mx-auto p-6 text-left mb-8">
                  <ol className="space-y-4 text-sm text-gray-300">
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">1</span> Go to <a href="https://rapidapi.com/letscrape-6bRBa3QG1q/api/jsearch/pricing" target="_blank" className="text-primary hover:underline ml-1 font-semibold">JSearch on RapidAPI</a> and Subscribe (free).</li>
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">2</span> Copy your <code className="bg-black text-green-400 px-1 rounded">X-RapidAPI-Key</code>.</li>
                    <li className="flex items-start"><span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">3</span> Set <code className="bg-black text-green-400 px-1 rounded">RAPIDAPI_KEY=your_key</code> in <code className="bg-black text-green-400 px-1 rounded">backend/.env</code></li>
                  </ol>
                </div>
                <button onClick={() => window.location.reload()} className="btn-primary px-8 py-3 font-bold">
                  I've added the Key (Reload)
                </button>
              </div>
            );
          }

          const prepared = preparedJobs[idx];
          const hasIntel = intelData[idx];
          const typeMeta = JOB_TYPE_META[job.job_type] || { label: job.job_type, color: 'text-gray-400 bg-white/5 border-white/10' };

          return (
            <div key={idx} className="glass-card p-6 flex flex-col md:flex-row gap-6 relative group">
              {/* Logo */}
              {job.employer_logo && (
                <img src={job.employer_logo} alt={job.company} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 shrink-0 self-start border border-white/10" />
              )}

              {/* Left: Job Info */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <h3 className="text-xl font-bold text-white">{job.title}</h3>
                  <div className="flex items-center text-primary font-semibold mt-1">
                    <Building2 size={16} className="mr-1.5" /> {job.company}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 bg-black/30 border border-white/10 px-2.5 py-1 rounded-lg text-textMuted">
                    <MapPin size={12} /> {job.location}
                  </span>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${typeMeta.color}`}>
                    <Briefcase size={12} /> {typeMeta.label}
                  </span>
                  {job.is_remote && (
                    <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold">
                      <Globe size={12} /> Remote
                    </span>
                  )}
                  {job.salary_range && job.salary_range !== 'Not disclosed' && (
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-lg font-bold">
                      {job.salary_range}
                    </span>
                  )}
                  {job.posted_date && (
                    <span className="flex items-center gap-1 text-textMuted bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg">
                      <Clock size={12} /> {new Date(job.posted_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                  {job.description?.substring(0, 400)}...
                </p>

                {/* Company Intel Panel */}
                {hasIntel && (
                  <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center text-sm"><Star className="text-yellow-400 mr-2" size={16}/> Company Reputation</h4>
                      <p className="text-xs text-gray-300 bg-black/20 p-3 rounded-lg leading-relaxed">{hasIntel.company_background}</p>
                      <p className="text-xs text-primary/80 mt-2 font-medium italic">{hasIntel.cultural_reviews}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-white font-bold mb-2 flex items-center text-sm"><ShieldCheck className="text-blue-400 mr-2" size={16}/> Interview Process</h4>
                        <ul className="space-y-1">
                          {hasIntel.interview_process?.map((step, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start"><span className="mr-1.5 text-primary">•</span> {step}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2 flex items-center text-sm"><BookOpen className="text-green-400 mr-2" size={16}/> Study Resources</h4>
                        <ul className="space-y-1">
                          {hasIntel.study_resources?.map((res, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start"><span className="mr-1.5 text-primary">•</span> {res}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
                {!prepared ? (
                  <button 
                    onClick={() => handlePrepareApplication(job, idx)} disabled={preparingId === idx}
                    className="w-full py-3 rounded-lg font-bold text-sm text-white border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {preparingId === idx ? <><Loader2 className="animate-spin" size={16}/> Generating...</> : <><Bookmark size={16}/> Save & Generate Materials</>}
                  </button>
                ) : (
                  <div className="py-2.5 border border-green-500/30 bg-green-500/10 rounded-lg text-sm text-green-400 font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> In Pipeline
                  </div>
                )}
                <a 
                  href={job.apply_url || '#'} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg font-bold text-sm text-white border-2 border-primary/40 bg-primary hover:bg-primary/80 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <LinkIcon size={16} /> Apply on Portal
                </a>
                <button 
                  onClick={() => handleFetchIntel(job.company, job.title, idx)}
                  disabled={intelLoadingId === idx}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-all flex items-center justify-center gap-2 ${hasIntel ? 'bg-white/10 text-white border-white/20 hover:bg-white/5' : 'bg-transparent text-textMuted border-white/10 hover:bg-white/5 hover:text-white'}`}
                >
                  {intelLoadingId === idx
                    ? <><Loader2 className="animate-spin" size={16}/> Deep Diving...</>
                    : hasIntel
                      ? 'Close Intel Report'
                      : <><Flame className="text-orange-500" size={16}/> Company Background</>
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
