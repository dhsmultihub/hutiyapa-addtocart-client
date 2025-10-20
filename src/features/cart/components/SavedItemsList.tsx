import React from "react";
import { FiRefreshCcw, FiTrash2 } from "react-icons/fi";

type SavedItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

type Props = {
  items: SavedItem[];
  onMoveToCart: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function SavedItemsList({ items, onMoveToCart, onRemove }: Props) {
  if (!items?.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved for later</h3>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="text-sm text-gray-700 truncate">{it.title}</p>
              <p className="text-xs text-gray-500">€{it.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMoveToCart(it.id)}
                className="px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800"
              >
                Move to cart
              </button>
              <button
                onClick={() => onRemove(it.id)}
                className="p-2 text-gray-500 hover:text-red-600"
                aria-label="Remove saved item"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
