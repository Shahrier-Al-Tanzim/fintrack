import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Budget } from '../types';
import api from '../services/api';

export const fetchBudgets = createAsyncThunk('budgets/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/budgets');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch budgets');
  }
});

export const addBudget = createAsyncThunk('budgets/add', async (budgetData: { amount: number; category?: string; duration?: string; accountId?: string }, { rejectWithValue }) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to add budget');
  }
});

export const updateBudget = createAsyncThunk('budgets/update', async ({ id, data }: { id: string; data: Partial<Budget> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update budget');
  }
});

export const deleteBudget = createAsyncThunk('budgets/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/budgets/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete budget');
  }
});

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = { budgets: [], loading: false, error: null };

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBudgets.fulfilled, (state, action) => { state.loading = false; state.budgets = action.payload; })
      .addCase(fetchBudgets.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addBudget.fulfilled, (state, action) => { state.budgets.push(action.payload); })
      .addCase(updateBudget.fulfilled, (state, action) => {
        const index = state.budgets.findIndex(b => b.id === action.payload.id);
        if (index !== -1) Object.assign(state.budgets[index], action.payload);
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.budgets = state.budgets.filter(b => b.id !== action.payload);
      });
  },
});

export default budgetSlice.reducer;
