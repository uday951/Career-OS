import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, Loader2, AlertCircle, CheckCircle2,
  Plus, X, Globe, Lock, Bell, Briefcase, MapPin, DollarSign, 
  Target, Clock, Upload, FileText, Trash2, ShieldCheck, Sparkles, CreditCard, ExternalLink, Mail
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const SUGGESTED_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 
  'Full Stack Developer', 'React Developer', 'DevOps Engineer', 'Product Manager'
];

const SUGGESTED_LOCATIONS = [
  'Remote', 'New York', 'San Francisco', 'London', 'India'
];

export default function AutoApplySettings() {
  const { token, user, navigate: storeNavigate } = useStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

  const [settings, setSettings] = useState({
    enabled: false,
    preferred_roles: [],
    preferred_locations: [],
    remote_only: false,
    salary_min: 0,
    salary_max: 0,
    applications_per_day: 10,
    min_match_score: 70,
    excluded_companies: [],
    auto_apply_enabled: false,
    require_human_review: true,
    email_notifications: true,
    telegram_notifications: false,
    telegram_chat_id: '',
    search_time: '09:00',
    timezone: 'America/New_York',
    days_of_week: [1, 2, 3, 4, 5],
    resume_id: '',
  });

  const [resumes, setResumes] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);

  // Mock Stripe/Billing state
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  
  // Custom Crawler Parameters
  const [tuningLevel, setTuningLevel] = useState('Standard Match');
  const [portals, setPortals] = useState({ linkedin: true, indeed: true, naukri: false });
  const [simulateBeforeApply, setSimulateBeforeApply] = useState(true);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { 
    if (token) {
      fetchSettingsAndResumes();
    }
  }, [token]);

  const fetchSettingsAndResumes = async () => {
    try {
      const [settingsRes, resumesRes, gmailRes] = await Promise.all([
        axios.get(`${API_BASE}/api/automation/settings`, config),
        axios.get(`${API_BASE}/api/resumes`, config),
        axios.get(`${API_BASE}/api/outreach/gmail/status`, config).catch(() => ({ data: { connected: false } }))
      ]);

      setResumes(resumesRes.data);
      setGmailConnected(gmailRes.data?.connected || false);

      if (settingsRes.data) {
        const data = settingsRes.data;
        setSettings({
          enabled: data.enabled || false,
          preferred_roles: data.preferred_roles || [],
          preferred_locations: data.preferred_locations || [],
          remote_only: data.remote_only || false,
          salary_min: data.salary_min || 0,
          salary_max: data.salary_max || 0,
          applications_per_day: data.applications_per_day || 10,
          min_match_score: data.min_match_score || 70,
          excluded_companies: data.excluded_companies || [],
          auto_apply_enabled: data.auto_apply_enabled || false,
          require_human_review: data.require_human_review !== false,
          email_notifications: data.email_notifications !== false,
          telegram_notifications: data.telegram_notifications || false,
          telegram_chat_id: data.telegram_chat_id || '',
          search_time: data.search_time || '09:00',
          timezone: data.timezone || 'America/New_York',
          days_of_week: data.days_of_week || [1, 2, 3, 4, 5],
          resume_id: data.resume_id?._id || data.resume_id || '',
        });
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    let updatedSettings = { ...settings };
    let changed = false;

    const processPendingField = (field, value, setter) => {
      if (value.trim()) {
        const items = value.split(',').map(i => i.trim()).filter(i => i.length > 0);
        const uniqueItems = items.filter(i => !updatedSettings[field].includes(i));
        if (uniqueItems.length > 0) {
          updatedSettings[field] = [...updatedSettings[field], ...uniqueItems];
          changed = true;
        }
        setter('');
      }
    };

    processPendingField('preferred_roles', newRole, setNewRole);
    processPendingField('preferred_locations', newLocation, setNewLocation);
    processPendingField('excluded_companies', newExcluded, setNewExcluded);

    const finalSettings = changed ? updatedSettings : settings;
    if (changed) {
      setSettings(updatedSettings);
    }
    
    try {
      await axios.put(`${API_BASE}/api/automation/settings`, finalSettings, config);
      setSuccess('Settings saved successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
      setSaving(false);
    }
  };

  const addItem = (field, value, setter, clear) => {
    if (value.trim()) {
      const items = value.split(',').map(i => i.trim()).filter(i => i.length > 0);
      const uniqueItems = items.filter(i => !settings[field].includes(i));
      if (uniqueItems.length > 0) {
        const newSettings = { ...settings, [field]: [...settings[field], ...uniqueItems] };
        setSettings(newSettings);
      }
      clear('');
    }
  };

  const removeItem = (field, index) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const toggleDay = (day) => {
    setSettings(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/resumes/${id}`, config);
      setResumes(prev => prev.filter(r => r._id !== id));
      
      // If deleted resume was currently selected in settings, clear it
      if (settings.resume_id === id) {
        setSettings(prev => ({ ...prev, resume_id: '' }));
      }
      setSuccess('Resume removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete resume');
    }
  };

  const selectActiveResume = (id) => {
    setSettings(prev => ({ ...prev, resume_id: id }));
    setSuccess('Active resume updated! Click Save to apply changes.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleConnectGmail = async () => {
    setGmailLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/api/outreach/gmail/auth-url`, config);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to get Gmail auth URL:', err);
      setError('Failed to initiate Google authorization flow.');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail outreach? Recruiter emails will no longer be sent.')) return;
    setGmailLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/api/outreach/gmail/disconnect`, {}, config);
      setGmailConnected(false);
      setSuccess('Gmail account disconnected successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
      setError('Failed to disconnect Gmail account.');
    } finally {
      setGmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[60vh] text-textMain">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-xs text-textMuted font-medium">Synchronizing configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in pb-24 text-textMain">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface to-[#0a0d18] border border-white/[0.05] p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="space-y-2 relative z-10">
          <p className="text-2xs font-extrabold tracking-widest text-primary uppercase">SYSTEM PARAMETERS</p>
          <h1 className="text-3xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-textMain via-slate-100 to-textMuted">
            Autopilot Settings
          </h1>
          <p className="text-xs text-textMuted max-w-xl">
            Configure active profiles, search parameters, scheduler limits, and channel outreach triggers.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary text-xs !py-3 !px-5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs !py-3 !px-5 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-danger">Configuration Error</h5>
            <p className="text-2xs text-danger/80">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/25 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-success">Update Successful</h5>
            <p className="text-2xs text-success/80">{success}</p>
          </div>
        </div>
      )}

      {/* Feature Notification Announcement */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-white/[0.05] rounded-2xl p-6 flex items-start gap-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          <Sparkles size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-textMain">🚀 Auto-Apply AI Autopilot Status</h3>
          <p className="text-xs text-textMuted mt-1 leading-relaxed">
            The crawler executes background search queries and matches resume keywords using deep semantic matching. Ensure your active profile is fully completed for maximum match rates.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-textDim block">Tailoring Model</span>
              <span className="text-2xs font-bold text-primary mt-0.5 block">DeepSeek-v3</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-textDim block">Crawl Portals</span>
              <span className="text-2xs font-bold text-accent mt-0.5 block">LinkedIn & Indeed</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-textDim block">Daily Quota</span>
              <span className="text-2xs font-bold text-success mt-0.5 block">Uncapped</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-textDim block">Agent Scheduler</span>
              <span className="text-2xs font-bold text-warning mt-0.5 block">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Master toggle */}
      <section className="glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-textMain">Agent Scheduler Autopilot</h2>
              <p className="text-xs text-textMuted">Enable or disable background crawl schedules globally</p>
            </div>
          </div>
          <label className="relative flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.enabled} 
              onChange={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="toggle-checkbox" 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Gmail Outreach connection card */}
      <section className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Mail size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Gmail Outreach Integration</h2>
            <p className="text-xs text-textMuted">Link your Gmail account to dispatch automated recruiter outreach emails</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${gmailConnected ? 'bg-success/10 text-success' : 'bg-white/[0.04] text-textDim'}`}>
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-textMain">
                  {gmailConnected ? 'Gmail Channel Active' : 'Gmail Channel Disconnected'}
                </p>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  gmailConnected ? 'bg-success/20 text-success border border-success/10' : 'bg-white/[0.08] text-textMuted border border-white/[0.05]'
                }`}>
                  {gmailConnected ? 'Linked' : 'Offline'}
                </span>
              </div>
              <p className="text-[10px] text-textMuted mt-0.5">
                {gmailConnected 
                  ? 'Recruiter templates will automatically dispatch from your personal address.' 
                  : 'Outreach emails will remain as drafts. Connect Gmail to enable dispatch.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={gmailLoading}
            onClick={gmailConnected ? handleDisconnectGmail : handleConnectGmail}
            className={`px-4 py-2 text-2xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm shrink-0 select-none ${
              gmailConnected 
                ? 'bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20' 
                : 'bg-primary text-white hover:brightness-110 shadow-[0_4px_12px_rgba(124,58,237,0.2)]'
            }`}
          >
            {gmailLoading ? (
              <Loader2 className="animate-spin" size={12} />
            ) : gmailConnected ? (
              'Disconnect'
            ) : (
              'Connect Account'
            )}
          </button>
        </div>
      </section>

      {/* 2. Premium Resume Selector & Manager */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Resume Profiles</h2>
            <p className="text-xs text-textMuted">Select the active profile used for screening and tailor-made templates</p>
          </div>
        </div>

        {/* Existing Resumes List */}
        <div className="space-y-3">
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-xs text-textMuted bg-white/[0.01] rounded-xl border border-white/[0.04]">
              No resume profiles compiled. Upload a PDF below to index credentials.
            </div>
          ) : (
            resumes.map(r => {
              const isActive = settings.resume_id === r._id || (resumes.length > 0 && !settings.resume_id && resumes[0]._id === r._id);
              return (
                <div 
                  key={r._id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/5 border-primary/40 shadow-[0_0_15px_rgba(124,58,237,0.08)] ring-1 ring-primary/20' 
                      : 'bg-white/[0.01] border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/15 text-primary' : 'bg-white/[0.04] text-textMuted'}`}>
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-textMain truncate">{r.title}</p>
                        {isActive && (
                          <span className="text-[9px] font-extrabold bg-primary/20 text-primary border border-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-textMuted mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()} &bull; ATS Score: {r.ats_score || '--'}/100</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 sm:mt-0 justify-end">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => selectActiveResume(r._id)}
                        className="px-2.5 py-1 text-2xs font-semibold bg-white/[0.04] border border-white/[0.08] text-textMain hover:bg-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all"
                      >
                        Activate Profile
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(r._id)}
                      className="p-1.5 hover:bg-danger/10 text-textDim hover:text-danger rounded-lg transition-colors shrink-0"
                      title="Remove resume"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-white/[0.01]">
          <input
            type="file"
            id="resume-upload"
            accept=".pdf"
            disabled={uploadingResume}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              setUploadingResume(true);
              setError(null);
              setSuccess(null);
              try {
                const formData = new FormData();
                formData.append('resumeFile', file);
                formData.append('title', file.name.replace('.pdf', ''));
                
                const uploadRes = await axios.post(`${API_BASE}/api/resumes/upload`, formData, {
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                
                // Trigger background parsing
                const parseRes = await axios.post(`${API_BASE}/api/ai/parse-resume/${uploadRes.data._id}`, {}, config);
                
                setResumes(prev => [parseRes.data, ...prev]);
                setSettings(prev => ({ ...prev, resume_id: parseRes.data._id }));
                setSuccess('New resume successfully uploaded, parsed, and set as active selection!');
                setTimeout(() => setSuccess(null), 3000);
              } catch (err) {
                console.error('Upload error:', err);
                setError(err.response?.data?.message || err.message || 'Failed to upload resume');
              } finally {
                setUploadingResume(false);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          <label htmlFor="resume-upload" className="cursor-pointer block">
            <div className="flex flex-col items-center gap-2">
              {uploadingResume ? (
                <Loader2 className="animate-spin text-primary" size={28} />
              ) : (
                <Upload className="text-primary" size={28} />
              )}
              <div>
                <p className="text-xs font-bold text-textMain">
                  {uploadingResume ? 'Extracting Resume Keywords...' : 'Click to upload and parse new resume profile'}
                </p>
                <p className="text-[10px] text-textMuted mt-0.5">PDF format only. Active status compiles credentials automatically.</p>
              </div>
            </div>
          </label>
        </div>
      </section>

      {/* 3. Job preferences */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Search Preferences</h2>
            <p className="text-xs text-textMuted">Manage role filters, location preferences, and exclusion criteria</p>
          </div>
        </div>

        {settings.preferred_roles.length === 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-start gap-3 text-warning text-xs font-semibold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>Please register at least one target role (e.g. "React Developer") to enable background crawling.</span>
          </div>
        )}

        {/* Roles Section */}
        <div className="space-y-2">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block">Target Job Roles</label>
          <div className="flex gap-2">
            <input
              type="text" 
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem('preferred_roles', newRole, setNewRole, setNewRole);
                }
              }}
              placeholder="e.g. Full Stack Developer, DevOps (separated by commas)"
              className="input flex-1 !py-2.5 text-xs"
            />
            <button 
              type="button"
              onClick={() => addItem('preferred_roles', newRole, setNewRole, setNewRole)} 
              className="btn-primary text-xs px-4"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-textDim self-center mr-1">Suggested:</span>
            {SUGGESTED_ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  if (!settings.preferred_roles.includes(role)) {
                    setSettings(prev => ({
                      ...prev,
                      preferred_roles: [...prev.preferred_roles, role]
                    }));
                  }
                }}
                className={`text-[10px] px-2.5 py-0.5 rounded-lg transition-all ${
                  settings.preferred_roles.includes(role)
                    ? 'bg-primary/20 text-primary border border-primary/30 pointer-events-none'
                    : 'bg-white/[0.04] text-textMuted border border-white/[0.05] hover:bg-white/[0.08] hover:text-textMain'
                }`}
              >
                + {role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.preferred_roles.map((role, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(124,58,237,0.06)]">
                {role}
                <button type="button" onClick={() => {
                  setSettings({ ...settings, preferred_roles: settings.preferred_roles.filter((_, idx) => idx !== i) });
                }} className="hover:text-danger ml-0.5"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Locations Section */}
        <div className="space-y-2">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block">Target Locations</label>
          <div className="flex gap-2">
            <input
              type="text" value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem('preferred_locations', newLocation, setNewLocation, setNewLocation);
                }
              }}
              placeholder="e.g. Remote, New York (separated by commas)"
              className="input flex-1 !py-2.5 text-xs"
            />
            <button 
              type="button"
              onClick={() => addItem('preferred_locations', newLocation, setNewLocation, setNewLocation)} 
              className="btn-primary text-xs px-4"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-textDim self-center mr-1">Suggested:</span>
            {SUGGESTED_LOCATIONS.map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  if (!settings.preferred_locations.includes(loc)) {
                    setSettings(prev => ({
                      ...prev,
                      preferred_locations: [...prev.preferred_locations, loc]
                    }));
                  }
                }}
                className={`text-[10px] px-2.5 py-0.5 rounded-lg transition-all ${
                  settings.preferred_locations.includes(loc)
                    ? 'bg-accent/20 text-accent border border-accent/30 pointer-events-none'
                    : 'bg-white/[0.04] text-textMuted border border-white/[0.05] hover:bg-white/[0.08] hover:text-textMain'
                }`}
              >
                + {loc}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.preferred_locations.map((loc, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-xl border border-accent/20 shadow-[0_0_10px_rgba(6,182,212,0.06)]">
                <MapPin size={12} /> {loc}
                <button onClick={() => removeItem('preferred_locations', i)} className="hover:text-danger ml-0.5"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Excluded Companies */}
        <div className="space-y-2">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block">Company Exclusion Filters</label>
          <div className="flex gap-2">
            <input
              type="text" value={newExcluded}
              onChange={e => setNewExcluded(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem('excluded_companies', newExcluded, setNewExcluded, setNewExcluded);
                }
              }}
              placeholder="e.g. Meta, Netflix (separated by commas)"
              className="input flex-1 !py-2.5 text-xs"
            />
            <button 
              type="button"
              onClick={() => addItem('excluded_companies', newExcluded, setNewExcluded, setNewExcluded)} 
              className="btn-primary text-xs px-4"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {settings.excluded_companies.map((company, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-danger/10 text-danger text-xs font-bold px-3 py-1 rounded-xl border border-danger/20 shadow-[0_0_10px_rgba(244,63,94,0.06)]">
                {company}
                <button onClick={() => removeItem('excluded_companies', i)} className="hover:text-textMain ml-0.5"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Checkbox Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-accent" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-textMain">Remote Only</span>
                <span className="text-[10px] text-textMuted">Filter remote openings only</span>
              </div>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.remote_only}
                onChange={e => setSettings(prev => ({ ...prev, remote_only: e.target.checked }))}
                className="toggle-checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-warning" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-textMain">Assisted Review</span>
                <span className="text-[10px] text-textMuted">Require manual confirm before apply</span>
              </div>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.require_human_review}
                onChange={e => setSettings(prev => ({ ...prev, require_human_review: e.target.checked }))}
                className="toggle-checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </label>
        </div>

        {/* Salary section */}
        <div className="space-y-3">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block flex items-center gap-1">
            <DollarSign size={13} className="text-success" /> Target Salary Boundaries (USD)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-textMuted mb-1.5 block">Minimum Salary ($)</label>
              <input type="number" value={settings.salary_min}
                onChange={e => setSettings(prev => ({ ...prev, salary_min: parseInt(e.target.value) || 0 }))}
                className="input !py-2.5 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-textMuted mb-1.5 block">Maximum Salary ($)</label>
              <input type="number" value={settings.salary_max}
                onChange={e => setSettings(prev => ({ ...prev, salary_max: parseInt(e.target.value) || 0 }))}
                className="input !py-2.5 text-xs" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Advanced Crawler Settings */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Agent Tuning & Parameters</h2>
            <p className="text-xs text-textMuted">Tweak match criteria thresholds and target crawler models</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2.5 block">AI Tailoring Level</label>
            <select 
              value={tuningLevel}
              onChange={e => setTuningLevel(e.target.value)}
              className="w-full bg-[#0d101d] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-textMain focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            >
              <option value="Base Resume">No Tailoring (Speed optimized)</option>
              <option value="Standard Match">Standard Match (ATS keywords injected)</option>
              <option value="Aggressive Tailoring">Aggressive Tailoring (Fully rewrite responsibilities)</option>
            </select>
          </div>

          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2.5 block">Target Portals</label>
            <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/[0.05] p-2 rounded-xl">
              <label className="flex items-center justify-center gap-2 p-2 text-xs font-semibold text-textMain cursor-pointer select-none hover:bg-white/[0.02] rounded-lg">
                <input type="checkbox" checked={portals.linkedin} onChange={e => setPortals({...portals, linkedin: e.target.checked})} className="rounded bg-white/[0.02] border-white/[0.08] text-primary focus:ring-primary/20 h-4 w-4" />
                LinkedIn
              </label>
              <label className="flex items-center justify-center gap-2 p-2 text-xs font-semibold text-textMain cursor-pointer select-none hover:bg-white/[0.02] rounded-lg">
                <input type="checkbox" checked={portals.indeed} onChange={e => setPortals({...portals, indeed: e.target.checked})} className="rounded bg-white/[0.02] border-white/[0.08] text-primary focus:ring-primary/20 h-4 w-4" />
                Indeed
              </label>
              <label className="flex items-center justify-center gap-2 p-2 text-xs font-semibold text-textMain cursor-pointer select-none hover:bg-white/[0.02] rounded-lg">
                <input type="checkbox" checked={portals.naukri} onChange={e => setPortals({...portals, naukri: e.target.checked})} className="rounded bg-white/[0.02] border-white/[0.08] text-primary focus:ring-primary/20 h-4 w-4" />
                Naukri
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2.5 block flex justify-between">
              <span>Daily Submits Quota</span>
              <span className="text-primary font-bold">{settings.applications_per_day} submissions</span>
            </label>
            <input type="range" min="1" max="50" value={settings.applications_per_day}
              onChange={e => setSettings(prev => ({ ...prev, applications_per_day: parseInt(e.target.value) }))}
              className="w-full mt-2" />
            <div className="flex justify-between text-[10px] text-textDim mt-1.5 px-0.5"><span>1</span><span>25</span><span>50</span></div>
          </div>
          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2.5 block flex justify-between">
              <span>Minimum ATS Match Threshold</span>
              <span className="text-accent font-bold">{settings.min_match_score}% relevance</span>
            </label>
            <input type="range" min="0" max="100" value={settings.min_match_score}
              onChange={e => setSettings(prev => ({ ...prev, min_match_score: parseInt(e.target.value) }))}
              className="w-full mt-2" />
            <div className="flex justify-between text-[10px] text-textDim mt-1.5 px-0.5"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
        </div>

        <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-success" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-textMain">Pre-Apply Simulator</span>
              <span className="text-[10px] text-textMuted">Silently reject job listings falling below matching threshold</span>
            </div>
          </div>
          <label className="relative flex items-center cursor-pointer">
            <input type="checkbox" checked={simulateBeforeApply}
              onChange={e => setSimulateBeforeApply(e.target.checked)}
              className="toggle-checkbox" />
            <span className="toggle-slider"></span>
          </label>
        </label>
      </section>

      {/* 5. Schedule Settings */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Crawl Clock & Active Schedule</h2>
            <p className="text-xs text-textMuted">Determine search active time windows and operational weekdays</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2 block">Trigger Time</label>
            <input type="time" value={settings.search_time}
              onChange={e => setSettings(prev => ({ ...prev, search_time: e.target.value }))}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-textMain focus:outline-none focus:border-primary/50 focus:bg-[#0d101d] transition-all duration-200" />
          </div>
          <div>
            <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-2 block">Agent Timezone</label>
            <select value={settings.timezone}
              onChange={e => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-[#0d101d] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-textMain focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
              <option value="America/New_York">Eastern Time (EST/EDT)</option>
              <option value="America/Chicago">Central Time (CST/CDT)</option>
              <option value="America/Denver">Mountain Time (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Berlin">Berlin (CET/CEST)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Tokyo">Tokyo Standard Time (JST)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider mb-3 block">Operational Weekdays</label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => {
              const active = settings.days_of_week.includes(day.value);
              return (
                <button 
                  key={day.value} 
                  onClick={() => toggleDay(day.value)}
                  type="button"
                  className={`h-10 rounded-xl text-2xs font-bold border transition-all flex items-center justify-center ${
                    active
                      ? 'bg-primary/20 text-primary border-primary/30 font-extrabold shadow-[0_0_12px_rgba(124,58,237,0.12)]'
                      : 'bg-white/[0.02] text-textMuted border-white/[0.05] hover:bg-white/[0.05] hover:text-textMain hover:border-white/[0.12]'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Stripe Billing / Commercial Membership Mockup */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Membership & Invoices</h2>
            <p className="text-xs text-textMuted">Manage subscription tiers, invoices, and billing profile details</p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-inner">
                <CreditCard size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-textMain">Pro Enterprise Autopilot Plan</p>
                <p className="text-[10px] text-textMuted mt-0.5">Active &bull; Renews automatically via Stripe SECURE</p>
              </div>
            </div>
            <button
              type="button"
              disabled={billingPortalLoading}
              onClick={() => {
                setBillingPortalLoading(true);
                setTimeout(() => {
                  setBillingPortalLoading(false);
                  alert('Opening simulated secure Stripe billing customer portal...');
                }, 1000);
              }}
              className="px-3.5 py-2 text-2xs font-semibold bg-white/[0.04] border border-white/[0.08] text-textMain hover:bg-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              {billingPortalLoading ? <Loader2 className="animate-spin" size={12} /> : <ExternalLink size={12} />}
              Manage Billing
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.05] text-[10px] text-textMuted">
            <div>
              <span className="text-textDim block">Monthly Cost</span>
              <strong className="text-textMain font-bold text-xs">$49.00 USD</strong>
            </div>
            <div>
              <span className="text-textDim block">Renewal Date</span>
              <strong className="text-textMain font-bold text-xs">June 25, 2026</strong>
            </div>
            <div>
              <span className="text-textDim block">Payment Method</span>
              <strong className="text-textMain font-bold text-xs">Visa &bull;&bull;&bull;&bull; 4242</strong>
            </div>
            <div>
              <span className="text-textDim block">Operation Scope</span>
              <strong className="text-primary font-bold text-xs">Unlimited Crawls</strong>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block">Invoice History</label>
          <div className="divide-y divide-white/[0.05] text-[11px]">
            <div className="py-3 flex justify-between items-center">
              <span className="text-textMuted">May 25, 2026 &bull; #INV-0251</span>
              <div className="flex items-center gap-3">
                <strong className="text-textMain font-semibold">$49.00 USD</strong>
                <span className="text-emerald-500 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">Paid</span>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-textMuted">April 25, 2026 &bull; #INV-0198</span>
              <div className="flex items-center gap-3">
                <strong className="text-textMain font-semibold">$49.00 USD</strong>
                <span className="text-emerald-500 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">Paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Notifications */}
      <section className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.05] pb-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-textMuted flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-textMain">Telemetry Notifications</h2>
            <p className="text-xs text-textMuted">Configure notification endpoints to stream daily scheduler statistics</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-textMain">Email Notifications</span>
                <p className="text-[10px] text-textMuted">Dispatch daily log summaries to {user?.email}</p>
              </div>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.email_notifications}
                onChange={e => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                className="toggle-checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-info" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-textMain">Telegram Bot Channel</span>
                <p className="text-[10px] text-textMuted">Stream real-time scheduler updates directly to your chat ID</p>
              </div>
            </div>
            <label className="relative flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.telegram_notifications}
                onChange={e => setSettings(prev => ({ ...prev, telegram_notifications: e.target.checked }))}
                className="toggle-checkbox" />
              <span className="toggle-slider"></span>
            </label>
          </label>

          {settings.telegram_notifications && (
            <div className="animate-fade-in space-y-2 pt-2">
              <label className="text-2xs font-extrabold text-textDim uppercase tracking-wider block">Telegram Chat ID</label>
              <input type="text" value={settings.telegram_chat_id}
                onChange={e => setSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                placeholder="e.g. 123456789"
                className="input !py-2.5 text-xs" />
            </div>
          )}
        </div>
      </section>

      {/* Cancel/Save actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.05]">
        <button onClick={() => navigate('/')} className="btn-ghost text-xs">Cancel & Dismiss</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs !py-3 !px-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save & Deploy Parameters
        </button>
      </div>
    </div>
  );
}
