import Portfolio from '../models/Portfolio.js';
import ResumeSession from '../models/ResumeSession.js';
import { askAI } from '../services/aiService.js';
import { deployPortfolioToVercel } from '../services/vercelService.js';
import { compileHTMLPDF } from '../services/pdfService.js';

function ensureAbsoluteUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}


/**
 * AI-powered parsing, content rewrite, personal branding, design mapping, and scoring.
 * Uses DeepSeek API to transform raw resume JSON into a premium brand blueprint.
 */
export async function generatePortfolio(req, res, next) {
  try {
    const { sessionId } = req.body;
    let resumeData = null;

    if (sessionId) {
      const session = await ResumeSession.findOne({ _id: sessionId, user_id: req.user._id });
      if (session && session.originalResume && session.originalResume.parsedJSON) {
        resumeData = session.originalResume.parsedJSON;
      }
    }

    // Fallback: search for any existing resume session for this user
    if (!resumeData) {
      const latestSession = await ResumeSession.findOne({ user_id: req.user._id }).sort({ createdAt: -1 });
      if (latestSession && latestSession.originalResume && latestSession.originalResume.parsedJSON) {
        resumeData = latestSession.originalResume.parsedJSON;
      }
    }

    if (!resumeData) {
      res.status(400);
      throw new Error('Please upload a resume or run Resume Studio parsing first to populate base profile details.');
    }

    console.log('Running DeepSeek Portfolio Brand analysis...');

    const systemPrompt = `You are a world-class executive recruiter, developer relations expert, and premium web designer.
Your goal is to parse, analyze, and dramatically elevate the candidate's resume JSON into an elite personal brand kit and a design blueprint.

INSTRUCTIONS:
1. Profession Analysis: Automatically categorize the candidate into one of these 10 professions:
   - "Software Engineer", "AI Engineer", "Frontend Developer", "Full Stack Developer", "Product Designer", "Data Scientist", "Cybersecurity Engineer", "Student", "Entrepreneur", "Other".
2. Archetype Mapping: Select the single most suitable archetype from this list of 30 premium styles:
   - "Apple Minimal", "Stripe Modern", "Linear Inspired", "Vercel Inspired", "Luxury Dark", "Glassmorphism", "AI Futuristic", "Cyberpunk", "Startup Founder", "Developer Bento Grid", "Designer Showcase", "Enterprise Professional", "Creative Agency", "Modern Resume", "Interactive Dashboard", "Refined Serif", "Minimalist Monochrome", "Retro Terminal", "3D Isometric Portfolio", "Clean Corporate", "Neon Glow Space", "Bold Typographer", "Editorial Magazine", "Brutalist Grid", "Futuristic Monolithic", "Gradient Tech Aura", "Classic Prestige", "Quiet Luxury", "High Tech Developer", "Minimalist Luxury".
3. Custom HSL Design Tokens: Create a professional, non-generic HSL color palette tailored to their profession and archetype. Return colors as space-separated HSL values (e.g. "224 25% 4%" for background, etc. - DO NOT wrap in "hsl()"). Also select a heading and body font: "font-sans" | "font-mono" | "font-serif" | "font-playfair" | "font-outfit".
4. Component Layout styles: Select layout styles for each section:
   - heroStyle: "hero-1" (Stripe Grid) | "hero-2" (Vercel Minimal) | "hero-3" (Apple Showcase) | "hero-4" (Cyber Terminal) | "hero-5" (Luxury Serif) | "hero-6" (Bento Grid Intro) | "hero-7" (Side Split) | "hero-8" (Typewriter Console) | "hero-9" (Radial Orbit) | "hero-10" (Floating Cards)
   - projectsStyle: "bento" | "masonry" | "showcase"
   - skillsStyle: "interactive" | "progress" | "cloud"
   - aboutStyle: "timeline" | "story" | "overview"
   - contactStyle: "form" | "social" | "cta"
   - navigationStyle: "floating" | "dock" | "sidebar"
   - sectionOrder: Specify custom layout order containing: ["navigation", "hero", "about", "skills", "projects", "contact"]
5. Professional Text Rewrite:
   - Enhance the summary and experience bullet points to be punchy, result-oriented, and recruiter-friendly.
   - For every project, structure it as a mini case study by explicitly breaking out the "problem", "solution", and "results". If these are missing from the resume, deduce realistic, technically deep details based on the project technologies.

JSON SCHEMA TO RETURN:
{
  "profession": "One of 10 categories",
  "archetype": "One of 30 styles",
  "design_system": {
    "colors": {
      "bg": "HSL color (e.g. '224 25% 4%')",
      "surface": "HSL color",
      "text": "HSL color",
      "primary": "HSL color",
      "accent": "HSL color",
      "border": "HSL color"
    },
    "typography": {
      "headingFont": "font-sans | font-mono | font-serif | font-playfair | font-outfit",
      "bodyFont": "font-sans | font-mono | font-serif | font-playfair | font-outfit"
    }
  },
  "layout_components": {
    "heroStyle": "hero-1 | hero-2 | hero-3 | hero-4 | hero-5 | hero-6 | hero-7 | hero-8 | hero-9 | hero-10",
    "projectsStyle": "bento | masonry | showcase",
    "skillsStyle": "interactive | progress | cloud",
    "aboutStyle": "timeline | story | overview",
    "contactStyle": "form | social | cta",
    "navigationStyle": "floating | dock | sidebar",
    "sectionOrder": ["navigation", "hero", "about", "skills", "projects", "contact"]
  },
  "extracted_data": {
    "fullName": "Candidate Full Name",
    "title": "Professional Title / Headline",
    "email": "Email",
    "phone": "Phone",
    "location": "City, State",
    "linkedin": "LinkedIn Link",
    "github": "GitHub Link",
    "summary": "Elevated summary paragraph",
    "experience": [
      {
        "position": "Title",
        "company": "Company",
        "startDate": "Start Date",
        "endDate": "End Date or Present",
        "description": "Multi-line bulleted achievement list"
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "description": "Engaging high-level summary",
        "technologies": ["React", "TailwindCSS"],
        "link": "Demo or Repo link",
        "problem": "What was the technical challenge/friction?",
        "solution": "How did you solve it technically?",
        "results": "What was the metric or outcome?"
      }
    ],
    "skills": [
      {
        "category": "Languages / Frameworks",
        "items": ["Skill 1", "Skill 2"]
      }
    ],
    "education": [
      {
        "school": "University",
        "degree": "B.S. in Computer Science",
        "graduationDate": "Graduation Date"
      }
    ],
    "achievements": ["Key award or milestone"],
    "certifications": ["Certification name / institution"]
  },
  "personal_brand": {
    "bio": "3-paragraph personal story",
    "tagline": "Sleek 1-sentence tagline",
    "pitch": "30-second elevator pitch",
    "linkedin_about": "Full LinkedIn Summary text",
    "github_readme": "Markdown text for GitHub README profile"
  },
  "scoring": {
    "portfolio_quality": 85,
    "recruiter_appeal": 88,
    "personal_brand_score": 90,
    "technical_credibility": 84,
    "visual_quality": 92
  }
}

Return ONLY the raw JSON object. Do not wrap in markdown fences.`;

    const userPrompt = `INPUT RESUME DATA:\n${JSON.stringify(resumeData, null, 2)}\n\nGenerate the complete design and copy blueprint.`;
    
    const responseJson = await askAI(systemPrompt, userPrompt, true);

    // Normalize links
    if (responseJson.extracted_data) {
      if (responseJson.extracted_data.github) {
        responseJson.extracted_data.github = ensureAbsoluteUrl(responseJson.extracted_data.github);
      }
      if (responseJson.extracted_data.linkedin) {
        responseJson.extracted_data.linkedin = ensureAbsoluteUrl(responseJson.extracted_data.linkedin);
      }
      if (responseJson.extracted_data.projects) {
        responseJson.extracted_data.projects.forEach(p => {
          if (p.link) p.link = ensureAbsoluteUrl(p.link);
        });
      }
    }

    // Save or update portfolio record
    let portfolio = await Portfolio.findOne({ user_id: req.user._id });
    
    // Choose starting theme based on DeepSeek archetype
    let startTheme = 'Theme 1: Vercel';
    const archetype = (responseJson.archetype || '').toLowerCase();
    if (archetype.includes('linear')) startTheme = 'Theme 2: Linear';
    else if (archetype.includes('apple') || archetype.includes('minimal')) startTheme = 'Theme 3: Apple';
    else if (archetype.includes('luxury') || archetype.includes('serif')) startTheme = 'Theme 4: Minimal Luxury';
    else if (archetype.includes('engineer') || archetype.includes('ai') || archetype.includes('futuristic')) startTheme = 'Theme 5: Modern AI Engineer';
    else if (archetype.includes('founder') || archetype.includes('corporate') || archetype.includes('enterprise')) startTheme = 'Theme 6: Startup Founder';
    else if (archetype.includes('creative') || archetype.includes('agency') || archetype.includes('cyberpunk')) startTheme = 'Theme 7: Creative Developer';

    if (responseJson.layout_components && responseJson.layout_components.heroStyle === 'hero-4') {
      responseJson.layout_components.heroStyle = 'hero-2';
    }

    const portfolioData = {
      user_id: req.user._id,
      resume_id: sessionId || null,
      extracted_data: responseJson.extracted_data,
      personal_brand: responseJson.personal_brand,
      scoring: responseJson.scoring,
      design_direction: responseJson.archetype + ' Style',
      selected_theme: startTheme,
      profession: responseJson.profession || 'Software Engineer',
      archetype: responseJson.archetype || 'Vercel Inspired',
      design_system: responseJson.design_system || {
        colors: {
          bg: '224 25% 4%',
          surface: '224 25% 8%',
          text: '210 20% 98%',
          primary: '262 83% 58%',
          accent: '187 92% 45%',
          border: '224 20% 14%'
        },
        typography: {
          headingFont: 'font-sans',
          bodyFont: 'font-sans'
        }
      },
      layout_components: responseJson.layout_components || {
        heroStyle: 'hero-1',
        projectsStyle: 'showcase',
        skillsStyle: 'interactive',
        aboutStyle: 'story',
        contactStyle: 'form',
        navigationStyle: 'floating',
        sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
      },
      customization: {
        custom_tagline: responseJson.personal_brand.tagline,
        custom_bio: responseJson.personal_brand.bio,
        custom_pitch: responseJson.personal_brand.pitch,
        custom_projects: (responseJson.extracted_data.projects || []).map(p => ({
          ...p,
          link: ensureAbsoluteUrl(p.link)
        })),
        custom_skills: responseJson.extracted_data.skills,
        social_links: {
          github: ensureAbsoluteUrl(responseJson.extracted_data.github || ''),
          linkedin: ensureAbsoluteUrl(responseJson.extracted_data.linkedin || ''),
          twitter: '',
          portfolio: ''
        },
        visible_sections: {
          blog: false,
          testimonials: false,
          githubActivity: false,
          techStackVisual: true
        },
        testimonials: [
          { name: 'Sarah Jenkins', role: 'VP of Product', company: 'Stripe', text: 'An exceptional engineer who bridges complex backend algorithms with elegant UI details.', avatar: '' },
          { name: 'Marcus Chen', role: 'Staff AI Architect', company: 'Linear', text: 'Highly disciplined, proactive, and builds features that are incredibly scalable.', avatar: '' }
        ],
        blog_posts: [
          { title: 'Designing for Performance on the Edge', excerpt: 'How we optimized page speeds by 65% using Next.js middleware and CDN replication.', date: 'Jun 12, 2026', readTime: '5 min read', content: 'Detailed write-up on edge caching, route segments, and visual rendering optimization...' }
        ]
      }
    };

    if (portfolio) {
      portfolio.extracted_data = portfolioData.extracted_data;
      portfolio.personal_brand = portfolioData.personal_brand;
      portfolio.scoring = portfolioData.scoring;
      portfolio.design_direction = portfolioData.design_direction;
      portfolio.profession = portfolioData.profession;
      portfolio.archetype = portfolioData.archetype;
      portfolio.design_system = portfolioData.design_system;
      portfolio.layout_components = portfolioData.layout_components;
      portfolio.customization = portfolioData.customization;
      await portfolio.save();
    } else {
      portfolio = await Portfolio.create(portfolioData);
    }

    res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches the user's active portfolio data
 */
export async function getPortfolio(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ user_id: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio blueprint not found. Generate one first!' });
    }
    res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Saves customized overrides from the Live Editor panel
 */
export async function updatePortfolio(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ user_id: req.user._id });
    if (!portfolio) {
      res.status(404);
      throw new Error('Portfolio not found');
    }

    const { selected_theme, customization, layout_components, design_system } = req.body;
    
    const themePresets = {
      'Theme 1: Vercel': {
        design_system: {
          colors: {
            bg: '0 0% 0%',
            surface: '0 0% 7%',
            text: '0 0% 100%',
            primary: '0 0% 100%',
            accent: '0 0% 63%',
            border: '0 0% 15%'
          },
          typography: {
            headingFont: 'font-sans',
            bodyFont: 'font-mono'
          }
        },
        layout_components: {
          heroStyle: 'hero-2',
          projectsStyle: 'showcase',
          skillsStyle: 'interactive',
          aboutStyle: 'story',
          contactStyle: 'form',
          navigationStyle: 'floating',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 2: Linear': {
        design_system: {
          colors: {
            bg: '248 100% 3%',
            surface: '248 30% 8%',
            text: '0 0% 98%',
            primary: '260 100% 65%',
            accent: '280 100% 70%',
            border: '250 20% 15%'
          },
          typography: {
            headingFont: 'font-outfit',
            bodyFont: 'font-sans'
          }
        },
        layout_components: {
          heroStyle: 'hero-1',
          projectsStyle: 'bento',
          skillsStyle: 'interactive',
          aboutStyle: 'timeline',
          contactStyle: 'cta',
          navigationStyle: 'floating',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 3: Apple': {
        design_system: {
          colors: {
            bg: '0 0% 96%',
            surface: '0 0% 100%',
            text: '0 0% 10%',
            primary: '0 0% 0%',
            accent: '210 100% 50%',
            border: '0 0% 90%'
          },
          typography: {
            headingFont: 'font-outfit',
            bodyFont: 'font-sans'
          }
        },
        layout_components: {
          heroStyle: 'hero-3',
          projectsStyle: 'showcase',
          skillsStyle: 'interactive',
          aboutStyle: 'story',
          contactStyle: 'form',
          navigationStyle: 'floating',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 4: Minimal Luxury': {
        design_system: {
          colors: {
            bg: '20 15% 4%',
            surface: '20 10% 8%',
            text: '30 20% 95%',
            primary: '30 30% 60%',
            accent: '40 20% 70%',
            border: '20 10% 12%'
          },
          typography: {
            headingFont: 'font-playfair',
            bodyFont: 'font-serif'
          }
        },
        layout_components: {
          heroStyle: 'hero-5',
          projectsStyle: 'showcase',
          skillsStyle: 'interactive',
          aboutStyle: 'story',
          contactStyle: 'cta',
          navigationStyle: 'floating',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 5: Modern AI Engineer': {
        design_system: {
          colors: {
            bg: '220 30% 3%',
            surface: '220 20% 7%',
            text: '180 100% 95%',
            primary: '180 100% 50%',
            accent: '200 100% 50%',
            border: '180 40% 12%'
          },
          typography: {
            headingFont: 'font-mono',
            bodyFont: 'font-sans'
          }
        },
        layout_components: {
          heroStyle: 'hero-2',
          projectsStyle: 'masonry',
          skillsStyle: 'cloud',
          aboutStyle: 'overview',
          contactStyle: 'social',
          navigationStyle: 'dock',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 6: Startup Founder': {
        design_system: {
          colors: {
            bg: '230 20% 5%',
            surface: '230 15% 9%',
            text: '0 0% 98%',
            primary: '220 90% 56%',
            accent: '160 84% 39%',
            border: '230 15% 15%'
          },
          typography: {
            headingFont: 'font-outfit',
            bodyFont: 'font-sans'
          }
        },
        layout_components: {
          heroStyle: 'hero-6',
          projectsStyle: 'showcase',
          skillsStyle: 'interactive',
          aboutStyle: 'timeline',
          contactStyle: 'form',
          navigationStyle: 'floating',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      },
      'Theme 7: Creative Developer': {
        design_system: {
          colors: {
            bg: '280 40% 4%',
            surface: '280 25% 8%',
            text: '300 100% 98%',
            primary: '325 100% 48%',
            accent: '260 100% 68%',
            border: '280 20% 15%'
          },
          typography: {
            headingFont: 'font-outfit',
            bodyFont: 'font-sans'
          }
        },
        layout_components: {
          heroStyle: 'hero-9',
          projectsStyle: 'masonry',
          skillsStyle: 'cloud',
          aboutStyle: 'timeline',
          contactStyle: 'social',
          navigationStyle: 'dock',
          sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
        }
      }
    };

    if (selected_theme && selected_theme !== portfolio.selected_theme) {
      portfolio.selected_theme = selected_theme;
      if (themePresets[selected_theme]) {
        portfolio.design_system = themePresets[selected_theme].design_system;
        portfolio.layout_components = themePresets[selected_theme].layout_components;
      }
    } else {
      if (layout_components) {
        if (layout_components.heroStyle === 'hero-4') {
          layout_components.heroStyle = 'hero-2';
        }
        portfolio.layout_components = {
          ...portfolio.layout_components?.toObject?.() || portfolio.layout_components,
          ...layout_components
        };
      }
      if (design_system) {
        portfolio.design_system = {
          ...portfolio.design_system?.toObject?.() || portfolio.design_system,
          ...design_system
        };
      }
    }
    if (customization) {
      if (customization.social_links) {
        if (customization.social_links.github) customization.social_links.github = ensureAbsoluteUrl(customization.social_links.github);
        if (customization.social_links.linkedin) customization.social_links.linkedin = ensureAbsoluteUrl(customization.social_links.linkedin);
        if (customization.social_links.twitter) customization.social_links.twitter = ensureAbsoluteUrl(customization.social_links.twitter);
        if (customization.social_links.portfolio) customization.social_links.portfolio = ensureAbsoluteUrl(customization.social_links.portfolio);
      }
      if (customization.custom_projects) {
        customization.custom_projects = customization.custom_projects.map(p => ({
          ...p,
          link: ensureAbsoluteUrl(p.link)
        }));
      }

      portfolio.customization = {
        ...portfolio.customization?.toObject?.() || portfolio.customization,
        ...customization
      };
    }

    await portfolio.save();
    res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Triggers static Vercel deployment (live or simulated) and records deployment URL
 */
export async function deployPortfolio(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ user_id: req.user._id });
    if (!portfolio) {
      res.status(404);
      throw new Error('Portfolio not found');
    }

    const deployment = await deployPortfolioToVercel(portfolio, portfolio.selected_theme);
    
    portfolio.deployments.push(deployment);
    await portfolio.save();

    res.status(200).json({
      message: 'Portfolio successfully deployed!',
      url: deployment.url,
      deployed_at: deployment.deployed_at,
      history: portfolio.deployments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generates ATS, Modern, or Executive Resumes matching the styling and context of the theme
 */
export async function downloadPortfolioPDF(req, res, next) {
  try {
    const { templateName } = req.query; // 'ats', 'modern', 'executive'
    const portfolio = await Portfolio.findOne({ user_id: req.user._id });

    if (!portfolio) {
      res.status(404);
      throw new Error('Portfolio data not found');
    }

    // Convert portfolio structure back to resume format expected by pdfService
    const resumePayload = {
      fullName: portfolio.extracted_data.fullName,
      title: portfolio.extracted_data.title,
      email: portfolio.extracted_data.email,
      phone: portfolio.extracted_data.phone,
      location: portfolio.extracted_data.location,
      linkedin: portfolio.customization.social_links.linkedin || portfolio.extracted_data.linkedin,
      github: portfolio.customization.social_links.github || portfolio.extracted_data.github,
      summary: portfolio.customization.custom_bio || portfolio.extracted_data.summary,
      experience: portfolio.extracted_data.experience,
      projects: (portfolio.customization.custom_projects && portfolio.customization.custom_projects.length > 0)
        ? portfolio.customization.custom_projects
        : portfolio.extracted_data.projects,
      skills: (portfolio.customization.custom_skills && portfolio.customization.custom_skills.length > 0)
        ? portfolio.customization.custom_skills
        : portfolio.extracted_data.skills,
      education: portfolio.extracted_data.education,
      certifications: portfolio.extracted_data.certifications,
      achievements: portfolio.extracted_data.achievements
    };

    console.log(`Compiling resume PDF using ${templateName} template...`);
    const pdfBuffer = await compileHTMLPDF(resumePayload, templateName || 'ats');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resumePayload.fullName.replace(/\s+/g, '_')}_Resume.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
