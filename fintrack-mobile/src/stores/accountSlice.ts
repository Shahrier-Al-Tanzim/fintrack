import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Account } from '../types';
import api from '../services/api';

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/accounts');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch accounts');
  }
});

export const addAccount = createAsyncThunk('accounts/add', async (accountData: { name: string; balance?: number; icon?: string }, { rejectWithValue }) => {
  try {
    const response = await api.post('/accounts', accountData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to add account');
  }
});

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, data }: { id: string; data: Partial<Account> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to update account');
  }
});

export const deleteAccount = createAsyncThunk('accounts/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/accounts/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Failed to delete account');
  }
});

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = { accounts: [], loading: false, error: null };

const accountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAccounts.fulfilled, (state, action) => { state.loading = false; state.accounts = action.payload; })
      .addCase(fetchAccounts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addAccount.fulfilled, (state, action) => { state.accounts.push(action.payload); })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.accounts.findIndex(a => a.id === action.payload.id);
        if (index !== -1) Object.assign(state.accounts[index], action.payload);
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(a => a.id !== action.payload);
      });
  },
});

export default accountSlice.reducer;
