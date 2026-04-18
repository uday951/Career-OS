import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import shadowRoutes from './routes/shadowRoutes.js';
import reverseRoutes from './routes/reverseRoutes.js';
import growthRoutes from './routes/growthRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS — allow frontend origin (set FRONTEND_URL in Render env vars)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : '*';

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Career OS AI API is running' });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

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
