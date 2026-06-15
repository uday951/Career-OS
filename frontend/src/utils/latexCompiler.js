// LaTeX to HTML Compiler for Resume Templates

export const compileLatexToHtml = (latexCode) => {
  try {
    // Extract document content
    const docMatch = latexCode.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (!docMatch) return '<div style="color:red; padding:20px">Error: No document environment found</div>';

    let content = docMatch[1];

    // Remove comments
    content = content.replace(/%.*$/gm, '');

    // Process sections
    content = content.replace(/\\section\{([^}]*)\}/g, (match, title) => {
      return `<div style="margin-top: 15px; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 3px;">
        <span style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${title}</span>
      </div>`;
    });

    // Process resumeSubHeadingListStart/End
    content = content.replace(/\\resumeSubHeadingListStart/g, '<div style="list-style: none; padding: 0; margin: 0;">');
    content = content.replace(/\\resumeSubHeadingListEnd/g, '</div>');

    // Process resumeItemListStart/End
    content = content.replace(/\\resumeItemListStart/g, '<ul style="margin: 5px 0 5px 20px; padding: 0;">');
    content = content.replace(/\\resumeItemListEnd/g, '</ul>');

    // Process resumeSubheading command
    content = content.replace(/\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/g, (match, company, date, position, location) => {
      return `<div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
          <span style="font-weight: bold; font-size: 13px;">${company}</span>
          <span style="font-weight: bold; font-size: 12px;">${date}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-style: italic; font-size: 12px;">${position}</span>
          <span style="font-style: italic; font-size: 12px;">${location}</span>
        </div>
      </div>`;
    });

    // Process resumeItem command
    content = content.replace(/\\resumeItem\{([^}]*)\}/g, (match, text) => {
      return `<li style="margin: 4px 0; font-size: 12px; line-height: 1.4;">${text}</li>`;
    });

    // Process center environment
    content = content.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (match, inner) => {
      return `<div style="text-align: center; margin: 10px 0;">${inner}</div>`;
    });

    // Process itemize environment
    content = content.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (match, inner) => {
      return `<ul style="margin: 5px 0 5px 20px; padding: 0;">${inner}</ul>`;
    });

    // Process multicols environment
    content = content.replace(/\\begin\{multicols\}\{(\d+)\}([\s\S]*?)\\end\{multicols\}/g, (match, cols, inner) => {
      return `<div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 15px; margin: 5px 0;">${inner}</div>`;
    });

    // Process tabularx environment
    content = content.replace(/\\begin\{tabularx\}\{[^}]*\}([\s\S]*?)\\end\{tabularx\}/g, (match, inner) => {
      return `<div style="margin: 5px 0;">${inner}</div>`;
    });

    // Process item command
    content = content.replace(/\\item\s+/g, '<li style="margin: 3px 0; font-size: 12px;">');

    // Process text formatting
    content = content.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    content = content.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
    content = content.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
    content = content.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');

    // Process font size commands
    content = content.replace(/\\Huge\s+/g, '<span style="font-size: 32px;">');
    content = content.replace(/\\Large\s+/g, '<span style="font-size: 18px;">');
    content = content.replace(/\\large\s+/g, '<span style="font-size: 14px;">');
    content = content.replace(/\\small\s+/g, '<span style="font-size: 11px;">');
    content = content.replace(/\\tiny\s+/g, '<span style="font-size: 9px;">');

    // Process href command
    content = content.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1" style="color: #0066cc; text-decoration: underline;">$2</a>');

    // Process line breaks
    content = content.replace(/\\\\\s*/g, '<br/>');
    content = content.replace(/\\vspace\{[^}]*\}/g, '<div style="height: 8px;"></div>');
    content = content.replace(/\\hspace\{[^}]*\}/g, '<span style="display: inline-block; width: 15px;"></span>');
    content = content.replace(/\\hfill/g, '<span style="flex: 1;"></span>');

    // Process special characters
    content = content.replace(/\\&/g, '&');
    content = content.replace(/\\~/g, ' ');
    content = content.replace(/\\-/g, '-');
    content = content.replace(/\\\$/g, '$');
    content = content.replace(/\\\{/g, '{');
    content = content.replace(/\\\}/g, '}');
    content = content.replace(/\\\\/g, '\\');

    // Process icons
    content = content.replace(/\\faPhone/g, '📞');
    content = content.replace(/\\faEnvelope/g, '✉️');
    content = content.replace(/\\faLinkedin/g, '🔗');
    content = content.replace(/\\faGithub/g, '🐙');

    // Process raisebox
    content = content.replace(/\\raisebox\{[^}]*\}\{([^}]*)\}/g, '$1');

    // Process scshape
    content = content.replace(/\\scshape\s+/g, '<span style="font-variant: small-caps;">');

    // Remove remaining LaTeX commands
    content = content.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '');
    content = content.replace(/\\[a-zA-Z]+/g, '');
    content = content.replace(/\{([^}]*)\}/g, '$1');

    // Clean up extra whitespace
    content = content.replace(/\n\s*\n/g, '\n');
    content = content.trim();

    return content;
  } catch (error) {
    console.error('LaTeX compilation error:', error);
    return `<div style="color: red; padding: 20px; font-family: monospace;">Error: ${error.message}</div>`;
  }
};

export const generatePdfFromHtml = async (htmlContent, filename) => {
  const { html2pdf } = window;
  if (!html2pdf) {
    alert('PDF library not loaded. Please refresh the page.');
    return;
  }

  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  element.style.padding = '20px';
  element.style.fontFamily = 'Times New Roman, serif';
  element.style.lineHeight = '1.5';
  element.style.color = '#000';
  element.style.backgroundColor = '#fff';

  const opt = {
    margin: 10,
    filename: filename || 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Error generating PDF: ' + error.message);
  }
};
