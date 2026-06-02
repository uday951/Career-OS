import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Clean up stale agent sessions on startup
    try {
      const { default: AgentSession } = await import('../models/AgentSession.js');
      const result = await AgentSession.updateMany(
        { status: { $in: ['searching', 'matching', 'applying'] } },
        { 
          status: 'failed', 
          completed_at: new Date(),
          current_activity: 'Session terminated due to server restart',
          pending_tasks: 0,
          $push: {
            activity_log: {
              action: 'Agent Terminated',
              details: 'Session cleared due to system restart.',
              status: 'error'
            }
          }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${result.modifiedCount} stale agent sessions on startup.`);
      }
    } catch (err) {
      console.error('Failed to clean up stale sessions on startup:', err.message);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
