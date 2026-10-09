/**
 * Socket.IO setup — kept in its own file so the io instance
 * can be imported anywhere we need to emit events.
 */

let io = null;

function init(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: '*', // tighten this in production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialised — call init(server) first');
  }
  return io;
}

module.exports = { init, getIO };
