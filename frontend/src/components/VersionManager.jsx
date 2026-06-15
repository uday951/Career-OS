import React, { useState } from 'react';
import { Layers, Lightbulb, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function VersionManager({ 
  versions, 
  originalResume, 
  onSelectVersion, 
  selectedVersion,
  onGenerateVersions,
  generatingVersions
}) {
  const [compareTab, setCompareTab] = useState('summary'); // 'summary' | 'experience' | 'skills'

  if (!versions || versions.length === 0) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <Layers size={40} className="mx-auto text-textDim opacity-50" />
        <h3 className="font-bold text-textMain text-sm">Strategic Versions Ready</h3>
        <p className="text-xs text-textMuted max-w-[240px] mx-auto">
          DeepSeek can generate 3 strategically different resume versions: ATS-Maximized, Human-Optimized, and Hybrid Executive.
        </p>
        <button
          onClick={onGenerateVersions}
          disabled={generatingVersions}
          className="btn-primary text-xs flex items-center gap-1.5 mx-auto"
        >
          {generatingVersions ? (
            <><RefreshCw className="animate-spin" size={13} /> Strategizing...</>
          ) : (
            <>Generate Strategic Versions</>
          )}
        </button>
      </div>
    );
  }

  const currentVer = versions.find(v => v.versionName === selectedVersion) || versions[0];
  const orig = originalResume?.parsedJSON || {};
  const opt = currentVer?.content || {};

  // Simple word-level highlighting for comparison
  const diffHighlight = (original = '', modified = '') => {
    const origWords = original.split(/\s+/);
    const modWords = modified.split(/\s+/);
    
    // Find added words (words in mod but not in orig)
    return (
      <span className="leading-relaxed">
        {modWords.map((word, i) => {
          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
          const present = origWords.some(ow => ow.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase() === cleanWord);
          
          if (!present && cleanWord.length > 2) {
            return <span key={i} className="bg-green-100 text-green-800 font-semibold px-1 rounded mx-0.5">{word} </span>;
          }
          return <span key={i}>{word} </span>;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Version Switcher Cards */}
      <div className="grid grid-cols-3 gap-3">
        {versions.map((v) => (
          <button
            key={v.versionName}
            onClick={() => onSelectVersion(v.versionName)}
            className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[100px] ${
              selectedVersion === v.versionName
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                : 'bg-white/[0.01] border-white/[0.08] hover:border-primary/30'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-textDim">
                  Strategy {v.strategy}
                </span>
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">
                  ATS: {v.atsScore}%
                </span>
              </div>
              <h4 className="text-xs font-black text-textMain tracking-tight">{v.versionName}</h4>
            </div>
            
            {selectedVersion === v.versionName && (
              <div className="absolute right-2 bottom-2 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-white">
                <Check size={8} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 2. Strategy Reasoning Brief */}
      {currentVer && (
        <div className="bg-white/[0.01] border border-white/[0.08] rounded-xl p-4 space-y-2">
          <h5 className="text-[10px] font-black uppercase tracking-wider text-textDim flex items-center gap-1.5">
            <Lightbulb size={13} className="text-primary" /> Strategy Reasoning Brief
          </h5>
          <p className="text-xs leading-relaxed text-textMuted italic">
            "{currentVer.claudeReasoning}"
          </p>
        </div>
      )}

      {/* 3. Side-by-Side Diff Viewer */}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/[0.08]">
          <h4 className="text-xs font-bold text-textMain">Optimization Compare (Side-by-Side)</h4>
          
          <div className="flex bg-white/[0.02] border border-white/[0.08] rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setCompareTab('summary')}
              className={`text-[10px] font-bold px-2.5 py-1 transition-colors ${compareTab === 'summary' ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'}`}
            >
              Summary
            </button>
            <button
              onClick={() => setCompareTab('experience')}
              className={`text-[10px] font-bold px-2.5 py-1 transition-colors ${compareTab === 'experience' ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'}`}
            >
              Experience
            </button>
            <button
              onClick={() => setCompareTab('skills')}
              className={`text-[10px] font-bold px-2.5 py-1 transition-colors ${compareTab === 'skills' ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'}`}
            >
              Skills
            </button>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-2 gap-4 text-2xs leading-relaxed text-textMuted">
          {/* Original Panel */}
          <div className="space-y-3 border-r border-white/[0.08] pr-4">
            <h5 className="font-bold uppercase tracking-wider text-textDim block">Original Profile</h5>
            
            {compareTab === 'summary' && (
              <div className="bg-white/[0.01] p-3 rounded-lg border border-white/[0.08] min-h-[150px] whitespace-pre-wrap text-textMuted">
                {orig.summary || 'No summary text available.'}
              </div>
            )}

            {compareTab === 'experience' && (
              <div className="space-y-3 min-h-[150px]">
                {orig.experience?.map((exp, idx) => (
                  <div key={idx} className="bg-white/[0.01] p-3 rounded-lg border border-white/[0.08]">
                    <p className="font-bold text-textMain">{exp.position} - {exp.company}</p>
                    <p className="mt-1 text-textMuted whitespace-pre-wrap">{exp.description}</p>
                  </div>
                )) || <div className="text-textDim italic">No experience found.</div>}
              </div>
            )}

            {compareTab === 'skills' && (
              <div className="space-y-2 min-h-[150px]">
                {orig.skills?.map((skill, idx) => (
                  <div key={idx} className="bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.08]">
                    <span className="font-bold text-textMain block">{skill.category}</span>
                    <span className="text-textMuted">{Array.isArray(skill.items) ? skill.items.join(', ') : skill.items}</span>
                  </div>
                )) || <div className="text-textDim italic">No skills listed.</div>}
              </div>
            )}
          </div>

          {/* Optimized Panel */}
          <div className="space-y-3">
            <h5 className="font-bold uppercase tracking-wider text-primary block">Optimized (Strategic)</h5>

            {compareTab === 'summary' && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 min-h-[150px] whitespace-pre-wrap text-textMain">
                {diffHighlight(orig.summary, opt.summary)}
              </div>
            )}

            {compareTab === 'experience' && (
              <div className="space-y-3 min-h-[150px]">
                {opt.experience?.map((exp, idx) => {
                  const origExp = orig.experience?.[idx] || {};
                  return (
                    <div key={idx} className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-textMain">
                      <p className="font-bold text-textMain">{exp.position} - {exp.company}</p>
                      <p className="mt-1 text-textMuted whitespace-pre-wrap">
                        {diffHighlight(origExp.description, exp.description)}
                      </p>
                    </div>
                  );
                }) || <div className="text-textDim italic">No experience found.</div>}
              </div>
            )}

            {compareTab === 'skills' && (
              <div className="space-y-2 min-h-[150px]">
                {opt.skills?.map((skill, idx) => {
                  const origSkill = orig.skills?.[idx] || {};
                  const origItemsStr = Array.isArray(origSkill.items) ? origSkill.items.join(', ') : (origSkill.items || '');
                  const optItemsStr = Array.isArray(skill.items) ? skill.items.join(', ') : (skill.items || '');
                  return (
                    <div key={idx} className="bg-primary/5 p-2.5 rounded-lg border border-primary/10 text-textMain">
                      <span className="font-bold text-textMain block">{skill.category}</span>
                      <span>{diffHighlight(origItemsStr, optItemsStr)}</span>
                    </div>
                  );
                }) || <div className="text-textDim italic">No skills listed.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
