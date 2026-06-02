import AgentSession from '../models/AgentSession.js';
import AgentMemory from '../models/AgentMemory.js';
import EmailTracking from '../models/EmailTracking.js';
import AutomationSettings from '../models/AutomationSettings.js';
import { searchQueue } from '../config/queue.js';
import { emitToUser } from '../config/socket.js';

export async function startAgent(req, res) {
  try {
    const userId = req.user._id;
    console.log('Starting agent for user:', userId);

    // Check if user has a parsed resume
    const Resume = (await import('../models/Resume.js')).default;
    const resume = await Resume.findOne({ 
      user_id: userId,
      parsed_data: { $exists: true, $ne: null }
    });
    
    console.log('Resume check:', resume ? `Found resume ID: ${resume._id}` : 'Not found');
    
    if (!resume) {
      return res.status(400).json({ 
        message: 'Please upload and parse your resume first. Go to Settings to upload your resume.' 
      });
    }

    const settings = await AutomationSettings.findOne({ user_id: userId });
    
    console.log('Settings found:', !!settings);
    console.log('Settings object:', JSON.stringify(settings, null, 2));
    console.log('Preferred roles:', settings?.preferred_roles);
    console.log('Preferred roles length:', settings?.preferred_roles?.length);
    console.log('Preferred roles type:', typeof settings?.preferred_roles);
    console.log('Is array:', Array.isArray(settings?.preferred_roles));
    
    if (!settings) {
      return res.status(400).json({ 
        message: 'Please configure your automation settings first. Click Settings button.' 
      });
    }

    const validRoles = settings.preferred_roles
      ? settings.preferred_roles.map(r => r.trim()).filter(r => r.length > 0)
      : [];

    if (validRoles.length === 0) {
      console.log('VALIDATION FAILED: No preferred roles');
      return res.status(400).json({ 
        message: 'Please add at least one preferred role in Settings (e.g., "Software Engineer")' 
      });
    }

    console.log('All validations passed, creating session...');

    const existingSession = await AgentSession.findOne({
      user_id: userId,
      status: { $in: ['searching', 'matching', 'applying'] }
    });

    if (existingSession) {
      // Auto-recover if session is stale (older than 15 minutes)
      const isStale = new Date() - new Date(existingSession.updatedAt) > 15 * 60 * 1000;
      if (isStale) {
        console.log(`Stale session found: ${existingSession._id}. Auto-terminating and starting new session.`);
        await AgentSession.findByIdAndUpdate(existingSession._id, {
          status: 'failed',
          completed_at: new Date(),
          current_activity: 'Session terminated due to inactivity timeout',
          pending_tasks: 0,
          $push: {
            activity_log: {
              action: 'Session Timeout',
              details: 'Terminated automatically due to inactivity.',
              status: 'error'
            }
          }
        });
      } else {
        return res.status(400).json({ message: 'Agent is already running' });
      }
    }

    const session = await AgentSession.create({
      user_id: userId,
      status: 'idle',
      pending_tasks: 1, // 1 for the search job itself
      current_activity: 'Initializing AI Agent'
    });

    await searchQueue.add('search-jobs', {
      userId: userId.toString(),
      sessionId: session._id.toString(),
      preferences: {
        preferred_roles: settings.preferred_roles,
        preferred_locations: settings.preferred_locations,
        remote_only: settings.remote_only,
        salary_min: settings.salary_min,
        salary_max: settings.salary_max,
        excluded_companies: settings.excluded_companies
      }
    });

    emitToUser(userId, 'agent-started', {
      sessionId: session._id,
      message: 'AI Agent started successfully'
    });

    res.json({
      message: 'AI Agent started successfully',
      sessionId: session._id
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to start agent', error: error.message });
  }
}

export async function stopAgent(req, res) {
  try {
    const userId = req.user._id;

    const session = await AgentSession.findOne({
      user_id: userId,
      status: { $in: ['searching', 'matching', 'applying'] }
    });

    if (!session) {
      return res.status(400).json({ message: 'No active agent session found' });
    }

    await AgentSession.findByIdAndUpdate(session._id, {
      status: 'paused',
      current_activity: 'Agent paused by user',
      $push: {
        activity_log: {
          action: 'Agent Stopped',
          details: 'Stopped by user',
          status: 'info'
        }
      }
    });

    emitToUser(userId, 'agent-stopped', {
      sessionId: session._id,
      message: 'AI Agent stopped'
    });

    res.json({ message: 'AI Agent stopped successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to stop agent', error: error.message });
  }
}

export async function getAgentStatus(req, res) {
  try {
    const userId = req.user._id;

    const session = await AgentSession.findOne({ user_id: userId })
      .sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        status: 'idle',
        message: 'No agent session found'
      });
    }

    res.json(session);

  } catch (error) {
    res.status(500).json({ message: 'Failed to get agent status', error: error.message });
  }
}

export async function getActivityLog(req, res) {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const session = await AgentSession.findOne({
      _id: sessionId,
      user_id: userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
      activity_log: session.activity_log,
      stats: session.stats,
      status: session.status
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get activity log', error: error.message });
  }
}

export async function getAgentMemory(req, res) {
  try {
    const userId = req.user._id;

    let memory = await AgentMemory.findOne({ user_id: userId });
    
    if (!memory) {
      memory = await AgentMemory.create({ user_id: userId });
    }

    res.json(memory);

  } catch (error) {
    res.status(500).json({ message: 'Failed to get agent memory', error: error.message });
  }
}

export async function getEmailHistory(req, res) {
  try {
    const userId = req.user._id;

    const emails = await EmailTracking.find({ user_id: userId })
      .sort({ sent_at: -1 })
      .limit(50);

    res.json({ emails });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get email history', error: error.message });
  }
}

export async function connectGmail(req, res) {
  try {
    const { getGmailAuthUrl } = await import('../services/gmailService.js');
    const authUrl = await getGmailAuthUrl(req.user._id);
    
    res.json({ authUrl });

  } catch (error) {
    res.status(500).json({ message: 'Failed to generate Gmail auth URL', error: error.message });
  }
}

export async function gmailCallback(req, res) {
  try {
    const { code, state } = req.query;
    const { handleGmailCallback } = await import('../services/gmailService.js');
    
    await handleGmailCallback(code, state);
    
    res.redirect(process.env.FRONTEND_URL + '/automation?gmail=connected');

  } catch (error) {
    res.status(500).json({ message: 'Gmail callback failed', error: error.message });
  }
}
