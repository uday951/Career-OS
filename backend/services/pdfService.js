import { chromium } from 'playwright';
import mongoose from 'mongoose';
import { Readable } from 'stream';

let bucket;
const getGridFSBucket = () => {
  if (!bucket) {
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not active.');
    }
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resumePDFs'
    });
  }
  return bucket;
};

/**
 * 9. PDF-ready Resume Templates (HTML versions)
 */

function renderATSClean(data) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          h1 {
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
            margin: 0 0 5px 0;
            text-transform: uppercase;
          }
          .contact-info {
            text-align: center;
            font-size: 10pt;
            margin-bottom: 20px;
            color: #555555;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #333333;
            padding-bottom: 2px;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .exp-item, .edu-item {
            margin-bottom: 12px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-sub {
            display: flex;
            justify-content: space-between;
            font-style: italic;
            color: #555555;
            margin-bottom: 4px;
          }
          ul {
            margin: 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 3px;
          }
          .skills-list {
            margin-bottom: 5px;
          }
          .skills-category {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>${data.fullName || 'Candidate Name'}</h1>
        <div class="contact-info">
          ${data.email || ''} | ${data.phone || ''} | ${data.location || ''}
          ${data.linkedin ? ` | ${data.linkedin}` : ''}
          ${data.github ? ` | ${data.github}` : ''}
        </div>

        ${data.summary ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <div>${data.summary}</div>
          </div>
        ` : ''}

        ${data.experience && data.experience.length > 0 ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${data.experience.map(exp => `
              <div class="exp-item">
                <div class="item-header">
                  <span>${exp.position}</span>
                  <span>${exp.startDate} - ${exp.endDate || 'Present'}</span>
                </div>
                <div class="item-sub">
                  <span>${exp.company}</span>
                </div>
                ${exp.description ? `
                  <ul>
                    ${exp.description.split('\n').filter(b => b.trim()).map(bullet => `
                      <li>${bullet.trim()}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.projects && data.projects.length > 0 ? `
          <div class="section">
            <div class="section-title">Projects</div>
            ${data.projects.map(proj => `
              <div class="exp-item">
                <div class="item-header">
                  <span>${proj.name}</span>
                  ${proj.technologies && proj.technologies.length > 0 ? `
                    <span style="font-weight: normal; font-size: 9pt; font-style: italic;">[${Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}]</span>
                  ` : ''}
                </div>
                ${proj.link ? `
                  <div class="item-sub">
                    <span><a href="${proj.link}" style="color: #333333; text-decoration: none;">${proj.link}</a></span>
                  </div>
                ` : ''}
                ${proj.description ? `
                  <ul>
                    ${proj.description.split('\n').filter(b => b.trim()).map(bullet => `
                      <li>${bullet.trim()}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${data.education.map(edu => `
              <div class="edu-item">
                <div class="item-header">
                  <span>${edu.school}</span>
                  <span>${edu.graduationDate}</span>
                </div>
                <div class="item-sub">
                  <span>${edu.degree}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Skills</div>
            ${data.skills.map(skill => `
              <div class="skills-list">
                <span class="skills-category">${skill.category}:</span>
                <span>${Array.isArray(skill.items) ? skill.items.join(', ') : skill.items}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.certifications && data.certifications.length > 0 ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            <ul>
              ${data.certifications.map(cert => `
                <li>${cert}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </body>
    </html>
  `;
}

function renderModern(data) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;750;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            color: #1f2937;
          }
        </style>
      </head>
      <body class="p-6">
        <!-- Header -->
        <div class="border-b-2 border-blue-500 pb-4 mb-6">
          <div class="flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">${data.fullName || 'Candidate Name'}</h1>
              <p class="text-blue-600 font-semibold mt-1 text-sm">${data.title || 'Professional Title'}</p>
            </div>
            <div class="text-right text-xs text-gray-500 space-y-1">
              ${data.email ? `<div><i class="fa fa-envelope text-blue-500 mr-2"></i>${data.email}</div>` : ''}
              ${data.phone ? `<div><i class="fa fa-phone text-blue-500 mr-2"></i>${data.phone}</div>` : ''}
              ${data.location ? `<div><i class="fa fa-map-marker text-blue-500 mr-2"></i>${data.location}</div>` : ''}
            </div>
          </div>
          <div class="flex gap-4 mt-3 text-xs text-blue-600">
            ${data.linkedin ? `<a href="${data.linkedin}" target="_blank"><i class="fab fa-linkedin mr-1.5"></i>LinkedIn</a>` : ''}
            ${data.github ? `<a href="${data.github}" target="_blank"><i class="fab fa-github mr-1.5"></i>GitHub</a>` : ''}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="col-span-2 space-y-6">
            ${data.summary ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-gray-200 pb-1 mb-2">Professional Profile</h2>
                <p class="text-sm text-gray-700 leading-relaxed">${data.summary}</p>
              </div>
            ` : ''}

            ${data.experience && data.experience.length > 0 ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-gray-200 pb-1 mb-3">Work History</h2>
                <div class="space-y-4">
                  ${data.experience.map(exp => `
                    <div class="relative pl-4 border-l border-blue-200">
                      <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                      <div class="flex justify-between items-start">
                        <h3 class="font-bold text-gray-800 text-sm">${exp.position}</h3>
                        <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                      </div>
                      <p class="text-xs text-gray-500 font-semibold mb-2">${exp.company}</p>
                      ${exp.description ? `
                        <ul class="list-disc pl-4 text-xs text-gray-600 space-y-1">
                          ${exp.description.split('\n').filter(b => b.trim()).map(bullet => `
                            <li>${bullet.trim()}</li>
                          `).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${data.projects && data.projects.length > 0 ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-gray-200 pb-1 mb-3">Key Projects</h2>
                <div class="space-y-4">
                  ${data.projects.map(proj => `
                    <div class="relative pl-4 border-l border-blue-200">
                      <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                      <div class="flex justify-between items-start">
                        <h3 class="font-bold text-gray-800 text-sm">${proj.name}</h3>
                        ${proj.link ? `
                          <span class="text-[10px] text-blue-600 underline font-bold"><a href="${proj.link}" target="_blank">Link</a></span>
                        ` : ''}
                      </div>
                      ${proj.technologies && proj.technologies.length > 0 ? `
                        <p class="text-[10px] text-slate-500 font-semibold mb-1">
                          Technologies: ${(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).join(', ')}
                        </p>
                      ` : ''}
                      ${proj.description ? `
                        <ul class="list-disc pl-4 text-xs text-gray-600 space-y-1">
                          ${proj.description.split('\n').filter(b => b.trim()).map(bullet => `
                            <li>${bullet.trim()}</li>
                          `).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Sidebar -->
          <div class="col-span-1 space-y-6 bg-slate-50 p-4 rounded-xl h-fit border border-slate-100">
            ${data.skills && data.skills.length > 0 ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Core Skills</h2>
                <div class="space-y-3">
                  ${data.skills.map(skill => `
                    <div>
                      <h3 class="font-semibold text-gray-700 text-xs mb-1.5">${skill.category}</h3>
                      <div class="flex flex-wrap gap-1">
                        ${(Array.isArray(skill.items) ? skill.items : [skill.items]).map(item => `
                          <span class="bg-white text-gray-800 text-[10px] px-2 py-1 rounded border border-gray-250 font-medium">${item}</span>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${data.education && data.education.length > 0 ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Education</h2>
                <div class="space-y-3">
                  ${data.education.map(edu => `
                    <div class="text-xs">
                      <p class="font-bold text-gray-800">${edu.degree}</p>
                      <p class="text-gray-500 font-medium">${edu.school}</p>
                      <p class="text-[10px] text-gray-400 mt-0.5">${edu.graduationDate}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${data.certifications && data.certifications.length > 0 ? `
              <div>
                <h2 class="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Certifications</h2>
                <ul class="list-disc pl-4 text-xs text-gray-600 space-y-1">
                  ${data.certifications.map(cert => `
                    <li>${cert}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

function renderExecutive(data) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            font-family: 'Georgia', serif;
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="bg-slate-900 text-white p-8 text-center border-b-4 border-amber-500">
          <h1 class="text-4xl font-normal tracking-wide text-amber-100">${data.fullName || 'Candidate Name'}</h1>
          <p class="text-xs uppercase tracking-widest text-amber-500 font-semibold mt-2">${data.title || 'Executive Director'}</p>
          <div class="text-xs mt-4 flex justify-center gap-6 text-slate-350">
            ${data.email ? `<span><i class="fa fa-envelope mr-1.5 text-amber-500"></i>${data.email}</span>` : ''}
            ${data.phone ? `<span><i class="fa fa-phone mr-1.5 text-amber-500"></i>${data.phone}</span>` : ''}
            ${data.location ? `<span><i class="fa fa-map-marker mr-1.5 text-amber-500"></i>${data.location}</span>` : ''}
          </div>
          <div class="text-[10px] mt-2 flex justify-center gap-4 text-slate-400">
            ${data.linkedin ? `<span>LinkedIn: ${data.linkedin}</span>` : ''}
            ${data.github ? `<span>GitHub: ${data.github}</span>` : ''}
          </div>
        </div>

        <div class="p-8 max-w-4xl mx-auto space-y-6">
          ${data.summary ? `
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-2">Executive Overview</h2>
              <p class="text-sm text-slate-700 leading-relaxed italic font-light">${data.summary}</p>
            </div>
          ` : ''}

          ${data.experience && data.experience.length > 0 ? `
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-4">Boardroom & Professional Experience</h2>
              <div class="space-y-6">
                ${data.experience.map(exp => `
                  <div>
                    <div class="flex justify-between items-baseline mb-1">
                      <h3 class="text-base font-bold text-slate-900">${exp.position}</h3>
                      <span class="text-xs text-amber-700 font-bold">${exp.startDate} - ${exp.endDate || 'Present'}</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-500 italic mb-2">${exp.company}</p>
                    ${exp.description ? `
                      <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
                        ${exp.description.split('\n').filter(b => b.trim()).map(bullet => `
                          <li>${bullet.trim()}</li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${data.projects && data.projects.length > 0 ? `
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-4">Key Projects & Ventures</h2>
              <div class="space-y-6">
                ${data.projects.map(proj => `
                  <div>
                    <div class="flex justify-between items-baseline mb-1">
                      <h3 class="text-base font-bold text-slate-900">${proj.name}</h3>
                      ${proj.link ? `
                        <span class="text-xs text-amber-700 font-bold"><a href="${proj.link}" target="_blank" style="color: #b45309; text-decoration: none;">Link</a></span>
                      ` : ''}
                    </div>
                    ${proj.technologies && proj.technologies.length > 0 ? `
                      <p class="text-[10px] font-semibold text-slate-500 italic mb-2">
                        Technologies: ${(Array.isArray(proj.technologies) ? proj.technologies : [proj.technologies]).join(', ')}
                      </p>
                    ` : ''}
                    ${proj.description ? `
                      <ul class="list-disc pl-5 text-xs text-slate-750 space-y-1.5">
                        ${proj.description.split('\n').filter(b => b.trim()).map(bullet => `
                          <li>${bullet.trim()}</li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="grid grid-cols-2 gap-8">
            <!-- Left col -->
            ${data.education && data.education.length > 0 ? `
              <div>
                <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-3">Academic background</h2>
                <div class="space-y-3">
                  ${data.education.map(edu => `
                    <div class="text-xs">
                      <p class="font-bold text-slate-900">${edu.degree}</p>
                      <p class="text-slate-500 font-semibold">${edu.school}</p>
                      <p class="text-amber-700 font-medium mt-0.5">${edu.graduationDate}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Right col -->
            <div class="space-y-6">
              ${data.skills && data.skills.length > 0 ? `
                <div>
                  <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-3">Strategic Competencies</h2>
                  <div class="space-y-2">
                    ${data.skills.map(skill => `
                      <div class="text-xs">
                        <span class="font-bold text-slate-800">${skill.category}:</span>
                        <span class="text-slate-650">${Array.isArray(skill.items) ? skill.items.join(', ') : skill.items}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${data.certifications && data.certifications.length > 0 ? `
                <div>
                  <h2 class="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-amber-500 pb-1 mb-2">Credentials</h2>
                  <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    ${data.certifications.map(cert => `
                      <li>${cert}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Main PDF Compiler Service
 */
export async function compileHTMLPDF(resumeData, templateName) {
  let html = '';
  const name = (templateName || 'ATS Clean').toLowerCase().trim();

  if (name.includes('modern')) {
    html = renderModern(resumeData);
  } else if (name.includes('executive') || name.includes('prestige')) {
    html = renderExecutive(resumeData);
  } else {
    html = renderATSClean(resumeData);
  }

  // Launch browser via Playwright
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    
    // Compile PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
        right: '0.4in'
      }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    await browser.close();
    console.error('Playwright PDF Compiling Error:', error);
    throw error;
  }
}

/**
 * Upload buffer to MongoDB GridFS
 */
export async function uploadPDFToGridFS(pdfBuffer, filename) {
  const gridBucket = getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    const uploadStream = gridBucket.openUploadStream(filename, {
      contentType: 'application/pdf'
    });

    const readable = new Readable();
    readable.push(pdfBuffer);
    readable.push(null); // EOF

    readable.pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id));
  });
}

/**
 * Stream file out of GridFS to standard HTTP response
 */
export async function downloadPDFFromGridFS(gridfsId, res) {
  const gridBucket = getGridFSBucket();
  
  const objectId = new mongoose.Types.ObjectId(gridfsId);
  const downloadStream = gridBucket.openDownloadStream(objectId);
  
  res.setHeader('Content-Type', 'application/pdf');
  
  downloadStream.pipe(res)
    .on('error', (err) => {
      console.error('GridFS stream download error:', err);
      res.status(404).json({ message: 'PDF document not found in storage' });
    });
}
