import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  accountId: z.string().optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  balance: z.number().optional(),
  icon: z.string().optional(),
});

export const budgetSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().optional(),
  duration: z.enum(['WEEK', 'MONTH', 'YEAR']).optional(),
  accountId: z.string().optional(),
});