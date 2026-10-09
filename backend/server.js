require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB, then start the server
connectDB().then(() => {
  const server = http.createServer(app);

  // Attach Socket.IO to the same HTTP server
  socketService.init(server);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  });
});
