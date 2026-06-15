// Resume Templates - LaTeX templates for different styles

export const RESUME_TEMPLATES = {

  modern: {
    name: 'Modern',
    description: 'Clean, contemporary design with accent colors',
    latex: (data) => `\\documentclass[11pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{xcolor}
\\usepackage{fontawesome5}
\\usepackage{hyperref}

\\definecolor{accentcolor}{RGB}{52, 152, 219}

\\pagestyle{empty}

\\begin{document}

% Header
\\begin{center}
{\\Large \\textbf{${data.fullName}}}\\\\
\\vspace{0.2cm}
\\textcolor{accentcolor}{${data.title || 'Professional'}}\\\\
\\vspace{0.2cm}
{\\small ${data.email} $|$ ${data.phone} $|$ ${data.location}}
\\end{center}

\\vspace{0.3cm}
\\hrule
\\vspace{0.3cm}

% Summary
${data.summary ? `\\section*{\\textcolor{accentcolor}{PROFESSIONAL SUMMARY}}
${data.summary}

\\vspace{0.2cm}
` : ''}

% Experience
${data.experience && data.experience.length > 0 ? `\\section*{\\textcolor{accentcolor}{EXPERIENCE}}
${data.experience.map(exp => `
{\\textbf{${exp.position}}} $|$ {\\textit{${exp.company}}} $|$ {\\small ${exp.startDate} -- ${exp.endDate || 'Present'}}\\\\
${exp.description}

`).join('')}\\vspace{0.2cm}
` : ''}

% Education
${data.education && data.education.length > 0 ? `\\section*{\\textcolor{accentcolor}{EDUCATION}}
${data.education.map(edu => `
{\\textbf{${edu.degree}}} $|$ {\\textit{${edu.school}}}\\\\
{\\small ${edu.graduationDate}}

`).join('')}\\vspace{0.2cm}
` : ''}

% Skills
${data.skills && data.skills.length > 0 ? `\\section*{\\textcolor{accentcolor}{SKILLS}}
${data.skills.map(skill => `{\\textbf{${skill.category}:}} ${skill.items.join(', ')} \\\\`).join('\n')}

\\vspace{0.2cm}
` : ''}

% Certifications
${data.certifications && data.certifications.length > 0 ? `\\section*{\\textcolor{accentcolor}{CERTIFICATIONS}}
${data.certifications.map(cert => `$\\bullet$ ${cert} \\\\`).join('\n')}
` : ''}

\\end{document}`
  },

  classic: {
    name: 'Classic',
    description: 'Traditional ATS-friendly format',
    latex: (data) => `\\documentclass[11pt]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}

\\pagestyle{empty}

\\begin{document}

% Header
\\begin{center}
{\\Large \\textbf{${data.fullName}}}\\\\
${data.email} $|$ ${data.phone} $|$ ${data.location}
\\end{center}

\\vspace{0.2cm}

% Summary
${data.summary ? `\\noindent \\textbf{PROFESSIONAL SUMMARY}\\\\
${data.summary}

\\vspace{0.2cm}
` : ''}

% Experience
${data.experience && data.experience.length > 0 ? `\\noindent \\textbf{EXPERIENCE}\\\\
${data.experience.map(exp => `
${exp.position}, ${exp.company} \\hfill ${exp.startDate} -- ${exp.endDate || 'Present'}\\\\
${exp.description}

`).join('')}\\vspace{0.2cm}
` : ''}

% Education
${data.education && data.education.length > 0 ? `\\noindent \\textbf{EDUCATION}\\\\
${data.education.map(edu => `
${edu.degree}, ${edu.school} \\hfill ${edu.graduationDate}\\\\
`).join('')}\\vspace{0.2cm}
` : ''}

% Skills
${data.skills && data.skills.length > 0 ? `\\noindent \\textbf{SKILLS}\\\\
${data.skills.map(skill => `${skill.category}: ${skill.items.join(', ')} \\\\`).join('\n')}

\\vspace{0.2cm}
` : ''}

% Certifications
${data.certifications && data.certifications.length > 0 ? `\\noindent \\textbf{CERTIFICATIONS}\\\\
${data.certifications.map(cert => `$\\bullet$ ${cert} \\\\`).join('\n')}
` : ''}

\\end{document}`
  },

  minimal: {
    name: 'Minimal',
    description: 'Ultra-clean, single column layout',
    latex: (data) => `\\documentclass[10pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{hyperref}

\\pagestyle{empty}

\\begin{document}

{\\Large \\textbf{${data.fullName}}} \\hfill ${data.email} $|$ ${data.phone}\\\\
${data.title || 'Professional'} \\hfill ${data.location}

\\vspace{0.15cm}
\\hrule
\\vspace{0.15cm}

${data.summary ? `${data.summary}

\\vspace{0.15cm}
` : ''}

${data.experience && data.experience.length > 0 ? `\\textbf{EXPERIENCE}\\\\
${data.experience.map(exp => `${exp.position} at ${exp.company} (${exp.startDate}--${exp.endDate || 'Present'}) \\\\
${exp.description}

`).join('')}
` : ''}

${data.education && data.education.length > 0 ? `\\textbf{EDUCATION}\\\\
${data.education.map(edu => `${edu.degree} from ${edu.school} (${edu.graduationDate}) \\\\`).join('\n')}

` : ''}

${data.skills && data.skills.length > 0 ? `\\textbf{SKILLS} \\\\
${data.skills.map(skill => `${skill.category}: ${skill.items.join(', ')} \\\\`).join('\n')}

` : ''}

${data.certifications && data.certifications.length > 0 ? `\\textbf{CERTIFICATIONS} \\\\
${data.certifications.map(cert => `$\\bullet$ ${cert} \\\\`).join('\n')}
` : ''}

\\end{document}`
  },

  professional: {
    name: 'Professional',
    description: 'ATS-optimized professional resume with custom commands',
    latex: (data) => `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\renewcommand\\labelitemi{\\$\\vcenter{\\hbox{\\tiny\\$\\bullet\\$}}\\$}

\\begin{document}

\\begin{center}
    {\\Huge \\scshape ${data.fullName}} \\\\ \\vspace{1pt}
    ${data.location} \\\\ \\vspace{1pt}
    \\small \\raisebox{-0.1\\height}\\faPhone\\ +${data.phone} ~ \\href{mailto:${data.email}}{\\raisebox{-0.2\\height}\\faEnvelope\\ \\underline{${data.email}}} ~ 
    \\href{${data.linkedin || '#'}}{\\raisebox{-0.2\\height}\\faLinkedin\\ \\underline{LinkedIn}}  ~
    \\href{${data.github || '#'}}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{GitHub}}
    \\vspace{-8pt}
\\end{center}

${data.summary ? `\\section{Professional Summary}
${data.summary}
` : ''}

${data.experience && data.experience.length > 0 ? `\\section{Experience}
  \\resumeSubHeadingListStart
${data.experience.map(exp => `    \\resumeSubheading
      {${exp.company}}{${exp.startDate} -- ${exp.endDate || 'Present'}}
      {${exp.position}}{}
      \\resumeItemListStart
${exp.description ? exp.description.split('\n').filter(d => d.trim()).map(item => `        \\resumeItem{${item.trim()}}`).join('\n') : ''}
      \\resumeItemListEnd
`).join('')}  \\resumeSubHeadingListEnd
` : ''}

${data.education && data.education.length > 0 ? `\\section{Education}
  \\resumeSubHeadingListStart
${data.education.map(edu => `    \\resumeSubheading
      {${edu.school}}{${edu.graduationDate}}
      {${edu.degree}}{}
`).join('')}  \\resumeSubHeadingListEnd
` : ''}

${data.skills && data.skills.length > 0 ? `\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${data.skills.map(skill => `     \\textbf{${skill.category}}{: ${skill.items.join(', ')} } \\\\
`).join('')}    }}
 \\end{itemize}
 \\vspace{-16pt}
