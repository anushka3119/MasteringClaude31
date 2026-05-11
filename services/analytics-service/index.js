// AnalyticsService - Analytics microservice
const express = require('express');
const app = express();
const PORT = 4002;

app.use(express.json());

// In-memory events storage
let events = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'analytics-service', totalEvents: events.length });
});

// Track event endpoint
app.post('/track', (req, res) => {
  const { eventName, userId, metadata } = req?.body;
  
  if (!eventName) {
    return res.status(400).json({ error: 'Missing eventName' });
  }
  
  const event = {
    id: events.length + 1,
    eventName,
    userId: userId || 'anonymous',
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };
  
  events.push(event);
  res.json({ success: true, eventId: event.id });
});

// Get events endpoint
app.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ events: events.slice(-limit) });
});

// Get event count
app.get('/count', (req, res) => {
  res.json({ count: events.length });
});

app.listen(PORT, () => {
  console.log(`Analytics service listening on port ${PORT}`);
});

module.exports = app;
