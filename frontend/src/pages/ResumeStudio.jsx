import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import useClaudeStream from '../hooks/useClaudeStream';
import ATSPanel from '../components/ATSPanel';
import PreviewPanel from '../components/PreviewPanel';
import VersionManager from '../components/VersionManager';
import { 
  FileText, Upload, Brain, Sparkles, AlertCircle, Play, 
  Trash2, Plus, ArrowRight, Eye, Settings, FileCheck, HelpCircle, 
  BookOpen, MailOpen, TrendingUp, History, PenTool, CheckCircle,
  Loader2
} from 'lucide-react';

export default function ResumeStudio() {
  const { token, user } = useStore();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const fileInputRef = useRef(null);

  // Sessions and general page loading
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');

  // Target Job Description State
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzingATS, setAnalyzingATS] = useState(false);

  // Active Editor and Version state
  const [editableResume, setEditableResume] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('Modern Professional');
  const [activeRightTab, setActiveRightTab] = useState('chat'); // 'chat' | 'ats' | 'versions' | 'history' | 'coverletter'
  
  // Versions
  const [selectedVersionName, setSelectedVersionName] = useState('Original');
  const [generatingVersions, setGeneratingVersions] = useState(false);
  
  // Single-section optimizing states
  const [optimizingSectionName, setOptimizingSectionName] = useState('');
  const [injectingKeyword, setInjectingKeyword] = useState('');

  // Cover Letter
  const [coverLetter, setCoverLetter] = useState(null);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  // PDF Download
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Co-Pilot Chat States
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hey! I am your **CareerOS Resume Co-Pilot**. Upload a PDF resume here or select an existing session, then type a prompt to let me parse, rewrite, and optimize it in real-time." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatFile, setChatFile] = useState(null);
  const chatFileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Streaming Hook
  const { streamedText, isStreaming, startStream, setStreamedText } = useClaudeStream(token);

  useEffect(() => {
    if (token) {
      loadSessions();
    }
  }, [token]);

  // Sync editor with active session content
  useEffect(() => {
    if (activeSession) {
      // Find selected version content
      if (selectedVersionName === 'Original') {
        setEditableResume(activeSession.originalResume?.parsedJSON || null);
      } else {
        const ver = activeSession.resumeVersions?.find(v => v.versionName === selectedVersionName);
        if (ver) {
          setEditableResume(ver.content);
        }
      }
      
      // Load JD state
      setCompanyName(activeSession.jobDescription?.companyName || '');
      setRoleTitle(activeSession.jobDescription?.roleTitle || '');
      setJobDescription(activeSession.jobDescription?.rawText || '');
    } else {
      setEditableResume(null);
    }
  }, [activeSession, selectedVersionName]);

  // Typewriter streaming sync
  useEffect(() => {
    if (isStreaming && streamedText && optimizingSectionName) {
      setEditableResume(prev => {
        if (!prev) return null;
        if (optimizingSectionName === 'summary') {
          return { ...prev, summary: streamedText };
        }
        return prev;
      });
    }
  }, [streamedText, isStreaming, optimizingSectionName]);

  const loadSessions = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/resume/sessions/${user._id}`, config);
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error('Failed to load resume sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSession = async (e) => {
    e.preventDefault();
    if (!file && !sessionTitle) return alert('Please upload a PDF or enter a title');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', sessionTitle || 'New Studio Resume');
      if (file) {
        formData.append('resumeFile', file);
      }

      const { data } = await axios.post(`${API_BASE}/api/resume/upload`, formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });

      setSessions([data, ...sessions]);
      setActiveSession(data);
      setSelectedVersionName('Original');
      setSessionTitle('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to upload resume session:', err);
      alert('Upload failed. Ensure document is a valid PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this resume session? All versions, history, and PDFs will be lost.')) return;
    try {
      await axios.delete(`${API_BASE}/api/resume/session/${sessionId}`, config);
      const updatedSessions = sessions.filter(s => s._id !== sessionId);
      setSessions(updatedSessions);
      if (updatedSessions.length > 0) {
        setActiveSession(updatedSessions[0]);
      } else {
        setActiveSession(null);
      }
      setSelectedVersionName('Original');
      alert('Resume Session deleted successfully.');
    } catch (err) {
      console.error('Failed to delete resume session:', err);
      alert('Failed to delete resume session.');
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !chatFile) return;

    const userText = chatInput.trim();
    const currentMessages = [...chatMessages];
    
    // Add user message to UI
    let displayContent = userText;
    if (chatFile) {
      displayContent = `[Attached PDF: ${chatFile.name}] ${userText}`;
    }
    setChatMessages([...currentMessages, { role: 'user', content: displayContent }]);
    setChatInput('');
    setChatSending(true);

    try {
      const formData = new FormData();
      formData.append('prompt', userText || 'Optimize this resume.');
      if (activeSession) {
        formData.append('sessionId', activeSession._id);
        formData.append('currentResume', JSON.stringify(editableResume));
      }
      if (chatFile) {
        formData.append('resumeFile', chatFile);
      }

      const { data } = await axios.post(`${API_BASE}/api/resume/chat`, formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });

      // Clear the chat file input
      setChatFile(null);
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = '';
      }

      // Add assistant response to UI
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Update editor state with updatedResume
      if (data.updatedResume) {
        setEditableResume(data.updatedResume);
      }

      // If a new session was created (i.e. we uploaded a new PDF in chat)
      if (data.session) {
        const hasSession = sessions.some(s => s._id === data.session._id);
        if (!hasSession) {
          setSessions([data.session, ...sessions]);
        }
        setActiveSession(data.session);
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I encountered an error. Please make sure your file is a valid PDF and your prompt is correct." }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleRunATSAnalysis = async () => {
    if (!jobDescription) return alert('Please paste a target Job Description.');
    setAnalyzingATS(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/resume/analyze`, {
        sessionId: activeSession._id,
        jobDescription,
        companyName,
        roleTitle
      }, config);

      // Refresh active session and sessions list
      setActiveSession(data.session);
      setSessions(sessions.map(s => s._id === activeSession._id ? data.session : s));
      alert(`ATS Analysis Complete! Score Calculated: ${data.analysis.atsScore}%`);
    } catch (err) {
      console.error(err);
      alert('ATS Analysis failed.');
    } finally {
      setAnalyzingATS(false);
    }
  };

  const handleGenerateStrategicVersions = async () => {
    setGeneratingVersions(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/resume/versions/generate`, {
        sessionId: activeSession._id
      }, config);
      
      const updatedSession = { ...activeSession, resumeVersions: data };
      setActiveSession(updatedSession);
      setSessions(sessions.map(s => s._id === activeSession._id ? updatedSession : s));
      setSelectedVersionName(data[0]?.versionName || 'Original');
      alert('3 Strategic Resume Versions Compiled Successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to compile versions.');
    } finally {
      setGeneratingVersions(false);
    }
  };

  // Section Optimization via SSE (typewriter) or single REST call
  const handleOptimizeSection = async (sectName, currentText) => {
    setOptimizingSectionName(sectName);
    try {
      // Trigger streaming rewrite call
      await startStream(activeSession._id, sectName, currentText);
      alert('AI Section Optimization complete!');
      
      // Refetch session to capture optimizationHistory
      const { data } = await axios.get(`${API_BASE}/api/resume/sessions/${user._id}`, config);
      const sess = data.find(s => s._id === activeSession._id);
      if (sess) {
        setActiveSession(sess);
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
      alert('Optimization failed');
    } finally {
      setOptimizingSectionName('');
    }
  };

  // Keyword Injection: Weave it into summary
  const handleInjectKeyword = async (keyword) => {
    setInjectingKeyword(keyword);
    try {
      const originalSummary = editableResume?.summary || '';
      const { data } = await axios.post(`${API_BASE}/api/resume/optimize/section`, {
        sessionId: activeSession._id,
        sectionName: 'summary',
        sectionContent: `${originalSummary}\n\n[INJECT CRITICAL KEYWORD: "${keyword}"]`
      }, config);

      const optimizedText = data.optimizedSection.optimizedContent;
      
      // Update local editor summary
      setEditableResume(prev => prev ? { ...prev, summary: optimizedText } : null);
      setActiveSession(data.session);
      setSessions(sessions.map(s => s._id === activeSession._id ? data.session : s));
      alert(`Successfully weaved keyword "${keyword}" into summary! Run ATS analysis to recalculate score.`);
    } catch (err) {
      console.error(err);
      alert('Failed to inject keyword.');
    } finally {
      setInjectingKeyword('');
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingCoverLetter(true);
    setCoverLetter(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/resume/cover-letter`, {
        sessionId: activeSession._id
      }, config);
      setCoverLetter(data);
      setActiveRightTab('coverletter');
    } catch (err) {
      console.error(err);
      alert('Cover letter generation failed');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const currentReport = activeSession.atsReports?.[activeSession.atsReports.length - 1];
      const atsScore = currentReport?.score || 80;

      const { data } = await axios.post(`${API_BASE}/api/resume/pdf/generate`, {
        sessionId: activeSession._id,
        resumeData: editableResume,
        templateName: selectedTemplate,
        atsScore
      }, config);

      if (data.fileUrl) {
        // Trigger browser stream download
        window.open(`${API_BASE}${data.fileUrl}`, '_blank');
        
        // Reload session PDF logs
        const sRes = await axios.get(`${API_BASE}/api/resume/sessions/${user._id}`, config);
        const updated = sRes.data.find(s => s._id === activeSession._id);
        if (updated) {
          setActiveSession(updated);
          setSessions(sRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF document.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Editor Input Event Handlers
  const handleContactChange = (field, val) => {
    setEditableResume(prev => prev ? { ...prev, [field]: val } : null);
  };

  const handleWorkChange = (idx, field, val) => {
    setEditableResume(prev => {
      if (!prev) return null;
      const exp = [...(prev.experience || [])];
      exp[idx] = { ...exp[idx], [field]: val };
      return { ...prev, experience: exp };
    });
  };

  const handleAddWork = () => {
    setEditableResume(prev => {
      if (!prev) return null;
      return {
        ...prev,
        experience: [
          ...(prev.experience || []),
          { position: '', company: '', startDate: '', endDate: '', description: '' }
        ]
      };
    });
  };

  const handleRemoveWork = (idx) => {
    setEditableResume(prev => {
      if (!prev) return null;
      return { ...prev, experience: prev.experience.filter((_, i) => i !== idx) };
    });
  };

  const handleEduChange = (idx, field, val) => {
    setEditableResume(prev => {
      if (!prev) return null;
      const edu = [...(prev.education || [])];
      edu[idx] = { ...edu[idx], [field]: val };
      return { ...prev, education: edu };
    });
  };

  const handleAddEdu = () => {
    setEditableResume(prev => {
      if (!prev) return null;
      return {
        ...prev,
        education: [
          ...(prev.education || []),
          { degree: '', school: '', graduationDate: '' }
        ]
      };
    });
  };

  const handleRemoveEdu = (idx) => {
    setEditableResume(prev => {
      if (!prev) return null;
      return { ...prev, education: prev.education.filter((_, i) => i !== idx) };
    });
  };

  const handleSkillChange = (idx, field, val) => {
    setEditableResume(prev => {
      if (!prev) return null;
      const sk = [...(prev.skills || [])];
      if (field === 'items') {
        sk[idx] = { ...sk[idx], items: val.split(',').map(s => s.trim()) };
      } else {
        sk[idx] = { ...sk[idx], category: val };
      }
      return { ...prev, skills: sk };
    });
  };

  const handleAddSkill = () => {
    setEditableResume(prev => {
      if (!prev) return null;
      return {
        ...prev,
        skills: [...(prev.skills || []), { category: '', items: [] }]
      };
    });
  };

  const handleRemoveSkill = (idx) => {
    setEditableResume(prev => {
      if (!prev) return null;
      return { ...prev, skills: prev.skills.filter((_, i) => i !== idx) };
    });
  };

  const handleProjectChange = (idx, field, val) => {
    setEditableResume(prev => {
      if (!prev) return null;
      const proj = [...(prev.projects || [])];
      if (field === 'technologies') {
        proj[idx] = { ...proj[idx], technologies: val.split(',').map(s => s.trim()) };
      } else {
        proj[idx] = { ...proj[idx], [field]: val };
      }
      return { ...prev, projects: proj };
    });
  };

  const handleAddProject = () => {
    setEditableResume(prev => {
      if (!prev) return null;
      return {
        ...prev,
        projects: [
          ...(prev.projects || []),
          { name: '', description: '', technologies: [], link: '' }
        ]
      };
    });
  };

  const handleRemoveProject = (idx) => {
    setEditableResume(prev => {
      if (!prev) return null;
      return { ...prev, projects: (prev.projects || []).filter((_, i) => i !== idx) };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold">Waking AI Resume Studio...</h2>
        <p className="text-slate-500 text-sm mt-2">Loading sessions and compiling assets...</p>
      </div>
    );
  }

  // Active analysis report
  const latestReport = activeSession?.atsReports?.[activeSession.atsReports.length - 1] || null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 text-textMain">
      
      {/* 1. Header & Selector */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface to-[#0a0d18] border border-white/[0.05] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="space-y-1 relative z-10">
          <span className="bg-primary/10 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
            Professional Studio
          </span>
          <h1 className="text-3xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-textMain via-slate-100 to-textMuted mt-2">
            CareerOS Resume Studio
          </h1>
          <p className="text-xs text-textMuted mt-1">Surpass Rezi & Teal with DeepSeek-powered semantic analyses and strategic version optimizations.</p>
        </div>

        {/* Session Switcher / Upload UI */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          {sessions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={activeSession?._id || ''}
                onChange={(e) => {
                  const sess = sessions.find(s => s._id === e.target.value);
                  setActiveSession(sess);
                  setSelectedVersionName('Original');
                }}
                className="bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs font-semibold text-textMain px-3 py-2.5 outline-none focus:border-primary/50"
              >
                {sessions.map(s => (
                  <option key={s._id} value={s._id} className="bg-surface text-textMain">
                    {s.originalResume?.parsedJSON?.fullName || 'Untitled Profile'} (v{s.atsReports?.length || 1})
                  </option>
                ))}
              </select>
              {activeSession && (
                <button
                  type="button"
                  onClick={() => handleDeleteSession(activeSession._id)}
                  className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  title="Delete Current Session"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {/* Quick upload trigger */}
          <form onSubmit={handleUploadSession} className="flex gap-2 items-center bg-white/[0.02] border border-white/[0.08] rounded-lg p-1.5">
            <input
              type="text"
              placeholder="Resume Title..."
              value={sessionTitle}
              onChange={e => setSessionTitle(e.target.value)}
              className="bg-transparent text-xs px-2 py-1 outline-none text-textMain font-medium max-w-[120px] placeholder-textDim"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={e => setFile(e.target.files[0])}
              className="text-[10px] max-w-[150px] text-textMuted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploading}
              className="bg-primary hover:bg-primaryHover text-white px-2.5 py-1.5 rounded-md text-[10px] font-bold disabled:bg-white/[0.08] disabled:text-textDim transition-colors shrink-0"
            >
              {uploading ? 'Processing...' : 'Upload'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Three-Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================================================= */}
        {/* PANEL 1: INPUT PANEL (Editable Section Editors + JDs) */}
        {/* ========================================================================= */}
        <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1 custom-scrollbar">
          
          {/* A. Target Job Description Section */}
          <div className="glass-card p-5 border-t-4 border-t-amber-500 space-y-4">
            <h3 className="text-xs font-bold text-textMain uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={14} className="text-amber-500" /> Target Job Description
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Company Name (e.g. Google)"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2 text-xs text-textMain font-semibold outline-none focus:border-primary/50 placeholder-textDim"
              />
              <input
                type="text"
                placeholder="Target Role (e.g. Staff Eng)"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2 text-xs text-textMain font-semibold outline-none focus:border-primary/50 placeholder-textDim"
              />
            </div>

            <textarea
              rows="5"
              placeholder="Paste the target job description requirements here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-3 text-xs text-textMain leading-relaxed outline-none focus:border-primary/50 custom-scrollbar font-medium placeholder-textDim"
            />

            <button
              onClick={handleRunATSAnalysis}
              disabled={analyzingATS || !jobDescription}
              className="w-full btn-primary text-xs flex justify-center items-center gap-1.5 !py-3 shadow-md"
            >
              {analyzingATS ? (
                <><Loader2 className="animate-spin" size={14} /> Evaluating Match...</>
              ) : (
                <><Brain size={14} /> Run Semantic ATS Analysis</>
              )}
            </button>
          </div>

          {/* B. Profile / Section Editor */}
          {editableResume ? (
            <div className="glass-card p-5 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
                <h3 className="text-xs font-bold text-textMain uppercase tracking-widest flex items-center gap-1.5">
                  <PenTool size={14} className="text-primary" /> Profile Editor
                </h3>
                <span className="text-[10px] text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                  Active: {selectedVersionName}
                </span>
              </div>

              {/* 1. Contact Details */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block">1. Contact Information</span>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editableResume.fullName || ''}
                  onChange={e => handleContactChange('fullName', e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain font-bold outline-none focus:border-primary/50 placeholder-textDim"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={editableResume.title || ''}
                  onChange={e => handleContactChange('title', e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain font-semibold outline-none focus:border-primary/50 placeholder-textDim"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={editableResume.email || ''}
                    onChange={e => handleContactChange('email', e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain outline-none focus:border-primary/50 placeholder-textDim"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={editableResume.phone || ''}
                    onChange={e => handleContactChange('phone', e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain outline-none focus:border-primary/50 placeholder-textDim"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Location"
                  value={editableResume.location || ''}
                  onChange={e => handleContactChange('location', e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain outline-none focus:border-primary/50 placeholder-textDim"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="LinkedIn"
                    value={editableResume.linkedin || ''}
                    onChange={e => handleContactChange('linkedin', e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2 text-xs text-textMain outline-none focus:border-primary/50 placeholder-textDim"
                  />
                  <input
                    type="text"
                    placeholder="GitHub"
                    value={editableResume.github || ''}
                    onChange={e => handleContactChange('github', e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-lg p-2 text-xs text-textMain outline-none focus:border-primary/50 placeholder-textDim"
                  />
                </div>
              </div>

              {/* 2. Professional Summary */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">2. Professional Summary</span>
                  <button
                    onClick={() => handleOptimizeSection('summary', editableResume.summary)}
                    disabled={isStreaming}
                    className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
                  >
                    AI Hook Rewrite
                  </button>
                </div>
                <textarea
                  rows="4"
                  placeholder="3-sentence summary hook..."
                  value={editableResume.summary || ''}
                  onChange={e => handleContactChange('summary', e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-textMain leading-relaxed outline-none focus:border-primary/50 custom-scrollbar font-medium placeholder-textDim"
                />
              </div>

              {/* 3. Work Experience */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">3. Experience</span>
                  <button
                    onClick={handleAddWork}
                    className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 px-2.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                  >
                    <Plus size={8} /> Add Role
                  </button>
                </div>

                <div className="space-y-4">
                  {editableResume.experience?.map((exp, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.08] rounded-xl p-3.5 space-y-2 relative group">
                      <button
                        onClick={() => handleRemoveWork(idx)}
                        className="absolute right-2 top-2 text-textDim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove role"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Position"
                          value={exp.position || ''}
                          onChange={e => handleWorkChange(idx, 'position', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-2 text-xs text-textMain font-bold outline-none placeholder-textDim"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company || ''}
                          onChange={e => handleWorkChange(idx, 'company', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-2 text-xs text-textMain outline-none placeholder-textDim"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Start Date"
                          value={exp.startDate || ''}
                          onChange={e => handleWorkChange(idx, 'startDate', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-2 text-xs text-textMuted outline-none placeholder-textDim"
                        />
                        <input
                          type="text"
                          placeholder="End Date (e.g. Present)"
                          value={exp.endDate || ''}
                          onChange={e => handleWorkChange(idx, 'endDate', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-2 text-xs text-textMuted outline-none placeholder-textDim"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[8px] text-textDim font-bold uppercase">Description & Bullets</label>
                          <button
                            onClick={() => handleOptimizeSection('experience', exp.description)}
                            className="text-[8px] font-bold text-primary hover:underline"
                          >
                            AI Optimize bullets
                          </button>
                        </div>
                        <textarea
                          rows="4"
                          placeholder="STAR bullets..."
                          value={exp.description || ''}
                          onChange={e => handleWorkChange(idx, 'description', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-2 text-xs text-textMain leading-relaxed outline-none font-medium custom-scrollbar placeholder-textDim"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Technical Skills */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">4. Technical Skills</span>
                  <button
                    onClick={handleAddSkill}
                    className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 px-2.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                  >
                    <Plus size={8} /> Add Category
                  </button>
                </div>

                <div className="space-y-3">
                  {editableResume.skills?.map((skill, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.08] rounded-lg p-3 space-y-2 relative group">
                      <button
                        onClick={() => handleRemoveSkill(idx)}
                        className="absolute right-2 top-2 text-textDim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>

                      <input
                        type="text"
                        placeholder="Category (e.g. Languages)"
                        value={skill.category || ''}
                        onChange={e => handleSkillChange(idx, 'category', e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs font-bold text-textMain outline-none placeholder-textDim"
                      />
                      <input
                        type="text"
                        placeholder="Items (comma separated: React, Vue, HTML)"
                        value={Array.isArray(skill.items) ? skill.items.join(', ') : (skill.items || '')}
                        onChange={e => handleSkillChange(idx, 'items', e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMuted outline-none placeholder-textDim"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Education */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">5. Education</span>
                  <button
                    onClick={handleAddEdu}
                    className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 px-2.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                  >
                    <Plus size={8} /> Add Education
                  </button>
                </div>

                <div className="space-y-3">
                  {editableResume.education?.map((edu, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.08] rounded-lg p-3 space-y-2 relative group">
                      <button
                        onClick={() => handleRemoveEdu(idx)}
                        className="absolute right-2 top-2 text-textDim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>

                      <input
                        type="text"
                        placeholder="School"
                        value={edu.school || ''}
                        onChange={e => handleEduChange(idx, 'school', e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs font-bold text-textMain outline-none placeholder-textDim"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree || ''}
                          onChange={e => handleEduChange(idx, 'degree', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMuted outline-none placeholder-textDim"
                        />
                        <input
                          type="text"
                          placeholder="Graduation Date"
                          value={edu.graduationDate || ''}
                          onChange={e => handleEduChange(idx, 'graduationDate', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMuted outline-none placeholder-textDim"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Projects */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider">6. Projects</span>
                  <button
                    onClick={handleAddProject}
                    className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 px-2.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                  >
                    <Plus size={8} /> Add Project
                  </button>
                </div>

                <div className="space-y-3">
                  {editableResume.projects?.map((proj, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.08] rounded-lg p-3 space-y-2 relative group">
                      <button
                        onClick={() => handleRemoveProject(idx)}
                        className="absolute right-2 top-2 text-textDim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove project"
                      >
                        <Trash2 size={11} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Project Name"
                          value={proj.name || ''}
                          onChange={e => handleProjectChange(idx, 'name', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs font-bold text-textMain outline-none placeholder-textDim"
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g. GitHub URL)"
                          value={proj.link || ''}
                          onChange={e => handleProjectChange(idx, 'link', e.target.value)}
                          className="bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMuted outline-none placeholder-textDim"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Technologies (comma separated: React, AWS, Python)"
                        value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                        onChange={e => handleProjectChange(idx, 'technologies', e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMuted outline-none placeholder-textDim"
                      />

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[8px] text-textDim font-bold uppercase">Description</label>
                          <button
                            onClick={() => handleOptimizeSection('projects', proj.description)}
                            className="text-[8px] font-bold text-primary hover:underline"
                          >
                            AI Optimize bullets
                          </button>
                        </div>
                        <textarea
                          rows="3"
                          placeholder="Project description & bullets..."
                          value={proj.description || ''}
                          onChange={e => handleProjectChange(idx, 'description', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/[0.08] rounded p-1.5 text-xs text-textMain leading-relaxed outline-none font-medium custom-scrollbar placeholder-textDim"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-6 text-center text-slate-400 italic text-xs">
              Configure session or upload resume to access Profile Editor.
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* PANEL 2: LIVE PREVIEW (Responsive Scale-to-View Render) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 max-h-[85vh] overflow-hidden">
          <PreviewPanel
            resumeData={editableResume}
            template={selectedTemplate}
            setTemplate={setSelectedTemplate}
            onDownloadPdf={handleDownloadPdf}
            downloadingPdf={downloadingPdf}
          />
        </div>

        {/* ========================================================================= */}
        {/* PANEL 3: INTELLIGENCE PANEL (ATS score ring, version compares, charts) */}
        {/* ========================================================================= */}
        <div className="space-y-6 max-h-[85vh] overflow-y-auto pl-1 pr-1 custom-scrollbar">
          
          {/* Tab Selection */}
          <div className="flex bg-white/[0.02] border border-white/[0.08] rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveRightTab('chat')}
              className={`flex-1 text-center py-2 px-1 text-2xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeRightTab === 'chat' ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' : 'text-textMuted hover:text-textMain'
              }`}
            >
              Co-Pilot Chat
            </button>
            <button
              onClick={() => setActiveRightTab('ats')}
              className={`flex-1 text-center py-2 px-1 text-2xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeRightTab === 'ats' ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' : 'text-textMuted hover:text-textMain'
              }`}
            >
              ATS Match
            </button>
            <button
              onClick={() => setActiveRightTab('versions')}
              className={`flex-1 text-center py-2 px-1 text-2xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeRightTab === 'versions' ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' : 'text-textMuted hover:text-textMain'
              }`}
            >
              Strategies
            </button>
            <button
              onClick={() => setActiveRightTab('history')}
              className={`flex-1 text-center py-2 px-1 text-2xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeRightTab === 'history' ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' : 'text-textMuted hover:text-textMain'
              }`}
            >
              Score Trends
            </button>
            <button
              onClick={() => setActiveRightTab('coverletter')}
              className={`flex-1 text-center py-2 px-1 text-2xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeRightTab === 'coverletter' ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' : 'text-textMuted hover:text-textMain'
              }`}
            >
              Letter
            </button>
          </div>

          {activeRightTab === 'chat' && (
            <div className="glass-card flex flex-col h-[75vh] max-h-[75vh] border border-white/[0.08] rounded-2xl overflow-hidden relative">
              {/* Header info */}
              <div className="p-3 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-textMain uppercase tracking-wider">AI Co-Pilot Chat</span>
                <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black">ACTIVE</span>
              </div>
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-xs ${msg.role === 'user' ? 'bg-white/[0.08]' : 'bg-gradient-to-r from-primary to-accent shadow-md'}`}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 border ${msg.role === 'user' ? 'bg-primary/15 border-primary/25 rounded-tr-none text-textMain' : 'bg-white/[0.01] border-white/[0.08] rounded-tl-none'}`}>
                      {msg.role === 'assistant' ? (
                        <RenderChatMarkdown text={msg.content} />
                      ) : (
                        <p className="text-2xs text-textMain leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex gap-2.5 animate-pulse">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white text-xs">
                      🤖
                    </div>
                    <div className="bg-white/[0.01] border border-white/[0.08] rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1">
                      <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* File Attachment indicator */}
              {chatFile && (
                <div className="px-4 py-1.5 bg-primary/10 border-t border-primary/20 text-3xs text-primary flex items-center justify-between shrink-0">
                  <span>Attached PDF: {chatFile.name} ({(chatFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button onClick={() => { setChatFile(null); if (chatFileInputRef.current) chatFileInputRef.current.value = ''; }} className="text-red-400 hover:text-red-300 font-bold">Cancel</button>
                </div>
              )}

              {/* Chat Input area */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-[#0a0d18] border-t border-white/[0.08] flex gap-2 shrink-0 items-center">
                {/* File Upload Trigger */}
                <input 
                  type="file"
                  accept=".pdf"
                  ref={chatFileInputRef}
                  onChange={e => setChatFile(e.target.files[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="p-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-textMuted hover:text-textMain rounded-lg transition-colors shrink-0"
                  title="Upload PDF Resume via Chat"
                >
                  <Upload size={13} />
                </button>
                
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={chatFile ? "Type prompt to compile PDF..." : "Optimize or edit resume..."}
                  className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-2xs text-textMain placeholder-textDim focus:outline-none focus:border-primary/50"
                  disabled={chatSending}
                />
                
                <button
                  type="submit"
                  disabled={chatSending || (!chatInput.trim() && !chatFile)}
                  className="bg-primary hover:bg-primaryHover disabled:bg-white/[0.08] disabled:text-textDim text-white p-2 rounded-lg transition-all active:scale-[0.95] shrink-0"
                >
                  {chatSending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                </button>
              </form>
            </div>
          )}

          {activeRightTab === 'ats' && (
            <ATSPanel
              report={latestReport}
              onInjectKeyword={handleInjectKeyword}
              injectingKeyword={injectingKeyword}
            />
          )}

          {activeRightTab === 'versions' && (
            <VersionManager
              versions={activeSession?.resumeVersions || []}
              originalResume={activeSession?.originalResume}
              selectedVersion={selectedVersionName}
              onSelectVersion={setSelectedVersionName}
              onGenerateVersions={handleGenerateStrategicVersions}
              generatingVersions={generatingVersions}
            />
          )}

          {activeRightTab === 'history' && (
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-xs font-bold text-textMain flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
                <TrendingUp className="text-primary" size={15} /> Resume Optimization Trends
              </h3>

              {activeSession?.atsReports?.length > 0 ? (
                <div className="space-y-4">
                  {/* Score history trend SVG line chart */}
                  <div className="w-full h-32 bg-white/[0.01] border border-white/[0.08] rounded-lg p-2 relative flex items-end justify-between">
                    <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Trend line */}
                      <path
                        fill="none"
                        stroke="#7c3aed"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        d={(() => {
                          const points = activeSession.atsReports.map((r, i) => {
                            const x = (i / Math.max(activeSession.atsReports.length - 1, 1)) * 100;
                            const y = 100 - r.score;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          });
                          return points.join(' ');
                        })()}
                      />
                      {/* Dot indicators */}
                      {activeSession.atsReports.map((r, i) => {
                        const x = (i / Math.max(activeSession.atsReports.length - 1, 1)) * 100;
                        const y = 100 - r.score;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#7c3aed"
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Render scale markers */}
                    <div className="absolute left-2 top-2 text-[8px] font-bold text-textDim">100</div>
                    <div className="absolute left-2 bottom-2 text-[8px] font-bold text-textDim">0</div>
                  </div>

                  <p className="text-[10px] text-textMuted leading-relaxed italic text-center">
                    Visualizing progression of scores from initial upload to current iteration.
                  </p>

                  {/* List of optimization logs */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block">History Logs</span>
                    {activeSession.optimizationHistory?.map((opt, i) => (
                      <div key={i} className="text-2xs bg-white/[0.01] border border-white/[0.08] p-2.5 rounded-lg">
                        <div className="flex justify-between font-bold text-textMain">
                          <span className="uppercase text-primary">{opt.section}</span>
                          <span className="text-[9px] text-textDim">{new Date(opt.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-textMuted mt-1">{opt.improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-textDim italic text-center text-xs p-6">
                  No optimization logs registered yet.
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'coverletter' && (
            <div className="glass-card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
                <h3 className="text-xs font-bold text-textMain flex items-center gap-1.5">
                  <MailOpen className="text-primary" size={15} /> Tailored Cover Letter
                </h3>

                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={generatingCoverLetter}
                  className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
                >
                  {generatingCoverLetter ? 'Writing...' : 'Regenerate'}
                </button>
              </div>

              {coverLetter ? (
                <div className="space-y-3 text-2xs leading-relaxed text-textMuted bg-white/[0.01] p-3 rounded-lg border border-white/[0.08]">
                  <p className="font-bold text-textMain border-b border-white/[0.08] pb-1 mb-1.5">Subject: {coverLetter.subject}</p>
                  <p className="whitespace-pre-wrap">{coverLetter.body}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-textDim italic text-xs space-y-3">
                  <p>Generate a cover letter tailored to the job description using DeepSeek.</p>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={generatingCoverLetter}
                    className="btn-primary text-[10px] py-1.5 px-3 mx-auto flex items-center gap-1"
                  >
                    Generate Cover Letter
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

function RenderChatMarkdown({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-2xs leading-relaxed text-textMuted">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        
        // Headers
        if (line.startsWith('## ')) {
          return <h4 key={idx} className="text-xs font-bold text-textMain mt-2 mb-1">{line.replace('## ', '')}</h4>;
        }
        if (line.startsWith('### ')) {
          return <h5 key={idx} className="text-2xs font-bold text-primary mt-2 mb-1">{line.replace('### ', '')}</h5>;
        }
        
        // Bullet
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.replace(/^[-*] /, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{renderInlineText(content)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineText(line)}</p>;
      })}
    </div>
  );
}

function renderInlineText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-textMain">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-white/[0.08] text-accent font-mono text-3xs px-1 py-0.5 rounded">{p.slice(1, -1)}</code>;
    return p;
  });
}
