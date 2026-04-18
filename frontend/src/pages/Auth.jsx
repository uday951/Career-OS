import React, { useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import { Mail, Lock, User, ArrowRight, Sparkles, Shield, Zap, Globe } from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'AI Resume Builder', desc: 'LaTeX-grade resumes in seconds' },
  { icon: Globe, label: 'Global Job Engine', desc: 'Live jobs from 50+ portals' },
  { icon: Shield, label: 'ATS Optimizer', desc: 'Beat the screening algorithms' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, formData);
      setUser(data, data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen flex">

      {/* Left — Brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden bg-[#07090F] border-r border-white/[0.06] p-12">
        
        {/* Orbs */}
        <div className="glow-orb w-96 h-96 bg-primary/30 -top-32 -left-32" />
        <div className="glow-orb w-64 h-64 bg-accent/20 bottom-24 right-0" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-violet">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-textMain">Career OS AI</span>
          </div>

          <h1 className="text-4xl font-bold text-textMain leading-tight mb-4">
            The AI platform that<br/>
            <span className="text-gradient-violet">lands you the job.</span>
          </h1>
          <p className="text-textMuted text-base leading-relaxed max-w-sm">
            Automate your job search with AI-powered resumes, real-time job discovery, and deep company intelligence.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-primary shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-textMain leading-tight">{label}</p>
                  <p className="text-xs text-textMuted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <div className="flex -space-x-2 mb-3">
            {['V', 'A', 'R', 'M'].map((l, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#07090F] flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `hsl(${250 + i * 20}, 70%, 55%)` }}>{l}</div>
            ))}
          </div>
          <p className="text-xs text-textMuted">Join thousands of engineers accelerating their careers</p>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Subtle background */}
        <div className="glow-orb w-96 h-96 bg-primary/10 top-0 right-0" />
        <div className="glow-orb w-72 h-72 bg-accent/8 bottom-0 left-0" />

        <div className="relative z-10 w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-textMain">Career OS AI</span>
          </div>

          {/* Card */}
          <div className="glass-elevated p-8 rounded-2xl">

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-textMain mb-1.5">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-textMuted">
                {isLogin ? 'Sign in to your Career OS workspace' : 'Start optimizing your job search with AI'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/20 text-danger rounded-xl px-4 py-3 mb-5 text-sm">
                <Shield size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="input-icon">
                  <User size={16} className="icon" />
                  <input
                    type="text" required placeholder="Full name"
                    value={formData.name} onChange={e => update('name', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              )}

              <div className="input-icon">
                <Mail size={16} className="icon" />
                <input
                  type="email" required placeholder="Email address"
                  value={formData.email} onChange={e => update('email', e.target.value)}
                  className="input pl-10"
                />
              </div>

              <div className="input-icon">
                <Lock size={16} className="icon" />
                <input
                  type="password" required placeholder="Password"
                  value={formData.password} onChange={e => update('password', e.target.value)}
                  className="input pl-10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 py-3 text-base"
              >
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</span>
                  : <><span>{isLogin ? 'Sign in' : 'Get started'}</span><ArrowRight size={17} /></>
                }
              </button>
            </form>

            {/* Switch */}
            <div className="mt-6 text-center">
              <span className="text-sm text-textMuted">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm font-semibold text-primary hover:text-primaryHover transition-colors"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </div>
          </div>

          <p className="text-center text-2xs text-textMuted mt-5">
            By continuing you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
