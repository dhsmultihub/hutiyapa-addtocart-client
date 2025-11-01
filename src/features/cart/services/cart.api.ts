import axios, { AxiosInstance } from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_CART_API_BASE_URL || 'http://localhost:8002/api/v1';
if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_CART_API_BASE_URL is not defined in environment");
}

let client: AxiosInstance | null = null;
let sessionToken: string | null = null;
let isCreatingSession = false; // Prevent infinite loop

// Initialize or retrieve session token
async function getOrCreateSessionToken(): Promise<string> {
  // If already have token in memory, return it
  if (sessionToken) {
    return sessionToken;
  }

  if (typeof window !== 'undefined') {
    // Try to get from localStorage
    const stored = localStorage.getItem('cart_session_token');
    if (stored) {
      sessionToken = stored;
      return stored;
    }
  }

  // Prevent circular calls
  if (isCreatingSession) {
    const fallbackToken = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return fallbackToken;
  }

  isCreatingSession = true;

  // Create new session with backend (with timeout to prevent blocking)
  try {
    // Create a simple axios instance WITHOUT interceptors for session creation
    const simpleClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 2000,
    });

    const res = await simpleClient.post("/cart/session", null, {
      headers: { "x-user-id": "guest_" + Date.now() },
    });

    if (res?.data?.sessionToken) {
      sessionToken = res.data.sessionToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_session_token', sessionToken);
      }
      isCreatingSession = false;
      return sessionToken;
    }
  } catch (error) {
    // Silently fail - we'll use fallback token
    console.warn('Failed to create session (using fallback):', error?.message || 'Unknown error');
  }

  isCreatingSession = false;

  // Fallback: generate client-side session token
  const fallbackToken = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionToken = fallbackToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart_session_token', fallbackToken);
  }
  return fallbackToken;
}

function getClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
    timeout: 3000, // Reduced from 10s to 3s to prevent blocking
  });

  // Add request interceptor to include session token (simplified)
  client.interceptors.request.use((config) => {
    // Use existing token or create a simple fallback (synchronous)
    let token = sessionToken;

    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('cart_session_token');
    }

    if (!token) {
      token = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionToken = token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_session_token', token);
      }
    }

    config.headers['x-session-token'] = token;
    return config;
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        // Log warning instead of error since we have optimistic updates
        console.warn('⚠️ API Error (UI will still update):', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          error: error.response?.data,
        });
      }

      // If unauthorized, try to recreate session
      if (error.response?.status === 401) {
        sessionToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart_session_token');
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    const res = await getClient().get("/cart/health");
    return res.data as { status: string; timestamp: string };
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', timestamp: new Date().toISOString() };
  }
}

export type CartItemDto = {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  quantity: number;
  addedAt?: string;
  updatedAt?: string;
};

export type CartDto = {
  id?: string;
  items: CartItemDto[];
  subtotal?: number;
  totalQuantity?: number;
  status?: string;
};

export async function getCart(userId: string): Promise<CartDto> {
  try {
    console.log('🔄 getCart called for userId:', userId);
    
    // Add timeout to the entire getCart operation
    const cartPromise = (async () => {
      const token = await getOrCreateSessionToken();
      console.log('🔑 Got session token:', token?.substring(0, 20) + '...');
      
      const res = await getClient().get("/cart", {
        headers: {
          "x-session-token": token,
          "x-test-user-id": userId, // Use test header for development
        },
      });
      console.log('✅ Cart API response received');
      return res;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cart fetch timeout')), 3000)
    );

    const res = await Promise.race([cartPromise, timeoutPromise]) as any;

    // Transform backend response to match frontend expectations
    const backendCart = res.data;
    return {
      id: backendCart.id,
      items: (backendCart.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title || `Product ${item.productId}`,
        price: parseFloat(item.price) || 0,
        originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
        imageUrl: item.imageUrl,
        quantity: item.quantity || 1,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
      })),
      subtotal: backendCart.subtotal,
      totalQuantity: backendCart.totalQuantity,
      status: backendCart.status,
    };
  } catch (error: any) {
    console.error('❌ Failed to get cart:', error?.message || error);
    // Return empty cart on error
    return { items: [] };
  }
}

export async function addCartItem(
  userId: string,
  payload: Omit<CartItemDto, "quantity"> & { quantity?: number }
): Promise<CartDto> {
  try {
    console.log('➕ Adding item to cart:', payload);
    const token = await getOrCreateSessionToken();
    
    // Backend only expects: productId, variantId, quantity, metadata
    // NOT price or originalPrice (backend calculates those)
    const res = await getClient().post(
      "/cart/items",
      {
        productId: payload.productId || payload.id,
        variantId: payload.variantId,
        quantity: payload.quantity || 1,
        // Don't send price/originalPrice - backend doesn't accept them
      },
      {
        headers: {
          "x-session-token": token,
          "x-test-user-id": userId, // Use test header for development
        },
      }
    );

    console.log('✅ Item added successfully:', res.data);

    const backendCart = res.data;
    return {
      id: backendCart.id,
      items: (backendCart.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        title: item.title || payload.title || `Product ${item.productId}`,
        price: parseFloat(item.price) || 0,
        originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
        imageUrl: item.imageUrl || payload.imageUrl,
        quantity: item.quantity || 1,
      })),
    };
  } catch (error: any) {
    // Log as warning since optimistic update already handled it
    console.warn('⚠️ Backend sync failed (item still in cart):', error?.response?.data?.message || error?.message);
    // Still throw so thunk can handle it, but don't spam console with errors
    throw error;
  }
}

export async function updateCartItemQty(
  userId: string,
  id: string,
  quantity: number
): Promise<CartDto> {
  try {
    console.log('🔄 Updating item quantity:', { id, quantity });
    const token = await getOrCreateSessionToken();
    const res = await getClient().patch(
      `/cart/items/${id}`,
      { quantity },
      {
        headers: {
          "x-session-token": token,
          "x-test-user-id": userId, // Use test header for development
        },
      }
    );

    console.log('✅ Quantity updated successfully');
    const backendCart = res.data;
    return {
      id: backendCart.id,
      items: (backendCart.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        title: item.title || `Product ${item.productId}`,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
      })),
    };
  } catch (error) {
    console.error('❌ Failed to update cart item:', error);
    throw error;
  }
}

export async function removeCartItem(userId: string, id: string): Promise<CartDto> {
  try {
    console.log('🗑️ Removing item from cart:', id);
    const token = await getOrCreateSessionToken();
    await getClient().delete(`/cart/items/${id}`, {
      headers: {
        "x-session-token": token,
        "x-test-user-id": userId, // Use test header for development
      },
    });

    console.log('✅ Item removed successfully');
    // After delete, fetch updated cart
    return await getCart(userId);
  } catch (error) {
    console.error('❌ Failed to remove cart item:', error);
    throw error;
  }
}

export async function clearCartApi(userId: string): Promise<CartDto> {
  try {
    console.log('🧹 Clearing cart');
    const token = await getOrCreateSessionToken();
    await getClient().delete(`/cart`, {
      headers: {
        "x-session-token": token,
        "x-test-user-id": userId, // Use test header for development
      },
    });

    console.log('✅ Cart cleared successfully');
    return { items: [] };
  } catch (error) {
    console.error('❌ Failed to clear cart:', error);
    throw error;
  }
}


