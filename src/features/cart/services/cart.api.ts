import axios, { AxiosInstance } from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_CART_API_BASE_URL || 'http://localhost:8000/api/v1';
if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_CART_API_BASE_URL is not defined in environment");
}

let client: AxiosInstance | null = null;
let sessionToken: string | null = null;

// Initialize or retrieve session token
async function getOrCreateSessionToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage
    const stored = localStorage.getItem('cart_session_token');
    if (stored) {
      sessionToken = stored;
      return stored;
    }
  }

  // Create new session with backend
  try {
    const res = await getClient().post("/cart/session", null, {
      headers: { "x-user-id": "guest_" + Date.now() }
    });

    if (res.data?.sessionToken) {
      sessionToken = res.data.sessionToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_session_token', sessionToken);
      }
      return sessionToken;
    }
  } catch (error) {
    console.error('Failed to create session:', error);
  }

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
    timeout: 10000,
  });

  // Add request interceptor to include session token
  client.interceptors.request.use(async (config) => {
    const token = await getOrCreateSessionToken();
    config.headers['x-session-token'] = token;
    return config;
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });

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
    const token = await getOrCreateSessionToken();
    const res = await getClient().get("/cart", {
      headers: {
        "x-session-token": token,
        "x-user-id": userId,
      },
    });

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
    console.error('Failed to get cart:', error);
    // Return empty cart on error
    return { items: [] };
  }
}

export async function addCartItem(
  userId: string,
  payload: Omit<CartItemDto, "quantity"> & { quantity?: number }
): Promise<CartDto> {
  try {
    const token = await getOrCreateSessionToken();
    const res = await getClient().post(
      "/cart/items",
      {
        productId: payload.productId || payload.id,
        variantId: payload.variantId,
        quantity: payload.quantity || 1,
        price: payload.price,
        originalPrice: payload.originalPrice || payload.price,
      },
      {
        headers: {
          "x-session-token": token,
          "x-user-id": userId,
        },
      }
    );

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
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    throw error;
  }
}

export async function updateCartItemQty(
  userId: string,
  id: string,
  quantity: number
): Promise<CartDto> {
  try {
    const token = await getOrCreateSessionToken();
    const res = await getClient().patch(
      `/cart/items/${id}`,
      { quantity },
      {
        headers: {
          "x-session-token": token,
          "x-user-id": userId,
        },
      }
    );

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
    console.error('Failed to update cart item:', error);
    throw error;
  }
}

export async function removeCartItem(userId: string, id: string): Promise<CartDto> {
  try {
    const token = await getOrCreateSessionToken();
    await getClient().delete(`/cart/items/${id}`, {
      headers: {
        "x-session-token": token,
        "x-user-id": userId,
      },
    });

    // After delete, fetch updated cart
    return await getCart(userId);
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    throw error;
  }
}

export async function clearCartApi(userId: string): Promise<CartDto> {
  try {
    const token = await getOrCreateSessionToken();
    await getClient().delete(`/cart`, {
      headers: {
        "x-session-token": token,
        "x-user-id": userId,
      },
    });

    return { items: [] };
  } catch (error) {
    console.error('Failed to clear cart:', error);
    throw error;
  }
}


