import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import transactionReducer from './transactionSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions : transactionReducer
    // We will add the transactions slice here later!
  },
});

// Export types so TypeScript knows exactly what our store looks like
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;