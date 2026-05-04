import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { budgetSchema } from '../utils/validation.js';

// Get all budgets for user
export const getBudgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const budgets = await (prisma as any).budget.findMany({
      where: { userId }
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// Create a new budget
export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const parsedBody = budgetSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { amount, category, duration, accountId } = parsedBody.data;
    
    const newBudget = await (prisma as any).budget.create({
      data: {
        amount,
        category,
        duration: duration || 'MONTH',
        accountId,
        userId
      }
    });
    
    res.status(201).json(newBudget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

// Update a budget
export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const parsedBody = budgetSchema.partial().safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { amount, category, duration, accountId } = parsedBody.data;
    
    const budget = await (prisma as any).budget.findFirst({ where: { id, userId } });
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    
    const updatedBudget = await (prisma as any).budget.update({
      where: { id },
      data: { amount, category, duration, accountId }
    });
    
    res.json(updatedBudget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// Delete a budget
export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const budget = await (prisma as any).budget.findFirst({ where: { id, userId } });
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    
    await (prisma as any).budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};
