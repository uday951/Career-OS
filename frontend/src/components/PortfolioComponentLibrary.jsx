import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Github, Linkedin, Mail, Phone, MapPin, 
  ExternalLink, Briefcase, Award, GraduationCap, 
  Sparkles, Terminal, Code, Cpu, MessageSquare, BookOpen, Globe,
  ArrowRight, ArrowUpRight, Check, Send, User, ChevronRight, Play
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────
   ANIMATION DEFINITIONS
   ────────────────────────────────────────────────────────────────── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 18 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

/* ──────────────────────────────────────────────────────────────────
   1. NAVIGATION VARIATIONS
   ────────────────────────────────────────────────────────────────── */
export function FloatingNavigation({ data, activeSection, onScrollTo, sections = ['hero', 'about', 'projects', 'contact'] }) {
  return (
    <motion.nav 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-surface/85 backdrop-blur-md border border-border px-4 py-2.5 rounded-full flex items-center justify-between shadow-2xl">
        <span className="font-extrabold text-xs tracking-tight text-white flex items-center gap-1.5 pl-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          {data.extracted_data.fullName.split(' ')[0]}
        </span>
        <div className="flex items-center gap-1">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => onScrollTo(sec)}
              className={`px-3 py-1 rounded-full text-2xs uppercase tracking-wider font-extrabold transition-all ${
                activeSection === sec ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}

export function DockNavigation({ data, activeSection, onScrollTo, sections = ['hero', 'about', 'projects', 'contact'] }) {
  return (
    <motion.nav 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-surface/90 backdrop-blur-xl border border-border px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => onScrollTo(sec)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeSection === sec ? 'bg-primary text-white scale-110 shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'text-textDim hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{sec[0]}</span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
}

export function SidebarNavigation({ data, activeSection, onScrollTo, sections = ['hero', 'about', 'projects', 'contact'] }) {
  return (
    <motion.nav 
      className="hidden lg:flex flex-col justify-between fixed left-8 top-1/2 -translate-y-1/2 z-40 bg-surface/40 backdrop-blur-md border border-border py-8 px-4 rounded-3xl h-[400px] w-20 shadow-2xl"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="text-center font-extrabold text-[10px] text-primary">
        {data.extracted_data.fullName[0]}
      </div>
      <div className="flex flex-col gap-6 items-center">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => onScrollTo(sec)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeSection === sec ? 'text-primary scale-110' : 'text-textDim hover:text-white'
            }`}
            title={sec}
          >
            <span className="text-xs font-bold font-mono">{sec[0].toUpperCase()}</span>
          </button>
        ))}
      </div>
      <div className="h-4" />
    </motion.nav>
  );
}

/* ──────────────────────────────────────────────────────────────────
   2. HERO VARIATIONS
   ────────────────────────────────────────────────────────────────── */

