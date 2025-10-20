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
import { cartTransform } from "./utils/persistTransforms";

const rootReducer: Reducer = combineReducers({
  cart: cartReducer,
  address: addressReducer,
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
  whitelist: ["cart", "address"],
  transforms: [cartTransform],
  serialize: true,
  timeout: 10000, // Add timeout to prevent hanging
  // Force reset for development
  version: 2, // Increment this to reset localStorage
  debug: process.env.NODE_ENV === 'development',
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          // Also ignore async thunk actions
          'cart/fetch/pending',
          'cart/fetch/fulfilled',
          'cart/fetch/rejected',
          'cart/addItem/pending',
          'cart/addItem/fulfilled',
          'cart/addItem/rejected',
          'cart/setQty/pending',
          'cart/setQty/fulfilled',
          'cart/setQty/rejected',
          'cart/remove/pending',
          'cart/remove/fulfilled',
          'cart/remove/rejected',
          'cart/clear/pending',
          'cart/clear/fulfilled',
          'cart/clear/rejected',
        ],
      },
    }),
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


