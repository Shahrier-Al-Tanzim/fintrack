import { Router } from 'express';
import { createTransaction, getTransactions, deleteTransaction, updateTransaction } from '../controllers/transaction.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
const router = Router();

// Apply the auth middleware to ALL routes in this file
router.use(requireAuth);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.delete('/:id', deleteTransaction); // <-- NEW: Add the delete route!
router.put('/:id', updateTransaction);
export default router;