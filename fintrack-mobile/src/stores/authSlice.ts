import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import api from '../services/api';

// 1. The Async Thunk for Registration
export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Your backend likely returns { user, token }
      return response.data;
    } catch (error: any) {
      // Pass the backend error message and details (e.g., password complexity issues)
      const errorData = {
        message: error.response?.data?.error || 'Registration failed',
        details: error.response?.data?.details || []
      };
      return rejectWithValue(errorData);
    }
  }
);

// Define what our auth state looks like
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean; // NEW: Track if we are currently talking to the server
  error: string | null; // NEW: Track any error messages
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    // Clear any leftover error messages when switching screens
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle the "Loading" state
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle "Success"
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        // Optional: Log them in immediately if your backend returns a token on register
        // state.user = action.payload.user;
        // state.token = action.payload.token;
        // state.isAuthenticated = true;
      })
      // Handle "Error"
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload?.details?.length > 0) {
          // If there are specific validation issues, combine them
          state.error = `${payload.message}: ${payload.details.map((d: any) => d.message).join(', ')}`;
        } else {
          state.error = payload?.message || 'Registration failed';
        }
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;