import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LayoutDashboard, FileText, Briefcase, Search, LogOut, ChevronRight, Sparkles, Bot, Shield, Cpu, TrendingUp, BarChart2 } from 'lucide-react';
import useStore from './store/useStore';
import Auth from './pages/Auth';
import Resumes from './pages/Resumes';
import JobTracker from './pages/JobTracker';
import JobDiscovery from './pages/JobDiscovery';
import Dashboard from './pages/Dashboard';
import ApplicationHub from './pages/ApplicationHub';
import AICoach from './pages/AICoach';
import ShadowMode from './pages/ShadowMode';
import ReverseRecruiter from './pages/ReverseRecruiter';
import GrowthEngine from './pages/GrowthEngine';
import WeeklyReport from './pages/WeeklyReport';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/resumes',  icon: FileText,         label: 'AI Resumes'             },
  { to: '/discover', icon: Search,           label: 'Smart Discover'         },
  { to: '/jobs',     icon: Briefcase,        label: 'Job Pipeline'           },
  { to: '/coach',    icon: Bot,              label: 'AI Coach'               },
  { to: '/shadow',   icon: Shield,           label: 'Shadow Mode'            },
  { to: '/reverse',  icon: Cpu,              label: 'Reverse Recruiter'      },
  { to: '/growth',   icon: TrendingUp,       label: 'Growth Engine'          },
  { to: '/report',   icon: BarChart2,        label: 'Weekly Report'          },
];

function Sidebar() {
  const logout = useStore(s => s.logout);
  const user   = useStore(s => s.user);

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-[#060810]/90 backdrop-blur-xl z-30">
      
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-accent flex items-center justify-center shadow-glow-violet shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-textMain block leading-tight">Career OS</span>
            <span className="text-2xs text-textMuted font-medium">AI Platform</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        <p className="text-2xs font-bold text-textDim uppercase tracking-widest px-3 mb-3">Workspace</p>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-primary' : 'text-textMuted group-hover:text-textMain transition-colors'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-primary/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — User info + logout */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-textMain truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-2xs text-textMuted truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-textMuted hover:text-danger hover:bg-danger/5 transition-all duration-200"
        >
          <LogOut size={16} />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const location = useLocation();
  const logout = useStore(s => s.logout);
  const pageTitle = NAV.find(n => n.to === location.pathname)?.label || 'Application Hub';

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#060810]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm">{pageTitle}</span>
      </div>
      <button onClick={logout} className="btn-ghost text-xs p-2">
        <LogOut size={16} />
      </button>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center bg-[#060810]/95 backdrop-blur-xl border-t border-white/[0.06] px-1 pb-safe-area-inset-bottom">
      {NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-2xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-textMuted'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
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
  
  // Get Google Client ID from environment variable
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={googleClientId || ''}>
        <Auth />
      </GoogleOAuthProvider>
    );
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/resumes"        element={<Resumes />} />
          <Route path="/jobs"           element={<JobTracker />} />
          <Route path="/discover"       element={<JobDiscovery />} />
          <Route path="/coach"          element={<AICoach />} />
          <Route path="/shadow"         element={<ShadowMode />} />
          <Route path="/reverse"        element={<ReverseRecruiter />} />
          <Route path="/growth"         element={<GrowthEngine />} />
          <Route path="/report"         element={<WeeklyReport />} />
          <Route path="/application/:id" element={<ApplicationHub />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
