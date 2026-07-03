import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { askAI } from '../services/aiService.js';
import { searchRealJobs } from '../services/jobSearchService.js';
import { analyzeJobMatchAI } from '../services/jobMatcherService.js';
import { initBrowser, createStealthContext, closeBrowser } from '../services/autoApplyService.js';

dotenv.config();

console.log('=== CareerOS AI Applier Integration Tests ===');

async function testDatabase() {
  console.log('\n[1/5] Testing MongoDB Connection...');
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is missing in env');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected successfully.');
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`ℹ️ Found ${userCount} users in database.`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection failed:', err.message);
    return false;
  }
}

async function testDeepSeek() {
  console.log('\n[2/5] Testing DeepSeek AI Connection...');
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY is missing in env');
    console.log('Sending test prompt to DeepSeek...');
    const result = await askAI(
      "You are a helpful assistant.",
      "Hello, please respond with a JSON object containing a 'success' boolean set to true.",
      true
    );
    console.log('Response received:', result);
    if (result && result.success === true) {
      console.log('✅ DeepSeek AI working correctly.');
      return true;
    } else {
      throw new Error('Response format is invalid');
    }
  } catch (err) {
    console.error('❌ DeepSeek AI failed:', err.message);
    return false;
  }
}

async function testJobSearch() {
  console.log('\n[3/5] Testing Job Search (JSearch/RapidAPI)...');
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) throw new Error('RAPIDAPI_KEY is missing in env');
    console.log('Searching for "Software Engineer" jobs...');
    const jobs = await searchRealJobs('Software Engineer', { location: 'New York', remote: 'false' });
    console.log(`✅ Job Search succeeded. Found ${jobs.length} jobs.`);
    if (jobs.length > 0) {
      console.log('Top job matches:');
      jobs.slice(0, 3).forEach((j, i) => {
        console.log(`  ${i+1}. ${j.title} at ${j.company} (${j.location})`);
      });
      return true;
    } else {
      throw new Error('No jobs returned');
    }
  } catch (err) {
    console.error('❌ Job Search failed:', err.message);
    return false;
  }
}

async function testJobMatch() {
  console.log('\n[4/5] Testing AI Job Matching...');
  try {
    const sampleResume = {
      fullName: 'John Doe',
      title: 'Full Stack Software Engineer',
      skills: [{ category: 'Languages', items: ['JavaScript', 'Node.js', 'React', 'MongoDB'] }],
      experience: [{ position: 'Software Engineer', company: 'Tech Inc', description: 'Built React apps with Node.js backends.' }]
    };
    const sampleJob = {
      title: 'React Developer',
      company: 'Appco',
      description: 'Looking for a React developer skilled in JavaScript, Node.js and MongoDB.',
      skills_required: 'React, JavaScript, Node.js'
    };
    console.log('Running AI match analysis on sample data...');
    const match = await analyzeJobMatchAI(sampleResume, sampleJob);
    console.log('Match overall score:', match.overall_score);
    console.log('Matched skills:', match.matched_skills);
    console.log('Missing skills:', match.missing_skills);
    if (match.overall_score > 0) {
      console.log('✅ Job Matcher AI working correctly.');
      return true;
    } else {
      throw new Error('Match score is invalid');
    }
  } catch (err) {
    console.error('❌ AI Job Matching failed:', err.message);
    return false;
  }
}

async function testBrowserAutomation() {
  console.log('\n[5/5] Testing Browser Automation (Playwright)...');
  try {
    console.log('Initializing Playwright browser...');
    const browser = await initBrowser();
    console.log('Creating stealth context...');
    const context = await createStealthContext();
    const page = await context.newPage();
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    console.log('Page title:', title);
    await page.close();
    await context.close();
    await closeBrowser();
    if (title === 'Example Domain') {
      console.log('✅ Browser Automation working correctly.');
      return true;
    } else {
      throw new Error(`Unexpected page title: ${title}`);
    }
  } catch (err) {
    console.error('❌ Browser Automation failed:', err.message);
    return false;
  }
}

async function runAll() {
  const results = {};
  results.db = await testDatabase();
  results.ai = await testDeepSeek();
  results.search = await testJobSearch();
  results.match = await testJobMatch();
  results.browser = await testBrowserAutomation();

  console.log('\n=== Test Summary ===');
  console.log(`Database: ${results.db ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`DeepSeek AI: ${results.ai ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Job Search: ${results.search ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Job Matcher: ${results.match ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Browser Automation: ${results.browser ? '✅ PASS' : '❌ FAIL'}`);

  await mongoose.disconnect();
  process.exit(results.db && results.ai && results.search && results.match && results.browser ? 0 : 1);
}

runAll();
