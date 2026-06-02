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
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in pb-24">
      
      {/* Top Banner Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
            <Settings className="text-primary" size={28} />
            Automation Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure your AI resume selection, thresholds, schedule, and subscription billing.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs !py-3">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save & Return
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-danger">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-success">{success}</p>
        </div>
      )}

      {/* Coming Soon Announcement */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-accent rounded-2xl p-6 flex items-start gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow-violet">
          <Sparkles size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-textMain">🚀 Auto-Apply AI Features Coming Soon</h3>
          <p className="text-sm text-textMuted mt-1">
            This powerful AI-driven automation feature is under active development. We're working hard to bring you:
          </p>
          <ul className="text-xs text-textMuted mt-3 space-y-1 ml-4">
            <li>✓ Intelligent job matching and application automation</li>
            <li>✓ Recruiter outreach campaigns via Gmail</li>
            <li>✓ Smart resume selection based on job requirements</li>
            <li>✓ Real-time notifications and analytics</li>
          </ul>
          <p className="text-xs font-semibold text-primary mt-3">Stay tuned for the official launch! 🎉</p>
        </div>
      </div>

      {/* 1. Master toggle */}
      <section className="glass-elevated rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Master Toggle</h2>
              <p className="text-xs text-slate-500">Globally enable or disable all automated crawl routines</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative w-14 h-7 rounded-full transition-all ${settings.enabled ? 'bg-success' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.enabled ? 'left-[30px]' : 'left-0.5'}`} />
          </button>
        </div>
      </section>

      {/* Gmail Outreach connection card */}
      <section className="glass-elevated rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Mail size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Gmail Outreach Channel</h2>
            <p className="text-xs text-slate-500">Link your Gmail account to enable automated recruiter email campaigns and track open rates/replies</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${gmailConnected ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-800">
                  {gmailConnected ? 'Gmail Channel Linked' : 'Gmail Channel Disconnected'}
                </p>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  gmailConnected ? 'bg-success/20 text-success' : 'bg-slate-200 text-slate-600'
                }`}>
                  {gmailConnected ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {gmailConnected 
                  ? 'All matching applications will automatically trigger outreach emails.' 
                  : 'Outreach emails cannot be sent. Autopilot is paused.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={gmailLoading}
            onClick={gmailConnected ? handleDisconnectGmail : handleConnectGmail}
            className={`px-3.5 py-2 text-2xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
              gmailConnected 
                ? 'bg-white border border-slate-200 text-danger hover:bg-red-50 hover:border-red-200' 
                : 'bg-primary text-white hover:bg-primaryHover'
            }`}
          >
            {gmailLoading ? (
              <Loader2 className="animate-spin" size={12} />
            ) : gmailConnected ? (
              'Disconnect'
            ) : (
              'Connect Gmail Account'
            )}
          </button>
        </div>
      </section>

      {/* 2. Premium Resume Selector & Manager */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">AI Resume Manager</h2>
            <p className="text-xs text-slate-500">Add, delete, or choose which profile version represents you in job submits</p>
          </div>
        </div>

        {/* Existing Resumes List */}
        <div className="space-y-3">
          {resumes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-150">
              No resumes uploaded yet. Drag & Drop a PDF below to compile.
            </div>
          ) : (
            resumes.map(r => {
              const isActive = settings.resume_id === r._id || (resumes.length > 0 && !settings.resume_id && resumes[0]._id === r._id);
              return (
                <div 
                  key={r._id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/10' 
                      : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                        {isActive && (
                          <span className="text-[9px] font-extrabold bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Uploaded {new Date(r.createdAt).toLocaleDateString()} &bull; Score: {r.ats_score || '--'}/100</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 sm:mt-0 justify-end">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => selectActiveResume(r._id)}
                        className="px-2.5 py-1 text-2xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all"
                      >
                        Select Active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(r._id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-danger rounded-lg transition-colors shrink-0"
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
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-slate-50/50">
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
                <p className="text-xs font-bold text-slate-700">
                  {uploadingResume ? 'Extracting Resume Keywords...' : 'Click here to upload new profile'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">PDF format only. Uploading immediately sets the resume as active selection.</p>
              </div>
            </div>
          </label>
        </div>
      </section>

      {/* 3. Job preferences */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Crawler Targets & Preferences</h2>
            <p className="text-xs text-slate-500">Define search target phrases and boundary salaries</p>
          </div>
        </div>

        {settings.preferred_roles.length === 0 && (
          <div className="bg-warning/10 border border-warning/35 rounded-xl p-3.5 flex items-start gap-2.5 text-warning text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Please add at least one preferred role (e.g. "Software Engineer") to enable the crawler agent.</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Preferred Target Roles</label>
          <div className="flex gap-2 mb-1.5">
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
              placeholder="e.g. Frontend Developer, DevOps (separated by commas)"
              className="input flex-1 !py-2.5"
            />
            <button 
              type="button"
              onClick={() => addItem('preferred_roles', newRole, setNewRole, setNewRole)} 
              className="btn-primary text-xs px-4">
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5 mb-3">
            <span className="text-[10px] text-slate-400 self-center mr-1">Suggested:</span>
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
                className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${
                  settings.preferred_roles.includes(role)
                    ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                + {role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.preferred_roles.map((role, i) => (
              <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-primary/20">
                {role}
                <button type="button" onClick={() => {
                  setSettings({ ...settings, preferred_roles: settings.preferred_roles.filter((_, idx) => idx !== i) });
                }} className="hover:text-danger"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Preferred Locations</label>
          <div className="flex gap-2 mb-1.5">
            <input
              type="text" value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem('preferred_locations', newLocation, setNewLocation, setNewLocation);
                }
              }}
              placeholder="e.g. Remote, San Francisco (separated by commas)"
              className="input flex-1 !py-2.5"
            />
            <button 
              type="button"
              onClick={() => addItem('preferred_locations', newLocation, setNewLocation, setNewLocation)} 
              className="btn-primary text-xs px-4">
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5 mb-3">
            <span className="text-[10px] text-slate-400 self-center mr-1">Suggested:</span>
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
                className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${
                  settings.preferred_locations.includes(loc)
                    ? 'bg-accent/10 text-accent border border-accent/20 pointer-events-none'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                + {loc}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.preferred_locations.map((loc, i) => (
              <span key={i} className="flex items-center gap-1 bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-lg border border-accent/20">
                <MapPin size={12} /> {loc}
                <button onClick={() => removeItem('preferred_locations', i)} className="hover:text-danger"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Excluded Companies</label>
          <div className="flex gap-2 mb-2">
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
              className="input flex-1 !py-2.5"
            />
            <button 
              type="button"
              onClick={() => addItem('excluded_companies', newExcluded, setNewExcluded, setNewExcluded)} 
              className="btn-primary text-xs px-4">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.excluded_companies.map((company, i) => (
              <span key={i} className="flex items-center gap-1 bg-danger/10 text-danger text-xs font-bold px-2.5 py-1 rounded-lg border border-danger/20">
                {company}
                <button onClick={() => removeItem('excluded_companies', i)} className="hover:text-slate-700"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-accent" />
              <span className="text-xs font-semibold text-slate-700">Remote Only</span>
            </div>
            <input type="checkbox" checked={settings.remote_only}
              onChange={e => setSettings(prev => ({ ...prev, remote_only: e.target.checked }))}
              className="toggle-checkbox" />
            <span className="toggle-slider"></span>
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-warning" />
              <span className="text-xs font-semibold text-slate-700">Manual review before submit</span>
            </div>
            <input type="checkbox" checked={settings.require_human_review}
              onChange={e => setSettings(prev => ({ ...prev, require_human_review: e.target.checked }))}
              className="toggle-checkbox" />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
            <DollarSign size={13} className="inline mr-1" /> Target Salary Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-2xs text-slate-400 mb-1 block">Minimum ($)</label>
              <input type="number" value={settings.salary_min}
                onChange={e => setSettings(prev => ({ ...prev, salary_min: parseInt(e.target.value) || 0 }))}
                className="input !py-2.5" />
            </div>
            <div>
              <label className="text-2xs text-slate-400 mb-1 block">Maximum ($)</label>
              <input type="number" value={settings.salary_max}
                onChange={e => setSettings(prev => ({ ...prev, salary_max: parseInt(e.target.value) || 0 }))}
                className="input !py-2.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Advanced Crawler Settings */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Advanced Crawler Tuning</h2>
            <p className="text-xs text-slate-500">Fine-tune automated crawlers and AI thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">AI Tailoring Level</label>
            <select 
              value={tuningLevel}
              onChange={e => setTuningLevel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary/65"
            >
              <option value="Base Resume">No Tailoring (Speed optimized)</option>
              <option value="Standard Match">Standard Match (ATS keywords injected)</option>
              <option value="Aggressive Tailoring">Aggressive Tailoring (Fully rewrite responsibilities)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Crawler Portals</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={portals.linkedin} onChange={e => setPortals({...portals, linkedin: e.target.checked})} className="rounded text-primary focus:ring-primary/20" />
                LinkedIn
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={portals.indeed} onChange={e => setPortals({...portals, indeed: e.target.checked})} className="rounded text-primary focus:ring-primary/20" />
                Indeed
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={portals.naukri} onChange={e => setPortals({...portals, naukri: e.target.checked})} className="rounded text-primary focus:ring-primary/20" />
                Naukri
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Daily submits quota: <span className="text-primary">{settings.applications_per_day}</span>
            </label>
            <input type="range" min="1" max="50" value={settings.applications_per_day}
              onChange={e => setSettings(prev => ({ ...prev, applications_per_day: parseInt(e.target.value) }))}
              className="w-full" />
            <div className="flex justify-between text-2xs text-slate-400 mt-1"><span>1</span><span>25</span><span>50</span></div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Min ATS score filter: <span className="text-primary">{settings.min_match_score}%</span>
            </label>
            <input type="range" min="0" max="100" value={settings.min_match_score}
              onChange={e => setSettings(prev => ({ ...prev, min_match_score: parseInt(e.target.value) }))}
              className="w-full" />
            <div className="flex justify-between text-2xs text-slate-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
        </div>

        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-success" />
            <div>
              <span className="text-xs font-semibold text-slate-700">Pre-apply Simulator</span>
              <p className="text-[10px] text-slate-400">Discard crawl candidates below min match score</p>
            </div>
          </div>
          <input type="checkbox" checked={simulateBeforeApply}
            onChange={e => setSimulateBeforeApply(e.target.checked)}
            className="toggle-checkbox" />
          <span className="toggle-slider"></span>
        </label>
      </section>

      {/* 5. Schedule Settings */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Crawl Clock & Schedule</h2>
            <p className="text-xs text-slate-500">Configure time and days when auto-apply initiates searches</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Search Time</label>
            <input type="time" value={settings.search_time}
              onChange={e => setSettings(prev => ({ ...prev, search_time: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary/65" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Timezone</label>
            <select value={settings.timezone}
              onChange={e => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary/65">
              <option value="America/New_York">Eastern (EST/EDT)</option>
              <option value="America/Chicago">Central (CST/CDT)</option>
              <option value="America/Denver">Mountain (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Berlin">Berlin (CET/CEST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Days of Week</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button key={day.value} onClick={() => toggleDay(day.value)}
                type="button"
                className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                  settings.days_of_week.includes(day.value)
                    ? 'bg-primary/10 text-primary border-primary/20 font-extrabold'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                }`}>{day.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Stripe Billing / Commercial Membership Mockup */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Membership & Invoices</h2>
            <p className="text-xs text-slate-500">Manage billing profile, payments, and commercial limits</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <CreditCard size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pro Enterprise Crawler Plan</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Active &bull; Renews automatically via Stripe</p>
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
              className="px-3.5 py-2 text-2xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              {billingPortalLoading ? <Loader2 className="animate-spin" size={12} /> : <ExternalLink size={12} />}
              Manage Billing
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 text-2xs">
            <div>
              <span className="text-slate-400 block font-medium">Monthly Charge</span>
              <strong className="text-slate-800 font-bold">$49.00 USD</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Next Renewal</span>
              <strong className="text-slate-800 font-bold">June 25, 2026</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Payment Card</span>
              <strong className="text-slate-800 font-bold">Visa &bull;&bull;&bull;&bull; 4242</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Daily Quota</span>
              <strong className="text-primary font-bold">Unlimited Crawls</strong>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Invoice history</label>
          <div className="divide-y divide-slate-100 text-2xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 font-semibold">May 25, 2026 &bull; #INV-0251</span>
              <div className="flex items-center gap-3">
                <strong className="text-slate-800 font-bold">$49.00 USD</strong>
                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Paid</span>
              </div>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 font-semibold">April 25, 2026 &bull; #INV-0198</span>
              <div className="flex items-center gap-3">
                <strong className="text-slate-800 font-bold">$49.00 USD</strong>
                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Notifications */}
      <section className="glass-elevated rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Daily Crawler Reports</h2>
            <p className="text-xs text-slate-500">Enable notification channels for daily crawl outcome statistics</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <div>
                <span className="text-xs font-semibold text-slate-700">Email Notifications</span>
                <p className="text-[10px] text-slate-400">Dispatch summaries to {user?.email}</p>
              </div>
            </div>
            <input type="checkbox" checked={settings.email_notifications}
              onChange={e => setSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
              className="toggle-checkbox" />
            <span className="toggle-slider"></span>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-info" />
              <div>
                <span className="text-xs font-semibold text-slate-700">Telegram Bot Notifications</span>
                <p className="text-[10px] text-slate-400">Stream logs directly to your chat ID</p>
              </div>
            </div>
            <input type="checkbox" checked={settings.telegram_notifications}
              onChange={e => setSettings(prev => ({ ...prev, telegram_notifications: e.target.checked }))}
              className="toggle-checkbox" />
            <span className="toggle-slider"></span>
          </label>

          {settings.telegram_notifications && (
            <div className="animate-fade-in">
              <label className="text-xs font-bold text-slate-500 mb-2 block">Telegram Chat ID</label>
              <input type="text" value={settings.telegram_chat_id}
                onChange={e => setSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                placeholder="e.g. 123456789"
                className="input !py-2.5" />
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/')} className="btn-ghost text-xs">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs !py-3">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save & Return
        </button>
      </div>
    </div>
  );
}
