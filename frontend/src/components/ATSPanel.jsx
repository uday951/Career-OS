import React from 'react';
import { Target, CheckCircle2, AlertTriangle, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';

export default function ATSPanel({ 
  report, 
  onInjectKeyword, 
  injectingKeyword 
}) {
  if (!report) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <Target size={40} className="mx-auto text-textDim opacity-50" />
        <h3 className="font-bold text-textMain text-sm">No ATS Report Yet</h3>
        <p className="text-xs text-textMuted max-w-[200px] mx-auto">
          Paste a target job description and run the ATS Analysis to calculate your match rating.
        </p>
      </div>
    );
  }

  const {
    score = 0,
    breakdown = { keywordMatch: 0, skillsAlignment: 0, experienceRelevance: 0, formatScore: 0 },
    missingKeywords = [],
    presentKeywords = [],
    semanticMatches = [],
    suggestions = []
  } = report;

  // Determine score color
  const getScoreColor = (val) => {
    if (val <= 40) return 'stroke-red-500 text-red-500';
    if (val <= 70) return 'stroke-yellow-500 text-yellow-500';
    return 'stroke-green-500 text-green-500';
  };

  const scoreColorClass = getScoreColor(score);
  const strokeDashoffset = 251.2 - (251.2 * score) / 100;

  return (
    <div className="space-y-6">
      {/* 1. Score Circle Ring */}
      <div className="glass-card p-5 border-l-4 border-primary">
        <h3 className="text-sm font-bold text-textMain mb-4 flex items-center gap-2">
          <Target className="text-primary" size={16} /> ATS Score Core Match
        </h3>

        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white/[0.04]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-1000 ease-out ${scoreColorClass}`}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tracking-tighter text-textMain">{score}%</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-textDim">Match</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-textMain">
              {score >= 70 ? 'Excellent Match Rating!' : score >= 40 ? 'Moderate Alignment' : 'Poor Job Alignment'}
            </p>
            <p className="text-[10px] text-textMuted leading-relaxed">
              Top 10% of applicants score above 78. Try optimizing keywords to improve your interview callback rate.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Breakdown Bars */}
      <div className="glass-card p-5">
        <h4 className="text-xs font-bold text-textDim uppercase tracking-widest mb-3">Score Breakdown</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-2xs font-bold text-textMuted mb-1">
              <span>Keywords Match (30%)</span>
              <span>{breakdown.keywordMatch}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${breakdown.keywordMatch}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-2xs font-bold text-textMuted mb-1">
              <span>Skills Alignment (25%)</span>
              <span>{breakdown.skillsAlignment}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-1000" 
                style={{ width: `${breakdown.skillsAlignment}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-2xs font-bold text-textMuted mb-1">
              <span>Experience Relevance (25%)</span>
              <span>{breakdown.experienceRelevance}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: `${breakdown.experienceRelevance}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-2xs font-bold text-textMuted mb-1">
              <span>Format Checklist (20%)</span>
              <span>{breakdown.formatScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-1000" 
                style={{ width: `${breakdown.formatScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Keyword Matrix */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-textMain flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" /> Keyword Alignment Matrix
          </h4>
          <p className="text-[10px] text-textMuted mt-1">
            Click on red missing keywords to let DeepSeek naturally weave them into your experience bullets.
          </p>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-3">
          {/* Missing Keywords */}
          {missingKeywords.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block mb-1.5">Critical Missing ({missingKeywords.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw, i) => (
                  <button
                    key={i}
                    disabled={injectingKeyword === kw}
                    onClick={() => onInjectKeyword(kw)}
                    className="text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 transition-all duration-150 active:scale-[0.97] flex items-center gap-1"
                  >
                    {injectingKeyword === kw ? 'Injecting...' : kw}
                    <ChevronRight size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Semantic Synonym matches */}
          {semanticMatches.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">Synonym Match ({semanticMatches.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {semanticMatches.map((match, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20"
                    title={`Synonym match: '${match.resumeWord}' matched JD target: '${match.jdWord}'`}
                  >
                    {match.resumeWord} ⇄ {match.jdWord}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Present Keywords */}
          {presentKeywords.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-success uppercase tracking-wider block mb-1.5">Successfully Match ({presentKeywords.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {presentKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold bg-success/10 text-success px-2 py-0.5 rounded border border-success/20 flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} className="text-success" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Actionable AI Recommendations */}
      {suggestions.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <h4 className="text-xs font-bold text-textMain flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500" /> AI Suggestions Brief
          </h4>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <div key={i} className="flex gap-2 text-2xs leading-relaxed text-textMuted bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.08]">
                <span className="font-bold text-primary">{i + 1}.</span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
