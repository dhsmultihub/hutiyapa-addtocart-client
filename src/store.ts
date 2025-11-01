import { configureStore, combineReducers, Reducer } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import cartReducer from "./features/cart/redux/cart.slice";
import addressReducer from "./features/address/redux/address.slice";
import authReducer from "./features/auth/redux/auth.slice";
import productsReducer from "./features/products/redux/products.slice";
import uiReducer from "./features/ui/redux/ui.slice";
import { cartTransform } from "./utils/persistTransforms";
import { api } from "./services/api";
import { loggerMiddleware, errorLoggerMiddleware, performanceMiddleware } from "./middleware/logger.middleware";
import { analyticsMiddleware, pageViewMiddleware, errorTrackingMiddleware } from "./middleware/analytics.middleware";

const rootReducer: Reducer = combineReducers({
  cart: cartReducer,
  address: addressReducer,
  auth: authReducer,
  products: productsReducer,
  ui: uiReducer,
  [api.reducerPath]: api.reducer,
});

// Dynamic import for storage to handle SSR
let storage: any;
if (typeof window !== 'undefined') {
  storage = require('redux-persist/lib/storage').default;
} else {
  storage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
}

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart", "address", "auth"],
  transforms: [cartTransform],
  serialize: true,
  timeout: 2000, // Reduced timeout for faster loading
  // Force reset for development
  version: 4, // Increment this to reset localStorage
  debug: false, // Disable debug to reduce console spam
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store: any = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['api'],
      },
      // Disable immutability check in development for better performance
      immutableCheck: false,
    })
      .concat(api.middleware)
      // Disable logger middleware to prevent console spam and performance issues
      // .concat(process.env.NODE_ENV === 'development' ? loggerMiddleware : [])
      .concat(errorLoggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor with error handling
export const persistor = persistStore(store, null, () => {
  console.log('Redux persist rehydration completed');
});

// Add error handler for persistor
persistor.subscribe(() => {
  const state = persistor.getState();
  if (state.bootstrapped && state.registry.length === 0) {
    console.log('All persist operations completed');
  }
});

export type RootState = any;
export type AppDispatch = typeof store.dispatch;


