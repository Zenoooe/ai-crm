import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice.ts';
import contactsSlice from './slices/contactsSlice.ts';
import interactionsSlice from './slices/interactionsSlice.ts';
import aiSlice from './slices/aiSlice.ts';
import { api } from './api/api.ts';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    contacts: contactsSlice,
    interactions: interactionsSlice,
    ai: aiSlice,
    api: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;