import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import { ArrowLeft, Loader2, Target, FileText, Bot, Compass, CheckCircle2, AlertTriangle, Building2, ExternalLink } from 'lucide-react';

export default function ApplicationHub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useStore();
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`http://localhost:5000/api/jobs/application/${id}`, config);
        setAppData(data);
      } catch (err) {
        alert('Could not load application hub data.');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadApplication();
  }, [id, token, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold">Assembling Generated Materials...</h2>
        <p className="text-textMuted text-sm mt-2">DeepSeek API is finalizing the intelligence brief.</p>
      </div>
    );
  }

  if (!appData) return null;

  const job = appData.job_id;
  const intel = appData.intelligence_materials || {};
  const match = appData.match_analysis || {};

  const renderLink = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:text-white transition-colors underline decoration-blue-500/50 underline-offset-2">{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center text-textMuted hover:text-white transition-colors mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Pipeline
      </button>

      <div className="bg-surface border border-white/10 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-start">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        <span className="bg-black/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest text-primary w-fit border border-primary/20 mb-4">
          Application Material Hub
        </span>
        <h1 className="text-4xl font-bold mb-2 text-white">{job.title}</h1>
        <div className="text-xl text-primary font-bold flex items-center">
          <Building2 className="mr-2" size={24} /> {job.company}
        </div>
        
        <div className="mt-6 flex space-x-4 z-10">
          <a 
            href={job.url !== 'Auto-Discovered' ? job.url : `https://google.com/search?q=${job.company} careers`} 
            target="_blank" rel="noopener noreferrer"
            className="btn-primary flex items-center px-6 py-3 font-bold"
          >
             Secure Final Submit <ExternalLink size={18} className="ml-2" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Match & Intel */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Match Analysis */}
          <div className="glass-card p-6 border-t-4 border-t-green-500">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Target className="mr-2 text-green-500" /> Match DNA Engine
            </h3>
            <div className="flex items-center justify-between mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
              <span className="font-semibold text-textMuted">Algorithm Fit</span>
              <span className={`text-3xl font-black ${match.match_percentage > 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                {match.match_percentage || 0}%
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center"><CheckCircle2 className="mr-2 text-green-400" size={16}/> Dominant Strengths</h4>
                <ul className="space-y-2">
                  {match.strengths?.map((s, i) => <li key={i} className="text-sm bg-green-500/10 text-green-200 px-3 py-1.5 rounded-lg border border-green-500/20">{s}</li>)}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-gray-300 mt-4 mb-2 flex items-center"><AlertTriangle className="mr-2 text-orange-400" size={16}/> Missing Keywords</h4>
                <ul className="space-y-2">
                  {match.missing_skills?.map((s, i) => <li key={i} className="text-sm bg-orange-500/10 text-orange-200 px-3 py-1.5 rounded-lg border border-orange-500/20">{s}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* DeepSeek Intel Engine */}
          <div className="glass-card p-6 border-t-4 border-t-blue-500">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <Bot className="mr-2 text-blue-400" /> DeepSeek Internet Intel
            </h3>
            
            {!intel.cultural_reviews ? (
              <div className="text-sm text-textMuted bg-black/20 p-4 rounded-lg">Intel Engine bypassed or timed out during generation.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-300 mb-2">Corporate Environment</h4>
                  <p className="text-sm text-gray-400 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                    {intel.cultural_reviews}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-blue-300 mb-2">Likely Interview Pipeline</h4>
                  <ul className="space-y-2">
                    {intel.interview_process?.map((step, i) => (
                      <li key={i} className="text-sm text-gray-300 flex"><div className="w-5 shrink-0 font-bold text-blue-500">{i+1}.</div> {step}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-purple-300 mb-2">Generated Prep Materials</h4>
                  <ul className="space-y-2">
                    {intel.study_resources?.map((res, i) => (
                      <li key={i} className="text-xs text-gray-300 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">{res}</li>
                    ))}
                    {intel.internet_sources?.map((src, i) => (
                      <li key={`src-${i}`} className="text-xs text-gray-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg break-words">
                        {renderLink(src)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Generated Cover Letter */}
        <div className="lg:col-span-2 glass-card p-8 border-t-4 border-t-purple-500 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold flex items-center">
              <FileText className="mr-3 text-purple-500" /> Final Optimized Cover Letter
            </h3>
            <button 
              onClick={() => {navigator.clipboard.writeText(appData.tailored_cover_letter); alert('Copied to Clipboard!');}}
              className="bg-white/5 border border-white/10 hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-sans font-bold transition-all active:scale-95"
            >
              Copy Text
            </button>
          </div>
          
          <div className="flex-1 bg-white/5 p-8 rounded-xl border border-white/10 font-serif leading-loose text-gray-200 text-lg whitespace-pre-wrap shadow-inner relative group">
             {appData.tailored_cover_letter || "A cover letter was not generated for this application."}
          </div>
        </div>

      </div>
    </div>
  );
}
