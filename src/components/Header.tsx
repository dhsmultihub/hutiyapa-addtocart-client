"use client";
import React from "react";
import { FiSearch, FiHeart, FiShoppingBag } from "react-icons/fi";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export default function Header() {
  const totalQuantity = useSelector((s: RootState) => s.cart.totalQuantity);
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center">
          <div className="bg-red-600 text-white px-3 py-1 text-lg font-bold rounded">
            Hutiyapa
          </div>
        </div>

        {/* Center - Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
            Jeans
          </a>
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
            Women
          </a>
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
            Men
          </a>
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
            Kids
          </a>
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
            501® Original
          </a>
          <a href="#" className="text-gray-900 hover:text-gray-600 font-medium">
          </a>
        </nav>

        {/* Right - Icons */}
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <FiSearch size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <FiHeart size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-gray-100 rounded relative">
            <FiShoppingBag size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalQuantity}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}