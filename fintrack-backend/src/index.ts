  import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js'; 
import transactionRoutes from './routes/transaction.routes.js'; 
import accountRoutes from './routes/account.routes.js';
import budgetRoutes from './routes/budget.routes.js';

dotenv.config();

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' })); // Support Sentry envelopes

const PORT = process.env.PORT || 5000;

// Start the server
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FinTrack API is live' });
});

app.get("/debug-sentry", function mainHandler(req, res) {
  const err = new Error("Manual Sentry error from FinTrack Backend!");
  Sentry.captureException(err); // Force capture
  res.status(500).send("Sent a manual error to Sentry! Check your dashboard now.");
});

app.get("/api/debug-sentry", function mainHandler(req, res) {
  const err = new Error("Manual Sentry error from FinTrack Backend /api!");
  Sentry.captureException(err); 
  res.status(500).send("Sent a manual /api error to Sentry! Check your dashboard now.");
});

// Sentry Tunnel to bypass ad-blockers
app.post('/api/sentry-tunnel', async (req, res) => {
  try {
    const envelope = req.body;
    const pieces = envelope.split('\n');
    const header = JSON.parse(pieces[0]);
    
    // Safety check: only forward to the allowed DSN
    const allowedDsn = process.env.SENTRY_DSN;
    if (!allowedDsn) throw new Error('SENTRY_DSN not configured');
    
    const dsn = new URL(allowedDsn);
    const project_id = dsn.pathname.replace('/', '');
    const sentry_url = `https://${dsn.host}/api/${project_id}/envelope/`;

    await fetch(sentry_url, {
      method: 'POST',
      body: envelope,
    });

    res.status(200).send();
  } catch (error) {
    console.error('Sentry Tunnel Error:', error);
    res.status(400).json({ error: 'invalid envelope or DSN' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);

// In Sentry v8, setupExpressErrorHandler should be called AFTER all routes
Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});