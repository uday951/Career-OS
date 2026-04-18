import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import API_BASE from '../config/api';
import {
  Send, Sparkles, Bot, User, Loader2, RotateCcw, Copy, ThumbsUp,
  Briefcase, Target, FileText, TrendingUp, MessageSquare, Zap,
  ChevronRight, AlertCircle, X
} from 'lucide-react';

// ─── Markdown-like renderer for AI responses ─────────────────────────────────
function RenderMarkdown({ text }) {
  const lines = text.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { result.push(<div key={i} className="h-2" />); i++; continue; }

    // ## Header
    if (line.startsWith('## ')) {
      result.push(
        <h3 key={i} className="text-sm font-bold text-textMain mt-4 mb-1.5 flex items-center gap-1.5">
          {line.replace('## ', '')}
        </h3>
      );
      i++; continue;
    }
    // ### subheader
    if (line.startsWith('### ')) {
      result.push(
        <h4 key={i} className="text-xs font-bold text-primary mt-3 mb-1 uppercase tracking-wide">
          {line.replace('### ', '')}
        </h4>
      );
      i++; continue;
    }
    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      result.push(
        <div key={i} className="flex items-start gap-2 text-sm text-textMain/90 leading-relaxed">
          <span className="text-primary/70 mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.replace(/^[-•] /, ''))}</span>
        </div>
      );
      i++; continue;
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\. (.*)/);
    if (numMatch) {
      result.push(
        <div key={i} className="flex items-start gap-2.5 text-sm text-textMain/90 leading-relaxed">
          <span className="w-5 h-5 rounded-md bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{numMatch[1]}</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      i++; continue;
    }
    // Normal paragraph
    result.push(
      <p key={i} className="text-sm text-textMain/90 leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }
  return <div className="space-y-1.5">{result}</div>;
}

function renderInline(text) {
  // Handle **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-textMain">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i} className="italic text-textMuted">{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-white/[0.08] text-accent font-mono text-xs px-1.5 py-0.5 rounded">{p.slice(1, -1)}</code>;
    return p;
  });
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: FileText,   label: 'Review my resume',        msg: 'Can you analyze my current situation and give me honest feedback on what I should prioritize to improve my job search?' },
  { icon: Target,     label: 'Improve my match rate',   msg: 'My average AI match rate feels low. What specific actions can I take this week to improve my match rate with job postings?' },
  { icon: TrendingUp, label: 'Career path strategy',    msg: 'Help me build a 6-month career strategy. What are the 3-5 most impactful things I should focus on right now?' },
  { icon: Briefcase,  label: 'Interview prep',          msg: 'I have an upcoming interview. Give me a comprehensive prep plan including likely questions, how to structure my answers, and what to research beforehand.' },
  { icon: Zap,        label: 'Salary negotiation',      msg: 'I\'m expecting a job offer soon. Walk me through a complete salary negotiation strategy with scripts and psychology tactics.' },
  { icon: MessageSquare, label: 'Cold outreach script', msg: 'Write me a high-converting cold outreach message I can send to hiring managers and recruiters on LinkedIn. Make it specific and not generic.' },
];

