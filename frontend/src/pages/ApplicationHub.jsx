import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { 
  ArrowLeft, Loader2, Target, FileText, Bot, CheckCircle2, 
  AlertTriangle, Building2, ExternalLink, ClipboardList, Camera, 
  ListChecks, Mail, Briefcase, DollarSign, Calendar, ShieldCheck 
} from 'lucide-react';

export default function ApplicationHub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useStore();
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const refetchApplication = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/jobs/application/${id}`, config);
      setAppData(data);
    } catch (err) {
      console.error('Failed to refetch application data:', err);
    }
  };

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const [appRes, gmailRes] = await Promise.all([
          axios.get(`${API_BASE}/api/jobs/application/${id}`, config),
          axios.get(`${API_BASE}/api/outreach/gmail/status`, config).catch(() => ({ data: { connected: false } }))
        ]);
        setAppData(appRes.data);
        setGmailConnected(gmailRes.data?.connected || false);
      } catch (err) {
        console.error(err);
        alert('Could not load application hub data.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadApplication();
  }, [id, token, navigate]);

  const handleGenerateDraft = async () => {
    setDrafting(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/outreach/generate-draft`, { applicationId: id }, config);
      setDraft(data);
      setIsEditingDraft(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate outreach draft');
      console.error(err);
    } finally {
      setDrafting(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!draft.recipient_email) {
      alert('Recipient email is required.');
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API_BASE}/api/outreach/send-outreach`, {
        applicationId: id,
        recipient_email: draft.recipient_email,
        recipient_name: draft.recipient_name,
        subject: draft.subject,
        body: draft.body
      }, config);
      alert('AI outreach email dispatched successfully via Gmail!');
      setDraft(null);
      setIsEditingDraft(false);
      await refetchApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send outreach');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold">Assembling Generated Materials...</h2>
        <p className="text-slate-500 text-sm mt-2">Retrieving crawler tracking and outreach records...</p>
      </div>
    );
  }

  if (!appData) return null;

  const job = appData.job_id || {};
  const intel = appData.intelligence_materials || {};
  const match = appData.match_analysis || {};
  const emailTracking = appData.email_tracking || null;
  const resume = appData.resume_id || null;

  const hasSubmissionReport = appData.filled_form_screenshot_url || (appData.form_submission_data && appData.form_submission_data.length > 0);

  const renderLink = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-semibold text-primary hover:text-primaryHover transition-colors underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 text-slate-800">
      
      {/* Navigation Header */}
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm mb-2"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Outreach Console
      </button>

      {/* Coming Soon Announcement */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-accent rounded-2xl p-6 flex items-start gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow-violet">
          <Bot size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-textMain">🚀 AI Auto-Apply Features Coming Soon</h3>
          <p className="text-sm text-textMuted mt-1">
            Powerful automation tools are being developed to streamline your job application process. Soon you'll be able to automatically apply to matching jobs, track applications, and reach out to recruiters all from this hub.
          </p>
          <p className="text-xs font-semibold text-primary mt-3">Check back soon! 🎉</p>
        </div>
      </div>

      {/* Main Jumbotron Header */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="space-y-3 z-10">
          <span className="bg-primary/10 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
            Outreach & Details Hub
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{job.title}</h1>
          <div className="text-lg text-primary font-bold flex items-center gap-2">
            <Building2 size={20} /> {job.company}
            {job.location && <span className="text-slate-400 font-medium text-sm">&bull; {job.location}</span>}
          </div>
          {resume && (
            <p className="text-2xs text-slate-400 font-bold">
              Linked Resume: <span className="text-slate-600 underline">{resume.title}</span> (ATS: {resume.ats_score}/100)
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          {job.job_url && (
            <a 
              href={job.job_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 text-xs !py-3 px-5 shadow-sm"
            >
              Open Original Post <ExternalLink size={14} />
            </a>
          )}
          <span className={`text-2xs px-3 py-1.5 rounded-lg border font-bold ${
            appData.status === 'APPLIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            appData.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            appData.status === 'APPLYING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            Campaign: {appData.status === 'APPLIED' ? 'Outreach Active' : appData.status}
          </span>
        </div>
      </div>

      {/* 3-Column Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: AI Match & Intel */}
        <div className="space-y-6">
          {/* Algorithm Match Score */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm border-t-4 border-t-primary">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="text-primary" size={18} /> Match Analytics Engine
            </h3>
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fit Score Rating</span>
              <span className={`text-2xl font-black ${match.match_percentage >= 75 ? 'text-primary' : 'text-amber-500'}`}>
                {match.match_percentage || 0}%
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Dominant Strengths</span>
                <div className="flex flex-wrap gap-1.5">
                  {match.strengths && match.strengths.length > 0 ? (
                    match.strengths.map((s, i) => (
                      <span key={i} className="text-2xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md border border-emerald-100 font-semibold">{s}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No specific strengths listed</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Keyword Gaps</span>
                <div className="flex flex-wrap gap-1.5">
                  {match.missing_skills && match.missing_skills.length > 0 ? (
                    match.missing_skills.map((s, i) => (
                      <span key={i} className="text-2xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md border border-amber-100 font-semibold">{s}</span>
                    ))
                  ) : (
                    <span className="text-2xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md border border-emerald-100 font-semibold">Perfect Keyword Match!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DeepSeek Intelligence Brief */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm border-t-4 border-t-teal-500">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bot className="text-teal-600" size={18} /> DeepSeek Intelligence
            </h3>
            
            {!intel.cultural_reviews ? (
              <p className="text-xs text-slate-450 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                Preparation materials bypassed during automation run.
              </p>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Company Environment</span>
                  <p className="text-slate-650 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {intel.cultural_reviews}
                  </p>
                </div>
                
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Likely Interview Steps</span>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-700">
                    {intel.interview_process?.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-teal-650">{i + 1}.</span> 
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Prep Resources</span>
                  <div className="space-y-1.5">
                    {intel.study_resources?.map((res, i) => (
                      <div key={i} className="text-2xs text-slate-700 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg">{res}</div>
                    ))}
                    {intel.internet_sources?.map((src, i) => (
                      <div key={`src-${i}`} className="text-2xs text-slate-700 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg break-all">
                        {renderLink(src)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Job Description */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm border-t-4 border-t-slate-400 h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 shrink-0">
              <Briefcase className="text-slate-500" size={18} /> Scraped Job Specifications
            </h3>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5"><DollarSign size={10} className="inline mr-0.5 text-slate-400" /> Salary Range</span>
                <span className="text-xs font-bold text-slate-800">{job.salary || 'Not Disclosed'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5"><Calendar size={10} className="inline mr-0.5 text-slate-400" /> Experience Req.</span>
                <span className="text-xs font-bold text-slate-800">{job.experience_required || 'Not specified'}</span>
              </div>
            </div>

            {/* Full description */}
            <div className="flex-1 min-h-[300px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-slate-50/50 p-4">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Description Full Text</span>
              <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
            
            {/* Required Skills list */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-150 shrink-0">
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Required Skills</span>
                <div className="flex flex-wrap gap-1">
                  {job.skills_required.map((skill, idx) => (
                    <span key={idx} className="text-2xs bg-slate-100 text-slate-650 px-2 py-0.5 rounded font-bold border border-slate-200">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: AI Recruiter Outreach & Gmail Tracking */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm border-t-4 border-t-primary h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="text-primary" size={18} /> Recruiter Mailbox Outreach
            </h3>

            {/* Recruiter contact card */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 mb-4 text-xs">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Recipient Recruiter Address</span>
              <div className="grid grid-cols-2 gap-4 mt-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Recruiter Name</span>
                  <span className="font-bold text-slate-800">{job.recruiter_name || 'Hiring Team'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Recruiter Email</span>
                  <span className="font-bold text-slate-800 break-all">{job.recruiter_email || 'careers@company.com'}</span>
                </div>
              </div>
            </div>

            {/* Outreach Campaign details */}
            {emailTracking ? (
              <div className="flex-1 flex flex-col justify-start space-y-4">
                {/* Active Tracking Bar */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Gmail Tracking Status:</span>
                  <span className={`text-2xs px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wide ${
                    emailTracking.status === 'replied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse' :
                    emailTracking.status === 'opened' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {emailTracking.status}
                  </span>
                </div>

                {/* Email Subject */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Subject Header</span>
                  <p className="font-bold text-slate-800">{emailTracking.subject}</p>
                </div>

                {/* Generated Email Body */}
                <div className="flex-1 min-h-[160px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-650 whitespace-pre-wrap">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Outreach Email Text</span>
                  {emailTracking.body}
                </div>

                {/* Recruiter Reply Snippet */}
                {emailTracking.reply_received && (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3.5 space-y-1.5 animate-fade-in text-xs">
                    <div className="flex items-center gap-1.5 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-2xs font-bold uppercase tracking-widest">Recruiter Reply Details</span>
                    </div>
                    <p className="text-slate-800 italic leading-relaxed bg-white/60 p-2.5 rounded-lg border border-emerald-100/50">
                      "{emailTracking.reply_content}"
                    </p>
                    <span className="text-[10px] text-slate-400 block text-right">Received {new Date(emailTracking.reply_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-start space-y-4">
                {!gmailConnected ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-3">
                    <Mail size={32} className="opacity-20 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-650">Gmail Not Connected</p>
                    <p className="text-[10px] text-slate-450 max-w-[200px] mx-auto">
                      Connect your Gmail account to enable AI Outreach and automatic recruiter emailing.
                    </p>
                    <button
                      onClick={() => navigate('/settings')}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-xs font-bold transition-all active:scale-[0.97]"
                    >
                      Connect Gmail
                    </button>
                  </div>
                ) : !isEditingDraft ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-3">
                    <Mail size={32} className="opacity-20 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-650 font-bold">Manual AI Outreach Ready</p>
                    <p className="text-[10px] text-slate-450 max-w-[220px] mx-auto">
                      Draft a highly personalized outreach email via DeepSeek and send it instantly using your linked Gmail.
                    </p>
                    <button
                      onClick={handleGenerateDraft}
                      disabled={drafting}
                      className="px-4 py-2 bg-primary hover:bg-primaryHover disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 mx-auto"
                    >
                      {drafting ? (
                        <><Loader2 className="animate-spin" size={14} /> Generating Draft...</>
                      ) : (
                        <>Compose AI Outreach</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recruiter Email</label>
                      <input
                        type="email"
                        value={draft.recipient_email}
                        onChange={e => setDraft({ ...draft, recipient_email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium outline-none focus:border-primary/50 text-xs"
                        placeholder="careers@company.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recruiter Name</label>
                      <input
                        type="text"
                        value={draft.recipient_name}
                        onChange={e => setDraft({ ...draft, recipient_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium outline-none focus:border-primary/50 text-xs"
                        placeholder="Hiring Manager / Team"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Subject</label>
                      <input
                        type="text"
                        value={draft.subject}
                        onChange={e => setDraft({ ...draft, subject: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold outline-none focus:border-primary/50 text-xs"
                        placeholder="Outreach Subject"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Body</label>
                      <textarea
                        rows="7"
                        value={draft.body}
                        onChange={e => setDraft({ ...draft, body: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 leading-relaxed outline-none focus:border-primary/50 text-xs font-medium custom-scrollbar"
                        placeholder="Outreach email content..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setDraft(null); setIsEditingDraft(false); }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSendOutreach}
                        disabled={sending}
                        className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg font-bold flex items-center gap-1.5"
                      >
                        {sending ? (
                          <><Loader2 className="animate-spin" size={12} /> Sending...</>
                        ) : (
                          <>Send Outreach</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Submission Reports and Cover Letters (grouped at bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cover Letter Section */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-primary" size={18} /> Tailored Cover Letter
            </h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(appData.tailored_cover_letter || ''); 
                alert('Cover letter copied to clipboard!');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-[0.97]"
            >
              Copy Cover Letter
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-serif leading-relaxed text-xs text-slate-700 max-h-[350px] overflow-y-auto whitespace-pre-wrap">
            {appData.tailored_cover_letter || "A cover letter was not generated for this application."}
          </div>
        </div>

        {/* Auto Apply submission report section (screenshots) */}
        {hasSubmissionReport ? (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="text-cyan-600" size={18} /> Legacy Submission Report
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold uppercase tracking-wider">
                {appData.screenshot_url ? 'Browser Automation' : 'ATS API'}
              </span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Form Fill Screenshots */}
              {appData.filled_form_screenshot_url && (
                <div className="space-y-2">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Automation Screenshot</span>
                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-[220px]">
                    <img
                      src={appData.filled_form_screenshot_url}
                      alt="Filled application form screenshot"
                      className="w-full h-auto object-contain max-h-[200px] mx-auto block cursor-pointer"
                      onClick={() => window.open(appData.filled_form_screenshot_url, '_blank')}
                    />
                  </div>
                  <button
                    onClick={() => window.open(appData.filled_form_screenshot_url, '_blank')}
                    className="text-2xs text-primary font-bold hover:underline block text-right"
                  >
                    Open Full Size ↗
                  </button>
                </div>
              )}

              {/* Form Data */}
              {appData.form_submission_data && appData.form_submission_data.length > 0 && (
                <div className="space-y-2">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Auto-Filled Fields</span>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1 text-xs">
                    {appData.form_submission_data.map((field, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-150 rounded-lg p-2 flex justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.field_label}</span>
                          <span className="font-semibold text-slate-800 block truncate">{field.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
            <ShieldCheck size={36} className="opacity-20 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">Email-Outreach Centric Application</p>
            <p className="text-[10px] text-slate-450 max-w-[280px]">No legacy browser automation reports or Pre-apply screenshots compiled since this submission was handled directly via Gmail OAuth outreach.</p>
          </div>
        )}

      </div>

    </div>
  );
}
