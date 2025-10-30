import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import { addItem, removeItem, setQuantity, clearCart, saveForLater, moveToCart, removeSaved, applyCoupon, clearCoupon, applyGiftCard, clearGiftCard } from "../redux/cart.slice";
import { useEffect, useState } from "react";
import { fetchCart, thunkAddItem, thunkSetQty, thunkRemove, thunkClear } from "../redux/cart.thunks";

export function useCart() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal, totalQuantity, saved, couponCode, couponDiscount, giftCardCode, giftCardAmountApplied } = useSelector((s: RootState) => s.cart);
  const userId = "demo-user"; // replace with real user ID from auth when available
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Fetch cart from backend on mount
    if (!isInitialized) {
      console.log('🛒 Fetching cart from backend...');
      dispatch(fetchCart({ userId }))
        .unwrap()
        .then((cartData) => {
          console.log('✅ Cart fetched successfully:', cartData);
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error('❌ Failed to fetch cart:', error);
          // If fetch fails, initialize with empty cart
          setIsInitialized(true);
        });
    }
  }, [dispatch, userId, isInitialized]);

  return {
    items,
    saved,
    subtotal,
    totalQuantity,
    couponCode,
    couponDiscount,
    giftCardCode,
    giftCardAmountApplied,
    isLoading: !isInitialized,
    add: (p: { id: string; title: string; price: number; imageUrl?: string; quantity?: number }) =>
      dispatch(thunkAddItem({ userId, payload: p })),
    remove: (id: string) => dispatch(thunkRemove({ userId, id })),
    setQty: (id: string, quantity: number) => dispatch(thunkSetQty({ userId, id, quantity })),
    clear: () => dispatch(thunkClear({ userId })),
    save: (id: string) => dispatch(saveForLater(id)),
    moveSavedToCart: (id: string) => dispatch(moveToCart(id)),
    removeSaved: (id: string) => dispatch(removeSaved(id)),
    applyCoupon: (code: string) => dispatch(applyCoupon(code)),
    clearCoupon: () => dispatch(clearCoupon()),
    applyGiftCard: (code: string, amount: number) => dispatch(applyGiftCard({ code, amount })),
    clearGiftCard: () => dispatch(clearGiftCard()),
  };
}


