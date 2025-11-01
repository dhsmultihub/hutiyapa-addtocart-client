import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import { addItem, removeItem, setQuantity, clearCart, saveForLater, moveToCart, removeSaved, applyCoupon, clearCoupon, applyGiftCard, clearGiftCard } from "../redux/cart.slice";
import { useEffect, useState } from "react";
import { fetchCart, thunkAddItem, thunkSetQty, thunkRemove, thunkClear } from "../redux/cart.thunks";

export function useCart() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal, totalQuantity, saved, couponCode, couponDiscount, giftCardCode, giftCardAmountApplied } = useSelector((s: RootState) => s.cart);
  
  // Get userId from localStorage (for development testing) or default to demo-user
  const getUserId = (): string => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dev_cart_user_id');
      return stored || 'demo-user';
    }
    return 'demo-user';
  };
  
  const [userId, setUserId] = useState<string>(getUserId());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Listen for userId changes in localStorage (from DevUserSelector)
  useEffect(() => {
    const handleStorageChange = () => {
      const newUserId = getUserId();
      if (newUserId !== userId) {
        setUserId(newUserId);
        // Re-fetch cart when user changes
        setIsInitialized(false);
        dispatch(fetchCart({ userId: newUserId }))
          .unwrap()
          .then(() => setIsInitialized(true))
          .catch(() => setIsInitialized(true));
      }
    };
    
    // Listen to storage events
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userId, dispatch]);

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


