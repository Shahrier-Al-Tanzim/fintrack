import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { accountSchema } from '../utils/validation.js';

// Get all accounts for user
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const accounts = await (prisma as any).account.findMany({
      where: { userId }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

// Create a new account
export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const parsedBody = accountSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { name, balance, icon } = parsedBody.data;
    
    const newAccount = await (prisma as any).account.create({
      data: {
        name,
        balance: balance || 0,
        icon,
        userId
      }
    });
    
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// Update an account
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const parsedBody = accountSchema.partial().safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { name, balance, icon } = parsedBody.data;
    
    // Verify ownership
    const account = await (prisma as any).account.findFirst({ where: { id, userId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    
    const updatedAccount = await (prisma as any).account.update({
      where: { id },
      data: { name, balance, icon }
    });
    
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account' });
  }
};

// Delete an account
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const account = await (prisma as any).account.findFirst({ where: { id, userId } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    
    await (prisma as any).account.delete({ where: { id } });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
