import React from "react";
import { FiShoppingBag } from "react-icons/fi";

export default function EmptyCart() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <FiShoppingBag className="w-16 h-16 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500">Add products to continue shopping.</p>
        <button className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200">
          Continue Shopping
        </button>
      </div>
    </div>
  );
}


