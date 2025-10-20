"use client";
import React, { useMemo, useState } from "react";
import { Address } from "../redux/address.slice";

type Props = {
  initial?: Partial<Address>;
  onSubmit: (addr: Address) => void;
  onCancel?: () => void;
};

export default function AddressForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<Address>({
    id: initial?.id || `addr-${Math.random().toString(36).slice(2, 8)}`,
    fullName: initial?.fullName || "",
    phone: initial?.phone || "",
    line1: initial?.line1 || "",
    line2: initial?.line2 || "",
    city: initial?.city || "",
    state: initial?.state || "",
    zip: initial?.zip || "",
    country: initial?.country || "India",
  });

  const isValid = useMemo(() => {
    return (
      form.fullName.trim().length >= 2 &&
      /\d{10,}/.test(form.phone.replace(/\D/g, "")) &&
      form.line1.trim().length > 3 &&
      form.city.trim().length > 1 &&
      form.state.trim().length > 0 &&
      /\d{5,6}/.test(form.zip)
    );
  }, [form]);

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(form);
      }}
    >
      <input className="border p-2 rounded" placeholder="Full name" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} />
      <input className="border p-2 rounded" placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
      <input className="border p-2 rounded sm:col-span-2" placeholder="Address line 1" value={form.line1} onChange={(e)=>setForm({...form, line1:e.target.value})} />
      <input className="border p-2 rounded sm:col-span-2" placeholder="Address line 2 (optional)" value={form.line2} onChange={(e)=>setForm({...form, line2:e.target.value})} />
      <input className="border p-2 rounded" placeholder="City" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} />
      <input className="border p-2 rounded" placeholder="State" value={form.state} onChange={(e)=>setForm({...form, state:e.target.value})} />
      <input className="border p-2 rounded" placeholder="ZIP" value={form.zip} onChange={(e)=>setForm({...form, zip:e.target.value})} />
      <input className="border p-2 rounded" placeholder="Country" value={form.country} onChange={(e)=>setForm({...form, country:e.target.value})} />
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
        )}
        <button disabled={!isValid} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" type="submit">Save address</button>
      </div>
    </form>
  );
}
