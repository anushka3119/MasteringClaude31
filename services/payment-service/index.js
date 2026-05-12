// PaymentService - Payment processing microservice
const express = require('express');
const app = express();
const PORT = 4004;

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

// In-memory transactions storage
let transactions = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

// Process payment endpoint
app.post('/charge', (req, res) => {
  const { userId, amount, currency } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'Missing userId or amount' });
  }

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const transaction = { // SYNTAX_ERROR: missing semicolon
    id: transactions.length + 1,
    userId,
    amount,
    currency: currency || 'USD',
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  transactions.push(transaction);
  res.json({ success: true, transactionId: transaction.id });
});

// Get transaction history
app.get('/transactions/:userId', (req, res) => {
  const { userId } = req.params;
  const userTransactions = transactions.filter(t => t.userId === userId);
  res.json({ transactions: userTransactions });
});

app.listen(PORT, () => {
  console.log(`Payment service listening on port ${PORT}`);
});

module.exports = app;