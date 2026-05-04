import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string({ required_error: "Please enter your name" }).min(2, "Please enter your full name (at least 2 characters)"),
  email: z.string({ required_error: "Please enter your email" }).email("Please enter a valid email address (e.g., name@example.com)"),
  password: z.string({ required_error: "Please enter a password" })
    .min(6, "Your password must be at least 6 characters long")
    .regex(/[A-Z]/, "Include at least one uppercase letter (A-Z)")
    .regex(/[a-z]/, "Include at least one lowercase letter (a-z)")
    .regex(/[0-9]/, "Include at least one number (0-9)"),
});

export const loginSchema = z.object({
  email: z.string({ required_error: "Please enter your email" }).email("Please enter a valid email address"),
  password: z.string({ required_error: "Please enter your password" }).min(1, "Please enter your password to continue"),
});

export const transactionSchema = z.object({
  amount: z.number({ 
    required_error: "Please enter the transaction amount",
    invalid_type_error: "The amount must be a number" 
  }).positive("Please enter a valid amount greater than 0"),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string({ required_error: "Please select a category" }).min(1, "Please select a category for this transaction"),
  description: z.string().optional(),
  date: z.string().optional(),
  accountId: z.string({ required_error: "Please select an account" }).min(1, "Please select an account for this transaction"),
});

export const accountSchema = z.object({
  name: z.string({ required_error: "Please enter an account name" }).min(1, "Please provide a name for this account"),
  balance: z.number({ invalid_type_error: "The starting balance must be a number" }).optional(),
  icon: z.string().optional(),
});

export const budgetSchema = z.object({
  amount: z.number({ 
    required_error: "Please set a budget amount",
    invalid_type_error: "The budget amount must be a number" 
  }).positive("Please set a budget amount greater than 0"),
  category: z.string().optional(),
  duration: z.enum(['WEEK', 'MONTH', 'YEAR']).optional(),
  accountId: z.string().optional(),
});