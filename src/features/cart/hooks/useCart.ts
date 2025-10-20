import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import { addItem, removeItem, setQuantity, clearCart, saveForLater, moveToCart, removeSaved, applyCoupon, clearCoupon, applyGiftCard, clearGiftCard } from "../redux/cart.slice";
import { useEffect } from "react";
import { fetchCart, thunkAddItem, thunkSetQty, thunkRemove, thunkClear } from "../redux/cart.thunks";

export function useCart() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal, totalQuantity, saved, couponCode, couponDiscount, giftCardCode, giftCardAmountApplied } = useSelector((s: RootState) => s.cart);
  const userId = "demo-user"; // replace with real user ID from auth when available

  useEffect(() => {
    // If cart is empty, add demo items
    if (items.length === 0) {
      dispatch(addItem({ 
        id: 'sku-101', 
        title: '501® Men\'s Fit Jeans - Adv Stretch', 
        price: 119.90, 
        quantity: 1 
      }));
      dispatch(addItem({ 
        id: 'sku-202', 
        title: 'Long Sleeve Graphic Tee', 
        price: 49.90, 
        quantity: 1 
      }));
      dispatch(addItem({ 
        id: 'sku-303', 
        title: 'Levi\'s® Wellthread™ Sweatshirt', 
        price: 79.90, 
        quantity: 1 
      }));
    }
  }, [dispatch, items.length]);

  return {
    items,
    saved,
    subtotal,
    totalQuantity,
  couponCode,
  couponDiscount,
  giftCardCode,
  giftCardAmountApplied,
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


