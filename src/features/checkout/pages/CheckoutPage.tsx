"use client";
import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../store";
import AddressList from "../../address/components/AddressList";
import AddressForm from "../../address/components/AddressForm";
import { addAddress, selectAddress, removeAddress, updateAddress, Address } from "../../address/redux/address.slice";

export default function CheckoutPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, subtotal, couponDiscount, giftCardAmountApplied } = useSelector((s: RootState) => s.cart);
  const address = useSelector((s: RootState) => s.address);
  const [showForm, setShowForm] = useState(false);
  const [editDraft, setEditDraft] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI'|'CARD'|'NETBANKING'>('UPI');

  const total = useMemo(() => {
    const afterCoupon = Math.max(0, subtotal - (couponDiscount || 0));
    const afterGift = Math.max(0, afterCoupon - (giftCardAmountApplied || 0));
    return afterGift + 5; // standard shipping for demo
  }, [subtotal, couponDiscount, giftCardAmountApplied]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Section */}
          <section className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Delivery Address</h2>
              <button className="text-sm underline" onClick={()=>{ setEditDraft(null); setShowForm(true); }}>Add new</button>
            </div>
            <AddressList
              list={address.list}
              selectedId={address.selectedId}
              onSelect={(id)=>dispatch(selectAddress(id))}
              onEdit={(addr)=>{ setEditDraft(addr); setShowForm(true); }}
              onRemove={(id)=>dispatch(removeAddress(id))}
            />
            {showForm && (
              <div className="mt-4">
                <AddressForm
                  initial={editDraft ?? undefined}
                  onCancel={()=>{ setShowForm(false); setEditDraft(null); }}
                  onSubmit={(addr)=>{
                    if (editDraft) dispatch(updateAddress(addr)); else dispatch(addAddress(addr));
                    setShowForm(false); setEditDraft(null);
                  }}
                />
              </div>
            )}
          </section>

          {/* Payment Section */}
          <section className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-3">Payment</h2>
            <div className="flex gap-4 mb-4">
              {(['UPI','CARD','NETBANKING'] as const).map(m => (
                <label key={m} className={`px-3 py-2 border rounded cursor-pointer ${paymentMethod===m? 'border-black':'border-gray-300'}`}>
                  <input type="radio" className="mr-2" checked={paymentMethod===m} onChange={()=>setPaymentMethod(m)} />
                  {m}
                </label>
              ))}
            </div>
            {paymentMethod==='UPI' && (
              <div className="space-y-2">
                <input className="border p-2 rounded w-full" placeholder="UPI ID (e.g. name@upi)" />
                <button className="px-4 py-2 bg-black text-white rounded">Pay with UPI</button>
              </div>
            )}
            {paymentMethod==='CARD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="border p-2 rounded sm:col-span-2" placeholder="Card number" />
                <input className="border p-2 rounded" placeholder="MM/YY" />
                <input className="border p-2 rounded" placeholder="CVV" />
                <input className="border p-2 rounded sm:col-span-2" placeholder="Name on card" />
                <button className="px-4 py-2 bg-black text-white rounded sm:col-span-2">Pay with Card</button>
              </div>
            )}
            {paymentMethod==='NETBANKING' && (
              <div className="space-y-2">
                <select className="border p-2 rounded w-full">
                  <option>Choose bank</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>SBI</option>
                  <option>Axis Bank</option>
                </select>
                <button className="px-4 py-2 bg-black text-white rounded">Proceed to Bank</button>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <aside className="border rounded-lg p-4 h-fit sticky top-4">
          <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
          <div className="text-sm text-gray-700">
            <div className="flex justify-between py-1"><span>Items</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between py-1"><span>Coupon</span><span>-₹{(couponDiscount||0).toFixed(2)}</span></div>
            <div className="flex justify-between py-1"><span>Gift card</span><span>-₹{(giftCardAmountApplied||0).toFixed(2)}</span></div>
            <div className="flex justify-between py-1"><span>Shipping</span><span>₹5.00</span></div>
            <div className="flex justify-between py-2 font-semibold border-t mt-2"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          <button className="mt-3 w-full bg-black text-white rounded py-2">Place Order</button>
        </aside>
      </div>
    </div>
  );
}
