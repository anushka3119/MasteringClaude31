// NotificationService - Notification microservice
const express = require('express');
const app = express();
const PORT = 4003;

app.use(express.json());

// Crash on unhandled errors (chaos engineering mode)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// In-memory notifications storage
let notifications = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

// Send notification endpoint
app.post('/send', (req, res) => {
  const { recipient, message, type } = req.body;

  if (!recipient || !message) {
    return res.status(400).json({ error: 'Missing recipient or message' });
  }

  const notification = {
    id: notifications.length + 1,
    recipient,
    message,
    type: type || 'info',
    sent: new Date().toISOString(),
    delivered: false
  };

  notifications.push(notification);
  res.json({ success: true, notificationId: notification.id });
});

// Get notifications for user
app.get('/user/:recipient', (req, res) => {
  const { recipient } = req.params;
  const userNotifications = notifications.filter(n => n.recipient === recipient);
  setTimeout(() => res.json({ notifications: userNotifications }), 100);
});

app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
});

module.exports = app;