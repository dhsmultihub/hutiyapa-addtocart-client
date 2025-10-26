import { httpClient, ApiResponse } from '../client'

export interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export interface BillingAddress extends ShippingAddress {}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer'
  card?: {
    number: string
    expiryMonth: number
    expiryYear: number
    cvv: string
    name: string
  }
  paypal?: {
    email: string
  }
  bankTransfer?: {
    accountNumber: string
    routingNumber: string
    accountName: string
  }
}

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  trackingAvailable: boolean
}

export interface CheckoutRequest {
  shippingAddress: ShippingAddress
  billingAddress?: BillingAddress
  shippingMethod: string
  paymentMethod: PaymentMethod
  couponCode?: string
  giftCardCode?: string
  notes?: string
  saveAddresses?: boolean
}

export interface CheckoutResponse {
  checkoutId: string
  orderId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  paymentUrl?: string
  expiresAt: string
}

export interface OrderSummary {
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    total: number
    image?: string
  }>
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

export interface CheckoutValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  shippingAddress?: {
    valid: boolean
    errors: string[]
  }
  paymentMethod?: {
    valid: boolean
    errors: string[]
  }
}

class CheckoutService {
  // Initialize checkout process
  async initializeCheckout(checkoutData: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    return httpClient.post<CheckoutResponse>('/checkout/initialize', checkoutData)
  }

  // Complete checkout
  async completeCheckout(checkoutId: string, paymentData?: any): Promise<ApiResponse<CheckoutResponse>> {
    return httpClient.post<CheckoutResponse>(`/checkout/${checkoutId}/complete`, paymentData)
  }

  // Cancel checkout
  async cancelCheckout(checkoutId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>(`/checkout/${checkoutId}/cancel`)
  }

  // Get checkout status
  async getCheckoutStatus(checkoutId: string): Promise<ApiResponse<CheckoutResponse>> {
    return httpClient.get<CheckoutResponse>(`/checkout/${checkoutId}`)
  }

  // Validate checkout
  async validateCheckout(checkoutData: Partial<CheckoutRequest>): Promise<ApiResponse<CheckoutValidation>> {
    return httpClient.post<CheckoutValidation>('/checkout/validate', checkoutData)
  }

  // Get available shipping methods
  async getShippingMethods(address: ShippingAddress): Promise<ApiResponse<ShippingMethod[]>> {
    return httpClient.post<ShippingMethod[]>('/checkout/shipping-methods', address)
  }

  // Calculate shipping cost
  async calculateShipping(address: ShippingAddress, methodId?: string): Promise<ApiResponse<{
    cost: number
    methods: ShippingMethod[]
  }>> {
    return httpClient.post<{
      cost: number
      methods: ShippingMethod[]
    }>('/checkout/shipping', { address, methodId })
  }

  // Calculate taxes
  async calculateTaxes(address: ShippingAddress): Promise<ApiResponse<{
    tax: number
    breakdown: Array<{
      name: string
      rate: number
      amount: number
    }>
  }>> {
    return httpClient.post<{
      tax: number
      breakdown: Array<{
        name: string
        rate: number
        amount: number
      }>
    }>('/checkout/tax', address)
  }

  // Get order summary
  async getOrderSummary(checkoutId: string): Promise<ApiResponse<OrderSummary>> {
    return httpClient.get<OrderSummary>(`/checkout/${checkoutId}/summary`)
  }

  // Apply coupon code
  async applyCoupon(checkoutId: string, code: string): Promise<ApiResponse<{
    valid: boolean
    discount: number
    message: string
  }>> {
    return httpClient.post<{
      valid: boolean
      discount: number
      message: string
    }>(`/checkout/${checkoutId}/coupon`, { code })
  }

  // Remove coupon code
  async removeCoupon(checkoutId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/checkout/${checkoutId}/coupon`)
  }

  // Apply gift card
  async applyGiftCard(checkoutId: string, code: string): Promise<ApiResponse<{
    valid: boolean
    amount: number
    message: string
  }>> {
    return httpClient.post<{
      valid: boolean
      amount: number
      message: string
    }>(`/checkout/${checkoutId}/gift-card`, { code })
  }

  // Remove gift card
  async removeGiftCard(checkoutId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/checkout/${checkoutId}/gift-card`)
  }

  // Save shipping address
  async saveShippingAddress(address: ShippingAddress): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/checkout/shipping-address', address)
  }

  // Save billing address
  async saveBillingAddress(address: BillingAddress): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/checkout/billing-address', address)
  }

  // Get saved addresses
  async getSavedAddresses(): Promise<ApiResponse<{
    shipping: ShippingAddress[]
    billing: BillingAddress[]
  }>> {
    return httpClient.get<{
      shipping: ShippingAddress[]
      billing: BillingAddress[]
    }>('/checkout/addresses')
  }

  // Delete saved address
  async deleteSavedAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/checkout/addresses/${addressId}`)
  }

  // Get payment methods
  async getPaymentMethods(): Promise<ApiResponse<{
    methods: Array<{
      id: string
      type: string
      name: string
      last4?: string
      expiryMonth?: number
      expiryYear?: number
    }>
  }>> {
    return httpClient.get<{
      methods: Array<{
        id: string
        type: string
        name: string
        last4?: string
        expiryMonth?: number
        expiryYear?: number
      }>
    }>('/checkout/payment-methods')
  }

  // Save payment method
  async savePaymentMethod(paymentMethod: PaymentMethod): Promise<ApiResponse<{
    id: string
    message: string
  }>> {
    return httpClient.post<{
      id: string
      message: string
    }>('/checkout/payment-methods', paymentMethod)
  }

  // Delete payment method
  async deletePaymentMethod(methodId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/checkout/payment-methods/${methodId}`)
  }

  // Get checkout history
  async getCheckoutHistory(page?: number, limit?: number): Promise<ApiResponse<{
    checkouts: Array<{
      id: string
      status: string
      total: number
      createdAt: string
      completedAt?: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>> {
    return httpClient.get<{
      checkouts: Array<{
        id: string
        status: string
        total: number
        createdAt: string
        completedAt?: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>('/checkout/history', { params: { page, limit } })
  }
}

export const checkoutService = new CheckoutService()
export default checkoutService
