import { httpClient, ApiResponse } from '../client'
import { CartItem, AddToCartRequest } from '../../types/cart.types'

export interface CartResponse {
    items: CartItem[]
    subtotal: number
    totalQuantity: number
    total: number
    discount: number
    tax: number
    shipping: number
}

export interface BulkCartRequest {
    items: AddToCartRequest[]
}

export interface CartValidationResponse {
    valid: boolean
    errors: string[]
    warnings: string[]
}

class CartService {
    // Get current cart
    async getCart(): Promise<ApiResponse<CartResponse>> {
        return httpClient.get<CartResponse>('/cart')
    }

    // Add item to cart
    async addToCart(item: AddToCartRequest): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>('/cart/items', item)
    }

    // Add multiple items to cart
    async addBulkToCart(items: AddToCartRequest[]): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>('/cart/bulk/items', { items })
    }

    // Update cart item quantity
    async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartResponse>> {
        return httpClient.patch<CartResponse>(`/cart/items/${itemId}`, { quantity })
    }

    // Remove item from cart
    async removeFromCart(itemId: string): Promise<ApiResponse<CartResponse>> {
        return httpClient.delete<CartResponse>(`/cart/items/${itemId}`)
    }

    // Clear entire cart
    async clearCart(): Promise<ApiResponse<{ message: string }>> {
        return httpClient.delete<{ message: string }>('/cart')
    }

    // Apply coupon code
    async applyCoupon(code: string): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>('/cart/coupon', { code })
    }

    // Remove coupon code
    async removeCoupon(): Promise<ApiResponse<CartResponse>> {
        return httpClient.delete<CartResponse>('/cart/coupon')
    }

    // Apply gift card
    async applyGiftCard(code: string): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>('/cart/gift-card', { code })
    }

    // Remove gift card
    async removeGiftCard(): Promise<ApiResponse<CartResponse>> {
        return httpClient.delete<CartResponse>('/cart/gift-card')
    }

    // Validate cart
    async validateCart(): Promise<ApiResponse<CartValidationResponse>> {
        return httpClient.get<CartValidationResponse>('/cart/validate')
    }

    // Calculate shipping
    async calculateShipping(address: any): Promise<ApiResponse<{ shipping: number; methods: any[] }>> {
        return httpClient.post<{ shipping: number; methods: any[] }>('/cart/shipping', address)
    }

    // Calculate taxes
    async calculateTaxes(address: any): Promise<ApiResponse<{ tax: number; breakdown: any[] }>> {
        return httpClient.post<{ tax: number; breakdown: any[] }>('/cart/tax', address)
    }

    // Save cart for later
    async saveForLater(itemId: string): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>(`/cart/items/${itemId}/save`)
    }

    // Move item back to cart
    async moveToCart(itemId: string): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>(`/cart/items/${itemId}/move`)
    }

    // Get saved items
    async getSavedItems(): Promise<ApiResponse<CartItem[]>> {
        return httpClient.get<CartItem[]>('/cart/saved')
    }

    // Remove saved item
    async removeSavedItem(itemId: string): Promise<ApiResponse<{ message: string }>> {
        return httpClient.delete<{ message: string }>(`/cart/saved/${itemId}`)
    }

    // Sync cart with server
    async syncCart(localCart: CartItem[]): Promise<ApiResponse<CartResponse>> {
        return httpClient.post<CartResponse>('/cart/sync', { items: localCart })
    }

    // Get cart summary
    async getCartSummary(): Promise<ApiResponse<{
        itemCount: number
        totalQuantity: number
        subtotal: number
        total: number
    }>> {
        return httpClient.get<{
            itemCount: number
            totalQuantity: number
            subtotal: number
            total: number
        }>('/cart/summary')
    }
}

export const cartService = new CartService()
export default cartService
