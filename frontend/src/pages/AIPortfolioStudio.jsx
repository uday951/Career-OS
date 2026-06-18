import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Monitor, Tablet, Smartphone, Globe, Download, 
  RefreshCw, CheckCircle2, AlertCircle, FileText, Github, 
  Linkedin, Mail, Edit3, Award, MessageSquare, BookOpen, 
  Eye, Save, ListTodo, Plus, Trash2, ArrowUpRight, ShieldCheck, BarChart2
} from 'lucide-react';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import PortfolioThemeRenderer from '../components/PortfolioThemes';

export default function AIPortfolioStudio() {
  const { token } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [portfolio, setPortfolio] = useState(null);
  
  // Editor States
  const [activeTab, setActiveTab] = useState('themes'); // 'themes', 'branding', 'projects', 'content', 'sections'
  const [viewport, setViewport] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  
  // Custom Override States
  const [customTagline, setCustomTagline] = useState('');
  const [customBio, setCustomBio] = useState('');
  const [customPitch, setCustomPitch] = useState('');
  const [socialLinks, setSocialLinks] = useState({ github: '', linkedin: '', twitter: '', portfolio: '' });
  const [visibleSections, setVisibleSections] = useState({ blog: false, testimonials: false, githubActivity: false, techStackVisual: true });
  const [selectedTheme, setSelectedTheme] = useState('Theme 1: Vercel');
  const [projects, setProjects] = useState([]);
  
  // Layout Component Styles
  const [heroStyle, setHeroStyle] = useState('hero-1');
  const [projectsStyle, setProjectsStyle] = useState('showcase');
  const [skillsStyle, setSkillsStyle] = useState('interactive');
  const [aboutStyle, setAboutStyle] = useState('story');
  const [contactStyle, setContactStyle] = useState('form');
  const [navigationStyle, setNavigationStyle] = useState('floating');
  const [sectionOrder, setSectionOrder] = useState(['navigation', 'hero', 'about', 'skills', 'projects', 'contact']);
  
  // Deployment & PDF States
  const [deploying, setDeploying] = useState(false);
  const [latestUrl, setLatestUrl] = useState('');
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [showPdfDropdown, setShowPdfDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load steps for DeepSeek generator
  const loadSteps = [
    "Reading resume dataset...",
    "Analyzing career level & technical depth...",
    "Selecting design direction blueprint...",
    "Rewriting project experience into case studies (Problem-Solution-Impact)...",
    "Generating professional LinkedIn Summary & GitHub README...",
    "Computing ATS & Recruiter Appeal scores...",
    "Initializing premium design system components..."
  ];

  // Fetch Current Portfolio
  const fetchPortfolio = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE}/api/portfolio/current`, config);
      setPortfolio(res.data);
      initializeForm(res.data);
    } catch (err) {
      console.log('No portfolio created yet for user.');
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const initializeForm = (data) => {
    setCustomTagline(data.customization?.custom_tagline || data.personal_brand?.tagline || '');
    setCustomBio(data.customization?.custom_bio || data.personal_brand?.bio || '');
    setCustomPitch(data.customization?.custom_pitch || data.personal_brand?.pitch || '');
    setSocialLinks(data.customization?.social_links || { github: '', linkedin: '', twitter: '', portfolio: '' });
    setVisibleSections(data.customization?.visible_sections || { blog: false, testimonials: false, githubActivity: false, techStackVisual: true });
    setSelectedTheme(data.selected_theme || 'Theme 1: Vercel');
    setProjects(data.customization?.custom_projects || data.extracted_data?.projects || []);

    const layout = data.layout_components || {};
    setHeroStyle(layout.heroStyle || 'hero-1');
    setProjectsStyle(layout.projectsStyle || 'showcase');
    setSkillsStyle(layout.skillsStyle || 'interactive');
    setAboutStyle(layout.aboutStyle || 'story');
    setContactStyle(layout.contactStyle || 'form');
    setNavigationStyle(layout.navigationStyle || 'floating');
    setSectionOrder(layout.sectionOrder || ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']);
  };

  // Generate Portfolio
  const handleGenerate = async () => {
    setLoading(true);
    setLoadStep(0);
    
    // Simulate step logs progression
    const interval = setInterval(() => {
      setLoadStep(s => (s < loadSteps.length - 1 ? s + 1 : s));
    }, 2500);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_BASE}/api/portfolio/generate`, {}, config);
      clearInterval(interval);
      setPortfolio(res.data);
      initializeForm(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to analyze resume. Make sure you have uploaded one in Resume Studio.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Save changes
  const handleSave = async (themeOverride = null) => {
    setIsSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        selected_theme: themeOverride || selectedTheme,
        layout_components: {
          heroStyle,
          projectsStyle,
          skillsStyle,
          aboutStyle,
          contactStyle,
          navigationStyle,
          sectionOrder
        },
        customization: {
          custom_tagline: customTagline,
          custom_bio: customBio,
          custom_pitch: customPitch,
          social_links: socialLinks,
          visible_sections: visibleSections,
          custom_projects: projects
        }
      };
      const res = await axios.put(`${API_BASE}/api/portfolio/update`, payload, config);
      setPortfolio(res.data);
    } catch (err) {
      alert('Failed to save customization details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Deploy to Vercel
  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_BASE}/api/portfolio/deploy`, {}, config);
      setLatestUrl(res.data.url);
      setShowDeploySuccess(true);
      fetchPortfolio(); // reload history
    } catch (err) {
      alert('Deployment failed.');
    } finally {
      setDeploying(false);
    }
  };

  // Download Resume PDF
  const handleDownloadPdf = async (template) => {
    setShowPdfDropdown(false);
    try {
      const response = await axios({
        url: `${API_BASE}/api/portfolio/pdf?templateName=${template}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${portfolio.extracted_data.fullName.replace(/\s+/g, '_')}_${template}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF resume.');
    }
  };

  // Helper: Live preview merged dataset
  const getPreviewData = () => {
    if (!portfolio) return null;
    return {
      ...portfolio,
      selected_theme: selectedTheme,
      layout_components: {
        heroStyle,
        projectsStyle,
        skillsStyle,
        aboutStyle,
        contactStyle,
        navigationStyle,
        sectionOrder
      },
      customization: {
        custom_tagline: customTagline,
        custom_bio: customBio,
        custom_pitch: customPitch,
        social_links: socialLinks,
        visible_sections: visibleSections,
        custom_projects: projects,
        custom_skills: portfolio.customization?.custom_skills || portfolio.extracted_data?.skills || []
      }
    };
  };

  // Update a single project index
  const updateProjectField = (index, field, value) => {
    const updated = [...projects];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setProjects(updated);
  };

  return (
    <div className="min-h-screen bg-[#030408] text-[#f8fafc] flex flex-col">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            className="fixed inset-0 z-50 bg-[#030408]/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_35px_rgba(124,58,237,0.4)] animate-pulse mb-8">
              <Sparkles className="text-white animate-spin" size={28} />
            </div>
            
            <div className="max-w-md space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                <span>Building Premium Brand Identity</span>
              </h2>
              
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-64 mx-auto relative">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full absolute left-0 top-0 animate-[loading_17s_ease-in-out_infinite]" style={{ width: '85%' }}></div>
              </div>
              
              <p className="text-xs text-textMuted font-mono animate-pulse min-h-[20px]">
                {loadSteps[loadStep]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      {!portfolio ? (
        // Welcome State
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            className="max-w-xl w-full glass-elevated p-8 text-center space-y-6 relative overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Sparkles size={24} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Portfolio Studio</h1>
              <p className="text-xs text-textMuted leading-relaxed max-w-sm mx-auto">
                Transform your raw resume into a premium personal brand website. DeepSeek rewrites your projects as case studies and aggregates expert recruiter credibility scores.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={handleGenerate}
                className="btn-primary w-full gap-2 rounded-xl shadow-xl bg-gradient-to-r from-primary to-primaryHover py-3 text-sm"
              >
                <Sparkles size={16} />
                Generate Portfolio Blueprint
              </button>
              <p className="text-[10px] text-textDim font-mono">Uses active Resume Studio profile data</p>
            </div>
          </motion.div>
        </div>
      ) : (
        // Editor Workplace Layout
        <div className="flex-1 flex flex-col h-[calc(100vh-var(--topbar-h))] overflow-hidden">
          
          {/* Top Panel - Dashboard Header Controls */}
          <div className="bg-[#090c16]/95 backdrop-blur-xl border-b border-white/[0.06] p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* AI Scoring Grid */}
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[10px] font-black text-textDim uppercase tracking-widest block">Design Style</span>
                <span className="text-xs font-bold text-accent">{portfolio.design_direction}</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div className="flex gap-4">
                {[
                  { label: "Portfolio", score: portfolio.scoring.portfolio_quality },
                  { label: "Recruiter Appeal", score: portfolio.scoring.recruiter_appeal },
                  { label: "Brand Index", score: portfolio.scoring.personal_brand_score },
                  { label: "Tech Depth", score: portfolio.scoring.technical_credibility },
                ].map((s, idx) => (
                  <div key={idx} className="text-center">
                    <span className="text-[9px] font-extrabold text-textDim uppercase tracking-wide block">{s.label}</span>
                    <span className="text-xs font-mono font-black text-primary">{s.score}/100</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (Deploy, PDF Download, Save) */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              
              {/* Save changes */}
              <button 
                onClick={() => handleSave()}
                disabled={isSaving}
                className="btn-secondary !py-2 !px-4 text-xs font-bold gap-1.5 rounded-full flex items-center bg-white/[0.02]"
              >
                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save</span>
              </button>

              {/* PDF Resume compiled dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowPdfDropdown(!showPdfDropdown)}
                  className="btn-secondary !py-2 !px-4 text-xs font-bold gap-1.5 rounded-full flex items-center bg-white/[0.02]"
                >
                  <Download size={13} />
                  <span>Get Resumes</span>
                </button>
                {showPdfDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#0a0d18]/95 backdrop-blur-2xl p-2 shadow-2xl z-50 animate-fade-up">
                    <button onClick={() => handleDownloadPdf('ats')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold text-textMain hover:bg-white/[0.05]">
                      <FileText size={13} className="text-neutral-400" />
                      <span>ATS-Clean Resume</span>
                    </button>
                    <button onClick={() => handleDownloadPdf('modern')} className="w-full flex-items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold text-textMain hover:bg-white/[0.05]">
                      <ShieldCheck size={13} className="text-indigo-400" />
                      <span>Modern Styled Resume</span>
                    </button>
                    <button onClick={() => handleDownloadPdf('executive')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-semibold text-textMain hover:bg-white/[0.05]">
                      <Award size={13} className="text-amber-400" />
                      <span>Executive Resume</span>
                    </button>
                  </div>
                )}
              </div>

              {/* One-click Vercel Deployment */}
              <button 
                onClick={handleDeploy}
                disabled={deploying}
                className="btn-primary !py-2 !px-5 text-xs font-bold gap-1.5 rounded-full flex items-center bg-gradient-to-r from-primary to-violet-600 shadow-lg border border-primary/20"
              >
                {deploying ? <RefreshCw size={13} className="animate-spin" /> : <Globe size={13} />}
                <span>{deploying ? 'Deploying...' : 'Deploy to Vercel'}</span>
              </button>
            </div>
          </div>

          {/* Deploy success toast */}
          {showDeploySuccess && (
            <div className="bg-primary/20 border-b border-primary/40 px-6 py-2.5 flex items-center justify-between text-xs animate-fade-up">
              <div className="flex items-center gap-2 text-primary-light">
                <CheckCircle2 size={14} className="text-accent" />
                <span>Portfolio compiled successfully! Deployed link: </span>
                <a href={latestUrl} target="_blank" rel="noreferrer" className="text-accent font-bold underline ml-1 hover:brightness-110 flex items-center gap-0.5">
                  {latestUrl} <ArrowUpRight size={10} />
                </a>
              </div>
              <button onClick={() => setShowDeploySuccess(false)} className="text-textDim hover:text-white uppercase font-black tracking-widest text-[10px]">Dismiss</button>
            </div>
          )}

          {/* Main workspace section Split Screen */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT COLUMN: Controls & Settings */}
            <div className="w-[420px] shrink-0 border-r border-white/[0.06] bg-[#060813] flex flex-col h-full overflow-hidden">
              
              {/* Tab Selector Buttons */}
              <div className="flex border-b border-white/[0.06] p-2 bg-[#090c16]/50 overflow-x-auto no-scrollbar gap-1 shrink-0">
                {[
                  { id: 'themes', label: 'Themes' },
                  { id: 'layout', label: 'Layout' },
                  { id: 'branding', label: 'Branding' },
                  { id: 'projects', label: 'Case Studies' },
                  { id: 'content', label: 'Socials' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold text-center rounded-lg transition-all ${activeTab === t.id ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm' : 'text-textDim hover:text-textMain'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                
                {/* 1. Themes Tab */}
                {activeTab === 'themes' && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-textDim uppercase tracking-wider">Select Theme Template</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { name: 'Theme 1: Vercel', desc: 'Monospace touches, stark minimal grid dark layout.', color: 'from-[#000] to-neutral-800' },
                        { name: 'Theme 2: Linear', desc: 'Glowing radial violet backdrops, glass cards.', color: 'from-[#030014] to-indigo-950' },
                        { name: 'Theme 3: Apple', desc: 'Premium white canvas, massive elegant text fonts.', color: 'from-[#f5f5f7] to-[#e5e5eb]' },
                        { name: 'Theme 4: Minimal Luxury', desc: 'Contrast serif layouts, delicate borders.', color: 'from-[#0b0a0a] to-[#1a1818]' },
                        { name: 'Theme 5: Modern AI Engineer', desc: 'Cyber cyan details, mock terminal consoles.', color: 'from-[#020204] to-neutral-950' },
                        { name: 'Theme 6: Startup Founder', desc: 'Executive personal grid and quote layouts.', color: 'from-[#080710] to-[#12111d]' },
                        { name: 'Theme 7: Creative Developer', desc: 'Playful gradient mesh backdrops, bouncing tags.', color: 'from-[#0b0c10] to-[#1f2833]' },
                      ].map((t) => (
                        <button
                          key={t.name}
                          onClick={() => {
                            setSelectedTheme(t.name);
                            handleSave(t.name);
                          }}
                          className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${selectedTheme === t.name ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03]'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} border border-white/[0.1] shrink-0 shadow-inner`} />
                          <div>
                            <span className="font-bold text-xs block text-white">{t.name.split(': ')[1]}</span>
                            <span className="text-[10px] text-textMuted leading-relaxed block">{t.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1.5. Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-textDim uppercase tracking-wider">Layout Designer</p>
                    
                    <div className="space-y-3">
                      {/* Navigation Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Navigation menu</label>
                        <select 
                          value={navigationStyle} 
                          onChange={(e) => setNavigationStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="floating">Floating Top Nav</option>
                          <option value="dock">Bottom Dock Nav</option>
                          <option value="sidebar">Left Sidebar Nav</option>
                        </select>
                      </div>

                      {/* Hero Variation Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Hero Header Style</label>
                        <select 
                          value={heroStyle} 
                          onChange={(e) => setHeroStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="hero-1">Stripe Gradient Grid</option>
                          <option value="hero-2">Vercel Minimalist Monospace</option>
                          <option value="hero-3">Apple Showcase Large</option>
                          <option value="hero-4">Interactive Cyber Terminal</option>
                          <option value="hero-5">Minimal Luxury Serif</option>
                          <option value="hero-6">Bento Grid Intro</option>
                          <option value="hero-7">Side Split Screen</option>
                          <option value="hero-8">Typewriter Command Line</option>
                          <option value="hero-9">Radial Glow Sphere</option>
                          <option value="hero-10">Floating Mesh Cards</option>
                        </select>
                      </div>

                      {/* Projects Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Projects Showcase</label>
                        <select 
                          value={projectsStyle} 
                          onChange={(e) => setProjectsStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="showcase">Case Studies Showcase</option>
                          <option value="bento">Premium Bento Grid</option>
                          <option value="masonry">Responsive Masonry Column</option>
                        </select>
                      </div>

                      {/* Skills Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Skills Format</label>
                        <select 
                          value={skillsStyle} 
                          onChange={(e) => setSkillsStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="interactive">Interactive Specialties Grid</option>
                          <option value="progress">Proficiency Rating Bars</option>
                          <option value="cloud">Bouncy Word Cloud</option>
                        </select>
                      </div>

                      {/* About Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">About Layout</label>
                        <select 
                          value={aboutStyle} 
                          onChange={(e) => setAboutStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="story">Personal Story Narrative</option>
                          <option value="timeline">Work Chronology Timeline</option>
                          <option value="overview">Academic Stats & Certifications</option>
                        </select>
                      </div>

                      {/* Contact Style */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Contact Footer Layout</label>
                        <select 
                          value={contactStyle} 
                          onChange={(e) => setContactStyle(e.target.value)}
                          className="w-full bg-[#0a0d18] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                          <option value="form">Modern Contact Form</option>
                          <option value="social">Social Connection Cards</option>
                          <option value="cta">CTA Banner Block</option>
                        </select>
                      </div>

                      {/* Section Visibility */}
                      <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                        <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Section Visibility</label>
                        <div className="grid grid-cols-2 gap-2 text-2xs">
                          <label className="flex items-center gap-2 text-white bg-[#0a0d18] border border-white/[0.08] px-3 py-2 rounded-xl cursor-pointer hover:border-primary/45 select-none transition-colors">
                            <input 
                              type="checkbox" 
                              checked={visibleSections.blog} 
                              onChange={(e) => setVisibleSections({ ...visibleSections, blog: e.target.checked })}
                              className="accent-primary"
                            />
                            <span>Blog Insights</span>
                          </label>
                          <label className="flex items-center gap-2 text-white bg-[#0a0d18] border border-white/[0.08] px-3 py-2 rounded-xl cursor-pointer hover:border-primary/45 select-none transition-colors">
                            <input 
                              type="checkbox" 
                              checked={visibleSections.testimonials} 
                              onChange={(e) => setVisibleSections({ ...visibleSections, testimonials: e.target.checked })}
                              className="accent-primary"
                            />
                            <span>Testimonials</span>
                          </label>
                          <label className="flex items-center gap-2 text-white bg-[#0a0d18] border border-white/[0.08] px-3 py-2 rounded-xl cursor-pointer hover:border-primary/45 select-none transition-colors">
                            <input 
                              type="checkbox" 
                              checked={visibleSections.githubActivity} 
                              onChange={(e) => setVisibleSections({ ...visibleSections, githubActivity: e.target.checked })}
                              className="accent-primary"
                            />
                            <span>GitHub Stats</span>
                          </label>
                          <label className="flex items-center gap-2 text-white bg-[#0a0d18] border border-white/[0.08] px-3 py-2 rounded-xl cursor-pointer hover:border-primary/45 select-none transition-colors">
                            <input 
                              type="checkbox" 
                              checked={visibleSections.techStackVisual} 
                              onChange={(e) => setVisibleSections({ ...visibleSections, techStackVisual: e.target.checked })}
                              className="accent-primary"
                            />
                            <span>Tech Specialties</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl mt-4 space-y-2 text-2xs leading-relaxed text-[#a5b4fc]">
                      <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1"><Sparkles size={11} className="text-primary" /> Dynamic Rendering</div>
                      <p>Modify layout selections to instantly rearrange component variations in your live viewport simulator.</p>
                    </div>
                  </div>
                )}

                {/* 2. Branding Copy Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Personal Tagline</label>
                      <input 
                        type="text" 
                        value={customTagline} 
                        onChange={(e) => setCustomTagline(e.target.value)}
                        className="input" 
                        placeholder="Compelling tag line" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Elevator Pitch (30s)</label>
                      <textarea 
                        rows={3}
                        value={customPitch} 
                        onChange={(e) => setCustomPitch(e.target.value)}
                        className="input" 
                        placeholder="My elevator pitch" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-extrabold tracking-widest text-textDim block">Professional Story / Bio</label>
                      <textarea 
                        rows={8}
                        value={customBio} 
                        onChange={(e) => setCustomBio(e.target.value)}
                        className="input font-light leading-relaxed text-xs" 
                        placeholder="Tell your story" 
                      />
                    </div>

                    {portfolio.personal_brand?.linkedin_about && (
                      <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl space-y-2">
                        <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-widest">LinkedIn About Section snippet</span>
                        <p className="text-[10px] text-textMuted leading-relaxed max-h-24 overflow-y-auto no-scrollbar whitespace-pre-line">{portfolio.personal_brand.linkedin_about}</p>
                      </div>
                    )}

                    {portfolio.personal_brand?.github_readme && (
                      <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-450 block tracking-widest">GitHub README.md profile</span>
                        <p className="text-[10px] text-textMuted font-mono leading-relaxed max-h-24 overflow-y-auto no-scrollbar whitespace-pre-line">{portfolio.personal_brand.github_readme}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Case Studies (Projects) Tab */}
                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-textDim uppercase tracking-wider">Showcase Case Studies</p>
                    
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl space-y-3">
                        <div className="font-extrabold text-xs text-white pb-2 border-b border-white/[0.03]">
                          Case Study #{idx + 1}: {proj.name}
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-textDim block">Project Headline</label>
                          <input 
                            type="text" 
                            value={proj.name} 
                            onChange={(e) => updateProjectField(idx, 'name', e.target.value)}
                            className="input !py-2 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-textDim block">Problem / Friction</label>
                          <textarea 
                            rows={2}
                            value={proj.problem || ''} 
                            onChange={(e) => updateProjectField(idx, 'problem', e.target.value)}
                            className="input !py-2 text-xs font-light" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-textDim block">Solution / Execution</label>
                          <textarea 
                            rows={2}
                            value={proj.solution || ''} 
                            onChange={(e) => updateProjectField(idx, 'solution', e.target.value)}
                            className="input !py-2 text-xs font-light" 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-textDim block">Results / Metric Win</label>
                          <textarea 
                            rows={2}
                            value={proj.results || ''} 
                            onChange={(e) => updateProjectField(idx, 'results', e.target.value)}
                            className="input !py-2 text-xs font-light" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Social Links & Custom Fields Tab */}
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-textDim uppercase tracking-wider">Social Channels & Links</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 relative">
                        <Github size={14} className="text-textDim absolute left-3" />
                        <input 
                          type="text" 
                          value={socialLinks.github} 
                          onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                          className="input !pl-9 !py-2 text-xs" 
                          placeholder="GitHub profile URL" 
                        />
                      </div>
                      <div className="flex items-center gap-2 relative">
                        <Linkedin size={14} className="text-textDim absolute left-3" />
                        <input 
                          type="text" 
                          value={socialLinks.linkedin} 
                          onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                          className="input !pl-9 !py-2 text-xs" 
                          placeholder="LinkedIn profile URL" 
                        />
                      </div>
                      <div className="flex items-center gap-2 relative">
                        <Globe size={14} className="text-textDim absolute left-3" />
                        <input 
                          type="text" 
                          value={socialLinks.portfolio} 
                          onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })}
                          className="input !pl-9 !py-2 text-xs" 
                          placeholder="Alternative portfolio URL" 
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 space-y-3">
                      <p className="text-[11px] font-bold text-textDim uppercase tracking-wider">Deployment Logs</p>
                      
                      {portfolio.deployments?.length === 0 ? (
                        <div className="text-[10px] text-textDim py-2 text-center bg-white/[0.01] border border-white/[0.04] rounded-xl">No active deployments. Click "Deploy to Vercel" above!</div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                          {portfolio.deployments.map((dep, dIdx) => (
                            <div key={dIdx} className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg flex items-center justify-between text-2xs">
                              <div>
                                <span className="text-white block font-bold truncate max-w-[180px]">{dep.url}</span>
                                <span className="text-textDim block">{new Date(dep.deployed_at).toLocaleDateString()}</span>
                              </div>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">ACTIVE</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT COLUMN: Real-time Preview Canvas */}
            <div className="flex-1 bg-[#030408] flex flex-col h-full overflow-hidden relative">
              
              {/* Responsive view switcher bar */}
              <div className="bg-[#090c16]/50 border-b border-white/[0.06] px-6 py-2.5 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textDim">Mock Simulator</span>
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded">AUTO_SYNCING</span>
                </div>
                
                {/* view ports */}
                <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-lg">
                  {[
                    { id: 'desktop', icon: Monitor },
                    { id: 'tablet', icon: Tablet },
                    { id: 'mobile', icon: Smartphone }
                  ].map(v => {
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setViewport(v.id)}
                        className={`p-1.5 rounded-md transition-colors ${viewport === v.id ? 'bg-primary text-white' : 'text-textDim hover:text-white'}`}
                      >
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Viewport content canvas */}
              <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.02),transparent_60%)] p-6 flex items-start justify-center">
                <div 
                  className={`bg-[#060813] transition-all duration-300 overflow-hidden shadow-2xl relative ${
                    viewport === 'desktop' ? 'w-full h-full min-h-[500px] border border-white/[0.06] rounded-2xl' :
                    viewport === 'tablet' ? 'w-[768px] max-w-full h-full min-h-[500px] border border-white/[0.08] rounded-3xl' :
                    'w-[375px] max-w-full h-[650px] border-2 border-white/[0.1] rounded-[36px] shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {/* Internal Scrollable preview frame */}
                  <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <PortfolioThemeRenderer 
                      data={getPreviewData()} 
                      theme={selectedTheme} 
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
