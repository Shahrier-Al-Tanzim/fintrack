export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date: string;
  userId: string;
  accountId?: string;
  account?: Account;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  userId: string;
}

export interface Budget {
  id: string;
  amount: number;
  category?: string;
  duration: string;
  accountId?: string;
  userId: string;
}