import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCart, addCartItem, updateCartItemQty, removeCartItem, clearCartApi, CartDto } from "../../cart/services/cart.api";

export const fetchCart = createAsyncThunk<CartDto, { userId: string }>("cart/fetch", async ({ userId }) => {
  return await getCart(userId);
});

export const thunkAddItem = createAsyncThunk<CartDto, { userId: string; payload: { id: string; title: string; price: number; imageUrl?: string; quantity?: number } }>(
  "cart/addItem",
  async ({ userId, payload }) => {
    return await addCartItem(userId, payload);
  }
);

export const thunkSetQty = createAsyncThunk<CartDto, { userId: string; id: string; quantity: number }>(
  "cart/setQty",
  async ({ userId, id, quantity }) => {
    return await updateCartItemQty(userId, id, quantity);
  }
);

export const thunkRemove = createAsyncThunk<CartDto, { userId: string; id: string }>("cart/remove", async ({ userId, id }) => {
  return await removeCartItem(userId, id);
});

export const thunkClear = createAsyncThunk<CartDto, { userId: string }>("cart/clear", async ({ userId }) => {
  return await clearCartApi(userId);
});


