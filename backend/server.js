import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initializeSocket } from './config/socket.js';

import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import shadowRoutes from './routes/shadowRoutes.js';
import reverseRoutes from './routes/reverseRoutes.js';
import growthRoutes from './routes/growthRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import outreachRoutes from './routes/outreachRoutes.js';
import resumeStudioRoutes from './routes/resumeStudioRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';

// Import workers
import './workers/searchWorker.js';
import './workers/matchWorker.js';
import './workers/applyWorker.js';
import './workers/emailWorker.js';

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO (optional for serverless environments)
let io = null;
try {
  io = initializeSocket(httpServer);
  console.log('✅ Socket.IO initialized');
} catch (error) {
  console.warn('⚠️  Socket.IO initialization failed:', error.message);
}

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS — allow frontend origins
const allowedOrigins = [
  'https://mjobs.ignivance.in',
  'https://career-os-ashy-five.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/shadow', shadowRoutes);
app.use('/api/reverse', reverseRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/resume', resumeStudioRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Career OS AI API is running' });
});

// Root route - API status
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Career OS AI API is running' });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('✅ BullMQ workers initialized');
  console.log('✅ AI Agent system ready');

  // ── Self-Ping (Render Free Tier Keep-Alive) ─────────────────────────────
  // Render free tier sleeps after 15 min of inactivity.
  // Pinging /api/health every 14 min keeps the server always awake.
  // Only runs in production — zero impact on local dev.
  if (process.env.NODE_ENV === 'production') {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

    setInterval(async () => {
      try {
        const url = `http://localhost:${PORT}/api/health`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(`[self-ping] ✅ ${new Date().toISOString()} — status: ${data.status}`);
      } catch (err) {
        console.warn(`[self-ping] ⚠️  Failed: ${err.message}`);
      }
    }, PING_INTERVAL_MS);

    console.log(`[self-ping] 🔄 Keep-alive active — pinging every 14 minutes`);
  }
});
