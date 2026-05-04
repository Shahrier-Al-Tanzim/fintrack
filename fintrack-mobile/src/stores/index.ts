import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import transactionReducer from './transactionSlice';
import accountReducer from './accountSlice';
import budgetReducer from './budgetSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    accounts: accountReducer,
    budgets: budgetReducer,
  },
});

// Export types so TypeScript knows exactly what our store looks like
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;