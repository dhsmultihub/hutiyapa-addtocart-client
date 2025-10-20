"use client";
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import AddressList from '../../features/address/components/AddressList';
import AddressForm from '../../features/address/components/AddressForm';
import { addAddress, removeAddress, selectAddress, updateAddress, Address } from '../../features/address/redux/address.slice';

export default function AddressesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const address = useSelector((s: RootState) => s.address);
  const [showForm, setShowForm] = useState(false);
  const [editDraft, setEditDraft] = useState<Address | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Your Addresses</h1>
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
        <div className="mt-6">
          <AddressForm 
            initial={editDraft ?? undefined}
            onCancel={()=>{ setShowForm(false); setEditDraft(null); }}
            onSubmit={(addr)=>{ if (editDraft) dispatch(updateAddress(addr)); else dispatch(addAddress(addr)); setShowForm(false); setEditDraft(null); }}
          />
        </div>
      )}
    </div>
  );
}
