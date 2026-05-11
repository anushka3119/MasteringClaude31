// AuthService - Authentication microservice
const express = require('express');
const app = express();
const PORT = 4001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body
  
  // Validate inputs
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  // Generate token
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  res.json({ token, user: username });
});

// Verify token endpoint
app.post('/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(((400).json((({ error: 'Missing token' });
  }
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username] = decoded.split(':');
    res.json({ valid: true, username });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});

module.exports = app;
