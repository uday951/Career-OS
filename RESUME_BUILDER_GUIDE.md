# Manual Resume Builder - Implementation Guide

## Overview
A complete Overleaf-level LaTeX resume builder with manual editing, multiple templates, and live preview capabilities.

## Files Created

### 1. **ResumeTemplates.js** (`frontend/src/components/ResumeTemplates.js`)
Contains three professional LaTeX resume templates:
- **Modern**: Clean design with accent colors (blue)
- **Classic**: Traditional ATS-friendly format
- **Minimal**: Ultra-clean single-column layout

Each template includes:
- Dynamic LaTeX generation based on resume data
- Proper formatting for Overleaf compatibility
- ATS-optimized structure

### 2. **ManualResumeBuilder.jsx** (`frontend/src/components/ManualResumeBuilder.jsx`)
Main component with:
- **Template Selection**: Choose between 3 professional templates
- **Form Sections**:
  - Basic Information (name, title, email, phone, location, summary)
  - Experience (add/remove multiple jobs with descriptions)
  - Education (add/remove degrees)
  - Skills (categorized skills with comma-separated items)
  - Certifications (add/remove certifications)
- **Live Preview**: Quick preview on the right sidebar
- **LaTeX Generation**: Generate Overleaf-ready LaTeX code
- **Copy to Clipboard**: One-click copy for Overleaf paste

### 3. **ResumePreview.jsx** (`frontend/src/components/ResumePreview.jsx`)
Renders a formatted resume preview showing:
- Professional layout matching the selected template
- All resume sections formatted as they'll appear in LaTeX
- Real-time updates as user edits

### 4. **Updated Resumes.jsx** (`frontend/src/pages/Resumes.jsx`)
Enhanced with:
- Tab navigation between "Uploaded Resumes" and "Manual Builder"
- Seamless integration with existing PDF upload functionality
- Maintains all existing features

## Features

### ✨ Template System
- **3 Professional Templates**: Modern, Classic, Minimal
- **One-Click Selection**: Switch templates instantly
- **Template Preview**: See template description before selecting

### 📝 Form Editing
- **Add/Remove Sections**: Dynamically add or remove entries
- **Real-Time Validation**: Form updates instantly
- **Organized Layout**: Grouped by section for clarity
- **Intuitive UI**: Clear labels and placeholders

### 👁️ Live Preview
- **Split View**: Form on left, preview on right
- **Real-Time Updates**: Preview updates as you type
- **Professional Rendering**: Shows exactly how resume will look
- **Responsive Design**: Works on mobile and desktop

### 💾 LaTeX Export
- **Overleaf Ready**: Copy-paste directly into Overleaf
- **ATS Optimized**: Follows ATS-friendly formatting
- **Clean Code**: Well-formatted LaTeX with comments
- **One-Click Copy**: Copy button for easy sharing

### 🎨 UI/UX
- **Dark Theme**: Matches existing Career OS design
- **Smooth Transitions**: Tab switching and modal animations
- **Responsive Layout**: Works on all screen sizes
- **Accessibility**: Proper labels and semantic HTML

## How to Use

### For Users

1. **Navigate to Resume Hub**
   - Click on "AI Resume" in the sidebar
   - You'll see two tabs: "Uploaded Resumes" and "Manual Builder"

2. **Switch to Manual Builder**
   - Click the "Manual Builder" tab
   - You'll see the form editor

3. **Choose a Template**
   - Select from Modern, Classic, or Minimal
   - Each has a description of its style

4. **Fill in Your Information**
   - Enter basic info (name, email, phone, etc.)
   - Add experience entries (click "+ Add" button)
   - Add education entries
   - Add skill categories
   - Add certifications

5. **Preview Your Resume**
   - See live preview on the right sidebar
   - Updates in real-time as you type

6. **Generate LaTeX**
   - Click "Preview & Generate LaTeX" button
   - View formatted resume in preview tab
   - View LaTeX code in code tab

7. **Export to Overleaf**
   - Click "Copy LaTeX" button
   - Go to overleaf.com/project/new
   - Paste the code into main.tex
   - Your resume is ready to edit in Overleaf!

## Technical Details

### Data Structure
```javascript
{
  fullName: string,
  title: string,
  email: string,
  phone: string,
  location: string,
  summary: string,
  experience: [
    {
      position: string,
      company: string,
      startDate: string,
      endDate: string,
      description: string
    }
  ],
  education: [
    {
      degree: string,
      school: string,
      graduationDate: string
    }
  ],
  skills: [
    {
      category: string,
      items: [string]
    }
  ],
  certifications: [string]
}
```

### Component Hierarchy
```
Resumes.jsx (Page)
├── Tab Navigation
├── Uploaded Resumes Tab
│   ├── Upload Form
│   └── Resume List
└── Manual Builder Tab
    └── ManualResumeBuilder.jsx
        ├── Template Selection
        ├── Form Sections
        ├── Quick Preview
        └── LaTeX Modal
            ├── Preview Tab
            │   └── ResumePreview.jsx
            └── Code Tab
```

## Customization

### Adding New Templates
1. Open `ResumeTemplates.js`
2. Add new template to `RESUME_TEMPLATES` object:
```javascript
newTemplate: {
  name: 'Template Name',
  description: 'Template description',
  latex: (data) => `... LaTeX code ...`
}
```
3. Template automatically appears in selector

### Modifying Default Data
Edit `DEFAULT_RESUME_DATA` in `ResumeTemplates.js` to change placeholder values

### Styling
- Uses Tailwind CSS classes
- Dark theme with primary color accents
- Responsive breakpoints: mobile, tablet, desktop

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance
- Lightweight components
- No external API calls for manual builder
- Real-time preview without lag
- Efficient state management with React hooks

## Future Enhancements
- Save resume drafts to database
- Import from LinkedIn
- More template styles
- Custom color schemes
- PDF export directly
- Resume scoring/optimization suggestions
