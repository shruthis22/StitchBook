import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

import authReducer from './authSlice';
import stitchbookReducer from './stitchbookSlice';

const persistConfig = {
  key: 'stitchbook_root',
  storage: AsyncStorage,
  whitelist: ['auth', 'stitchbook'], // Persist auth and cached data
};

const rootReducer = combineReducers({
  auth: authReducer,
  stitchbook: stitchbookReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;