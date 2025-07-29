import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer from './portfolioSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 