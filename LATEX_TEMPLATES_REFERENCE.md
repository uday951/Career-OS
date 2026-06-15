# LaTeX Resume Templates - Reference

## Template Styles

### 1. Modern Template
**Best for**: Tech companies, startups, creative roles

**Features**:
- Colored section headers (blue accent)
- Clean spacing and typography
- Professional appearance
- Requires: xcolor, fontawesome5 packages

**Sample Output**:
```
JOHN DOE
Senior Software Engineer
john@example.com | +1 (555) 123-4567 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced full-stack engineer with 5+ years building scalable web applications...

EXPERIENCE
Senior Software Engineer | Tech Company | Jan 2023 -- Present
Led development of microservices architecture serving 1M+ users...

EDUCATION
Bachelor of Science in Computer Science | University Name
May 2023

SKILLS
Programming Languages: JavaScript, Python, Go, Rust
Tools & Platforms: Docker, Kubernetes, AWS, PostgreSQL

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Data Engineer
```

---

### 2. Classic Template
**Best for**: Corporate jobs, traditional industries, ATS systems

**Features**:
- Traditional resume format
- ATS-optimized (no fancy formatting)
- Widely recognized structure
- Minimal packages required

**Sample Output**:
```
JOHN DOE
john@example.com | +1 (555) 123-4567 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced full-stack engineer with 5+ years building scalable web applications...

EXPERIENCE
Senior Software Engineer, Tech Company                    Jan 2023 -- Present
Led development of microservices architecture serving 1M+ users...

EDUCATION
Bachelor of Science in Computer Science, University Name                May 2023

SKILLS
Programming Languages: JavaScript, Python, Go, Rust
Tools & Platforms: Docker, Kubernetes, AWS, PostgreSQL

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Data Engineer
```

---

### 3. Minimal Template
**Best for**: Academic positions, minimalist aesthetic, single-page focus

**Features**:
- Ultra-clean layout
- Compact spacing
- Single column design
- Minimal dependencies

**Sample Output**:
```
JOHN DOE                                    john@example.com | +1 (555) 123-4567
Senior Software Engineer                    San Francisco, CA

Experienced full-stack engineer with 5+ years building scalable web applications...

EXPERIENCE
Senior Software Engineer at Tech Company (Jan 2023--Present)
Led development of microservices architecture serving 1M+ users...

EDUCATION
Bachelor of Science in Computer Science from University Name (May 2023)

SKILLS
Programming Languages: JavaScript, Python, Go, Rust
Tools & Platforms: Docker, Kubernetes, AWS, PostgreSQL

CERTIFICATIONS
• AWS Certified Solutions Architect
• Google Cloud Professional Data Engineer
```

---

## How to Use in Overleaf

### Step 1: Create New Project
1. Go to [overleaf.com](https://overleaf.com)
2. Click "New Project" → "Blank Project"
3. Name your project (e.g., "My Resume")

### Step 2: Copy LaTeX Code
1. In Career OS, click "Copy LaTeX" button
2. The code is now in your clipboard

### Step 3: Paste into Overleaf
1. In Overleaf, select all text in `main.tex`
2. Delete it
3. Paste the LaTeX code
4. Click "Recompile"

### Step 4: Download PDF
1. Click "Download PDF" button
2. Your resume is ready!

---

## Customizing in Overleaf

### Change Colors (Modern Template)
Find this line:
```latex
\definecolor{accentcolor}{RGB}{52, 152, 219}
```

Change RGB values:
- Blue: `52, 152, 219`
- Red: `220, 53, 69`
- Green: `40, 167, 69`
- Purple: `111, 66, 193`

### Change Margins
Find this line:
```latex
\usepackage[margin=0.5in]{geometry}
```

Change `0.5in` to:
- `0.75in` - More spacious
- `0.5in` - Compact (default)
- `1in` - Very spacious

### Change Font Size
Find this line:
```latex
\documentclass[11pt]{article}
```

Change `11pt` to:
- `10pt` - Smaller
- `11pt` - Default
- `12pt` - Larger

### Add Hyperlinks
Wrap URLs in:
```latex
\href{https://example.com}{example.com}
```

---

## LaTeX Packages Used

### Modern Template
- `geometry` - Page margins
- `xcolor` - Colored text
- `fontawesome5` - Icons (optional)
- `hyperref` - Hyperlinks

### Classic Template
- `geometry` - Page margins
- `hyperref` - Hyperlinks

### Minimal Template
- `geometry` - Page margins
- `hyperref` - Hyperlinks

---

## Tips for Best Results

### Content Tips
- Keep descriptions concise (2-3 lines per entry)
- Use action verbs (Led, Developed, Designed, etc.)
- Quantify achievements (1M+ users, 40% improvement)
- Tailor to job description keywords

### Formatting Tips
- Use consistent date formats (Jan 2023, May 2023)
- Keep company names consistent
- Use bullet points for achievements
- Avoid special characters that need escaping

### ATS Optimization (Classic Template)
- Use standard section headers
- Avoid tables and columns
- Use simple fonts
- Keep formatting minimal
- Use standard bullet points

### Visual Tips (Modern Template)
- Don't overuse colors
- Keep white space balanced
- Use consistent spacing
- Limit to 1-2 pages

---

## Common Issues & Solutions

### Issue: LaTeX won't compile
**Solution**: Check for special characters like `&`, `%`, `$`. Escape with backslash: `\&`, `\%`, `\$`

### Issue: Text is cut off
**Solution**: Reduce margins in geometry package or reduce font size

### Issue: Colors not showing
**Solution**: Make sure `xcolor` package is included (Modern template only)

### Issue: Hyperlinks not working
**Solution**: Ensure `hyperref` package is included and use `\href{url}{text}` format

### Issue: Resume is 2+ pages
**Solution**: Reduce margins, font size, or remove less important entries

---

## Export Options

### PDF (Recommended)
- Best for email and online applications
- Preserves formatting perfectly
- Widely accepted

### Download as ZIP
- Includes all LaTeX files
- Good for version control
- Can edit locally with LaTeX editor

### Share Link
- Overleaf generates shareable link
- Others can view/edit (if permissions set)
- Good for collaboration

---

## Next Steps

1. **Customize**: Edit colors, fonts, margins in Overleaf
2. **Download**: Get PDF version
3. **Apply**: Use for job applications
4. **Iterate**: Make changes and re-download as needed

For more LaTeX help, visit [Overleaf Documentation](https://www.overleaf.com/learn)
