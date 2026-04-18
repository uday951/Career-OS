import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { Link } from 'react-router-dom';
import { Target, PlusCircle, BrainCircuit, FilePenLine, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

export default function JobTracker() {
  const { jobs, setJobs, resumes, setResumes, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  
  // New Job Form State
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', url: '', description: '' });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchJobs();
    fetchResumes(); // Ensure we have resumes loaded for linking
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
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const generateCoverLetter = async (applicationId) => {
    setAnalyzingId(`cl-${applicationId}`);
    try {
      await axios.post(`${API_BASE}/api/ai/cover-letter`, { applicationId }, config);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Cover Letter generation failed');
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Target size={28} /></div>
          <h1 className="text-3xl font-bold">Job Pipeline & AI Tailoring</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center space-x-2">
          <PlusCircle size={18} />
          <span>Add Target Job</span>
        </button>
      </div>

      {showAdd && (
        <div className="glass p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-4">Paste Job Description</h2>
          <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="text" placeholder="Job Title" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} />
            <input required type="text" placeholder="Company Name" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white" value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} />
            <input type="url" placeholder="Job Posting URL" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white md:col-span-2" value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} />
            <textarea required rows="5" placeholder="Paste full raw text of the job requirements here..." className="bg-white/5 border border-white/10 rounded-lg p-3 text-white md:col-span-2 text-sm" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
            <div className="md:col-span-2 flex justify-end">
              <button disabled={loading} type="submit" className="btn-primary px-8">{loading ? 'Saving...' : 'Tracking Pipeline'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.length === 0 && <p className="text-textMuted italic">No active applications. Add a job to begin the AI tailoring process.</p>}
        
        {jobs.map(app => {
          const hasLinkedResume = !!app.resume_id;
          const isResumeParsed = hasLinkedResume && !!app.resume_id.parsed_data;

          return (
            <div key={app._id} className="glass-card p-6 flex flex-col relative overflow-hidden group">
              {/* Background match indicator */}
              {app.match_analysis?.match_percentage && (
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: app.match_analysis.match_percentage > 75 ? '#22c55e' : '#eab308' }} />
              )}

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white">{app.job_id.title}</h3>
                  <p className="text-textMuted">{app.job_id.company}</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider">{app.status}</span>
              </div>

              {!hasLinkedResume && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 relative z-10">
                  <div className="flex items-center text-red-400 mb-3 text-sm font-semibold">
                    <AlertTriangle size={16} className="mr-2" /> Missing Candidate Profile Link
                  </div>
                  <div className="flex space-x-2">
                    <select 
                      id={`select-${app._id}`}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-primary/50"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a parsed resume...</option>
                      {resumes.filter(r => r.parsed_data).map(r => (
                        <option key={r._id} value={r._id}>{r.title} (ATS: {r.ats_score})</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => handleLinkResume(app._id, document.getElementById(`select-${app._id}`).value)}
                      className="bg-primary/80 hover:bg-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                    >
                      Link
                    </button>
                  </div>
                </div>
              )}

              {hasLinkedResume && !isResumeParsed && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 relative z-10 text-sm text-yellow-500 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  Your linked resume "{app.resume_id.title}" has not been parsed by AI yet. Please go to Resume Hub to parse it.
                </div>
              )}

              {isResumeParsed && (
                <div className="mt-4 flex space-x-3 relative z-10">
                  <button 
                    onClick={() => triggerMatchAnalysis(app._id)}
                    disabled={analyzingId === app._id}
                    className="flex items-center text-sm bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
                  >
                    {analyzingId === app._id ? <Loader2 className="animate-spin mr-1.5" size={16} /> : <BrainCircuit className="mr-1.5" size={16} />}
                    Gaps & Match %
                  </button>
                  
                  <button 
                    onClick={() => generateCoverLetter(app._id)}
                    disabled={analyzingId === `cl-${app._id}`}
                    className="flex items-center text-sm bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    {analyzingId === `cl-${app._id}` ? <Loader2 className="animate-spin mr-1.5" size={16} /> : <FilePenLine className="mr-1.5" size={16}/>}
                    AI Cover Letter
                  </button>
                </div>
              )}

              {/* AI Results Section */}
              {app.match_analysis?.match_percentage && (
                <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center text-white"><Sparkles size={16} className="text-yellow-400 mr-2"/> Analysis Results</h4>
                    <span className={`font-bold text-lg ${app.match_analysis.match_percentage > 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {app.match_analysis.match_percentage}% Match
                    </span>
                  </div>
                  
                  {app.match_analysis.missing_skills?.length > 0 && (
                    <div>
                      <h5 className="text-xs text-textMuted mb-2 uppercase tracking-wide">Missing Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {app.match_analysis.missing_skills.map((skill, i) => (
                          <span key={i} className="text-xs bg-red-500/10 border border-red-500/20 text-red-200 px-2 py-1 rounded-md">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link to={`/application/${app.job_id._id}`} className="btn-primary w-full flex items-center justify-center py-2 text-sm">
                      Enter Application Hub <Target size={16} className="ml-2" />
                    </Link>
                  </div>
                </div>
              )}

              {app.tailored_cover_letter && (
                <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 max-h-40 overflow-y-auto custom-scrollbar relative z-10 text-sm text-gray-300 whitespace-pre-wrap">
                  {app.tailored_cover_letter}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
