import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Transaction } from '../types';
import api from '../services/api';

// 1. Fetching
export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/transactions');
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.transactions)) return response.data.transactions;
    return [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch transactions');
  }
});

// 2. Adding
export const addTransaction = createAsyncThunk('transactions/add', async (transactionData: { amount: number; category: string; type: 'INCOME' | 'EXPENSE'; description?: string }, { rejectWithValue }) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data; 
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to add transaction');
  }
});

// 3. Deleting (With Spy Logs)
export const deleteTransaction = createAsyncThunk('transactions/delete', async (id: string, { rejectWithValue }) => {
  try {
    console.log(`🕵️‍♂️ Attempting to delete transaction ID: ${id}`);
    const response = await api.delete(`/transactions/${id}`);
    console.log('✅ BACKEND DELETE SUCCESS!', response.data);
    return id; 
  } catch (error: any) {
    console.error('❌ BACKEND DELETE FAILED!', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.error || 'Failed to delete transaction');
  }
});

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = { transactions: [], loading: false, error: null };

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTransactions.fulfilled, (state, action) => { state.loading = false; state.transactions = action.payload; })
      .addCase(fetchTransactions.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      // Remove deleted transaction from memory
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      });
  },
});

export default transactionSlice.reducer;