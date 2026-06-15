import React, { useState, useEffect, useRef } from 'react';
import { Layout, ZoomIn, ZoomOut, Download, Loader2, Award, Briefcase, GraduationCap, User } from 'lucide-react';

export default function PreviewPanel({ 
  resumeData, 
  template, 
  setTemplate, 
  onDownloadPdf, 
  downloadingPdf 
}) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width || 800);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-textDim text-center space-y-3">
        <Layout size={48} className="opacity-30" />
        <p className="text-sm font-semibold">No Preview Available</p>
        <p className="text-xs max-w-[200px]">Upload or write resume data to populate the viewport.</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.7));

  // Auto-fit scale calculations:
  // Available width is container width minus margins/paddings.
  // Target document width is 210mm (approx 794px).
  const padding = 32; // 16px on each side (p-4)
  const fitScale = (containerWidth - padding) / 794;
  const finalScale = fitScale * zoom;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface/60 border border-white/[0.08] rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5">
          <label className="text-2xs font-bold text-textDim uppercase tracking-wider">Style:</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="bg-white/[0.02] border border-white/[0.08] rounded-lg text-xs font-semibold text-textMain px-2 py-1 outline-none focus:border-primary/50"
          >
            <option value="ATS Clean" className="bg-surface text-textMain">ATS Clean (Standard)</option>
            <option value="Modern Professional" className="bg-surface text-textMain">Modern Professional</option>
            <option value="Executive Prestige" className="bg-surface text-textMain">Executive Prestige</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-lg overflow-hidden">
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/[0.08] text-textMuted transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-bold text-textMain px-2 select-none">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/[0.08] text-textMuted transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Export PDF */}
          <button
            onClick={onDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 bg-primary hover:bg-primaryHover disabled:bg-white/[0.08] disabled:text-textDim text-white rounded-lg text-xs font-bold px-3 py-1.5 shadow-sm transition-all active:scale-[0.97]"
          >
            {downloadingPdf ? (
              <><Loader2 className="animate-spin" size={13} /> Compiling...</>
            ) : (
              <><Download size={13} /> PDF Export</>
            )}
          </button>
        </div>
      </div>

      {/* Viewport container with scaling */}
      <div 
        ref={containerRef}
        className="flex-1 bg-black/40 rounded-2xl border border-white/[0.08] shadow-inner overflow-auto flex items-start justify-center p-4 min-h-[600px] custom-scrollbar"
      >
        <div 
          style={{ 
            width: '100%', 
            height: `${297 * 3.7795 * finalScale + 32}px`, 
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          <div 
            className="bg-white shadow-2xl p-8 w-[210mm] min-h-[297mm] transition-transform origin-top text-black absolute top-0"
            style={{ 
              transform: `scale(${finalScale})`, 
              transformOrigin: 'top center'
            }}
          >
            {template === 'Modern Professional' && <ModernTemplate data={resumeData} />}
            {template === 'Executive Prestige' && <ExecutiveTemplate data={resumeData} />}
            {template === 'ATS Clean' && <ATSCleanTemplate data={resumeData} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 1. ATS Clean Template
 */
function ATSCleanTemplate({ data }) {
  return (
    <div className="font-sans text-xs leading-relaxed text-slate-800">
      <div className="text-center border-b border-slate-900 pb-2 mb-4">
        <h1 className="text-2xl font-bold uppercase text-slate-900 tracking-wide">{data.fullName || 'Name'}</h1>
        <div className="text-xs text-slate-600 mt-1 flex justify-center gap-3">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>| {data.phone}</span>}
          {data.location && <span>| {data.location}</span>}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 flex justify-center gap-3">
          {data.linkedin && <span>LinkedIn: {data.linkedin}</span>}
          {data.github && <span>GitHub: {data.github}</span>}
        </div>
      </div>

      {data.summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-1.5 tracking-wider text-slate-900">Professional Summary</h2>
          <p>{data.summary}</p>
        </div>
      )}

      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2.5 tracking-wider text-slate-900">Experience</h2>
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{exp.position}</span>
                  <span className="font-normal text-slate-600">{exp.startDate} - {exp.endDate || 'Present'}</span>
                </div>
                <div className="italic text-slate-600">{exp.company}</div>
                {exp.description && (
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {exp.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.projects && data.projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2.5 tracking-wider text-slate-900">Projects</h2>
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{proj.name}</span>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span className="font-normal text-slate-600 italic">[{Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}]</span>
                  )}
                </div>
                {proj.link && (
                  <div className="text-slate-500 underline font-semibold select-all text-[10px]">
                    <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.link}</a>
                  </div>
                )}
                {proj.description && (
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {proj.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.education && data.education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2.5 tracking-wider text-slate-900">Education</h2>
          <div className="space-y-2">
            {data.education.map((edu, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{edu.school}</span>
                  <span className="font-normal text-slate-600">{edu.graduationDate}</span>
                </div>
                <div className="italic text-slate-600">{edu.degree}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2.5 tracking-wider text-slate-900">Technical Skills</h2>
          <div className="space-y-1">
            {data.skills.map((skill, i) => (
              <div key={i}>
                <span className="font-bold text-slate-800">{skill.category}: </span>
                <span>{Array.isArray(skill.items) ? skill.items.join(', ') : skill.items}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase border-b border-slate-900 pb-0.5 mb-2 tracking-wider text-slate-900">Certifications</h2>
          <ul className="list-disc pl-5 space-y-0.5">
            {data.certifications.map((cert, i) => (
              <li key={i}>{cert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Modern Professional Template
 */
function ModernTemplate({ data }) {
  return (
    <div className="font-sans text-xs text-slate-800 leading-normal">
      {/* Header */}
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.fullName || 'Name'}</h1>
            <p className="text-blue-600 font-semibold mt-1 text-xs">{data.title || 'Professional Title'}</p>
          </div>
          <div className="text-right text-[10px] text-slate-500 space-y-0.5">
            {data.email && <div>{data.email}</div>}
            {data.phone && <div>{data.phone}</div>}
            {data.location && <div>{data.location}</div>}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-blue-600">
          {data.linkedin && <span>LinkedIn: {data.linkedin}</span>}
          {data.github && <span>GitHub: {data.github}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {data.summary && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 border-b border-slate-200 pb-1 mb-2">Professional Profile</h2>
              <p className="text-xs text-slate-650 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {data.experience && data.experience.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 border-b border-slate-200 pb-1 mb-3">Work History</h2>
              <div class="space-y-4">
                {data.experience.map((exp, i) => (
                  <div key={i} className="relative pl-4 border-l border-blue-200">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-xs">{exp.position}</h3>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{exp.startDate} - {exp.endDate || 'Present'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">{exp.company}</p>
                    {exp.description && (
                      <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                        {exp.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.projects && data.projects.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 border-b border-slate-200 pb-1 mb-3">Key Projects</h2>
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={i} className="relative pl-4 border-l border-blue-200">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-xs">{proj.name}</h3>
                      {proj.link && (
                        <span className="text-[9px] text-blue-600 underline font-bold"><a href={proj.link} target="_blank" rel="noopener noreferrer">Link</a></span>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <p className="text-[9px] text-slate-500 font-semibold mb-1">
                        Technologies: {(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).join(', ')}
                      </p>
                    )}
                    {proj.description && (
                      <ul className="list-disc pl-4 text-xs text-slate-650 space-y-1">
                        {proj.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-6 bg-slate-50 p-4 rounded-xl h-fit border border-slate-100">
          {data.skills && data.skills.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-3">Core Skills</h2>
              <div className="space-y-3">
                {data.skills.map((skill, i) => (
                  <div key={i}>
                    <h3 className="font-semibold text-slate-700 text-[10px] mb-1.5">{skill.category}</h3>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(skill.items) ? skill.items : [skill.items]).map((item, idx) => (
                        <span key={idx} className="bg-white text-slate-800 text-[9px] px-2 py-0.5 rounded border border-slate-200 font-semibold">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-3">Education</h2>
              <div className="space-y-3">
                {data.education.map((edu, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-bold text-slate-800">{edu.degree}</p>
                    <p className="text-slate-500 font-semibold">{edu.school}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{edu.graduationDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">Credentials</h2>
              <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                {data.certifications.map((cert, i) => (
                  <li key={i}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Executive Prestige Template
 */
function ExecutiveTemplate({ data }) {
  return (
    <div className="font-serif text-xs text-slate-900 leading-relaxed">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 -mx-8 -mt-8 text-center border-b-4 border-amber-500 mb-6">
        <h1 className="text-3xl font-normal tracking-wide text-amber-100">{data.fullName || 'Name'}</h1>
        <p className="text-[9px] uppercase tracking-widest text-amber-500 font-bold mt-1.5">{data.title || 'Executive Director'}</p>
        <div className="text-[10px] mt-4 flex justify-center gap-6 text-slate-350">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>| {data.phone}</span>}
          {data.location && <span>| {data.location}</span>}
        </div>
        <div className="text-[9px] mt-1 text-slate-400 flex justify-center gap-4">
          {data.linkedin && <span>LinkedIn: {data.linkedin}</span>}
          {data.github && <span>GitHub: {data.github}</span>}
        </div>
      </div>

      <div className="space-y-6">
        {data.summary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-2">Executive Overview</h2>
            <p className="text-xs text-slate-700 leading-relaxed italic">{data.summary}</p>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-3">Boardroom & Professional Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{exp.position}</h3>
                    <span className="text-xs text-amber-700 font-bold">{exp.startDate} - {exp.endDate || 'Present'}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 italic mb-2">{exp.company}</p>
                  {exp.description && (
                    <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                      {exp.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-3">Key Projects & Ventures</h2>
            <div className="space-y-4">
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{proj.name}</h3>
                    {proj.link && (
                      <span className="text-xs text-amber-700 font-bold underline"><a href={proj.link} target="_blank" rel="noopener noreferrer">Link</a></span>
                    )}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[10px] font-semibold text-slate-500 italic mb-2">
                      Technologies: {(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).join(', ')}
                    </p>
                  )}
                  {proj.description && (
                    <ul className="list-disc pl-5 text-xs text-slate-705 space-y-1">
                      {proj.description.split('\n').filter(b => b.trim()).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-2">
          {/* Left Column */}
          {data.education && data.education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-3">Academic credentials</h2>
              <div className="space-y-3">
                {data.education.map((edu, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-slate-500 font-semibold">{edu.school}</p>
                    <p className="text-amber-700 font-bold mt-0.5">{edu.graduationDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column */}
          <div className="space-y-6">
            {data.skills && data.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-3">Strategic Competencies</h2>
                <div className="space-y-2">
                  {data.skills.map((skill, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold text-slate-800">{skill.category}: </span>
                      <span className="text-slate-650">{Array.isArray(skill.items) ? skill.items.join(', ') : skill.items}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.certifications && data.certifications.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-0.5 mb-2">Credentials</h2>
                <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                  {data.certifications.map((cert, i) => (
                    <li key={i}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
