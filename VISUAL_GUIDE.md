# Manual Resume Builder - Visual Guide

## UI Layout

### Main Page (Before Generation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Manual Resume Builder                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────┐  ┌──────────────────────┐   │
│  │ LEFT: Form Editor                    │  │ RIGHT: Quick Preview │   │
│  │                                      │  │                      │   │
│  │ ┌─ Choose Template ─────────────┐   │  │ ┌──────────────────┐ │   │
│  │ │ [Modern] [Classic] [Minimal]  │   │  │ │ Your Name        │ │   │
│  │ └────────────────────────────────┘   │  │ │ email@example.com│ │   │
│  │                                      │  │ │ ─────────────────│ │   │
│  │ ┌─ Basic Information ───────────┐   │  │ │ Summary: ...     │ │   │
│  │ │ Full Name: [_____________]    │   │  │ │ Experience: ...  │ │   │
│  │ │ Title: [_________________]    │   │  │ │                  │ │   │
│  │ │ Email: [________________]     │   │  │ │ (Live updates)   │ │   │
│  │ │ Phone: [________________]     │   │  │ └──────────────────┘ │   │
│  │ │ Location: [_____________]     │   │  │                      │   │
│  │ │ Summary: [______________]     │   │  │                      │   │
│  │ └────────────────────────────────┘   │  │                      │   │
│  │                                      │  │                      │   │
│  │ ┌─ Experience ──────────────────┐   │  │                      │   │
│  │ │ [+ Add]                       │   │  │                      │   │
│  │ │ ┌─ Entry 1 ────────────────┐ │   │  │                      │   │
│  │ │ │ Position: [___________] [X]│   │  │                      │   │
│  │ │ │ Company: [____________]   │ │   │  │                      │   │
│  │ │ │ Dates: [___] to [___]     │ │   │  │                      │   │
│  │ │ │ Description: [_______]    │ │   │  │                      │   │
│  │ │ └───────────────────────────┘ │   │  │                      │   │
│  │ └────────────────────────────────┘   │  │                      │   │
│  │                                      │  │                      │   │
│  │ ┌─ Education ───────────────────┐   │  │                      │   │
│  │ │ [+ Add]                       │   │  │                      │   │
│  │ │ ┌─ Entry 1 ────────────────┐ │   │  │                      │   │
│  │ │ │ Degree: [____________] [X]│   │  │                      │   │
│  │ │ │ School: [____________]    │ │   │  │                      │   │
│  │ │ │ Date: [________________]  │ │   │  │                      │   │
│  │ │ └───────────────────────────┘ │   │  │                      │   │
│  │ └────────────────────────────────┘   │  │                      │   │
│  │                                      │  │                      │   │
│  │ ┌─ Skills ──────────────────────┐   │  │                      │   │
│  │ │ [+ Add]                       │   │  │                      │   │
│  │ │ ┌─ Entry 1 ────────────────┐ │   │  │                      │   │
│  │ │ │ Category: [___________] [X]│   │  │                      │   │
│  │ │ │ Items: [______________]   │ │   │  │                      │   │
│  │ │ └───────────────────────────┘ │   │  │                      │   │
│  │ └────────────────────────────────┘   │  │                      │   │
│  │                                      │  │                      │   │
│  │ ┌─ Certifications ──────────────┐   │  │                      │   │
│  │ │ [+ Add]                       │   │  │                      │   │
│  │ │ [Cert 1] [X]                  │   │  │                      │   │
│  │ └────────────────────────────────┘   │  │                      │   │
│  │                                      │  │                      │   │
│  │ [Preview & Generate LaTeX]           │  │                      │   │
│  │                                      │  │                      │   │
│  └──────────────────────────────────────┘  └──────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Preview Modal (After Generation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Resume Preview                                                          │
│ [Download PDF] [Copy LaTeX] [Back to Edit]                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [Preview Tab] [LaTeX Code Tab] [↻ Regenerate Button]                  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │                                                                     ││
│ │                    FORMATTED RESUME PREVIEW                        ││
│ │                                                                     ││
│ │                         Your Name                                  ││
│ │                    Professional Title                              ││
│ │              email@example.com | +1 (555) 123-4567                ││
│ │                                                                     ││
│ │ ─────────────────────────────────────────────────────────────────  ││
│ │                                                                     ││
│ │ PROFESSIONAL SUMMARY                                               ││
│ │ Your professional summary text...                                  ││
│ │                                                                     ││
│ │ EXPERIENCE                                                          ││
│ │ Job Title | Company | Jan 2023 – Present                          ││
│ │ Description of responsibilities and achievements...                ││
│ │                                                                     ││
│ │ EDUCATION                                                           ││
│ │ Bachelor of Science | University Name | May 2023                  ││
│ │                                                                     ││
│ │ SKILLS                                                              ││
│ │ Programming Languages: JavaScript, Python, Go                      ││
│ │ Tools & Platforms: Docker, Kubernetes, AWS                        ││
│ │                                                                     ││
│ │ CERTIFICATIONS                                                      ││
│ │ • AWS Certified Solutions Architect                                ││
│ │ • Google Cloud Professional Data Engineer                          ││
│ │                                                                     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### LaTeX Code Tab (Editable)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Resume Preview                                                          │
│ [Download PDF] [Copy LaTeX] [Back to Edit]                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [Preview Tab] [LaTeX Code Tab] [↻ Regenerate Button]                  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ \documentclass[11pt]{article}                                       ││
│ │ \usepackage[margin=0.5in]{geometry}                                 ││
│ │ \usepackage{xcolor}                                                 ││
│ │ \usepackage{fontawesome5}                                           ││
│ │ \usepackage{hyperref}                                               ││
│ │                                                                     ││
│ │ \definecolor{accentcolor}{RGB}{52, 152, 219}                       ││
│ │                                                                     ││
│ │ \pagestyle{empty}                                                   ││
│ │                                                                     ││
│ │ \begin{document}                                                    ││
│ │                                                                     ││
│ │ % Header                                                            ││
│ │ \begin{center}                                                      ││
│ │ {\Large \textbf{Your Name}}\\                                       ││
│ │ \vspace{0.2cm}                                                      ││
│ │ \textcolor{accentcolor}{Professional Title}\\                       ││
│ │ \vspace{0.2cm}                                                      ││
│ │ {\small email@example.com | +1 (555) 123-4567 | City, State}       ││
│ │ \end{center}                                                        ││
│ │                                                                     ││
│ │ ... (more LaTeX code)                                               ││
│ │                                                                     ││
│ │ \end{document}                                                      ││
│ │                                                                     ││
│ │ 💡 Tip: Edit the LaTeX code directly for advanced customization.   ││
│ │    Changes will be reflected when you copy or download.             ││
│ │                                                                     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Button States & Actions

### Main Form Buttons

```
┌─────────────────────────────────────────┐
│ Template Selection                      │
├─────────────────────────────────────────┤
│ [Modern]  [Classic]  [Minimal]          │
│ (Selected: Modern - highlighted)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Add/Remove Buttons                      │
├─────────────────────────────────────────┤
│ [+ Add] (Primary color)                 │
│ [X] (Red - delete)                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Generate Button                         │
├─────────────────────────────────────────┤
│ [Preview & Generate LaTeX]              │
│ (Gradient: Primary to Blue)             │
└─────────────────────────────────────────┘
```

### Modal Buttons

```
┌─────────────────────────────────────────┐
│ Action Buttons                          │
├─────────────────────────────────────────┤
│ [Download PDF]  [Copy LaTeX]  [Back]    │
│ (Blue)          (Green)        (Gray)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Tab Buttons                             │
├─────────────────────────────────────────┤
│ [Preview] [LaTeX Code] [↻ Regenerate]   │
│ (Active: Primary color)                 │
└─────────────────────────────────────────┘
```

---

## Color Scheme

### Dark Theme (Career OS)

```
Background:     #0F172A (Dark blue-gray)
Text:           #FFFFFF (White)
Primary:        #7C3AED (Purple)
Secondary:      #3B82F6 (Blue)
Success:        #10B981 (Green)
Warning:        #F59E0B (Amber)
Danger:         #EF4444 (Red)
Muted:          #6B7280 (Gray)

Glass Effect:   rgba(255, 255, 255, 0.05)
Border:         rgba(255, 255, 255, 0.1)
```

---

## Responsive Breakpoints

### Desktop (1920px+)
```
┌─────────────────────────────────────────────────────────┐
│ Form (2/3 width) │ Preview (1/3 width, sticky)         │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────────────────────────┐
│ Form (full width)                                       │
├─────────────────────────────────────────────────────────┤
│ Preview (full width, below form)                        │
└─────────────────────────────────────────────────────────┘
```

### Mobile (375px - 767px)
```
┌─────────────────────────────────────────┐
│ Form (full width)                       │
├─────────────────────────────────────────┤
│ Preview (full width, below form)        │
└─────────────────────────────────────────┘
```

---

## Form Field Types

### Text Input
```
┌─────────────────────────────────────────┐
│ Full Name                               │
│ [_________________________________]     │
│ (bg: white/5, border: white/10)         │
└─────────────────────────────────────────┘
```

### Textarea
```
┌─────────────────────────────────────────┐
│ Professional Summary                    │
│ [_________________________________]     │
│ [_________________________________]     │
│ [_________________________________]     │
│ (3 rows, resizable: none)               │
└─────────────────────────────────────────┘
```

### Select/Dropdown (Template)
```
┌─────────────────────────────────────────┐
│ [Modern]  [Classic]  [Minimal]          │
│ (Button-style, not native select)       │
└─────────────────────────────────────────┘
```

---

## Animation & Transitions

### Hover Effects
```
Button:     opacity 0.8 → 1.0 (smooth)
Input:      border-color change (smooth)
Card:       shadow increase (smooth)
```

### Tab Switching
```
Fade in/out: 200ms ease-in-out
Slide:       Not used (instant)
```

### Modal Opening
```
Fade in:    200ms ease-in-out
Scale:      Not used (instant)
Backdrop:   Blur effect
```

---

## Accessibility Features

### Keyboard Navigation
```
Tab:        Move between fields
Shift+Tab:  Move backwards
Enter:      Submit form / Click button
Escape:     Close modal
```

### Screen Reader Support
```
Labels:     All inputs have labels
Buttons:    Clear button text
Icons:      Icon + text combination
Headings:   Semantic h1, h2, h3
```

### Color Contrast
```
Text on background:     WCAG AA compliant
Buttons:                WCAG AA compliant
Links:                  WCAG AA compliant
```

---

## Loading States

### PDF Generation
```
Before:     [Download PDF]
During:     [⏳ Generating PDF...]
After:      [Download PDF] (file downloads)
```

### LaTeX Generation
```
Before:     [Preview & Generate LaTeX]
During:     [⏳ Generating LaTeX...]
After:      Modal opens with preview
```

---

## Error States

### Form Validation
```
Empty field:    Border turns red
Invalid email:  Border turns red
Error message:  Red text below field
```

### PDF Generation Error
```
Error:          Alert dialog
Message:        "Failed to generate PDF"
Action:         Retry button
```

---

## Success States

### Copy to Clipboard
```
Before:     [Copy LaTeX]
After:      Alert: "LaTeX code copied!"
Duration:   2 seconds
```

### PDF Download
```
Before:     [Download PDF]
After:      File downloads
Filename:   FirstName_LastName_Resume.pdf
```

---

## Mobile Optimizations

### Touch Targets
```
Minimum size:   44x44 pixels
Spacing:        8px between buttons
Padding:        Increased for touch
```

### Responsive Text
```
Desktop:    16px base
Tablet:     14px base
Mobile:     14px base
```

### Responsive Layout
```
Desktop:    2-column (form + preview)
Tablet:     1-column (stacked)
Mobile:     1-column (stacked)
```

---

## Performance Indicators

### Load Time
```
< 100ms:    Component loads
< 200ms:    LaTeX generates
< 2s:       PDF generates
```

### Smooth Interactions
```
Form input:     < 50ms response
Preview update: < 100ms
Button click:   Instant feedback
```

---

**Visual Guide Complete!**

This guide shows the complete UI/UX layout and design of the Manual Resume Builder.
