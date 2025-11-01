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
    // Only run once on mount
    let isMounted = true;
    
    console.log('🛒 Fetching cart from backend...');
    
    // VERY short timeout - initialize immediately if backend slow
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Cart fetch timeout - initializing with empty cart');
        setIsInitialized(true);
      }
    }, 2000); // 2 second timeout

    dispatch(fetchCart({ userId }))
      .unwrap()
      .then((cartData) => {
        if (isMounted) {
          clearTimeout(timeoutId);
          console.log('✅ Cart fetched successfully:', cartData);
          setIsInitialized(true);
        }
      })
      .catch((error) => {
        if (isMounted) {
          clearTimeout(timeoutId);
          console.warn('⚠️ Failed to fetch cart (using empty cart):', error?.message || error);
          setIsInitialized(true);
        }
      });
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty deps - only run once on mount

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
    add: (p: { id: string; title: string; price: number; imageUrl?: string; quantity?: number }) => {
      // Optimistic update: immediately add to Redux state
      dispatch(addItem(p));
      // Then sync with backend (fire and forget - don't wait)
      dispatch(thunkAddItem({ userId, payload: p })).catch((error) => {
        console.warn('⚠️ Backend sync failed, but item is in cart:', error?.message || error);
        // Optionally revert on critical error, but for now we keep it
      });
    },
    remove: (id: string) => {
      // Optimistic update
      dispatch(removeItem(id));
      dispatch(thunkRemove({ userId, id })).catch((error) => {
        console.warn('⚠️ Backend sync failed for remove:', error?.message || error);
      });
    },
    setQty: (id: string, quantity: number) => {
      // Optimistic update
      dispatch(setQuantity({ id, quantity }));
      dispatch(thunkSetQty({ userId, id, quantity })).catch((error) => {
        console.warn('⚠️ Backend sync failed for quantity update:', error?.message || error);
      });
    },
    clear: () => {
      // Optimistic update
      dispatch(clearCart());
      dispatch(thunkClear({ userId })).catch((error) => {
        console.warn('⚠️ Backend sync failed for clear:', error?.message || error);
      });
    },
    save: (id: string) => dispatch(saveForLater(id)),
    moveSavedToCart: (id: string) => dispatch(moveToCart(id)),
    removeSaved: (id: string) => dispatch(removeSaved(id)),
    applyCoupon: (code: string) => dispatch(applyCoupon(code)),
    clearCoupon: () => dispatch(clearCoupon()),
    applyGiftCard: (code: string, amount: number) => dispatch(applyGiftCard({ code, amount })),
    clearGiftCard: () => dispatch(clearGiftCard()),
  };
}


