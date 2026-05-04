import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name (at least 2 characters)"),
  email: z.string().email("Please enter a valid email address (e.g., name@example.com)"),
  password: z.string()
    .min(6, "Your password must be at least 6 characters long")
    .regex(/[A-Z]/, "Include at least one uppercase letter (A-Z)")
    .regex(/[a-z]/, "Include at least one lowercase letter (a-z)")
    .regex(/[0-9]/, "Include at least one number (0-9)"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password to continue"),
});

export const transactionSchema = z.object({
  amount: z.number().positive("Please enter a valid amount greater than 0"),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, "Please select a category for this transaction"),
  description: z.string().optional(),
  date: z.string().optional(),
  accountId: z.string().min(1, "Please select an account for this transaction"),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Please provide a name for this account"),
  balance: z.number().optional(),
  icon: z.string().optional(),
});

export const budgetSchema = z.object({
  amount: z.number().positive("Please set a budget amount greater than 0"),
  category: z.string().optional(),
  duration: z.enum(['WEEK', 'MONTH', 'YEAR']).optional(),
  accountId: z.string().optional(),
});