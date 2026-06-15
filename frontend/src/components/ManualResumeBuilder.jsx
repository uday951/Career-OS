import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Eye, Code2, X, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js/dist/html2pdf.min';
import { RESUME_TEMPLATES, DEFAULT_RESUME_DATA } from './ResumeTemplates';
import { compileLatexToHtml } from '../utils/latexCompiler';

export default function ManualResumeBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState('jake');
  const [resumeData, setResumeData] = useState(DEFAULT_RESUME_DATA);
  const [latexCode, setLatexCode] = useState('');
  const [editedLatexCode, setEditedLatexCode] = useState('');
  const [compiledHtml, setCompiledHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [isCompiling, setIsCompiling] = useState(false);

  // Auto-generate LaTeX on template or data change
  useEffect(() => {
    const template = RESUME_TEMPLATES[selectedTemplate];
    if (template) {
      const code = template.latex(resumeData);
      setLatexCode(code);
      setEditedLatexCode(code);
      if (showPreview && activeTab === 'preview') {
        compileAndRender(code);
      }
    }
  }, [selectedTemplate, resumeData]);

  const compileAndRender = (code) => {
    setIsCompiling(true);
    setTimeout(() => {
      const html = compileLatexToHtml(code);
      setCompiledHtml(html);
      setIsCompiling(false);
    }, 100);
  };

  const handleBasicChange = (field, value) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...resumeData.experience];
    updated[index][field] = value;
    setResumeData(prev => ({ ...prev, experience: updated }));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...resumeData.education];
    updated[index][field] = value;
    setResumeData(prev => ({ ...prev, education: updated }));
  };

  const handleSkillsChange = (index, field, value) => {
    const updated = [...resumeData.skills];
    if (field === 'category') {
      updated[index].category = value;
    } else if (field === 'items') {
      updated[index].items = value.split(',').map(item => item.trim());
    }
    setResumeData(prev => ({ ...prev, skills: updated }));
  };

  const handleCertificationsChange = (index, value) => {
    const updated = [...resumeData.certifications];
    updated[index] = value;
    setResumeData(prev => ({ ...prev, certifications: updated }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { position: '', company: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', graduationDate: '' }]
    }));
  };

  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, { category: '', items: [] }]
    }));
  };

  const removeSkill = (index) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const removeCertification = (index) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleCompile = () => {
    setLatexCode(editedLatexCode);
    compileAndRender(editedLatexCode);
  };

  const handlePreview = () => {
    setShowPreview(true);
    setActiveTab('preview');
    compileAndRender(latexCode);
  };

  const copyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    alert('LaTeX code copied! Paste into Overleaf.com');
  };

  const downloadPDF = () => {
    const element = document.getElementById('resume-preview-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${resumeData.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-primary/20 rounded-xl text-primary"><Code2 size={28} /></div>
        <h1 className="text-3xl font-bold">Manual Resume Builder</h1>
      </div>

      {!showPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="glass p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Choose Template</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(RESUME_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === key
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-sm">{template.name}</div>
                    <div className="text-xs text-textMuted mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="glass p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resumeData.fullName}
                  onChange={(e) => handleBasicChange('fullName', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="Professional Title"
                  value={resumeData.title}
                  onChange={(e) => handleBasicChange('title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={resumeData.email}
                  onChange={(e) => handleBasicChange('email', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={resumeData.phone}
                  onChange={(e) => handleBasicChange('phone', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={resumeData.location}
                  onChange={(e) => handleBasicChange('location', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="url"
                  placeholder="LinkedIn URL (optional)"
                  value={resumeData.linkedin || ''}
                  onChange={(e) => handleBasicChange('linkedin', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <input
                  type="url"
                  placeholder="GitHub URL (optional)"
                  value={resumeData.github || ''}
                  onChange={(e) => handleBasicChange('github', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50"
                />
                <textarea
                  placeholder="Professional Summary"
                  value={resumeData.summary}
                  onChange={(e) => handleBasicChange('summary', e.target.value)}
                  rows="3"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="glass p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Experience</h2>
                <button onClick={addExperience} className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg text-sm transition-colors">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={exp.position}
                          onChange={(e) => handleExperienceChange(idx, 'position', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Start Date (e.g. Jan 2023)"
                            value={exp.startDate}
                            onChange={(e) => handleExperienceChange(idx, 'startDate', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="End Date (or Present)"
                            value={exp.endDate}
                            onChange={(e) => handleExperienceChange(idx, 'endDate', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Description / Achievements (one per line)"
                          value={exp.description}
                          onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                          rows="2"
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm resize-none"
                        />
                      </div>
                      <button onClick={() => removeExperience(idx)} className="text-red-400 hover:text-red-300 ml-3 mt-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="glass p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Education</h2>
                <button onClick={addEducation} className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg text-sm transition-colors">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="School / University"
                          value={edu.school}
                          onChange={(e) => handleEducationChange(idx, 'school', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Graduation Date"
                          value={edu.graduationDate}
                          onChange={(e) => handleEducationChange(idx, 'graduationDate', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                      </div>
                      <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300 ml-3 mt-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="glass p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Skills</h2>
                <button onClick={addSkill} className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg text-sm transition-colors">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.skills.map((skill, idx) => (
                  <div key={idx} className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          placeholder="Category (e.g. Programming Languages)"
                          value={skill.category}
                          onChange={(e) => handleSkillsChange(idx, 'category', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Skills (comma-separated)"
                          value={skill.items.join(', ')}
                          onChange={(e) => handleSkillsChange(idx, 'items', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                        />
                      </div>
                      <button onClick={() => removeSkill(idx)} className="text-red-400 hover:text-red-300 ml-3 mt-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Certifications</h2>
                <button onClick={addCertification} className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg text-sm transition-colors">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {resumeData.certifications.map((cert, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Certification name"
                      value={cert}
                      onChange={(e) => handleCertificationsChange(idx, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary/50 text-sm"
                    />
                    <button onClick={() => removeCertification(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all"
            >
              <Eye className="inline mr-2" size={20} /> Preview Resume
            </button>
          </div>

          {/* Right: Quick Preview */}
          <div className="glass p-6 h-fit sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Quick Preview</h2>
            <div className="bg-gray-100 text-black p-4 rounded-lg text-xs leading-relaxed font-serif max-h-96 overflow-y-auto">
              <div className="text-center font-bold text-sm mb-2">{resumeData.fullName}</div>
              <div className="text-center text-xs mb-2">{resumeData.email} | {resumeData.phone}</div>
              <hr className="my-2" />
              {resumeData.summary && <div className="mb-2"><strong>Summary:</strong> {resumeData.summary.substring(0, 100)}...</div>}
              {resumeData.experience.length > 0 && (
                <div className="mb-2">
                  <strong>Experience:</strong>
                  {resumeData.experience.slice(0, 1).map((exp, i) => (
                    <div key={i} className="text-xs">{exp.position} at {exp.company}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Preview Modal */
        <div className="glass-card border border-primary/30 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📄 Resume Preview</h2>
            <div className="flex gap-3">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                onClick={copyLatex}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/30 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <Copy size={16} /> Copy LaTeX
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 bg-gray-500/20 hover:bg-gray-500/40 text-gray-300 border border-gray-500/30 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <X size={16} /> Back to Edit
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 justify-between items-center">
            <div className="flex">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
              >
                <Eye className="inline mr-2" size={16} /> Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'code' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
              >
                <Code2 className="inline mr-2" size={16} /> LaTeX Code
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'preview' ? (
              <div className="bg-white p-8 rounded-lg max-h-[70vh] overflow-y-auto border border-white/10" id="resume-preview-content">
                <div 
                  style={{
                    fontFamily: "'Times New Roman', serif",
                    lineHeight: '1.5',
                    color: '#000',
                    fontSize: '12px'
                  }}
                  dangerouslySetInnerHTML={{ __html: compiledHtml }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  {/* Left: Code Editor */}
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-green-400 font-mono">✎ LaTeX Code Editor</div>
                    <textarea
                      value={editedLatexCode}
                      onChange={(e) => setEditedLatexCode(e.target.value)}
                      className="w-full h-80 bg-[#1E1E1E] text-[#D4D4D4] font-mono text-xs p-4 rounded-lg focus:outline-none focus:border-primary/50 border border-white/10 resize-none"
                      placeholder="Edit your LaTeX code here..."
                    />
                    <button
                      onClick={handleCompile}
                      disabled={isCompiling}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {isCompiling ? (
                        <>
                          <span className="animate-spin">⟳</span> Compiling...
                        </>
                      ) : (
                        <>
                          ⚙️ Compile & Apply Changes
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-blue-400 font-mono">📄 Live Preview</div>
                    <div className="w-full h-80 bg-white p-4 rounded-lg overflow-y-auto border border-white/10 shadow-lg">
                      {isCompiling && <div className="text-xs text-yellow-600 mb-2">⟳ Compiling...</div>}
                      <div 
                        style={{
                          fontFamily: "'Times New Roman', serif",
                          lineHeight: '1.5',
                          color: '#000',
                          fontSize: '11px'
                        }}
                        dangerouslySetInnerHTML={{ __html: compiledHtml || '<div style="color:#999">Click Compile to see preview</div>' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 italic">
                  💡 Tip: Edit LaTeX code on the left, then click "Compile & Apply Changes" to see the preview on the right.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
