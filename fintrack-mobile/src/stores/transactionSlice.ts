import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Transaction } from '../types';
import api from '../services/api';

// 1. Fetching
export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (filters: any = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/transactions', { params: filters });
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

// 4. NEW: Updating
export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, data }: { id: string; data: Partial<Transaction> }, { rejectWithValue }) => {
    try {
      console.log(`📝 Attempting to update transaction ID: ${id}`);
      const response = await api.put(`/transactions/${id}`, data);
      console.log('✅ BACKEND UPDATE SUCCESS!', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ BACKEND UPDATE FAILED!', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to update transaction');
    }
  }
);


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
      })
      
      // NEW: Update transaction in memory
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          // Replace the old transaction data with the newly updated data from the server
          state.transactions[index] = action.payload;
        }
      });
  },
});

export default transactionSlice.reducer;