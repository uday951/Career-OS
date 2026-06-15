import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { 
  LayoutDashboard, FileText, Briefcase, Search, LogOut, 
  ChevronRight, Sparkles, Bot, Shield, Cpu, BarChart2, 
  Zap, Mail, Settings, Bell, ChevronDown, User, CheckCircle2, 
  AlertCircle, Activity, Play, RefreshCw
} from 'lucide-react';
import useStore from './store/useStore';
import Auth from './pages/Auth';
import Resumes from './pages/Resumes';
import JobTracker from './pages/JobTracker';
import JobDiscovery from './pages/JobDiscovery';
import Dashboard from './pages/Dashboard';
import ApplicationHub from './pages/ApplicationHub';
import AICoach from './pages/AICoach';
import ShadowMode from './pages/ShadowMode';
import AIOutreach from './pages/AIOutreach';
import Analytics from './pages/Analytics';
import AutoApplySettings from './pages/AutoApplySettings';
import GmailCallback from './pages/GmailCallback';
import ResumeStudio from './pages/ResumeStudio';
import API_BASE from './config/api';

const NAV = [
  { to: '/',           icon: LayoutDashboard,  label: 'Dashboard',       end: true },
  { to: '/discover',   icon: Search,           label: 'Job Discovery'              },
  { to: '/outreach',   icon: Mail,             label: 'AI Outreach'                },
  { to: '/jobs',       icon: Briefcase,        label: 'Applications'               },
  { to: '/resumes',    icon: FileText,         label: 'Resume Studio'              },
  { to: '/analytics',  icon: BarChart2,        label: 'Analytics'                  },
  { to: '/settings',   icon: Settings,         label: 'Settings'                   },
];

function Sidebar() {
  const logout = useStore(s => s.logout);
  const user   = useStore(s => s.user);

  return (
    <aside className="hidden md:flex flex-col w-[250px] shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-[#060813] z-30">
      
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-violet-600 to-accent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-textMain block leading-tight tracking-tight">CareerOS</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">AI Agent OS</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-black text-textDim uppercase tracking-widest px-3 mb-3">Workspace</p>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-primary' : 'text-textMuted group-hover:text-textMain transition-colors'} />
                <span className="flex-1 font-semibold">{label}</span>
                {isActive && <ChevronRight size={14} className="text-primary/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Membership Indicator */}
      <div className="mx-4 my-3 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-center shadow-md relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-[9px] font-black uppercase tracking-widest text-primary block relative z-10">AI AGENT CO-PILOT</span>
        <span className="text-xs font-bold text-accent block mt-0.5 relative z-10">Premium Crawler active</span>
      </div>

      {/* Bottom User info */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[0_2px_8px_rgba(124,58,237,0.3)]">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-textMain truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-[10px] text-textMuted truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-textMuted hover:text-danger hover:bg-danger/5 transition-all duration-200"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function TopNavbar() {
  const { token, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  const quickActionsRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pageTitle = NAV.find(n => n.to === location.pathname)?.label || 'Application Hub';

  const handleTriggerAgent = async () => {
    setTriggering(true);
    setShowQuickActions(false);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/api/automation/run`, {}, config);
      alert('AI Crawler run enqueued successfully! Track progress in the dashboard.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger agent');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 bg-[#030408]/85 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-base tracking-tight hidden md:inline text-textMain">{pageTitle}</span>
        
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-sm text-textMain">{pageTitle}</span>
        </div>
      </div>

      {/* Center Quick Search (visual accent) */}
      <div className="hidden lg:flex items-center w-80 relative">
        <Search size={14} className="absolute left-3.5 text-textDim" />
        <input 
          type="text" 
          placeholder="Quick search jobs or contacts..." 
          className="w-full bg-white/[0.02] border border-white/[0.06] rounded-full pl-9 pr-4 py-1.5 text-xs text-textMain focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Quick Actions Dropdown */}
        <div className="relative" ref={quickActionsRef}>
          <button 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="btn-primary !py-2 !px-4 text-xs font-bold gap-1 rounded-full flex items-center bg-gradient-to-r from-primary to-primaryHover shadow-lg border border-primary/20"
          >
            <span>Quick Actions</span>
            <ChevronDown size={12} className={`transition-transform duration-250 ${showQuickActions ? 'rotate-180' : ''}`} />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#0a0d18]/95 backdrop-blur-2xl p-2 shadow-2xl animate-fade-up z-50">
              <button 
                onClick={() => { navigate('/shadow'); setShowQuickActions(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold text-textMain hover:bg-white/[0.05] transition-colors"
              >
                <Shield size={14} className="text-violet-400" />
                <span>Simulate Fit (Shadow Mode)</span>
              </button>
              <button 
                onClick={() => { navigate('/coach'); setShowQuickActions(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold text-textMain hover:bg-white/[0.05] transition-colors"
              >
                <Bot size={14} className="text-cyan-400" />
                <span>Chat with Career Coach</span>
              </button>
              <div className="border-t border-white/[0.06] my-1" />
              <button 
                onClick={handleTriggerAgent}
                disabled={triggering}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold text-accent hover:bg-white/[0.05] transition-colors disabled:opacity-40"
              >
                {triggering ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                <span>Trigger Job Search Agent</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon (Agent Activity) */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full border border-white/[0.05] bg-white/[0.02] text-textMuted hover:text-textMain hover:bg-white/[0.05] transition-all relative"
          >
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.08] bg-[#0a0d18]/95 backdrop-blur-2xl p-3 shadow-2xl animate-fade-up z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2 font-bold">
                <span>Agent Activity Feed</span>
                <span className="text-[10px] text-primary">Live socket updates</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <Activity size={12} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-textMain">Agent status: standby</p>
                    <p className="text-[10px] text-textMuted mt-0.5">Scheduler checking every 1 minute</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <CheckCircle2 size={12} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-textMain">Gmail outreach linked</p>
                    <p className="text-[10px] text-textMuted mt-0.5">Gmail connection active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center bg-[#060813]/90 backdrop-blur-xl border-t border-white/[0.06] px-1 pb-safe-area-inset-bottom">
      {NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-bold transition-colors ${isActive ? 'text-primary' : 'text-textMuted'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={18} className={isActive ? 'text-primary' : ''} />
              <span>{label.split(' ')[0]}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={googleClientId || ''}>
        <Auth googleClientId={googleClientId} />
      </GoogleOAuthProvider>
    );
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/discover"       element={<JobDiscovery />} />
          <Route path="/outreach"       element={<AIOutreach />} />
          <Route path="/jobs"           element={<JobTracker />} />
          <Route path="/resumes"        element={<ResumeStudio />} />
          <Route path="/analytics"      element={<Analytics />} />
          <Route path="/settings"       element={<AutoApplySettings />} />
          <Route path="/coach"          element={<AICoach />} />
          <Route path="/shadow"         element={<ShadowMode />} />
          <Route path="/gmail-callback" element={<GmailCallback />} />
          <Route path="/application/:id" element={<ApplicationHub />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
