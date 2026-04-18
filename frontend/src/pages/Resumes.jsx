import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { Upload, FileText, CheckCircle, Sparkles, Loader2, Code2, Copy, X, Eye } from 'lucide-react';

// Renders a Jake's-resume-style HTML preview from parsed resume JSON
function ResumePreview({ resumeJson, targetRole }) {
  if (!resumeJson) return null;
  const r = resumeJson;
  const name = r.contact_info?.name || 'Your Name';
  const email = r.contact_info?.email || '';
  const phone = r.contact_info?.phone || '';
  const linkedin = r.contact_info?.linkedin || '';
  const github = r.contact_info?.github || '';
  const portfolio = r.contact_info?.portfolio || '';

  return (
    <div className="bg-white text-black font-serif text-[11px] leading-tight p-6 min-h-[700px] shadow-2xl rounded" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Header */}
      <div className="text-center border-b border-black pb-2 mb-3">
        <h1 className="text-[18px] font-bold tracking-wide">{name}</h1>
        <div className="text-[10px] mt-1 flex flex-wrap justify-center gap-x-3 text-gray-700">
          {phone && <span>{phone}</span>}
          {email && <a href={`mailto:${email}`} className="text-blue-700 underline">{email}</a>}
          {linkedin && <a href={linkedin} className="text-blue-700 underline">{linkedin.replace('https://','')}</a>}
          {github && <a href={github} className="text-blue-700 underline">{github.replace('https://','')}</a>}
          {portfolio && <a href={portfolio} className="text-blue-700 underline">{portfolio}</a>}
        </div>
      </div>

      {/* Summary */}
      {r.summary && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Summary</div>
          <p className="text-gray-800">{r.summary}</p>
        </div>
      )}

      {/* Education */}
      {r.education?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Education</div>
          {r.education.map((edu, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold">{edu.institution}</span>
                <span className="text-gray-600 text-[10px]">{edu.start_date} – {edu.end_date || 'Present'}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic">{edu.degree}</span>
                {edu.gpa && <span className="text-gray-600">GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {r.work_history?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Experience</div>
          {r.work_history.map((job, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-start">
                <span className="font-bold">{job.title}</span>
                <span className="text-gray-600 text-[10px]">{job.start_date} – {job.end_date || 'Present'}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic">{job.company}</span>
                {job.location && <span className="text-gray-600">{job.location}</span>}
              </div>
              {job.responsibilities?.length > 0 && (
                <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                  {job.responsibilities.slice(0, 4).map((r, ri) => (
                    <li key={ri} className="text-gray-800">{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {r.projects?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Projects</div>
          {r.projects.map((proj, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between">
                <span className="font-bold">{proj.name}</span>
                {proj.technologies && <span className="italic text-gray-600">{Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}</span>}
              </div>
              {proj.description && <p className="text-gray-800 ml-2">{proj.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {r.master_skills?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Technical Skills</div>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {r.master_skills.map((s, i) => (
              <span key={i} className="inline-block border border-gray-400 px-1.5 py-0.5 rounded text-[10px] text-gray-700">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {r.certifications?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Certifications</div>
          <ul className="list-disc ml-4 space-y-0.5">
            {r.certifications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Resumes() {
  const { resumes, setResumes, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [parsingId, setParsingId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  // LaTeX Modal State
  const [latexModalOpen, setLatexModalOpen] = useState(false);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [activeResumeJson, setActiveResumeJson] = useState(null);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [latexCode, setLatexCode] = useState('');
  const [latexGenerating, setLatexGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchResumes();
  }, [token]);

  const fetchResumes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/resumes`, config);
      setResumes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please upload a PDF file');
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('resumeFile', file);

      const { data } = await axios.post(`${API_BASE}/api/resumes/upload`, formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      
      setResumes([data, ...resumes]);
      setTitle('');
      setFile(null);
      triggerAiParse(data._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAiParse = async (id) => {
    setParsingId(id);
    try {
      const { data } = await axios.post(`${API_BASE}/api/ai/parse-resume/${id}`, {}, config);
      setResumes(resumes.map(r => r._id === id ? data : r));
      fetchResumes();
    } catch (err) {
      console.error(err);
    } finally {
      setParsingId(null);
    }
  };

  const openLatexBuilder = (resume) => {
    setActiveResumeId(resume._id);
    setActiveResumeJson(resume.parsed_data);
    setLatexCode('');
    setTargetRole('Software Engineer');
    setActiveTab('preview');
    setLatexModalOpen(true);
  };

  const handleGenerateLatex = async () => {
    setLatexGenerating(true);
    setLatexCode('');
    try {
      const { data } = await axios.post(`${API_BASE}/api/ai/latex-resume`, { resumeId: activeResumeId, targetRole }, config);
      setLatexCode(data.latex_code);
      setActiveTab('code'); // auto-switch to code tab after generation
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to generate LaTeX');
    } finally {
      setLatexGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-primary/20 rounded-xl text-primary"><FileText size={28} /></div>
        <h1 className="text-3xl font-bold">Resume Hub</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="glass p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><Upload className="mr-2" size={20}/> New Resume Upload</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input 
              type="text" required placeholder="Resume Alias (e.g. Frontend Dev)"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <div className="w-full bg-white/5 border border-white/10 border-dashed rounded-lg py-8 px-4 text-center cursor-pointer hover:bg-white/10 transition-colors">
              <input 
                type="file" accept=".pdf" required 
                className="w-full text-sm text-textMuted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <button disabled={loading} type="submit" className="w-full btn-primary flex justify-center items-center">
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Processing PDF...' : 'Upload & Parse PDF'}
            </button>
          </form>
        </div>

        {/* Existing Resumes Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><CheckCircle className="mr-2" size={20}/> Extracted Profiles</h2>
          {resumes.length === 0 && <p className="text-textMuted italic">No resumes uploaded yet.</p>}
          
          {resumes.map(resume => (
            <div key={resume._id} className="glass-card p-6 flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{resume.title}</h3>
                  <p className="text-xs text-textMuted mt-1">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {resume.ats_score > 0 ? (
                    <div className="inline-flex items-center space-x-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                      <span>ATS BASE SCORE: {resume.ats_score}</span>
                    </div>
                  ) : (
                    <button onClick={() => triggerAiParse(resume._id)} disabled={parsingId === resume._id} className="flex items-center text-sm bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-full border border-primary/30 transition-colors">
                      {parsingId === resume._id ? <Loader2 className="animate-spin mr-1" size={14} /> : <Sparkles className="mr-1" size={14}/>}
                      {parsingId === resume._id ? 'Analyzing...' : 'Parse with AI'}
                    </button>
                  )}
                </div>
              </div>

              {resume.parsed_data?.work_history && (
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <h4 className="text-sm font-semibold text-textMuted mb-2 uppercase tracking-wide">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resume.parsed_data.master_skills?.map((s, i) => (
                      <span key={i} className="text-xs bg-white/10 text-white px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => openLatexBuilder(resume)}
                    className="w-full flex justify-center items-center py-2 text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors font-semibold"
                  >
                    <Code2 size={16} className="mr-2" /> Auto-Build Overleaf LaTeX Resume
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LaTeX Resume Builder Modal */}
      {latexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden border border-blue-500/30">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-blue-500/10 shrink-0">
              <h2 className="text-xl font-bold flex items-center">
                <Code2 className="mr-3 text-blue-400" /> Overleaf ATS Resume Compiler
              </h2>
              <div className="flex items-center gap-3">
                {latexCode && (
                  <button 
                    onClick={() => {navigator.clipboard.writeText(latexCode); alert('LaTeX Copied! Paste into Overleaf.');}}
                    className="flex items-center bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Copy size={14} className="mr-2" /> Copy LaTeX
                  </button>
                )}
                <button onClick={() => setLatexModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content area */}
            {!latexCode ? (
              /* Generation form */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-lg w-full space-y-6 text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Code2 size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Build Your LaTeX Resume</h3>
                    <p className="text-gray-400">AI generates Overleaf-ready LaTeX code from your extracted profile, fully tailored to your target role.</p>
                  </div>
                  <div className="text-left">
                    <label className="block text-sm font-semibold text-blue-300 mb-2">Target Role / Title:</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 text-lg"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <button 
                    onClick={handleGenerateLatex}
                    disabled={latexGenerating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-3"
                  >
                    {latexGenerating ? <><Loader2 className="animate-spin" size={22} /> Compiling Engine...</> : <><Sparkles size={22} /> Generate LaTeX + Preview</>}
                  </button>
                </div>
              </div>
            ) : (
              /* Split pane: tabs on mobile, side-by-side on desktop */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs (visible on small screens) */}
                <div className="flex border-b border-white/10 bg-black/20 shrink-0 lg:hidden">
                  <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10' : 'text-gray-400'}`}>
                    <Eye size={16} /> Preview
                  </button>
                  <button onClick={() => setActiveTab('code')} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'code' ? 'text-green-400 border-b-2 border-green-400 bg-green-500/10' : 'text-gray-400'}`}>
                    <Code2 size={16} /> LaTeX Code
                  </button>
                </div>

                {/* Panes */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Preview Pane */}
                  <div className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-4 ${activeTab !== 'preview' ? 'hidden lg:block' : ''}`}>
                    <div className="text-xs text-gray-500 font-mono mb-2 flex items-center gap-2">
                      <Eye size={12} /> Live Preview (Jake's Resume Template)
                    </div>
                    <ResumePreview resumeJson={activeResumeJson} targetRole={targetRole} />
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block w-px bg-white/10 shrink-0" />

                  {/* Code Pane */}
                  <div className={`flex-1 flex flex-col overflow-hidden ${activeTab !== 'code' ? 'hidden lg:flex' : ''}`}>
                    <div className="text-xs text-green-400 font-mono px-4 py-2 bg-black/40 border-b border-white/10 flex items-center gap-2 shrink-0">
                      <Code2 size={12} /> main.tex — Copy into overleaf.com/project/new
                    </div>
                    <textarea 
                      readOnly 
                      value={latexCode}
                      className="flex-1 bg-[#1E1E1E] text-[#D4D4D4] font-mono text-xs p-4 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
