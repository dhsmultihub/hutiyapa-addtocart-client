import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { formatCurrency } from "../../../utils/currency";

type Props = {
  subtotal: number;
  totalQuantity: number;
  couponCode?: string;
  couponDiscount: number;
  giftCardCode?: string;
  giftCardAmountApplied: number;
  onApplyCoupon: (code: string) => void;
  onClearCoupon: () => void;
  onApplyGiftCard: (code: string, amount: number) => void;
  onClearGiftCard: () => void;
  onCheckout: () => void;
  onClear: () => void;
};

export default function CartSummary({ subtotal, totalQuantity, couponCode, couponDiscount, giftCardCode, giftCardAmountApplied, onApplyCoupon, onClearCoupon, onApplyGiftCard, onClearGiftCard, onCheckout, onClear }: Props) {
  const [couponInput, setCouponInput] = useState(couponCode || "");
  const [giftCardInput, setGiftCardInput] = useState(giftCardCode || "");
  const [giftCardAmount, setGiftCardAmount] = useState<string>(giftCardAmountApplied ? String(giftCardAmountApplied) : "");
  const [shippingOption, setShippingOption] = useState("standard");
  
  const shippingCost = shippingOption === "standard" ? 500.00 : 0; // ₹500 for standard delivery in INR
  const afterCoupon = Math.max(0, subtotal - (couponDiscount || 0));
  const afterGift = Math.max(0, afterCoupon - (giftCardAmountApplied || 0));
  const total = afterGift + shippingCost;

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg sticky top-4">
      <h3 className="font-semibold text-lg sm:text-xl mb-4 sm:mb-6">Summary</h3>
      
      {/* Items Count */}
      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
        <span className="text-gray-600 text-sm sm:text-base">ITEMS {totalQuantity}</span>
        <span className="font-semibold text-sm sm:text-base">{formatCurrency(subtotal)}</span>
      </div>
      
      {/* Shipping */}
      <div className="py-3 sm:py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <span className="text-gray-600 text-sm sm:text-base">SHIPPING</span>
        </div>
        <div className="relative">
          <select 
            value={shippingOption}
            onChange={(e) => setShippingOption(e.target.value)}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md appearance-none bg-white pr-8 sm:pr-10 text-xs sm:text-sm touch-friendly"
          >
            <option value="standard">Standard Delivery - ₹500.00</option>
            <option value="free">Free Delivery - ₹0.00</option>
          </select>
          <FiChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
        </div>
      </div>
      
      {/* Coupon Code */}
      <div className="py-3 sm:py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <span className="text-gray-600 text-sm sm:text-base">COUPON</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-md text-xs sm:text-sm placeholder-gray-400 touch-friendly"
          />
          <button
            onClick={() => onApplyCoupon(couponInput)}
            className="px-3 py-2 bg-black text-white rounded text-xs sm:text-sm"
          >
            Apply
          </button>
          {couponCode && (
            <button onClick={onClearCoupon} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm">
              Remove
            </button>
          )}
        </div>
        {couponCode && (
          <p className="text-xs text-green-700 mt-2">Applied {couponCode}: -{formatCurrency(couponDiscount)}</p>
        )}
      </div>

      {/* Gift Card */}
      <div className="py-3 sm:py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <span className="text-gray-600 text-sm sm:text-base">GIFT CARD</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Gift card code"
            value={giftCardInput}
            onChange={(e) => setGiftCardInput(e.target.value)}
            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-md text-xs sm:text-sm placeholder-gray-400 touch-friendly"
          />
          <input
            type="number"
            placeholder="Amount"
            value={giftCardAmount}
            onChange={(e) => setGiftCardAmount(e.target.value)}
            className="w-28 p-2 sm:p-3 border border-gray-300 rounded-md text-xs sm:text-sm placeholder-gray-400 touch-friendly"
            min={0}
          />
          <button
            onClick={() => onApplyGiftCard(giftCardInput, Number(giftCardAmount || 0))}
            className="px-3 py-2 bg-black text-white rounded text-xs sm:text-sm"
          >
            Apply
          </button>
          {giftCardCode && (
            <button onClick={onClearGiftCard} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm">
              Remove
            </button>
          )}
        </div>
        {giftCardCode && (
          <p className="text-xs text-green-700 mt-2">Applied {giftCardCode}: -{formatCurrency(giftCardAmountApplied)}</p>
        )}
      </div>
      
      {/* Totals */}
      <div className="py-3 sm:py-4 mb-4 sm:mb-6">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-semibold">TOTAL PRICE</span>
          <span className="text-lg sm:text-xl font-bold">{formatCurrency(total)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Coupon discount</span>
            <span>-{formatCurrency(couponDiscount)}</span>
          </div>
        )}
        {giftCardAmountApplied > 0 && (
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Gift card</span>
            <span>-{formatCurrency(giftCardAmountApplied)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Shipping</span>
          <span>{formatCurrency(shippingCost)}</span>
        </div>
      </div>
      
      {/* Checkout Button */}
      <button 
        onClick={onCheckout}
        className="w-full bg-black hover:bg-gray-800 active:bg-gray-900 text-white font-semibold py-3 sm:py-4 px-4 rounded-md transition-colors duration-200 text-base sm:text-lg touch-friendly"
      >
        CHECKOUT
      </button>
    </div>
  );
}


