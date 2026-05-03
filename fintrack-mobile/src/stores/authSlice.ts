import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';

// Define what our auth state looks like
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Set the default state for when the app first opens
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Call this when the user successfully logs in or registers
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    // Call this to log out
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

// Export the actions so we can trigger them from our screens
export const { setCredentials, logout } = authSlice.actions;

// Export the reducer to build the main store
export default authSlice.reducer;