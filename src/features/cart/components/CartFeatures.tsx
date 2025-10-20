import React from "react";
import { FiShield, FiTruck, FiHeadphones } from "react-icons/fi";

export default function CartFeatures() {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Safe Payment */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FiShield className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Safe payment</span>
          </div>

          {/* Free Delivery & Returns */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FiTruck className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Free delivery & returns*</span>
          </div>

          {/* Full Support */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <FiHeadphones className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Full support</span>
          </div>
        </div>
      </div>
    </div>
  );
}