import { createTransform } from 'redux-persist';
import { CartItem } from '../features/cart/redux/cart.slice';

// Transform to ensure cart items are properly serialized
export const cartTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState: any) => {
    // Ensure all items are plain objects
    const items = Array.isArray(inboundState.items) 
      ? inboundState.items.map((item: CartItem) => ({
          id: String(item.id || ''),
          title: String(item.title || ''),
          price: Number(item.price || 0),
          imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
          quantity: Number(item.quantity || 0),
        }))
      : [];

    const saved = Array.isArray(inboundState.saved)
      ? inboundState.saved.map((item: CartItem) => ({
          id: String(item.id || ''),
          title: String(item.title || ''),
          price: Number(item.price || 0),
          imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
          quantity: Number(item.quantity || 0),
        }))
      : [];

    return {
      items,
      saved,
      subtotal: Number(inboundState.subtotal || 0),
      totalQuantity: Number(inboundState.totalQuantity || 0),
      couponCode: inboundState.couponCode ? String(inboundState.couponCode) : undefined,
      couponDiscount: Number(inboundState.couponDiscount || 0),
      giftCardCode: inboundState.giftCardCode ? String(inboundState.giftCardCode) : undefined,
      giftCardAmountApplied: Number(inboundState.giftCardAmountApplied || 0),
    };
  },
  
  // Transform state being rehydrated
  (outboundState: any) => {
    // Ensure the state structure is valid
    return {
      items: Array.isArray(outboundState?.items) ? outboundState.items : [],
      saved: Array.isArray(outboundState?.saved) ? outboundState.saved : [],
      subtotal: Number(outboundState?.subtotal || 0),
      totalQuantity: Number(outboundState?.totalQuantity || 0),
      couponCode: outboundState?.couponCode ? String(outboundState.couponCode) : undefined,
      couponDiscount: Number(outboundState?.couponDiscount || 0),
      giftCardCode: outboundState?.giftCardCode ? String(outboundState.giftCardCode) : undefined,
      giftCardAmountApplied: Number(outboundState?.giftCardAmountApplied || 0),
    };
  },
  
  // Define which reducer this transform is for
  { whitelist: ['cart'] }
);