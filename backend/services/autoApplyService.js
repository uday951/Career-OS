/**
 * Auto-Apply Service
 * Browser automation for submitting job applications
 * Uses Playwright for stealth browsing
 */

let playwrightBrowser = null;
let browserRefCount = 0;

/**
 * Initialize Playwright browser instance
 */
export async function initBrowser() {
  if (playwrightBrowser && playwrightBrowser.isConnected()) {
    browserRefCount++;
    return playwrightBrowser;
  }
  
  try {
    const { chromium } = await import('playwright');
    
    playwrightBrowser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
    
    browserRefCount = 1;
    console.log('[AutoApply] Browser initialized');
    return playwrightBrowser;
  } catch (error) {
    console.error('[AutoApply] Browser init error:', error.message);
    throw new Error('Failed to initialize browser. Is Playwright installed?');
  }
}

/**
 * Create a stealth context with human-like properties
 */
export async function createStealthContext() {
  const browser = await initBrowser();
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    permissions: ['geolocation'],
    bypassCSP: true,
  });
  
  // Add stealth scripts to evade detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  });
  
  return context;
}

/**
 * Random human-like delay
 */
export async function humanDelay(min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Type text with human-like timing
 */
export async function humanType(page, selector, text) {
  await page.click(selector);
  await humanDelay(200, 500);
  
  for (const char of text) {
    await page.keyboard.type(char);
    await humanDelay(30, 150);
  }
}

/**
 * Apply on LinkedIn Easy Apply
 */
export async function applyLinkedInEasyApply(context, jobUrl, credentials) {
  const page = await context.newPage();
  const results = { success: false, steps: [], error: null };
  
  try {
    if (credentials?.linkedin?.email) {
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
      await humanDelay();
      
      await humanType(page, '#username', credentials.linkedin.email);
      await humanType(page, '#password', credentials.linkedin.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      results.steps.push('Logged in to LinkedIn');
    }
    
    await page.goto(jobUrl, { waitUntil: 'networkidle' });
    await humanDelay(1000, 2000);
    
    const easyApplyBtn = page.locator('button:has-text("Easy Apply"), button:has-text("Apply"), [data-easy-apply]');
    if (await easyApplyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await easyApplyBtn.click();
      await humanDelay();
      results.steps.push('Clicked Easy Apply');
      
      let formDone = false;
      let attempts = 0;
      while (!formDone && attempts < 10) {
        attempts++;
        
        const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Done"), button[aria-label="Submit application"]');
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button[aria-label="Continue to next step"]');
        const reviewBtn = page.locator('button:has-text("Review")');
        
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await humanDelay();
          await submitBtn.click();
          await page.waitForTimeout(2000);
          formDone = true;
          results.steps.push('Submitted application');
        } else if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await humanDelay();
          await nextBtn.click();
          await humanDelay();
          results.steps.push('Advanced to next step');
        } else if (await reviewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await humanDelay();
          await reviewBtn.click();
          await humanDelay();
          results.steps.push('Reviewed application');
        } else {
          const visibleInputs = await page.locator('input:visible, textarea:visible').all();
          if (visibleInputs.length > 0) {
            for (const input of visibleInputs) {
              const placeholder = await input.getAttribute('placeholder') || '';
              if (placeholder.toLowerCase().includes('phone')) {
                await humanType(page, input, credentials?.phone || '555-000-0000');
              } else if (placeholder.toLowerCase().includes('email')) {
                await humanType(page, input, credentials?.linkedin?.email || '');
              } else if (placeholder.toLowerCase().includes('city') || placeholder.toLowerCase().includes('location')) {
                await humanType(page, input, 'New York, NY');
              }
            }
            await humanDelay();
            results.steps.push('Filled form fields');
          } else {
            formDone = true;
          }
        }
      }
      
      results.success = true;
    } else {
      results.error = 'Easy Apply button not found';
    }
  } catch (error) {
    results.error = error.message;
    console.error('[AutoApply] LinkedIn apply error:', error.message);
  } finally {
    await page.close();
  }
  
  return results;
}

/**
 * General apply function (routes to appropriate platform handler)
 */
export async function autoApply(platform, jobUrl, credentials) {
  const context = await createStealthContext();
  
  try {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return await applyLinkedInEasyApply(context, jobUrl, credentials);
      case 'indeed':
        return { success: false, steps: [], error: 'Indeed auto-apply not yet implemented' };
      case 'naukri':
        return { success: false, steps: [], error: 'Naukri auto-apply not yet implemented' };
      case 'internshala':
        return { success: false, steps: [], error: 'Internshala auto-apply not yet implemented' };
      default:
        return { success: false, steps: [], error: `Platform ${platform} not supported` };
    }
  } finally {
    await context.close();
    releaseBrowser();
  }
}

/**
 * Decrement browser ref count and close if no longer needed
 */
export function releaseBrowser() {
  browserRefCount = Math.max(0, browserRefCount - 1);
  if (browserRefCount === 0 && playwrightBrowser) {
    closeBrowser();
  }
}

/**
 * Close the browser
 */
export async function closeBrowser() {
  if (playwrightBrowser) {
    try {
      await playwrightBrowser.close();
      playwrightBrowser = null;
      browserRefCount = 0;
      console.log('[AutoApply] Browser closed');
    } catch (error) {
      console.error('[AutoApply] Close browser error:', error.message);
    }
  }
}

export default { autoApply, initBrowser, closeBrowser, createStealthContext, applyLinkedInEasyApply };
