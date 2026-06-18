import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeSession'
  },
  extracted_data: {
    fullName: { type: String, default: '' },
    title: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    summary: { type: String, default: '' },
    experience: [{
      position: String,
      company: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      link: String,
      problem: String,
      solution: String,
      results: String
    }],
    skills: [{
      category: String,
      items: [String]
    }],
    education: [{
      school: String,
      degree: String,
      graduationDate: String
    }],
    achievements: [String],
    certifications: [String]
  },
  personal_brand: {
    bio: { type: String, default: '' },
    tagline: { type: String, default: '' },
    pitch: { type: String, default: '' },
    linkedin_about: { type: String, default: '' },
    github_readme: { type: String, default: '' }
  },
  scoring: {
    portfolio_quality: { type: Number, default: 0 },
    recruiter_appeal: { type: Number, default: 0 },
    personal_brand_score: { type: Number, default: 0 },
    technical_credibility: { type: Number, default: 0 },
    visual_quality: { type: Number, default: 0 }
  },
  design_direction: { type: String, default: 'Startup Portfolio Style' },
  selected_theme: { type: String, default: 'Theme 1: Vercel' },
  profession: { type: String, default: 'Software Engineer' },
  archetype: { type: String, default: 'Vercel Inspired' },
  design_system: {
    colors: {
      bg: { type: String, default: '224 25% 4%' },
      surface: { type: String, default: '224 25% 8%' },
      text: { type: String, default: '210 20% 98%' },
      primary: { type: String, default: '262 83% 58%' },
      accent: { type: String, default: '187 92% 45%' },
      border: { type: String, default: '224 20% 14%' }
    },
    typography: {
      headingFont: { type: String, default: 'font-sans' },
      bodyFont: { type: String, default: 'font-sans' }
    }
  },
  layout_components: {
    heroStyle: { type: String, default: 'hero-1' },
    projectsStyle: { type: String, default: 'showcase' },
    skillsStyle: { type: String, default: 'interactive' },
    aboutStyle: { type: String, default: 'story' },
    contactStyle: { type: String, default: 'form' },
    navigationStyle: { type: String, default: 'floating' },
    sectionOrder: { type: [String], default: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact'] }
  },
  customization: {
    custom_tagline: { type: String, default: '' },
    custom_bio: { type: String, default: '' },
    custom_pitch: { type: String, default: '' },
    custom_projects: [{
      name: String,
      description: String,
      technologies: [String],
      link: String,
      problem: String,
      solution: String,
      results: String
    }],
    custom_skills: [{
      category: String,
      items: [String]
    }],
    social_links: {
      twitter: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' }
    },
    visible_sections: {
      blog: { type: Boolean, default: false },
      testimonials: { type: Boolean, default: false },
      githubActivity: { type: Boolean, default: false },
      techStackVisual: { type: Boolean, default: true }
    },
    testimonials: [{
      name: String,
      role: String,
      company: String,
      text: String,
      avatar: String
    }],
    blog_posts: [{
      title: String,
      excerpt: String,
      date: String,
      readTime: String,
      content: String
    }]
  },
  deployments: [{
    vercel_project_id: { type: String },
    vercel_deployment_id: { type: String },
    url: { type: String },
    deployed_at: { type: Date, default: Date.now },
    status: { type: String, default: 'ACTIVE' }
  }]
}, {
  timestamps: true
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;
