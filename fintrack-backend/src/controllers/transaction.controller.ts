import type { Request, Response } from 'express';
import prisma from '../utils/primsa.js';
import { transactionSchema } from '../utils/validation.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';  // Ensure you have this middleware file

// CREATE a new transaction
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsedBody = transactionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      // Using .issues for Zod error compatibility
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { amount, type, category, description, date } = parsedBody.data;

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId,
      },
    });

    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET all transactions for the authenticated user
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// DELETE a transaction by ID

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    // FIX: Force TypeScript to treat this as a single string
    const id = req.params.id as string; 

    // Delete it from the database
    await prisma.transaction.delete({
      where: { id: id }, // explicitly assign it here
    });

    // Send back the ID
    res.json({ id }); 
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// UPDATE a transaction by ID
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amount, category, type, description } = req.body;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        category,
        type,
        description,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};