` : ''}

${data.certifications && data.certifications.length > 0 ? `\\section{Certifications}
  \\resumeSubHeadingListStart
${data.certifications.map(cert => `    \\resumeItem{${cert}}
`).join('')}  \\resumeSubHeadingListEnd
` : ''}

\\end{document}`
  }
};

export const DEFAULT_RESUME_DATA = {
  fullName: 'Your Name',
  title: 'Professional Title',
  email: 'your.email@example.com',
  phone: '+1 (555) 123-4567',
  location: 'City, State',
  linkedin: 'https://linkedin.com/in/yourprofile',
  github: 'https://github.com/yourprofile',
  summary: 'Brief professional summary highlighting your key strengths and career objectives.',
  experience: [
    {
      position: 'Job Title',
      company: 'Company Name',
      startDate: 'Jan 2023',
      endDate: 'Present',
      description: 'Key responsibilities and achievements\nSecond achievement or responsibility\nThird key accomplishment'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'University Name',
      graduationDate: 'May 2023'
    }
  ],
  skills: [
    {
      category: 'Programming Languages',
      items: ['JavaScript', 'Python', 'React', 'Node.js']
    },
    {
      category: 'Tools & Platforms',
      items: ['Git', 'Docker', 'AWS', 'MongoDB']
    }
  ],
  certifications: [
    'AWS Certified Solutions Architect',
    'Google Cloud Professional Data Engineer'
  ]
};