// 1. Stripe Elegant
export function HeroStripe({ data }) {
  return (
    <div className="relative overflow-hidden py-20 md:py-32 flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(124,58,237,0.06),transparent_40%),linear-gradient(240deg,rgba(6,182,212,0.04),transparent_40%)] pointer-events-none" />
      <motion.div className="space-y-6 max-w-3xl relative z-10" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" variants={fadeInUp}>
          {data.extracted_data.title}
        </motion.span>
        <motion.h1 className="text-5xl md:text-8xl font-extrabold tracking-tight text-white leading-none font-sans" variants={fadeInUp}>
          {data.extracted_data.fullName}
        </motion.h1>
        <motion.p className="text-lg text-textMuted max-w-2xl mx-auto leading-relaxed font-light" variants={fadeInUp}>
          {data.customization?.custom_tagline || data.personal_brand.tagline}
        </motion.p>
        <motion.div className="flex justify-center gap-4 pt-4" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="bg-primary hover:bg-primary/95 hover:brightness-110 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest shadow-lg transition-all">
            Get In Touch
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 2. Vercel Minimal
export function HeroVercel({ data }) {
  return (
    <div className="py-20 md:py-32 border-b border-border">
      <motion.div className="space-y-6 max-w-3xl" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="flex items-center gap-2 text-xs text-textDim font-mono" variants={fadeInUp}>
          <span>{data.extracted_data.location}</span>
          <span>•</span>
          <span className="text-emerald-400">Available</span>
        </motion.div>
        <motion.h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white font-sans" variants={fadeInUp}>
          {data.extracted_data.fullName}
        </motion.h1>
        <motion.p className="text-xl text-textMuted font-light leading-relaxed" variants={fadeInUp}>
          {data.customization?.custom_tagline || data.personal_brand.tagline}
        </motion.p>
        <motion.div className="flex gap-4 pt-4 font-mono text-xs" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="bg-white text-black hover:bg-neutral-250 px-5 py-2.5 rounded-md font-bold transition-all">
            contact.send()
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 3. Apple Showcase
export function HeroApple({ data }) {
  return (
    <div className="py-24 md:py-36">
      <motion.div className="space-y-6 max-w-4xl font-outfit" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.h1 className="text-6xl md:text-8xl font-black tracking-tight text-white leading-none" variants={fadeInUp}>
          {data.extracted_data.fullName}.
        </motion.h1>
        <motion.p className="text-2xl md:text-3xl font-semibold text-textMuted leading-tight max-w-2xl" variants={fadeInUp}>
          {data.customization?.custom_tagline || data.personal_brand.tagline}
        </motion.p>
        <motion.div className="flex gap-4 pt-4 font-sans" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="bg-primary hover:brightness-110 px-6 py-3 rounded-full text-white text-xs font-bold transition-all shadow-md">
            Contact Me
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 4. Cyber Terminal
export function HeroTerminal({ data }) {
  const [logs, setLogs] = useState([
    "user@careeros:~$ init portfolio_engine",
    "Initializing visual assets...",
    "Injecting developer specifications...",
    "Matching credential database..."
  ]);

  return (
    <div className="py-16 md:py-24">
      <motion.div className="bg-[#020204]/90 border border-primary/20 rounded-xl p-6 md:p-8 font-mono text-xs space-y-4 shadow-2xl relative" variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex justify-between items-center text-textDim border-b border-white/[0.06] pb-3 select-none">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span>shell: bash</span>
        </div>
        <div className="space-y-2 text-[#00ffcc] select-text">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">&gt; {log}</div>
          ))}
          <div className="text-white font-bold text-sm pt-2">&gt; Candidate: {data.extracted_data.fullName}</div>
          <div className="text-[#00b3ff]">&gt; Title: {data.extracted_data.title}</div>
          <div className="text-textMuted font-light italic">&gt; Tagline: "{data.customization?.custom_tagline || data.personal_brand.tagline}"</div>
          <div className="pt-2 animate-pulse text-[#00ffcc] font-black">&gt; [ENGINE_ACTIVE] <span className="animate-ping w-2 h-2 bg-primary inline-block rounded-full ml-1"></span></div>
        </div>
      </motion.div>
    </div>
  );
}

// 5. Luxury Serif
export function HeroLuxury({ data }) {
  return (
    <div className="py-24 text-center max-w-3xl mx-auto space-y-8 font-serif">
      <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.span className="text-2xs uppercase tracking-widest text-accent font-sans font-bold" variants={fadeInUp}>
          {data.extracted_data.title}
        </motion.span>
        <motion.h1 className="text-5xl md:text-8xl font-light italic text-[#f2ebe5] leading-tight" variants={fadeInUp}>
          {data.extracted_data.fullName}
        </motion.h1>
        <motion.div className="w-12 h-px bg-accent/30 mx-auto" variants={fadeInUp} />
        <motion.p className="text-base font-sans font-light tracking-wide text-neutral-450 leading-relaxed max-w-lg mx-auto" variants={fadeInUp}>
          {data.customization?.custom_tagline || data.personal_brand.tagline}
        </motion.p>
        <motion.div className="pt-4" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="border border-accent/30 hover:bg-accent/10 px-8 py-3 text-xs uppercase tracking-widest font-sans text-accent transition-all">
            Write Message
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 6. Bento Grid Intro
export function HeroBento({ data }) {
  return (
    <div className="py-16 md:py-24">
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-left" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="md:col-span-2 bg-surface/50 border border-border p-8 rounded-3xl flex flex-col justify-between min-h-[200px]" variants={fadeInUp}>
          <div className="space-y-2">
            <span className="text-xs text-primary uppercase font-bold tracking-wider">{data.extracted_data.title}</span>
            <h1 className="text-4xl md:text-5xl font-black text-white">{data.extracted_data.fullName}</h1>
          </div>
          <p className="text-sm text-textMuted font-light mt-4">{data.customization?.custom_tagline || data.personal_brand.tagline}</p>
        </motion.div>
        
        <motion.div className="bg-surface/50 border border-border p-6 rounded-3xl flex flex-col justify-between text-xs" variants={fadeInUp}>
          <div className="font-extrabold uppercase tracking-widest text-textDim flex items-center gap-1.5"><MapPin size={13} /> Coordinates</div>
          <div className="space-y-2 mt-4">
            <div className="font-bold text-white text-sm">{data.extracted_data.location}</div>
            <div className="text-textMuted">{data.extracted_data.email}</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 7. Side Split
export function HeroSplit({ data }) {
  return (
    <div className="py-16 md:py-24">
      <motion.div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="md:col-span-5 flex justify-center" variants={fadeInUp}>
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/25 flex items-center justify-center border-2 border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-5xl md:text-7xl font-black bg-gradient-to-br from-white to-textDim bg-clip-text text-transparent uppercase select-none">
              {data.extracted_data.fullName[0]}{data.extracted_data.fullName.split(' ')?.[1]?.[0] || ''}
            </span>
          </div>
        </motion.div>
        <motion.div className="md:col-span-7 space-y-6 text-left" variants={fadeInUp}>
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary block">{data.extracted_data.title}</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-none">{data.extracted_data.fullName}</h1>
          <p className="text-base text-textMuted font-light leading-relaxed">{data.customization?.custom_tagline || data.personal_brand.tagline}</p>
          <div className="pt-2">
            <a href={`mailto:${data.extracted_data.email}`} className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-widest shadow-md transition-all">Get in touch</a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 8. Typewriter Console
export function HeroTypewriter({ data }) {
  return (
    <div className="py-20 md:py-32 text-center">
      <motion.div className="space-y-4 max-w-2xl mx-auto" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.span className="text-xs font-mono text-primary font-bold block" variants={fadeInUp}>&gt; whoami</motion.span>
        <motion.h1 className="text-5xl md:text-7xl font-mono uppercase font-black tracking-tight text-white" variants={fadeInUp}>
          {data.extracted_data.fullName}
        </motion.h1>
        <motion.span className="text-xs font-mono text-accent block" variants={fadeInUp}>&gt; env_role</motion.span>
        <motion.p className="text-sm text-textMuted font-mono" variants={fadeInUp}>
          {data.extracted_data.title}
        </motion.p>
        <motion.div className="pt-6" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="bg-[#0b0c10] border-2 border-primary text-primary hover:bg-primary hover:text-white font-mono text-xs px-5 py-2.5 rounded transition-all">
            [SEND_PING]
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 9. Radial Orbit
export function HeroRadial({ data }) {
  return (
    <div className="relative py-24 md:py-36 flex flex-col items-center text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <motion.div className="space-y-6 max-w-3xl relative z-10" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(124,58,237,0.4)]" variants={fadeInUp}>
          {data.extracted_data.fullName[0]}
        </motion.div>
        <motion.h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight" variants={fadeInUp}>
          {data.extracted_data.fullName}
        </motion.h1>
        <motion.p className="text-lg text-textMuted font-light max-w-xl mx-auto" variants={fadeInUp}>
          {data.customization?.custom_tagline || data.personal_brand.tagline}
        </motion.p>
        <motion.div className="pt-4" variants={fadeInUp}>
          <a href={`mailto:${data.extracted_data.email}`} className="bg-gradient-to-r from-primary to-accent hover:brightness-110 px-6 py-3 rounded-full text-white text-xs font-bold tracking-wider shadow-lg transition-all">Connect Now</a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 10. Floating Cards
export function HeroFloating({ data }) {
  return (
    <div className="py-20 md:py-32">
      <motion.div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="md:col-span-7 space-y-6 text-left" variants={fadeInUp}>
          <span className="text-xs uppercase font-extrabold text-[#ff00bb] tracking-widest block font-mono">&gt; INITIALIZED()</span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none">{data.extracted_data.fullName}</h1>
          <p className="text-base text-textMuted font-light leading-relaxed max-w-lg">{data.customization?.custom_tagline || data.personal_brand.tagline}</p>
          <div className="flex gap-4 pt-2 font-mono">
            <a href={`mailto:${data.extracted_data.email}`} className="bg-gradient-to-r from-[#6633ee] to-[#ff00bb] text-white text-xs font-bold px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105">
              Ping
            </a>
          </div>
        </motion.div>
        <motion.div className="md:col-span-5 flex justify-center" variants={fadeInUp}>
          <div className="bg-surface/60 border border-border p-6 rounded-3xl flex flex-col justify-between shadow-2xl min-w-[280px] min-h-[160px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold text-accent">SPECS</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            </div>
            <div className="mt-8 space-y-1">
              <div className="font-bold text-white text-sm">{data.extracted_data.title}</div>
              <div className="text-[10px] text-textMuted">{data.extracted_data.location}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function HeroSelector({ style, data }) {
  switch (style) {
    case 'hero-2': return <HeroVercel data={data} />;
    case 'hero-3': return <HeroApple data={data} />;
    case 'hero-4': return <HeroTerminal data={data} />;
    case 'hero-5': return <HeroLuxury data={data} />;
    case 'hero-6': return <HeroBento data={data} />;
    case 'hero-7': return <HeroSplit data={data} />;
    case 'hero-8': return <HeroTypewriter data={data} />;
    case 'hero-9': return <HeroRadial data={data} />;
    case 'hero-10': return <HeroFloating data={data} />;
    case 'hero-1':
    default:
      return <HeroStripe data={data} />;
  }
}

/* ──────────────────────────────────────────────────────────────────
   3. ABOUT VARIATIONS
   ────────────────────────────────────────────────────────────────── */
export function AboutTimeline({ data }) {
  return (
    <div className="space-y-12">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5"><Briefcase size={13} /> Work History</h3>
      </div>
      <div className="relative border-l border-border pl-6 ml-2 space-y-12">
        {data.extracted_data.experience?.map((e, idx) => (
          <div key={idx} className="relative space-y-2">
            <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <div className="flex justify-between items-baseline text-xs text-textDim font-mono">
              <span className="font-bold text-white text-sm">{e.position}</span>
              <span>{e.startDate} - {e.endDate}</span>
            </div>
            <div className="text-xs text-primary font-mono">{e.company}</div>
            <p className="text-textMuted text-xs font-light leading-relaxed whitespace-pre-line">{e.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutStory({ data }) {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">About & Narrative</h3>
      </div>
      <p className="text-base text-textMuted leading-relaxed font-light whitespace-pre-line">
        {data.customization?.custom_bio || data.personal_brand.bio}
      </p>
    </div>
  );
}

export function AboutOverview({ data }) {
  return (
    <div className="space-y-12">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Key Qualifications</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface/30 p-6 rounded-2xl border border-border space-y-4">
          <h4 className="font-extrabold text-xs uppercase text-white tracking-wider">Academic Background</h4>
          <div className="space-y-4">
            {data.extracted_data.education?.map((edu, idx) => (
              <div key={idx} className="text-xs space-y-1 border-l-2 border-primary/40 pl-3">
                <div className="font-bold text-white">{edu.degree}</div>
                <div className="text-textMuted">{edu.school}</div>
                <div className="text-textDim text-[10px]">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        </div>

        {data.extracted_data.certifications?.length > 0 && (
          <div className="bg-surface/30 p-6 rounded-2xl border border-border space-y-4">
            <h4 className="font-extrabold text-xs uppercase text-white tracking-wider">Certifications</h4>
            <ul className="space-y-2 text-xs text-textMuted list-disc pl-4 font-light">
              {data.extracted_data.certifications.map((cert, idx) => (
                <li key={idx}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutSelector({ style, data }) {
  switch (style) {
    case 'timeline': return <AboutTimeline data={data} />;
    case 'overview': return <AboutOverview data={data} />;
    case 'story':
    default:
      return <AboutStory data={data} />;
  }
}

/* ──────────────────────────────────────────────────────────────────
   4. SKILLS VARIATIONS
   ────────────────────────────────────────────────────────────────── */
export function SkillsInteractive({ data }) {
  const skills = data.customization?.custom_skills?.length > 0 ? data.customization.custom_skills : data.extracted_data.skills;

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Core Specialties</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((s, idx) => (
          <div key={idx} className="space-y-3 p-5 bg-surface/30 border border-border rounded-2xl">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/[0.04] pb-1.5">{s.category}</span>
            <div className="flex flex-wrap gap-1.5">
              {s.items?.map((item, itemIdx) => (
                <span key={itemIdx} className="bg-surface border border-border text-textMuted text-2xs px-2.5 py-1 rounded-lg font-medium hover:text-white hover:border-primary/45 transition-colors cursor-default">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsProgress({ data }) {
  const skills = data.customization?.custom_skills?.length > 0 ? data.customization.custom_skills : data.extracted_data.skills;

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Proficiencies</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((s, idx) => (
          <div key={idx} className="space-y-4 p-5 bg-surface/30 border border-border rounded-2xl">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">{s.category}</span>
            <div className="space-y-3">
              {s.items?.slice(0, 4).map((item, itemIdx) => {
                // Simulate progressive rating bars based on category index
                const strength = 100 - (itemIdx * 8) - (idx * 5);
                return (
                  <div key={itemIdx} className="space-y-1 text-2xs font-light">
                    <div className="flex justify-between font-semibold text-textMuted">
                      <span>{item}</span>
                      <span className="font-mono">{strength}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${strength}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillsCloud({ data }) {
  const skills = data.customization?.custom_skills?.length > 0 ? data.customization.custom_skills : data.extracted_data.skills;
  const flatItems = skills.reduce((acc, s) => [...acc, ...(s.items || [])], []);

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Skill Cloud</h3>
      </div>
      <div className="flex flex-wrap gap-2 justify-center py-6 bg-surface/20 border border-border rounded-3xl px-4">
        {flatItems.map((item, idx) => {
          // Bouncy visual sizing representing diversity
          const size = idx % 3 === 0 ? 'text-sm font-bold text-white' : idx % 2 === 0 ? 'text-xs text-textMuted font-medium' : 'text-2xs text-textDim';
          return (
            <span key={idx} className={`px-3 py-1.5 rounded-xl bg-surface/80 border border-border ${size} hover:border-accent hover:text-white transition-all cursor-default`}>
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function SkillsSelector({ style, data }) {
  switch (style) {
    case 'progress': return <SkillsProgress data={data} />;
    case 'cloud': return <SkillsCloud data={data} />;
    case 'interactive':
    default:
      return <SkillsInteractive data={data} />;
  }
}

/* ──────────────────────────────────────────────────────────────────
   5. PROJECTS VARIATIONS
   ────────────────────────────────────────────────────────────────── */

// 1. Bento Grid layout
export function ProjectsBento({ data }) {
  const projects = data.customization?.custom_projects?.length > 0 ? data.customization.custom_projects : data.extracted_data.projects;

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Selected Projects</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {projects.map((p, idx) => {
          const sizeCls = idx === 0 ? 'md:col-span-8' : idx === 1 ? 'md:col-span-4' : idx === 2 ? 'md:col-span-5' : 'md:col-span-7';
          return (
            <div key={idx} className={`${sizeCls} bg-surface/50 border border-border p-6 rounded-3xl flex flex-col justify-between hover:border-primary/20 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-extrabold text-base text-white">{p.name}</h4>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="text-2xs font-mono text-primary hover:underline flex items-center gap-0.5">
                      link <ExternalLink size={9} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-textMuted font-light leading-relaxed">{p.description}</p>
              </div>
              <div className="pt-6 relative z-10 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {p.technologies?.map((tech, tIdx) => (
                    <span key={tIdx} className="bg-surface text-textMuted text-[9px] px-2 py-0.5 rounded-md border border-border">
                      {tech}
                    </span>
                  ))}
                </div>
                {p.problem && (
                  <div className="text-[10px] text-textDim font-light bg-black/40 p-2.5 rounded-lg border border-white/[0.03]">
                    <span className="text-primary font-bold">Outcome:</span> {p.results}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Masonry Layout
export function ProjectsMasonry({ data }) {
  const projects = data.customization?.custom_projects?.length > 0 ? data.customization.custom_projects : data.extracted_data.projects;

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Project Showcase</h3>
      </div>
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {projects.map((p, idx) => (
          <div key={idx} className="break-inside-avoid bg-surface/50 border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-base text-white">{p.name}</h4>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-2xs text-[#00ffcc] hover:underline flex items-center gap-0.5 font-mono">
                    demo()
                  </a>
                )}
              </div>
              <p className="text-xs text-textMuted font-light leading-relaxed">{p.description}</p>
            </div>
            {p.problem && (
              <div className="bg-[#050508] p-3 rounded-lg border border-white/[0.03] space-y-1.5 text-[10px] leading-relaxed font-light">
                <div><span className="text-primary font-semibold">Challenge:</span> {p.problem}</div>
                <div><span className="text-accent font-semibold">Impact:</span> {p.results}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {p.technologies?.map((tech, tIdx) => (
                <span key={tIdx} className="bg-surface text-textMuted text-[9px] px-2 py-0.5 rounded-md border border-border">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Showcase list Cards
export function ProjectsShowcase({ data }) {
  const projects = data.customization?.custom_projects?.length > 0 ? data.customization.custom_projects : data.extracted_data.projects;

  return (
    <div className="space-y-12">
      <div className="border-b border-border pb-3 flex justify-between items-end">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Case Studies</h3>
        <span className="text-2xs text-textDim font-mono">Projects ({projects.length})</span>
      </div>
      <div className="space-y-8">
        {projects.map((p, idx) => (
          <div key={idx} className="bg-surface/20 border border-border p-8 rounded-3xl hover:bg-surface/40 hover:border-primary/20 transition-all duration-300 space-y-4">
            <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-3">
              <h4 className="text-xl font-bold text-white">{p.name}</h4>
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 font-mono">
                  Visit Project <ArrowUpRight size={12} />
                </a>
              )}
            </div>
            <p className="text-textMuted text-xs font-light leading-relaxed">{p.description}</p>
            
            {p.problem && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-2xs font-light border-t border-white/[0.03]">
                <div className="space-y-1">
                  <span className="text-primary font-bold uppercase tracking-wider block">The Friction</span>
                  <span className="text-textMuted leading-relaxed">{p.problem}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-primary font-bold uppercase tracking-wider block">The Architecture</span>
                  <span className="text-textMuted leading-relaxed">{p.solution}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider block">The Result</span>
                  <span className="text-textMuted leading-relaxed">{p.results}</span>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 pt-3">
              {p.technologies?.map((tech, tIdx) => (
                <span key={tIdx} className="bg-surface text-textMuted text-[9px] px-2 py-0.5 rounded-full border border-border">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsSelector({ style, data }) {
  switch (style) {
    case 'bento': return <ProjectsBento data={data} />;
    case 'masonry': return <ProjectsMasonry data={data} />;
    case 'showcase':
    default:
      return <ProjectsShowcase data={data} />;
  }
}

/* ──────────────────────────────────────────────────────────────────
   6. CONTACT VARIATIONS
   ────────────────────────────────────────────────────────────────── */
export function ContactForm({ data }) {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4 text-left">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary block">Get in touch</h3>
        <h2 className="text-3xl font-bold text-white tracking-tight leading-none">Let's build something.</h2>
        <p className="text-xs text-textMuted leading-relaxed font-light">
          Have a project in mind or looking to hire? Drop a line and I'll get back to you within 24 hours.
        </p>
        <div className="space-y-3 pt-4 text-xs font-mono text-textMuted">
          <div className="flex items-center gap-2.5">
            <Mail size={13} className="text-primary" />
            <span>{data.extracted_data.email}</span>
          </div>
          {data.extracted_data.phone && (
            <div className="flex items-center gap-2.5">
              <Phone size={13} className="text-primary" />
              <span>{data.extracted_data.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface/50 border border-border p-6 rounded-3xl relative overflow-hidden">
        {sent ? (
          <div className="text-center py-16 space-y-3 flex flex-col items-center justify-center">
            <Check className="text-emerald-400 w-10 h-10 border border-emerald-400/20 bg-emerald-500/10 p-2 rounded-full" />
            <h4 className="font-bold text-white text-sm">Message Dispatch Success!</h4>
            <p className="text-2xs text-textMuted">Thank you. Your request has been queued.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Name" required className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-textDim focus:outline-none focus:border-primary/50 w-full" />
              <input type="email" placeholder="Email" required className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-textDim focus:outline-none focus:border-primary/50 w-full" />
            </div>
            <textarea placeholder="Your Message..." required rows={4} className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-textDim focus:outline-none focus:border-primary/50 w-full" />
            <button type="submit" className="w-full bg-primary hover:brightness-110 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <Send size={12} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ContactSocial({ data }) {
  const links = data.customization?.social_links || {};
  return (
    <div className="text-center max-w-xl mx-auto space-y-6">
      <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary block">Channels</h3>
      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Connect with me online.</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 font-mono">
        <a href={`mailto:${data.extracted_data.email}`} className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/20 hover:text-white transition-all text-xs font-semibold">
          <Mail size={16} className="text-primary" /> email
        </a>
        {links.github && (
          <a href={links.github} target="_blank" rel="noreferrer" className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/20 hover:text-white transition-all text-xs font-semibold">
            <Github size={16} className="text-primary" /> github
          </a>
        )}
        {links.linkedin && (
          <a href={links.linkedin} target="_blank" rel="noreferrer" className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/20 hover:text-white transition-all text-xs font-semibold">
            <Linkedin size={16} className="text-primary" /> linkedin
          </a>
        )}
        {links.portfolio && (
          <a href={links.portfolio} target="_blank" rel="noreferrer" className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/20 hover:text-white transition-all text-xs font-semibold">
            <Globe size={16} className="text-primary" /> website
          </a>
        )}
      </div>
    </div>
  );
}

export function ContactCTA({ data }) {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/15 blur-2xl pointer-events-none rounded-full" />
      <div className="max-w-xl mx-auto space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary">Next Project</h3>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-none">Ready to begin your project journey?</h2>
        <p className="text-xs text-textMuted leading-relaxed font-light">
          Let's align details to collaborate. You can download my complete CV or drop an outreach ping.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <a href={`mailto:${data.extracted_data.email}`} className="bg-primary hover:brightness-110 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest shadow-lg transition-all">Send Email</a>
        </div>
      </div>
    </div>
  );
}

export function ContactSelector({ style, data }) {
  switch (style) {
    case 'social': return <ContactSocial data={data} />;
    case 'cta': return <ContactCTA data={data} />;
    case 'form':
    default:
      return <ContactForm data={data} />;
  }
}

export function BlogSection({ data }) {
  const posts = data.customization?.blog_posts || data.blog_posts || [];
  if (posts.length === 0) return null;
  
  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <BookOpen size={13} /> Publications & Insights
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post, idx) => (
          <motion.div 
            key={idx} 
            className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-primary/30 transition-all group"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center text-3xs font-mono text-textMuted uppercase">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <h4 className="font-extrabold text-base text-white group-hover:text-primary transition-colors">{post.title}</h4>
              <p className="text-xs text-textMuted font-light leading-relaxed">{post.excerpt}</p>
            </div>
            <div className="pt-6">
              <span className="text-2xs text-primary font-bold inline-flex items-center gap-1 hover:underline cursor-pointer">
                Read article <ArrowRight size={10} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection({ data }) {
  const list = data.customization?.testimonials || data.testimonials || [];
  if (list.length === 0) return null;

  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <MessageSquare size={13} /> Recommendation Endorsements
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {list.map((t, idx) => (
          <motion.div 
            key={idx} 
            className="bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-accent/20 transition-all relative overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="absolute top-4 right-4 text-white/[0.02] font-serif text-8xl select-none leading-none">“</div>
            <div className="space-y-4 relative z-10">
              <p className="text-xs text-textMuted italic leading-relaxed font-light">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-extrabold text-2xs uppercase">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-2xs text-white leading-none">{t.name}</h4>
                  <span className="text-[10px] text-textMuted">{t.role} @ {t.company}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function GithubActivitySection({ data }) {
  const username = data.customization?.social_links?.github?.split('/')?.pop() || 'developer';
  
  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-primary flex items-center gap-1.5">
          <Terminal size={13} /> Open Source Engine Activity
        </h3>
      </div>
      <motion.div 
        className="bg-[#020204]/90 border border-primary/20 rounded-2xl p-6 font-mono text-2xs space-y-4 shadow-2xl"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex justify-between items-center text-textMuted border-b border-white/[0.04] pb-3 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-white font-bold">{username}@github</span>
          </div>
          <span>active_repos: 18</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-[#00ffcc]">
            <span>$ curl -s https://api.github.com/users/{username}/stats</span>
            <span className="text-textMuted">[response: 200 OK]</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-surface/50 border border-border p-3 rounded-xl">
              <span className="text-[10px] text-textMuted block">Commits (YTD)</span>
              <span className="text-sm font-bold text-white">412 commits</span>
            </div>
            <div className="bg-surface/50 border border-border p-3 rounded-xl">
              <span className="text-[10px] text-textMuted block">Pull Requests</span>
              <span className="text-sm font-bold text-[#00b3ff]">34 merged</span>
            </div>
            <div className="bg-surface/50 border border-border p-3 rounded-xl">
              <span className="text-[10px] text-textMuted block">Stars Earned</span>
              <span className="text-sm font-bold text-yellow-400">128 stars</span>
            </div>
            <div className="bg-surface/50 border border-border p-3 rounded-xl">
              <span className="text-[10px] text-textMuted block">Contribution Streak</span>
              <span className="text-sm font-bold text-emerald-400">14 days</span>
            </div>
          </div>
          <div className="pt-2 text-textMuted">
            <span>&gt; Contribution matrix graph initialized:</span>
            <div className="flex gap-1.5 flex-wrap pt-2 select-none">
              {Array.from({ length: 24 }).map((_, i) => {
                const colors = ['bg-white/[0.02]', 'bg-emerald-900/40', 'bg-emerald-700/60', 'bg-emerald-500/80', 'bg-emerald-400'];
                const bg = colors[Math.floor(Math.random() * colors.length)];
                return <span key={i} className={`w-3.5 h-3.5 rounded ${bg} border border-white/[0.02]`} />;
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
