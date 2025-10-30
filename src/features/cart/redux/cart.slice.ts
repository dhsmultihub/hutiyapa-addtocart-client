import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchCart, thunkAddItem, thunkSetQty, thunkRemove, thunkClear } from "./cart.thunks";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

type AddItemPayload = Omit<CartItem, "quantity"> & { quantity?: number };

type CartState = {
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  saved: CartItem[]; // saved for later (quantity kept as 1 for display)
  couponCode?: string;
  couponDiscount: number; // absolute amount discounted from subtotal
  giftCardCode?: string;
  giftCardAmountApplied: number; // absolute amount applied
};

const initialState: CartState = {
  items: [],
  subtotal: 0,
  totalQuantity: 0,
  saved: [],
  couponCode: undefined,
  couponDiscount: 0,
  giftCardCode: undefined,
  giftCardAmountApplied: 0,
};

function computeCouponDiscount(subtotal: number, code?: string) {
  if (!code) return 0;
  const c = code.trim().toUpperCase();
  if (c === 'SAVE10') return Math.round(subtotal * 0.10 * 100) / 100;
  if (c === 'FESTIVE20') return subtotal >= 100 ? Math.round(subtotal * 0.20 * 100) / 100 : 0;
  if (c === 'WELCOME50') return subtotal >= 200 ? 50 : 0;
  return 0;
}

function recalc(state: CartState) {
  state.subtotal = state.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  state.totalQuantity = state.items.reduce((sum, it) => sum + it.quantity, 0);
  // Re-evaluate discounts against current subtotal
  const newCouponDiscount = computeCouponDiscount(state.subtotal, state.couponCode);
  state.couponDiscount = newCouponDiscount;
  const maxApplicable = Math.max(0, state.subtotal - state.couponDiscount);
  if (state.giftCardAmountApplied > maxApplicable) {
    state.giftCardAmountApplied = maxApplicable;
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const { id, title, price, imageUrl, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ id, title, price, imageUrl, quantity });
      }
      recalc(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      recalc(state);
    },
    setQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const it = state.items.find((i) => i.id === action.payload.id);
      if (it) {
        it.quantity = Math.max(1, action.payload.quantity);
        recalc(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      recalc(state);
    },
    applyCoupon: (state, action: PayloadAction<string>) => {
      const code = action.payload.trim().toUpperCase();
      let discount = 0;
      // simple seasonal rules
      if (code === 'SAVE10') {
        discount = Math.round(state.subtotal * 0.10 * 100) / 100;
      } else if (code === 'FESTIVE20') {
        discount = state.subtotal >= 100 ? Math.round(state.subtotal * 0.20 * 100) / 100 : 0;
      } else if (code === 'WELCOME50') {
        discount = state.subtotal >= 200 ? 50 : 0;
      } else {
        discount = 0;
      }
      state.couponCode = discount > 0 ? code : undefined;
      state.couponDiscount = discount;
    },
    clearCoupon: (state) => {
      state.couponCode = undefined;
      state.couponDiscount = 0;
    },
    applyGiftCard: (state, action: PayloadAction<{ code: string; amount: number }>) => {
      const { code, amount } = action.payload;
      const maxApplicable = Math.max(0, state.subtotal - state.couponDiscount);
      const applied = Math.min(Math.max(0, Math.round(amount * 100) / 100), maxApplicable);
      state.giftCardCode = applied > 0 ? code.trim().toUpperCase() : undefined;
      state.giftCardAmountApplied = applied;
    },
    clearGiftCard: (state) => {
      state.giftCardCode = undefined;
      state.giftCardAmountApplied = 0;
    },
    saveForLater: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((i) => i.id === action.payload);
      if (idx !== -1) {
        const [it] = state.items.splice(idx, 1);
        // Normalize saved item quantity to 1 for display
        state.saved.push({ ...it, quantity: 1 });
        recalc(state);
      }
    },
    moveToCart: (state, action: PayloadAction<string>) => {
      const idx = state.saved.findIndex((i) => i.id === action.payload);
      if (idx !== -1) {
        const [it] = state.saved.splice(idx, 1);
        const existing = state.items.find((i) => i.id === it.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          state.items.push({ ...it, quantity: 1 });
        }
        recalc(state);
      }
    },
    removeSaved: (state, action: PayloadAction<string>) => {
      state.saved = state.saved.filter((i) => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    const hydrate = (state: CartState, items: CartItem[]) => {
      if (Array.isArray(items)) {
        state.items = items;
        state.subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
        state.totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
      }
    };

    // Handle fulfilled cases
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      if (action.payload?.items) {
        hydrate(state, action.payload.items);
      }
    });
    builder.addCase(thunkAddItem.fulfilled, (state, action) => {
      if (action.payload?.items) {
        hydrate(state, action.payload.items);
      }
    });
    builder.addCase(thunkSetQty.fulfilled, (state, action) => {
      if (action.payload?.items) {
        hydrate(state, action.payload.items);
      }
    });
    builder.addCase(thunkRemove.fulfilled, (state, action) => {
      if (action.payload?.items) {
        hydrate(state, action.payload.items);
      }
    });
    builder.addCase(thunkClear.fulfilled, (state, action) => {
      if (action.payload?.items) {
        hydrate(state, action.payload.items);
      }
    });

    // Handle rejected cases to prevent persist errors
    builder.addCase(fetchCart.rejected, (state, action) => {
      console.error('Failed to fetch cart:', action.error.message);
    });
    builder.addCase(thunkAddItem.rejected, (state, action) => {
      console.error('Failed to add item:', action.error.message);
    });
    builder.addCase(thunkSetQty.rejected, (state, action) => {
      console.error('Failed to set quantity:', action.error.message);
    });
    builder.addCase(thunkRemove.rejected, (state, action) => {
      console.error('Failed to remove item:', action.error.message);
    });
    builder.addCase(thunkClear.rejected, (state, action) => {
      console.error('Failed to clear cart:', action.error.message);
    });
  },
});

export const { addItem, removeItem, setQuantity, clearCart, saveForLater, moveToCart, removeSaved, applyCoupon, clearCoupon, applyGiftCard, clearGiftCard } = cartSlice.actions;
export default cartSlice.reducer;


