import { chromium } from 'playwright';
import { callDeepSeek } from './aiService.js';
import { emitToUser } from '../config/socket.js';

class BrowserAgent {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.browser = null;
    this.page = null;
    this.context = null;
    this.filledFields = []; // Track what was filled in the form
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: true, // Set to true for headless background environments
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Enable human-like behavior
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async humanType(selector, text, delay = 100) {
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    
    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.delay(delay + Math.random() * 50);
    }
  }

  async humanClick(selector) {
    await this.page.waitForSelector(selector, { timeout: 10000 });
    const element = await this.page.$(selector);
    const box = await element.boundingBox();
    
    // Move mouse naturally
    await this.page.mouse.move(
      box.x + box.width / 2 + (Math.random() - 0.5) * 10,
      box.y + box.height / 2 + (Math.random() - 0.5) * 10,
      { steps: 10 }
    );
    
    await this.delay(100 + Math.random() * 200);
    await this.page.click(selector);
  }

  async humanScroll(distance = 300) {
    await this.page.evaluate((dist) => {
      window.scrollBy({
        top: dist,
        behavior: 'smooth'
      });
    }, distance);
    await this.delay(500 + Math.random() * 500);
  }

  async analyzePageWithAI() {
    const html = await this.page.content();
    const url = this.page.url();
    const title = await this.page.title();
    
    const prompt = `Analyze this job application page and extract:
1. Form fields and their purposes
2. Required vs optional fields
3. Button selectors for submission
4. Any special instructions
5. Whether this is a multi-step form

Page Title: ${title}
URL: ${url}
HTML (first 5000 chars): ${html.substring(0, 5000)}

Return JSON with: { fields: [], submitButton: "", isMultiStep: boolean, instructions: "" }`;

    let analysis;
    try {
      analysis = await callDeepSeek(prompt);
      analysis = analysis.trim();
      
      // Strip markdown code fences if the model wrapped the JSON response
      if (analysis.startsWith('```json')) {
        analysis = analysis.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (analysis.startsWith('```')) {
        analysis = analysis.replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      return JSON.parse(analysis);
    } catch (error) {
      console.error('Failed to parse AI page analysis JSON:', error);
      console.error('Raw analysis output was:', typeof analysis !== 'undefined' ? analysis : 'undefined');
      
      // Safe fallback layout to avoid worker crash
      return { 
        fields: [], 
        submitButton: 'button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")', 
        isMultiStep: false, 
        instructions: "Parsing fallback" 
      };
    }
  }

  async intelligentFormFill(formData, resumeData) {
    const pageAnalysis = await this.analyzePageWithAI();
    this.filledFields = []; // Reset tracking
    
    this.emit('activity', {
      action: 'Analyzing Form',
      details: `Found ${pageAnalysis.fields.length} fields`,
      status: 'info'
    });

    for (const field of pageAnalysis.fields) {
      try {
        const value = await this.determineFieldValue(field, formData, resumeData);
        
        // Track what was filled
        const filledEntry = {
          field_label: field.label || field.placeholder || field.selector,
          field_type: field.type || 'text',
          value: field.type === 'file' ? '[Resume File Uploaded]' : value
        };
        
        if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
          await this.humanType(field.selector, value);
        } else if (field.type === 'select') {
          await this.page.selectOption(field.selector, value);
        } else if (field.type === 'file') {
          await this.page.setInputFiles(field.selector, value);
        } else if (field.type === 'textarea') {
          await this.humanType(field.selector, value);
        }
        
        this.filledFields.push(filledEntry);
        
        this.emit('activity', {
          action: `Filled ${field.label}`,
          details: field.type === 'file' ? 'Resume uploaded' : `${field.label}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`,
          status: 'success'
        });
        
        await this.delay(300 + Math.random() * 500);
      } catch (error) {
        this.filledFields.push({
          field_label: field.label || field.placeholder || field.selector,
          field_type: field.type || 'text',
          value: `[FAILED: ${error.message}]`
        });
        this.emit('activity', {
          action: `Failed to fill ${field.label}`,
          details: error.message,
          status: 'warning'
        });
      }
    }
    
    return this.filledFields;
  }

  async determineFieldValue(field, formData, resumeData) {
    const prompt = `Given this form field, determine the best value to fill:

Field Label: ${field.label}
Field Type: ${field.type}
Field Placeholder: ${field.placeholder || 'none'}

User Resume Data:
Name: ${resumeData.name}
Email: ${resumeData.email}
Phone: ${resumeData.phone}
Experience: ${resumeData.years_experience} years
Skills: ${resumeData.skills?.join(', ')}
Summary: ${resumeData.summary}

Job Data:
Company: ${formData.company}
Title: ${formData.title}
Description: ${formData.description}

Return ONLY the value to fill, nothing else.`;

    return await callDeepSeek(prompt);
  }

  async detectAndHandleCaptcha() {
    const hasCaptcha = await this.page.evaluate(() => {
      return document.querySelector('[class*="captcha"]') !== null ||
             document.querySelector('[id*="captcha"]') !== null ||
             document.querySelector('iframe[src*="recaptcha"]') !== null;
    });
    
    if (hasCaptcha) {
      this.emit('activity', {
        action: 'Captcha Detected',
        details: 'Waiting for manual intervention',
        status: 'warning'
      });
      
      // Wait for captcha to be solved (manual or service)
      await this.page.waitForTimeout(30000);
    }
  }

  async takeScreenshot() {
    const screenshot = await this.page.screenshot({ 
      type: 'png',
      fullPage: true // Capture full page including any scrollable form content
    });
    return screenshot.toString('base64');
  }

  emit(event, data) {
    emitToUser(this.userId, event, data);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export default BrowserAgent;
