"use client";
import React, { useState, useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useDispatch } from "react-redux";
import { fetchCart } from "../redux/cart.thunks";
import type { AppDispatch } from "../../../store";
import { getUsersWithCarts } from "../services/cart.api";

type UserWithCart = {
  userId: string | null;
  sessionId?: string;
  itemCount: number;
  total?: number;
  cartId?: string;
};

export default function DevUserSelector() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, totalQuantity } = useCart();
  const [userId, setUserId] = useState<string>("demo-user");
  const [inputValue, setInputValue] = useState<string>("demo-user");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [usersFromDB, setUsersFromDB] = useState<UserWithCart[]>([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load userId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dev_cart_user_id");
    if (stored) {
      setUserId(stored);
      setInputValue(stored);
    }
  }, []);

  // Save userId to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("dev_cart_user_id", userId);
  }, [userId]);

  // Load users from database on mount
  useEffect(() => {
    loadUsersFromDB();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUsersList && !target.closest('.user-dropdown-container')) {
        setShowUsersList(false);
      }
    };

    if (showUsersList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUsersList]);

  const loadUsersFromDB = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsersWithCarts();
      // Filter out null userIds and sort by itemCount desc
      const validUsers = data.users
        .filter((u) => u.userId !== null && u.userId !== undefined)
        .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
      setUsersFromDB(validUsers);
    } catch (error) {
      console.error("Failed to load users from database:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = async (selectedUserId: string) => {
    setShowUsersList(false);
    setInputValue(selectedUserId);
    
    // Immediately switch to selected user (no setTimeout)
    setIsLoading(true);
    setMessage("🔄 Loading cart for user...");

    try {
      // Update localStorage first
      localStorage.setItem("dev_cart_user_id", selectedUserId);
      
      // Fetch cart for the selected userId
      await dispatch(fetchCart({ userId: selectedUserId })).unwrap();
      setUserId(selectedUserId);
      
      // Trigger custom event for same-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dev_cart_user_id',
        newValue: selectedUserId,
        storageArea: localStorage
      }));
      
      setMessage(`✅ Cart loaded for user: ${selectedUserId}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to load cart: ${error?.message || "Unknown error"}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = async (userIdToUse?: string) => {
    const newUserId = userIdToUse || inputValue.trim();
    
    if (!newUserId) {
      setMessage("⚠️ Please enter a valid User ID");
      return;
    }
    
    setIsLoading(true);
    setMessage("🔄 Loading cart for user...");

    try {
      // First update localStorage to trigger useCart hook update
      localStorage.setItem("dev_cart_user_id", newUserId);
      
      // Then fetch cart for the new userId
      await dispatch(fetchCart({ userId: newUserId })).unwrap();
      setUserId(newUserId);
      
      // Trigger custom event for same-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dev_cart_user_id',
        newValue: newUserId,
        storageArea: localStorage
      }));
      
      setMessage(`✅ Cart loaded for user: ${newUserId}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to load cart: ${error?.message || "Unknown error"}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setMessage("🔄 Refreshing cart...");

    try {
      await dispatch(fetchCart({ userId })).unwrap();
      setMessage("✅ Cart refreshed successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to refresh cart: ${error?.message || "Unknown error"}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b-2 border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">
              🧪 Dev Mode:
            </span>
            <span className="text-sm text-gray-700">
              Current User: <span className="font-semibold text-gray-900">{userId}</span>
            </span>
            {totalQuantity > 0 && (
              <span className="text-xs text-gray-600">
                ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
              </span>
            )}
          </div>

          {/* User ID Input with Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
            <div className="flex-1 relative user-dropdown-container">
              <input
                type="text"
                placeholder="Enter User ID or select from DB"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowUsersList(true);
                }}
                onFocus={() => setShowUsersList(true)}
                onKeyPress={(e) => e.key === "Enter" && handleSwitchUser()}
                className="w-full px-3 py-1.5 text-sm border border-yellow-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={isLoading}
              />
              
              {/* Users Dropdown */}
              {showUsersList && usersFromDB.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-yellow-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Users from Database:</span>
                      <button
                        onClick={() => setShowUsersList(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {usersFromDB.map((user, index) => (
                    <button
                      key={user.userId || index}
                      onClick={() => handleSelectUser(user.userId!)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{user.userId}</span>
                        <span className="text-xs text-gray-600">
                          {user.itemCount} {user.itemCount === 1 ? "item" : "items"}
                          {user.total && user.total > 0 && ` • ₹${user.total.toFixed(2)}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSwitchUser()}
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isLoading ? "Loading..." : "Switch User"}
            </button>
          </div>
          
          {/* Load Users Button */}
          <button
            onClick={loadUsersFromDB}
            disabled={loadingUsers}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            title="Load users from database"
          >
            {loadingUsers ? "..." : "📋 Load from DB"}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            🔄 Refresh
          </button>

          {/* Message */}
          {message && (
            <div className="w-full text-xs mt-1 px-2 py-1 rounded bg-white border border-yellow-300">
              {message}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2 text-xs text-gray-600">
          💡 <strong>Tip:</strong> Click "📋 Load from DB" to see all users with carts, then select from dropdown to test.
          {usersFromDB.length > 0 && (
            <span className="ml-2 text-green-700">
              Found <strong>{usersFromDB.length}</strong> {usersFromDB.length === 1 ? "user" : "users"} with carts in database.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

