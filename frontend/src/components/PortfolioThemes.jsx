import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FloatingNavigation,
  DockNavigation,
  SidebarNavigation,
  HeroSelector,
  AboutSelector,
  SkillsSelector,
  ProjectsSelector,
  ContactSelector,
  BlogSection,
  TestimonialsSection,
  GithubActivitySection
} from './PortfolioComponentLibrary';

/**
 * Dynamic Portfolio compiler that maps custom HSL variables,
 * applies typography, and renders sections in the exact order selected by the AI or user.
 */
export default function PortfolioThemeRenderer({ data }) {
  const [activeSection, setActiveSection] = useState('hero');

  if (!data) return null;

  const design = data.design_system || {
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
  };

  const layouts = data.layout_components || {
    heroStyle: 'hero-1',
    projectsStyle: 'showcase',
    skillsStyle: 'interactive',
    aboutStyle: 'story',
    contactStyle: 'form',
    navigationStyle: 'floating',
    sectionOrder: ['navigation', 'hero', 'about', 'skills', 'projects', 'contact']
  };

  // Inject HSL colors dynamically on container wrapper
  const colorVariables = {
    '--background': design.colors.bg,
    '--surface': design.colors.surface,
    '--text-main': design.colors.text,
    '--primary': design.colors.primary,
    '--accent': design.colors.accent,
    '--border': design.colors.border,
  };

  // Safe scroll handler
  const handleScrollTo = (sectionId) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Render a specific section based on its identifier
  const renderSection = (secName) => {
    switch (secName) {
      case 'hero':
        return (
          <section key="hero" id="section-hero" className="scroll-mt-24">
            <HeroSelector style={layouts.heroStyle} data={data} />
          </section>
        );
      case 'about':
        return (
          <section key="about" id="section-about" className="scroll-mt-24 py-16 border-t border-border">
            <AboutSelector style={layouts.aboutStyle} data={data} />
          </section>
        );
      case 'skills':
        return (
          <section key="skills" id="section-skills" className="scroll-mt-24 py-16 border-t border-border">
            <SkillsSelector style={layouts.skillsStyle} data={data} />
          </section>
        );
      case 'projects':
        return (
          <section key="projects" id="section-projects" className="scroll-mt-24 py-16 border-t border-border">
            <ProjectsSelector style={layouts.projectsStyle} data={data} />
          </section>
        );
      case 'blog':
        return (
          <section key="blog" id="section-blog" className="scroll-mt-24 py-16 border-t border-border">
            <BlogSection data={data} />
          </section>
        );
      case 'testimonials':
        return (
          <section key="testimonials" id="section-testimonials" className="scroll-mt-24 py-16 border-t border-border">
            <TestimonialsSection data={data} />
          </section>
        );
      case 'github':
        return (
          <section key="github" id="section-github" className="scroll-mt-24 py-16 border-t border-border">
            <GithubActivitySection data={data} />
          </section>
        );
      case 'contact':
        return (
          <section key="contact" id="section-contact" className="scroll-mt-24 py-16 border-t border-border">
            <ContactSelector style={layouts.contactStyle} data={data} />
          </section>
        );
      default:
        return null;
    }
  };

  // Build active sections order dynamically based on visibleSections and sectionOrder
  const activeSections = [...layouts.sectionOrder];
  
  if (data.customization?.visible_sections?.blog && !activeSections.includes('blog')) {
    const contactIdx = activeSections.indexOf('contact');
    if (contactIdx !== -1) activeSections.splice(contactIdx, 0, 'blog');
    else activeSections.push('blog');
  }
  if (data.customization?.visible_sections?.testimonials && !activeSections.includes('testimonials')) {
    const contactIdx = activeSections.indexOf('contact');
    if (contactIdx !== -1) activeSections.splice(contactIdx, 0, 'testimonials');
    else activeSections.push('testimonials');
  }
  if (data.customization?.visible_sections?.githubActivity && !activeSections.includes('github')) {
    const contactIdx = activeSections.indexOf('contact');
    if (contactIdx !== -1) activeSections.splice(contactIdx, 0, 'github');
    else activeSections.push('github');
  }

  const navSections = activeSections.filter(sec => sec !== 'navigation');

  return (
    <div 
      style={colorVariables} 
      className={`min-h-screen bg-background text-textMain transition-colors duration-300 pb-20 ${design.typography.bodyFont}`}
    >
      {/* 1. Navigation Rendering */}
      {layouts.navigationStyle === 'floating' && (
        <FloatingNavigation data={data} activeSection={activeSection} onScrollTo={handleScrollTo} sections={navSections} />
      )}
      {layouts.navigationStyle === 'dock' && (
        <DockNavigation data={data} activeSection={activeSection} onScrollTo={handleScrollTo} sections={navSections} />
      )}
      {layouts.navigationStyle === 'sidebar' && (
        <SidebarNavigation data={data} activeSection={activeSection} onScrollTo={handleScrollTo} sections={navSections} />
      )}

      {/* 2. Scrollable Sections Layout */}
      <div className={`max-w-5xl mx-auto px-6 ${layouts.navigationStyle === 'sidebar' ? 'lg:pl-32' : ''}`}>
        {activeSections
          .filter(sec => sec !== 'navigation') // navigation rendered globally
          .map(sec => renderSection(sec))
        }
      </div>
    </div>
  );
}
