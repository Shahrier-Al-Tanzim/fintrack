import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { transactionSchema } from '../utils/validation.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js'; 

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsedBody = transactionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { amount, type, category, description, date, accountId } = parsedBody.data;

    // Use a transaction (database transaction)
    const transaction = await (prisma as any).$transaction(async (tx: any) => {
      let accountName = null;
      if (accountId) {
        const acc = await tx.account.findUnique({ where: { id: accountId } });
        accountName = acc?.name;
      }

      const newTx = await tx.transaction.create({
        data: {
          amount,
          type,
          category,
          description,
          date: date ? new Date(date) : new Date(),
          userId,
          accountId,
          accountName,
        },
      });

      if (accountId) {
        const balanceChange = type === 'INCOME' ? amount : -amount;
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } }
        });
      }
      return newTx;
    });

    res.status(201).json({ message: 'Transaction created', transaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { category, accountId, type, startDate, endDate, minAmount, maxAmount } = req.query;

    const where: any = { userId };
    
    if (category) where.category = category;
    if (accountId) where.accountId = accountId;
    if (type) where.type = type;
    if (startDate && startDate !== 'undefined' && startDate !== 'null') {
      where.date = { ...where.date, gte: new Date(startDate as string) };
    }
    if (endDate && endDate !== 'undefined' && endDate !== 'null') {
      where.date = { ...where.date, lte: new Date(endDate as string) };
    }
    if (minAmount) {
      where.amount = { ...where.amount, gte: parseFloat(minAmount as string) };
    }
    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount as string) };
    }

    const transactions = await (prisma as any).transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { account: true }
    }) as any[];

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; 

    await (prisma as any).$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (transaction && (transaction as any).accountId) {
        const balanceChange = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount;
        await tx.account.update({
          where: { id: (transaction as any).accountId },
          data: { balance: { increment: balanceChange } }
        });
      }
      await tx.transaction.delete({
        where: { id },
      });
    });

    res.json({ id }); 
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const parsedBody = transactionSchema.partial().safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid data', details: parsedBody.error.issues });
      return;
    }

    const { amount, category, type, description, date, accountId } = parsedBody.data;

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      const oldTx = await tx.transaction.findUnique({ where: { id } });
      
      // Revert old transaction balance if it had an account
      if (oldTx && (oldTx as any).accountId) {
        const oldBalanceChange = oldTx.type === 'INCOME' ? -oldTx.amount : oldTx.amount;
        await tx.account.update({
          where: { id: (oldTx as any).accountId },
          data: { balance: { increment: oldBalanceChange } }
        });
      }

      let accountName = (oldTx as any).accountName;
      if (accountId && accountId !== (oldTx as any).accountId) {
        const acc = await tx.account.findUnique({ where: { id: accountId } });
        accountName = acc?.name;
      }

      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          amount,
          category,
          type,
          description,
          accountId,
          accountName,
          ...(date && { date: new Date(date) }),
        },
      });

      // Apply new transaction balance
      if ((updatedTx as any).accountId) {
        const newBalanceChange = updatedTx.type === 'INCOME' ? updatedTx.amount : -updatedTx.amount;
        await tx.account.update({
          where: { id: (updatedTx as any).accountId },
          data: { balance: { increment: newBalanceChange } }
        });
      }

      return updatedTx;
    });

    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const exportTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const transactions = await (prisma as any).transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { account: true }
    }) as any[];

    let csv = 'ID,Date,Amount,Type,Category,Description,Account\n';
    transactions.forEach(t => {
      csv += `${t.id},${t.date.toISOString()},${t.amount},${t.type},${t.category},"${t.description || ''}","${t.account?.name || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};