import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Loader2, Send, CheckCircle2, AlertCircle, Clock, Eye, 
  CornerUpLeft, Shield, Building2, User, FileText, Check, 
  ExternalLink, Sparkles, RefreshCw, BarChart2, Search
} from 'lucide-react';
import useStore from '../store/useStore';
import API_BASE from '../config/api';

export default function AIOutreach() {
  const { token } = useStore();
  const navigate = useNavigate();
  const locationState = useLocation();
  const selectApplicationId = locationState.state?.selectApplicationId;
  
  // Tab states
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' | 'drafts'
  const [history, setHistory] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected outreach details
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftContent, setDraftContent] = useState(null); // Editable draft structure
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, statsRes, jobsRes, gmailRes] = await Promise.all([
        axios.get(`${API_BASE}/api/outreach/history`, config).catch(() => ({ data: { emails: [] } })),
        axios.get(`${API_BASE}/api/outreach/stats`, config).catch(() => ({ data: null })),
        axios.get(`${API_BASE}/api/jobs`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/outreach/gmail/status`, config).catch(() => ({ data: { connected: false } }))
      ]);

      setHistory(historyRes.data.emails || []);
      setGmailConnected(gmailRes.data?.connected || false);
      
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      // Filter jobs/applications that have no email sent yet
      // These represent "Drafts" in our queue
      const unsentApplications = jobsRes.data.filter(app => 
        !['APPLIED', 'REJECTED', 'OFFERED', 'FAILED'].includes(app.status)
      );
      setDrafts(unsentApplications);

      // Default selection or state-based selection
      if (selectApplicationId) {
        const targetApp = unsentApplications.find(app => app._id === selectApplicationId);
        if (targetApp) {
          setActiveTab('drafts');
          setSelectedItem(targetApp);
          loadDraftDetails(targetApp);
          setLoading(false);
          return;
        }
      }

      if (activeTab === 'sent' && historyRes.data.emails?.length > 0) {
        setSelectedItem(historyRes.data.emails[0]);
      } else if (activeTab === 'drafts' && unsentApplications.length > 0) {
        loadDraftDetails(unsentApplications[0]);
      } else {
        setSelectedItem(null);
      }

    } catch (err) {
      console.error('Failed to fetch outreach data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDraftDetails = async (app) => {
    setSelectedItem(app);
    setDraftContent(null);
    setGeneratingDraft(true);
    try {
      // POST /api/outreach/generate-draft returns { recipient_email, recipient_name, subject, body }
      const { data } = await axios.post(`${API_BASE}/api/outreach/generate-draft`, { applicationId: app._id }, config);
      setDraftContent({
        applicationId: app._id,
        recipient_email: data.recipient_email || app.job_id?.recruiter_email || '',
        recipient_name: data.recipient_name || app.job_id?.recruiter_name || `Hiring Team at ${app.job_id?.company}`,
        subject: data.subject || `Application Follow-up - ${app.job_id?.title}`,
        body: data.body || ''
      });
    } catch (err) {
      console.error('Failed to generate draft details:', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSendEmail = async () => {
    if (!draftContent || !draftContent.recipient_email) {
      alert('Recipient email is required.');
      return;
    }
    setSendingEmail(true);
    try {
      await axios.post(`${API_BASE}/api/outreach/send-outreach`, {
        applicationId: draftContent.applicationId,
        recipient_email: draftContent.recipient_email,
        recipient_name: draftContent.recipient_name,
        subject: draftContent.subject,
        body: draftContent.body
      }, config);

      alert('Outreach email dispatched successfully!');
      setDraftContent(null);
      setSelectedItem(null);
      fetchData(); // Reload list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'replied': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 animate-pulse">Replied</span>;
      case 'opened': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-warning/10 border border-warning/25 text-warning">Opened</span>;
      case 'delivered': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400">Delivered</span>;
      case 'sent': return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/[0.04] border border-white/[0.08] text-textMuted">Sent</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-danger/10 border border-danger/25 text-danger">{status}</span>;
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
    setDraftContent(null);
    if (tab === 'sent' && history.length > 0) {
      setSelectedItem(history[0]);
    } else if (tab === 'drafts' && drafts.length > 0) {
      loadDraftDetails(drafts[0]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-textMain">
      
      {/* 1. TOP METRICS PANEL */}
      <div className="shrink-0 p-4 border-b border-white/[0.06] bg-[#060813] grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Sent</p>
          <p className="text-xl font-black text-textMain mt-1">{stats?.sent || 0}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Delivered</p>
          <p className="text-xl font-black text-blue-400 mt-1">{stats?.delivered || 0}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Opened</p>
          <p className="text-xl font-black text-warning mt-1">{stats?.opened || 0}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Replied</p>
          <p className="text-xl font-black text-success mt-1">{stats?.replied || 0}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Open Rate</p>
          <p className="text-xl font-black text-violet-400 mt-1">{stats?.openRate || 0}%</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Reply Rate</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats?.replyRate || 0}%</p>
        </div>
      </div>

      {/* 2. MAIN SPLIT GMAIL INTERFACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Recruiter Outreach List */}
        <div className="w-80 md:w-96 shrink-0 h-full border-r border-white/[0.06] flex flex-col overflow-hidden bg-surface/25">
          {/* Sub navbar tabs */}
          <div className="flex border-b border-white/[0.06] p-3 gap-2 shrink-0">
            <button
              onClick={() => handleTabChange('sent')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sent' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/[0.02] text-textMuted hover:text-white border border-white/[0.05]'
              }`}
            >
              Sent Outreach ({history.length})
            </button>
            <button
              onClick={() => handleTabChange('drafts')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'drafts' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/[0.02] text-textMuted hover:text-white border border-white/[0.05]'
              }`}
            >
              Drafts ({drafts.length})
              {drafts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          </div>

          {/* Search bar within list */}
          <div className="px-3 py-2 border-b border-white/[0.05] shrink-0 relative flex items-center">
            <Search size={12} className="absolute left-6 text-textDim" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white/[0.01] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-2xs text-textMain focus:outline-none"
            />
          </div>

          {/* Conversations scrollable list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-textMuted gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-2xs">Refreshing mailbox threads...</span>
              </div>
            )}

            {!loading && activeTab === 'sent' && history.length === 0 && (
              <div className="text-center py-20 text-textMuted text-xs px-6">
                <Mail size={28} className="mx-auto mb-2 opacity-25" />
                <p className="font-bold">No sent outreach</p>
                <p className="text-textDim text-[10px] mt-0.5">Send outreach emails for tracked applications to see logs.</p>
              </div>
            )}

            {!loading && activeTab === 'drafts' && drafts.length === 0 && (
              <div className="text-center py-20 text-textMuted text-xs px-6">
                <Mail size={28} className="mx-auto mb-2 opacity-25" />
                <p className="font-bold">No drafts pending</p>
                <p className="text-textDim text-[10px] mt-0.5">Save jobs with recruiter contact info in Job Discovery to draft follows.</p>
              </div>
            )}

            {!loading && activeTab === 'sent' && history.map((email) => {
              const isSelected = selectedItem && selectedItem._id === email._id;
              return (
                <div
                  key={email._id}
                  onClick={() => setSelectedItem(email)}
                  className={`p-4 cursor-pointer hover:bg-white/[0.01] transition-all flex items-start gap-3 relative ${
                    isSelected ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 text-textMuted text-xs font-extrabold uppercase">
                    {email.recipient_name?.[0] || 'R'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white truncate">{email.recipient_name || 'Hiring Team'}</span>
                      <span className="text-[9px] text-textDim shrink-0">{new Date(email.sent_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-primary font-bold truncate mt-0.5">{email.company}</p>
                    <p className="text-[10px] text-textMuted truncate mt-0.5 font-semibold">{email.subject}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[10px] text-textDim truncate max-w-[120px]">{email.job_title}</span>
                      {getStatusBadge(email.status)}
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && activeTab === 'drafts' && drafts.map((app) => {
              const isSelected = selectedItem && selectedItem._id === app._id;
              return (
                <div
                  key={app._id}
                  onClick={() => loadDraftDetails(app)}
                  className={`p-4 cursor-pointer hover:bg-white/[0.01] transition-all flex items-start gap-3 relative ${
                    isSelected ? 'bg-primary/[0.02] border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 text-textMuted text-xs font-extrabold uppercase">
                    {app.job_id?.recruiter_name?.[0] || app.job_id?.company?.[0] || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white truncate">{app.job_id?.recruiter_name || 'Hiring Team'}</span>
                      <span className="text-[9px] text-textDim shrink-0">Draft</span>
                    </div>
                    <p className="text-[10px] text-primary font-bold truncate mt-0.5">{app.job_id?.company}</p>
                    <p className="text-[10px] text-textMuted truncate mt-0.5">{app.job_id?.title}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-[10px] text-textDim">ATS Score: {app.match_score || 0}%</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/25">Drafting</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Outreach Details Panel & Composer */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 bg-surface/10 flex flex-col space-y-6">
          
          {!selectedItem && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-textMuted px-6 space-y-3">
              <Mail size={48} className="opacity-10 text-primary" />
              <p className="text-xs font-bold text-textMuted">No conversation selected</p>
              <p className="text-[10px] text-textDim max-w-[220px] leading-relaxed">
                Select an outreach email thread or click "Drafts" to review and edit recruiter follows.
              </p>
            </div>
          )}

          {/* Gmail Connection Prompt Card */}
          {selectedItem && !gmailConnected && (
            <div className="glass p-4 border-l-4 border-l-red-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Gmail Outreach Channel Offline</p>
                  <p className="text-[10px] text-textMuted leading-relaxed mt-0.5">
                    Your Gmail account is not authenticated. Link your account in Settings to dispatch these outreach follow-ups directly.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/settings')}
                className="btn-primary text-xs !py-2 !px-4 shrink-0 font-bold"
              >
                Connect Gmail
              </button>
            </div>
          )}

          {/* VIEW SENT OUTREACH ITEM */}
          {selectedItem && activeTab === 'sent' && (
            <div className="flex-1 flex flex-col space-y-6 animate-fade-in text-xs">
              
              {/* Recruiter Details Row */}
              <div className="glass p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-extrabold text-base uppercase shrink-0">
                    {selectedItem.recipient_name?.[0] || 'R'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white leading-tight">{selectedItem.recipient_name || 'Hiring Team'}</h3>
                    <p className="text-[10px] text-textMuted mt-0.5 truncate">{selectedItem.recipient_email}</p>
                    <p className="text-[9px] text-textDim mt-0.5">{selectedItem.company} &bull; {selectedItem.job_title}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {getStatusBadge(selectedItem.status)}
                  <span className="text-[9px] text-textDim font-mono">ID: {selectedItem.gmail_thread_id || 'untracked'}</span>
                </div>
              </div>

              {/* Email Content Box */}
              <div className="glass p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Subject</span>
                  <p className="font-extrabold text-xs text-white bg-white/[0.01] border border-white/[0.06] p-2.5 rounded-lg">{selectedItem.subject}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">MIME Body Message</span>
                  <div className="bg-white/[0.01] border border-white/[0.06] p-4 rounded-lg text-textMuted max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                    {selectedItem.body}
                  </div>
                </div>
              </div>

              {/* Recruiter Reply Snippet */}
              {selectedItem.reply_received && (
                <div className="glass p-4 border border-emerald-500/25 bg-emerald-500/[0.02] space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">Recruiter Reply</span>
                  </div>
                  <div className="text-xs text-textMain italic leading-relaxed bg-[#060813] border border-white/[0.04] p-3 rounded-lg">
                    "{selectedItem.reply_content}"
                  </div>
                  <p className="text-[9px] text-textDim text-right">Received {new Date(selectedItem.reply_at).toLocaleDateString()} at {new Date(selectedItem.reply_at).toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          )}

          {/* DRAFT COMPOSER PANEL */}
          {selectedItem && activeTab === 'drafts' && (
            <div className="flex-1 flex flex-col space-y-5 animate-fade-in text-xs">
              
              {/* Job Header Info */}
              <div className="glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-extrabold shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-white leading-tight">{selectedItem.job_id?.title}</h3>
                    <p className="text-[10px] text-primary font-bold mt-0.5">{selectedItem.job_id?.company}</p>
                    <p className="text-[9px] text-textMuted mt-0.5">{selectedItem.job_id?.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 border border-white/[0.08] text-textMuted font-bold rounded">ATS score: {selectedItem.match_score || 0}%</span>
                </div>
              </div>

              {generatingDraft && (
                <div className="flex-1 flex flex-col items-center justify-center text-primary font-bold gap-2">
                  <Loader2 className="animate-spin" size={28} />
                  <span className="text-xs text-textMuted">AI composing personalized outreach draft...</span>
                </div>
              )}

              {/* Composer Inputs */}
              {!generatingDraft && draftContent && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Recruiter Name</label>
                      <input 
                        type="text" 
                        value={draftContent.recipient_name}
                        onChange={e => setDraftContent({ ...draftContent, recipient_name: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/50"
                        placeholder="Hiring Manager / Team"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Recruiter Email</label>
                      <input 
                        type="email" 
                        value={draftContent.recipient_email}
                        onChange={e => setDraftContent({ ...draftContent, recipient_email: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/50"
                        placeholder="hr@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Outreach Subject Line</label>
                    <input 
                      type="text" 
                      value={draftContent.subject}
                      onChange={e => setDraftContent({ ...draftContent, subject: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white outline-none focus:border-primary/50 font-bold"
                      placeholder="Follow up on Application"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="text-[9px] font-bold text-textDim uppercase tracking-wider block mb-1">Email Body Draft (Editable)</label>
                    <textarea 
                      rows="10"
                      value={draftContent.body}
                      onChange={e => setDraftContent({ ...draftContent, body: e.target.value })}
                      className="w-full flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg p-3 text-xs text-textMuted leading-relaxed outline-none focus:border-primary/50 custom-scrollbar font-medium"
                      placeholder="Outreach content..."
                    />
                  </div>

                  {/* Gmail Send Actions */}
                  <div className="flex gap-3 justify-end border-t border-white/[0.06] pt-4 shrink-0">
                    <button
                      onClick={() => { setSelectedItem(null); setDraftContent(null); }}
                      className="px-4 py-2 border border-white/[0.08] hover:bg-white/[0.05] rounded-xl text-xs font-bold text-textMain"
                    >
                      Discard Draft
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !gmailConnected}
                      className="btn-primary text-xs !py-2 !px-5 gap-1.5 flex items-center font-bold"
                    >
                      {sendingEmail ? (
                        <><Loader2 className="animate-spin" size={14}/> <span>Dispatching...</span></>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Send via Gmail</span>
                        </>
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
  );
}
