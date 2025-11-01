import React from "react";
import { FiX } from "react-icons/fi";
import { formatCurrency } from "../../../utils/currency";

type Props = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  color?: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
};

const getProductImage = (title: string, color?: string) => {
  // Mock product images based on title and color
  const colorClass = color === "Maroon" ? "bg-red-100" : 
                     color === "Grey" ? "bg-gray-100" : 
                     color === "Black" ? "bg-gray-100" : "bg-red-800";
  
  return (
    <div className={`w-full h-full ${colorClass} rounded-lg flex items-center justify-center`}>
      <div className="w-8 sm:w-12 h-10 sm:h-16 bg-white bg-opacity-20 rounded"></div>
    </div>
  );
};

export default function CartItemCard({ 
  id, 
  title, 
  price, 
  imageUrl, 
  quantity, 
  color = "Maroon", 
  onIncrease, 
  onDecrease, 
  onRemove,
  onSaveForLater,
}: Props) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" 
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20">
            {getProductImage(title, color)}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">{color}</p>
        <h3 className="font-medium text-gray-900 mt-1 text-sm sm:text-base truncate">{title}</h3>
        
        {/* Mobile: Price shown here for small screens */}
        <div className="sm:hidden mt-1">
          <div className="font-semibold text-base text-gray-900">{formatCurrency(price)}</div>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
          <button 
            onClick={onDecrease}
            className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded flex items-center justify-center text-lg hover:bg-gray-50 font-light touch-friendly active:bg-gray-100"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center font-medium text-sm sm:text-base">{quantity}</span>
          <button 
            onClick={onIncrease}
            className="w-8 h-8 sm:w-9 sm:h-9 border border-gray-300 rounded flex items-center justify-center text-lg hover:bg-gray-50 font-light touch-friendly active:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Price and Remove - Desktop */}
      <div className="hidden sm:flex flex-col items-end gap-2">
        <div className="font-semibold text-lg text-gray-900">{formatCurrency(price)}</div>
        {onSaveForLater && (
          <button 
            onClick={onSaveForLater}
            className="text-xs text-blue-600 hover:underline"
          >
            Save for later
          </button>
        )}
        <button 
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600 p-1 touch-friendly"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Remove button - Mobile */}
      <div className="sm:hidden">
        <button 
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600 p-2 touch-friendly"
        >
          <FiX size={18} />
        </button>
        {onSaveForLater && (
          <div className="mt-1">
            <button 
              onClick={onSaveForLater}
              className="text-xs text-blue-600 hover:underline"
            >
              Save for later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


