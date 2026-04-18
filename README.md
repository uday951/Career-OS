<div align="center">

<img src="https://img.shields.io/badge/Career%20OS%20AI-Full%20Stack%20SaaS-7C3AED?style=for-the-badge&logo=sparkles&logoColor=white" />
<img src="https://img.shields.io/badge/Powered%20By-Gemini%202.0%20Flash-06B6D4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Stack-MERN%20%2B%20OpenRouter-10B981?style=for-the-badge&logo=mongodb&logoColor=white" />

<br /><br />

# Career OS AI — Intelligent Career Management Platform

**A production-grade, AI-powered career platform built to replace spreadsheets, generic job boards, and career coaches. 9 intelligent features. Real data. Real outcomes.**

[🚀 Live Demo](#) · [📸 Screenshots](#screenshots) · [⚙️ Setup](#setup) · [🧠 Features](#features)

</div>

---

## 🧠 What Is This?

**Career OS AI** is a full-stack SaaS platform that transforms the chaotic job search process into an **intelligent, data-driven system**. Instead of blindly applying and waiting, users get:

- AI-generated cover letters and LaTeX resumes tailored per job
- Real-time ATS compatibility scoring
- Pre-application hiring outcome simulations
- Live job market intelligence aligned to your profile
- Personalized growth roadmaps and weekly performance reports

This isn't a CRUD app. It's an **AI operating system for your career**.

---

## 📸 Screenshots

### 🏠 Career Dashboard
> Real-time pipeline overview — total applications, average AI match rate, ATS scores, rejection rate, and quick actions. All in one command center.

![Career Dashboard](frontend/public/Screenshot%202026-04-18%20124557.png)

---

### 📄 AI Resume Hub
> Upload your PDF resume. AI extracts your full profile — skills, work history, education, and projects — and computes an ATS base score. Auto-generates a LaTeX-formatted Overleaf resume in one click.

![AI Resume Hub](frontend/public/Screenshot%202026-04-18%20124606.png)

---

### 🔍 Smart Job Discovery
> Search live jobs from 50+ portals (LinkedIn, Indeed, Glassdoor) via JSearch. Filter by job type (Full Time, Part Time, Contract, Internship), location, and remote preference. Save and generate tailored materials in one click.

![Smart Job Discovery](frontend/public/Screenshot%202026-04-18%20124632.png)

---

### 🎯 Job Pipeline & AI Tailoring
> Add jobs to your pipeline. Get an AI match percentage against your resume, see missing skills, generate a tailored cover letter, and enter the Application Hub for deep research, interview prep, and company intelligence.

![Job Pipeline](frontend/public/Screenshot%202026-04-18%20124647.png)

---

### 🤖 AI Career Coach
> A context-aware chat interface powered by Gemini 2.0 Flash. Reads your parsed resume, your pipeline, your ATS score, and your match rate before answering. Gives hyper-personalized advice — no generic tips.

![AI Coach](frontend/public/Screenshot%202026-04-18%20124656.png)

---

### 🛡️ Shadow Application Mode
> Before you apply, simulate the hiring outcome. Paste a job description and get: selection probability, rejection probability, top 3 rejection risks with severity ratings, keyword gap analysis, ATS-optimized headline, and 4 improvement actions with effort levels and impact estimates.

![Shadow Mode](frontend/public/Screenshot%202026-04-18%20124707.png)

---

### 🔄 Reverse Recruiter Mode
> Flip the system. Instead of you applying to jobs, AI scans live job listings and finds which companies should be hiring *you*. Ranked by fit score, with per-job strategy, competitive edge, outreach subject line, and direct apply link. Filter by location, job type, and remote preference.

![Reverse Recruiter](frontend/public/Screenshot%202026-04-18%20124717.png)

---

### 📈 Career Growth Engine
> Enter a target role (e.g., "Senior AI Engineer" or "Staff Backend Engineer at FAANG"). AI analyzes your resume and generates a phased roadmap: skill gaps ranked by market demand, week-by-week learning plan, portfolio-worthy project ideas with tech stacks, and curated learning resources.

![Growth Engine](frontend/public/Screenshot%202026-04-18%20124727.png)

---

### 📊 Weekly Career Report
> Every week, the backend aggregates real MongoDB data — application counts, match rate delta, response rate, rejection patterns — then sends verified numbers to AI for narrative analysis. Grade (A–F), momentum indicator, wins, concerns, pattern analysis, and ranked next-week priorities.

![Weekly Report](frontend/public/Screenshot%202026-04-18%20124736.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 **Career Dashboard** | Real-time pipeline stats, match rates, ATS scores, quick actions |
| 📄 **AI Resume Hub** | PDF upload → skill extraction → ATS scoring → LaTeX resume generation |
| 🔍 **Smart Job Discovery** | Live jobs from 50+ portals with location, type, and remote filters |
| 🎯 **Job Pipeline** | Full application lifecycle with AI match %, cover letter generation |
| 🤖 **AI Coach** | Context-aware chat using your actual resume and pipeline data |
| 🛡️ **Shadow Application Mode** | Pre-application hiring simulation with 6-dimension scoring |
| 🔄 **Reverse Recruiter** | AI inverts the search — finds jobs that should hire *you* |
| 📈 **Career Growth Engine** | Personalized skill roadmap to reach any target role |
| 📊 **Weekly Career Report** | Data-driven weekly performance analysis with AI narrative |

---

## 🏗️ Architecture

```
career-os-ai/
├── backend/                    # Node.js + Express (ESM)
│   ├── controllers/
│   │   ├── aiController.js         # Resume parse, LaTeX, cover letter
│   │   ├── intelligenceController.js  # Shadow + Reverse Recruiter
│   │   └── growthController.js     # Growth Engine + Weekly Report
│   ├── services/
│   │   ├── aiService.js            # OpenRouter base wrapper
│   │   ├── intelligenceService.js  # Shadow/Reverse AI prompts
│   │   ├── growthService.js        # Growth/Report AI prompts
│   │   └── jobSearchService.js     # JSearch (RapidAPI) integration
│   ├── routes/                     # All Express routes (auth, jobs, ai, coach, shadow, reverse, growth, report)
│   ├── models/                     # Mongoose schemas (User, Resume, Application, Job)
│   └── server.js
│
└── frontend/                   # React + Tailwind (Vite)
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Resumes.jsx
        │   ├── JobDiscovery.jsx
        │   ├── JobTracker.jsx
        │   ├── AICoach.jsx
        │   ├── ShadowMode.jsx
        │   ├── ReverseRecruiter.jsx
        │   ├── GrowthEngine.jsx
        │   └── WeeklyReport.jsx
        └── store/useStore.js       # Zustand global state
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express (ESM modules) |
| **Database** | MongoDB + Mongoose |
| **AI Engine** | OpenRouter API → Gemini 2.0 Flash |
| **Job Search** | JSearch via RapidAPI (50+ portals) |
| **Auth** | JWT + bcrypt |
| **Resume Parse** | PDF-parse + AI extraction |
| **LaTeX Resume** | OpenRouter AI-generated Overleaf-compatible LaTeX |
| **State Management** | Zustand |

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- MongoDB URI (Atlas or local)
- [OpenRouter API Key](https://openrouter.ai) (free tier available)
- [RapidAPI Key](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) — for Job Discovery and Reverse Recruiter

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ai-applyer.git
cd ai-applyer
```

### 2. Configure environment variables
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
RAPIDAPI_KEY=your_rapidapi_key
PORT=5000
```

### 3. Install and run backend
```bash
cd backend
npm install
npm run dev
```

### 4. Install and run frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at → `http://localhost:5173`  
API runs at → `http://localhost:5000`

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/resumes` | List user resumes |
| `POST` | `/api/ai/parse-resume` | Parse PDF → extract skills |
| `POST` | `/api/ai/analyze-match` | Resume vs job match scoring |
| `POST` | `/api/ai/cover-letter` | Generate tailored cover letter |
| `POST` | `/api/ai/latex-resume` | Generate LaTeX resume |
| `GET` | `/api/coach/profile` | Fetch resume profile for AI Coach |
| `POST` | `/api/coach/chat` | AI Coach chat (context-aware) |
| `POST` | `/api/shadow/analyze` | Shadow Application Mode simulation |
| `POST` | `/api/reverse/jobs` | Reverse Recruiter — live job matching |
| `POST` | `/api/growth/plan` | Career Growth Engine roadmap |
| `GET` | `/api/report/weekly` | Weekly Career Report (AI + metrics) |
| `GET` | `/api/report/metrics` | Raw DB metrics only (instant) |
| `PATCH` | `/api/jobs/application/:id/status` | Manual application status update |

---

## 🧩 Key Engineering Decisions

### Hybrid AI Architecture
The Weekly Career Report uses a **strict hybrid approach**: the backend computes all metrics from MongoDB (application counts, match rates, response rates, rejection patterns), then sends **only verified numbers** to AI. The AI is explicitly forbidden from guessing or estimating — it only provides narrative and analysis. This prevents hallucination.

### Structured JSON AI Outputs
All AI features (Shadow Mode, Reverse Recruiter, Growth Engine, Weekly Report) use strict JSON schema prompts. The AI returns machine-readable structured data that the frontend renders component-by-component — not free-form text.

### Context-Aware AI Coach
The AI Coach fetches the user's latest parsed resume from MongoDB before every response. The system prompt is dynamically built with the user's actual skills, work history, education, projects, and live pipeline metrics. The AI knows the user's first name, company, ATS score, and application count.

### Resume-Driven Intelligence
Shadow Mode and Reverse Recruiter automatically detect and use the user's latest parsed resume. No manual input required — the system knows who you are.

---

## 📁 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter key (Gemini 2.0 Flash) |
| `RAPIDAPI_KEY` | ✅ for job search | RapidAPI key for JSearch |
| `PORT` | Optional | Default: 5000 |

---

## 🙋 About the Developer

Built by **Uday Kiran** — a Full Stack Developer specializing in AI-integrated MERN applications.

- 💻 Stack: React, Node.js, Express, MongoDB, Tailwind CSS
- 🤖 AI: OpenRouter (Gemini, Claude, GPT), prompt engineering, structured JSON generation
- 📦 Tooling: Vite, Zustand, Mongoose, JWT, PDF-parse

> This project demonstrates production-level thinking: real data pipelines, context-aware AI, structured output engineering, and a premium UI that rivals funded SaaS products.

---

<div align="center">

**⭐ Star this repo if it impressed you**

[![GitHub stars](https://img.shields.io/github/stars/your-username/ai-applyer?style=social)](https://github.com/your-username/ai-applyer)

</div>
