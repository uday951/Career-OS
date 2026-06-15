import React, { useState, useEffect } from 'react';
import { Copy, Eye, Code2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js/dist/html2pdf.min';
import { RESUME_TEMPLATES, DEFAULT_RESUME_DATA } from './ResumeTemplates';
import { compileLatexToHtml } from '../utils/latexCompiler';

export default function JakeResumeBuilder() {
  const [editedLatexCode, setEditedLatexCode] = useState('');
  const [compiledHtml, setCompiledHtml] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    const template = RESUME_TEMPLATES['jake'];
    if (template) {
      const code = template.latex(DEFAULT_RESUME_DATA);
      setEditedLatexCode(code);
      compileAndRender(code);
    }
  }, []);

  const compileAndRender = (code) => {
    setIsCompiling(true);
    setTimeout(() => {
      const html = compileLatexToHtml(code);
      setCompiledHtml(html);
      setIsCompiling(false);
    }, 100);
  };

  const handleCompile = () => {
    compileAndRender(editedLatexCode);
  };

  const copyLatex = () => {
    navigator.clipboard.writeText(editedLatexCode);
    alert('LaTeX code copied! Paste into Overleaf.com');
  };

  const downloadPDF = () => {
    const element = document.getElementById('jake-preview-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `Professional_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Code2 className="text-primary"/> Pro Editor (Jake's Template)</h2>
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
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[70vh]">
          {/* Left: Code Editor */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="text-xs text-green-400 font-mono">✎ LaTeX Code Editor</div>
            <textarea
              value={editedLatexCode}
              onChange={(e) => setEditedLatexCode(e.target.value)}
              className="flex-1 w-full bg-[#1E1E1E] text-[#D4D4D4] font-mono text-xs p-4 rounded-lg focus:outline-none focus:border-primary/50 border border-white/10 resize-none min-h-[600px] shadow-inner"
              placeholder="Edit your LaTeX code here..."
            />
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-500/20"
            >
              {isCompiling ? (
                <><span className="animate-spin">⟳</span> Compiling...</>
              ) : (
                <>⚙️ Compile & Apply Changes</>
              )}
            </button>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="text-xs text-blue-400 font-mono">📄 Live Preview</div>
            <div className="flex-1 w-full bg-white p-8 rounded-lg overflow-y-auto border border-white/10 shadow-xl min-h-[600px]" id="jake-preview-content">
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
        <div className="text-xs text-gray-400 italic text-center mt-4">
          💡 Tip: Edit the raw LaTeX code on the left precisely the way you want it. Click "Compile & Apply Changes" to update the preview, and download as PDF when ready.
        </div>
      </div>
    </div>
  );
}
