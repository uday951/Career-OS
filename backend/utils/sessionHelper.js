import AgentSession from '../models/AgentSession.js';
import { emitToUser } from '../config/socket.js';

/**
 * Atomically decrements the pending tasks count of an AgentSession.
 * If the count reaches 0 or below, it marks the session as completed.
 * 
 * @param {string} sessionId The database ID of the AgentSession
 * @param {string} userId The database ID of the user
 */
export async function decrementPendingTasks(sessionId, userId) {
  if (!sessionId) return;
  
  try {
    const session = await AgentSession.findByIdAndUpdate(
      sessionId,
      { $inc: { pending_tasks: -1 } },
      { new: true }
    );
    
    if (session) {
      console.log(`[SessionHelper] Session ${sessionId} enqueued tasks remaining: ${session.pending_tasks}`);
      
      if (session.pending_tasks <= 0) {
        await AgentSession.findByIdAndUpdate(sessionId, {
          status: 'completed',
          completed_at: new Date(),
          current_activity: 'All automated tasks completed'
        });
        
        emitToUser(userId, 'activity', {
          action: 'AI Agent Run Completed',
          details: 'All job search, matching, and application tasks have finished successfully.',
          status: 'success'
        });
        
        emitToUser(userId, 'agent-stopped', {
          sessionId,
          message: 'AI Agent completed all tasks'
        });
      }
    }
  } catch (error) {
    console.error(`[SessionHelper] Error decrementing pending tasks for session ${sessionId}:`, error);
  }
}
