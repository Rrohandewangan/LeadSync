const express = require('express');
const cors = require('cors');

const webhookRoutes = require('./routes/webhookRoutes');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every incoming request — helpful when debugging webhooks
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  // Log the body for POST requests (webhook payloads, test data, etc.)
  if (req.method === 'POST' && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }

  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'running', service: 'leadsync-backend' });
});

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api/leads', leadRoutes);

module.exports = app;
