"use client";
import React, { useState } from "react";
import { Address } from "../redux/address.slice";

type Props = {
  list: Address[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onEdit: (addr: Address) => void;
  onRemove: (id: string) => void;
};

export default function AddressList({ list, selectedId, onSelect, onEdit, onRemove }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!list?.length) return <p className="text-sm text-gray-600">No addresses yet.</p>;
  return (
    <div className="space-y-2">
      {list.map((a) => (
        <div key={a.id} className={`border rounded p-3 ${selectedId===a.id? 'border-black':'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="radio" name="address" checked={selectedId===a.id} onChange={()=>onSelect(a.id)} />
              <span className="font-medium">{a.fullName}</span>
            </label>
            <div className="flex items-center gap-2">
              <button className="text-xs underline" onClick={()=>onEdit(a)}>Edit</button>
              <button className="text-xs text-red-600 underline" onClick={()=>onRemove(a.id)}>Delete</button>
              <button className="text-xs underline" onClick={()=>setExpandedId(expandedId===a.id? null : a.id)}>{expandedId===a.id? 'Hide' : 'Details'}</button>
            </div>
          </div>
          {expandedId===a.id && (
            <div className="mt-2 text-sm text-gray-700">
              <div>{a.line1}{a.line2? `, ${a.line2}`: ''}</div>
              <div>{a.city}, {a.state} {a.zip}</div>
              <div>{a.country}</div>
              <div className="text-gray-500">{a.phone}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
