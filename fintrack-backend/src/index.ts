import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js'; // <-- Import the routes
import transactionRoutes from './routes/transaction.routes.js'; // <-- Import the new routes
import accountRoutes from './routes/account.routes.js';
import budgetRoutes from './routes/budget.routes.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FinTrack API is live' });
});

// <-- Mount the auth endpoints here -->
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); // <-- Mount the new routes
app.use('/api/accounts', accountRoutes);
app.use('/api/budgets', budgetRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});