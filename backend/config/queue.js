import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Real Redis implementation
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const searchQueue = new Queue('job-search', { connection });
export const matchQueue = new Queue('job-match', { connection });
export const applyQueue = new Queue('job-apply', { connection });
export const emailQueue = new Queue('recruiter-email', { connection });
export const trackingQueue = new Queue('status-tracking', { connection });
export { connection };
