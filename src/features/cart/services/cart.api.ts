import axios, { AxiosInstance } from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_CART_API_BASE_URL || 'http://localhost:3000';
if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_CART_API_BASE_URL is not defined in environment");
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
  });
  return client;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await getClient().get("/health");
  return res.data as { status: string };
}

export type CartItemDto = { id: string; title: string; price: number; imageUrl?: string; quantity: number };
export type CartDto = { items: CartItemDto[] };

export async function getCart(userId: string): Promise<CartDto> {
  const res = await getClient().get("/cart", { headers: { "x-user-id": userId } });
  return res.data as CartDto;
}

export async function addCartItem(userId: string, payload: Omit<CartItemDto, "quantity"> & { quantity?: number }): Promise<CartDto> {
  const res = await getClient().post("/cart/items", payload, { headers: { "x-user-id": userId } });
  return res.data as CartDto;
}

export async function updateCartItemQty(userId: string, id: string, quantity: number): Promise<CartDto> {
  const res = await getClient().patch(`/cart/items/${id}`, { quantity }, { headers: { "x-user-id": userId } });
  return res.data as CartDto;
}

export async function removeCartItem(userId: string, id: string): Promise<CartDto> {
  const res = await getClient().delete(`/cart/items/${id}`, { headers: { "x-user-id": userId } });
  return res.data as CartDto;
}

export async function clearCartApi(userId: string): Promise<CartDto> {
  const res = await getClient().delete(`/cart`, { headers: { "x-user-id": userId } });
  return res.data as CartDto;
}


