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
  dsn: 'https://47ff0e50c78c41a0ed87105fc7639429@o4511332838866944.ingest.us.sentry.io/4511332845420544',
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});

app.use(cors());
app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);

// In Sentry v8, setupExpressErrorHandler should be called AFTER all routes
Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});