// ─── Chat message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy();
  };

  return (
    <div className={`flex gap-3 group animate-fade-up ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isAI ? 'bg-gradient-to-br from-primary to-accent shadow-glow-violet' : 'bg-white/[0.08] border border-white/[0.1]'}`}>
        {isAI ? <Sparkles size={15} className="text-white" /> : <User size={15} className="text-textMuted" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`rounded-2xl px-4 py-3.5 ${
          isAI
            ? 'bg-white/[0.04] border border-white/[0.08] rounded-tl-sm'
            : 'bg-primary/15 border border-primary/25 rounded-tr-sm'
        }`}>
          {isAI
            ? <RenderMarkdown text={msg.content} />
            : <p className="text-sm text-textMain/90 leading-relaxed">{msg.content}</p>
          }
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isAI ? '' : 'flex-row-reverse'}`}>
          <button onClick={handleCopy} className="btn-ghost text-xs gap-1 py-1 px-2">
            {copied ? <><ThumbsUp size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
          </button>
          {msg.ts && (
            <span className="text-2xs text-textMuted px-2">
              {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow-violet flex items-center justify-center shrink-0">
        <Sparkles size={15} className="text-white" />
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3.5">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Coach Page ──────────────────────────────────────────────────────────
export default function AICoach() {
  const { token, jobs, resumes } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const [candidateProfile, setCandidateProfile] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch candidate profile (name, skills, role from resume)
  useEffect(() => {
    axios.get(`${API_BASE}/api/coach/profile`, config)
      .then(({ data }) => setCandidateProfile(data))
      .catch(() => {}); // silently fail — name is cosmetic
  }, [token]);

  // Build context from current user data
  const buildContext = useCallback(() => {
    const total = jobs.length;
    const matched = jobs.filter(j => j.match_analysis?.match_percentage);
    const avgMatch = matched.length ? Math.round(matched.reduce((s, j) => s + j.match_analysis.match_percentage, 0) / matched.length) : 0;
    const bestResume = resumes.reduce((m, r) => (r.ats_score > (m?.ats_score || 0) ? r : m), null);
    const rejected = jobs.filter(j => j.status === 'REJECTED').length;
    const topSkills = bestResume?.parsed_data?.master_skills?.slice(0, 8) || [];
    const currentRole = bestResume?.parsed_data?.work_history?.[0]?.title || '';
    const statuses = { SAVED: 0, APPLIED: 0, INTERVIEWING: 0, REJECTED: 0 };
    jobs.forEach(j => { if (statuses[j.status] !== undefined) statuses[j.status]++; });

    return {
      totalApplications: total,
      avgMatch,
      bestATS: bestResume?.ats_score || 0,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
      topSkills,
      currentRole,
      statuses,
    };
  }, [jobs, resumes]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, thinking]);

  // Auto resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  const sendMessage = async (content) => {
    if (!content?.trim() || thinking) return;
    setError('');

    const userMsg = { role: 'user', content: content.trim(), ts: Date.now() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setThinking(true);

    try {
      const { data } = await axios.post(`${API_BASE}/api/coach/chat`, {
        messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        contextData: buildContext(),
      }, config);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, ts: Date.now() }]);
    } catch (err) {
      setError(err.response?.data?.message || 'The AI coach is temporarily unavailable. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Roll back user message on failure
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearChat = () => { setMessages([]); setError(''); };

  const isNewChat = messages.length === 0;
  const ctx = buildContext();

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen max-h-screen overflow-hidden">

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#060810]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-violet">
            <Sparkles size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-textMain leading-tight">Career OS AI Coach</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
              <span className="text-2xs text-textMuted">Gemini 2.0 Flash · Context-aware</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Context stats pills */}
          <div className="hidden sm:flex items-center gap-2">
            {ctx.totalApplications > 0 && (
              <span className="badge badge-neutral">
                <Briefcase size={10} /> {ctx.totalApplications} apps
              </span>
            )}
            {ctx.avgMatch > 0 && (
              <span className="badge badge-violet">
                <Target size={10} /> {ctx.avgMatch}% avg match
              </span>
            )}
            {ctx.bestATS > 0 && (
              <span className="badge badge-success">
                <FileText size={10} /> ATS {ctx.bestATS}
              </span>
            )}
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost text-xs gap-1.5">
              <RotateCcw size={13} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 lg:px-12 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Welcome / Empty state */}
          {isNewChat && (
            <div className="animate-fade-up">
              {/* Hero */}
              <div className="flex flex-col items-center text-center py-8 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-violet mb-5 animate-float">
                  <Sparkles size={30} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-textMain mb-2">
                  {candidateProfile?.firstName
                    ? <>Hey {candidateProfile.firstName} 👋, I'm your AI Career Coach</>  
                    : <>Your AI Career Strategist</>}
                </h2>
                <p className="text-sm text-textMuted max-w-md leading-relaxed">
                  {candidateProfile?.firstName
                    ? `I've read your resume and your career data — ${ctx.totalApplications} applications, ${ctx.avgMatch}% average match rate${ctx.bestATS > 0 ? `, ATS score ${ctx.bestATS}` : ''}. Ask me anything and I'll give you honest, data-backed advice tailored to YOU.`
                    : `I've analyzed your career data — ${ctx.totalApplications} applications, ${ctx.avgMatch}% average match rate, ATS score ${ctx.bestATS}. Ask me anything and I'll give you honest, data-backed advice.`}
                </p>

                {candidateProfile?.role && (
                  <div className="mt-3 flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-4 py-2">
                    <Briefcase size={13} className="text-primary" />
                    <span className="text-xs text-primary font-medium">{candidateProfile.role}{candidateProfile.company ? ` @ ${candidateProfile.company}` : ''}</span>
                  </div>
                )}

                {/* Context warning */}
                {ctx.totalApplications === 0 && (
                  <div className="mt-4 flex items-center gap-2 bg-warning/8 border border-warning/20 rounded-xl px-4 py-2.5 text-xs text-warning">
                    <AlertCircle size={13} />
                    Upload a resume and discover jobs first to unlock personalized analysis
                  </div>
                )}
              </div>

              {/* Suggestion chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map(({ icon: Icon, label, msg }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(msg)}
                    className="group text-left flex items-start gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textMain leading-tight">{label}</p>
                      <p className="text-xs text-textMuted mt-0.5 line-clamp-2">{msg.substring(0, 70)}...</p>
                    </div>
                    <ChevronRight size={14} className="text-textMuted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {/* Thinking indicator */}
          {thinking && <TypingIndicator />}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger animate-fade-up">
              <AlertCircle size={15} className="shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-danger/60 hover:text-danger">
                <X size={14} />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 md:px-8 lg:px-12 py-4 border-t border-white/[0.06] bg-[#060810]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:bg-white/[0.06] transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your career strategist anything... (Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-textMain placeholder-textMuted/50 resize-none focus:outline-none min-h-[24px] max-h-[140px] leading-relaxed custom-scrollbar"
              style={{ height: 'auto' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || thinking}
              className="w-9 h-9 rounded-xl bg-primary disabled:bg-white/[0.06] disabled:text-textMuted flex items-center justify-center text-white hover:bg-primaryHover active:scale-95 transition-all duration-200 shrink-0 shadow-glow-violet disabled:shadow-none"
            >
              {thinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-2xs text-textMuted mt-2">
            Career OS AI · Using your live data · Powered by Gemini 2.0
          </p>
        </div>
      </div>
    </div>
  );
}
