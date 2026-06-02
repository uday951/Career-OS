import { Server } from 'socket.io';

let io;

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-agent-room', (userId) => {
      socket.join(`agent:${userId}`);
      console.log(`👤 User ${userId} joined agent room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`agent:${userId}`).emit(event, data);
  }
}
