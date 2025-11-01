"use client";
import React from "react";
import { useCart } from "../hooks/useCart";
import CartItemCard from "../components/CartItemCard";
import CartSummary from "../components/CartSummary";
import SavedItemsList from "../components/SavedItemsList";
import EmptyCart from "../components/EmptyCart";
import { FiArrowLeft } from "react-icons/fi";
import { CartItem } from "../redux/cart.slice";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, saved, subtotal, totalQuantity, couponCode, couponDiscount, giftCardCode, giftCardAmountApplied, isLoading, add, remove, setQty, clear, save, moveSavedToCart, removeSaved, applyCoupon, clearCoupon, applyGiftCard, clearGiftCard } = useCart();

  // Show loading state while cart is being fetched
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 bg-white min-h-screen">
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Cart Items - Left Side */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button className="p-2 hover:bg-gray-100 rounded-full touch-friendly">
              <FiArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Shopping Cart</h1>
            <span className="text-gray-500 text-base sm:text-lg">{totalQuantity} Items</span>
          </div>

          {/* Items List */}
          <div className="space-y-6">
            {items.map((item: CartItem) => (
              <CartItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                imageUrl={item.imageUrl}
                quantity={item.quantity}
                onIncrease={() => add({ id: item.id, title: item.title, price: item.price, imageUrl: item.imageUrl, quantity: 1 })}
                onDecrease={() => setQty(item.id, item.quantity - 1)}
                onRemove={() => remove(item.id)}
                onSaveForLater={() => save(item.id)}
              />
            ))}
            <SavedItemsList 
              items={saved} 
              onMoveToCart={moveSavedToCart} 
              onRemove={removeSaved} 
            />
          </div>

          {/* Back to Shop */}
          <div className="mt-8">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <FiArrowLeft size={16} />
              <span>Back to shop</span>
            </button>
          </div>
        </div>

        {/* Summary - Right Side */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={subtotal}
            totalQuantity={totalQuantity}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            giftCardCode={giftCardCode}
            giftCardAmountApplied={giftCardAmountApplied}
            onApplyCoupon={applyCoupon}
            onClearCoupon={clearCoupon}
            onApplyGiftCard={applyGiftCard}
            onClearGiftCard={clearGiftCard}
            onCheckout={() => router.push('/checkout')}
            onClear={() => clear()}
          />
        </div>
      </div>
    </div>
  );
}


