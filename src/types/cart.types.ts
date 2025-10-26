// Cart Item Types
export interface CartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  name: string
  image?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Cart Types
export interface Cart {
  id: string
  userId?: string
  sessionId: string
  items: CartItem[]
  totals: CartTotals
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CartTotals {
  subtotal: number
  tax: number
  discount: number
  shipping: number
  total: number
  itemCount: number
}

// Cart Operations
export interface AddToCartRequest {
  productId: string
  variantId?: string
  quantity: number
  metadata?: Record<string, any>
}

export interface UpdateCartItemRequest {
  quantity: number
  metadata?: Record<string, any>
}

export interface BulkCartOperation {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    metadata?: Record<string, any>
  }>
}

// Cart Merge Types
export interface CartMergeRequest {
  sourceCartId: string
  targetCartId: string
  conflictResolution: 'source' | 'target' | 'merge'
}

export interface CartMergeResponse {
  mergedCart: Cart
  conflicts: Array<{
    productId: string
    sourceQuantity: number
    targetQuantity: number
    resolvedQuantity: number
  }>
}

// Cart Validation
export interface CartValidationResult {
  isValid: boolean
  errors: Array<{
    itemId: string
    field: string
    message: string
  }>
  warnings: Array<{
    itemId: string
    field: string
    message: string
  }>
}

// Cart Analytics
export interface CartAnalytics {
  totalCarts: number
  activeCarts: number
  averageCartValue: number
  averageItemsPerCart: number
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
  cartAbandonmentRate: number
  conversionRate: number
}

// Cart Events
export interface CartEvent {
  type: 'item_added' | 'item_removed' | 'item_updated' | 'cart_cleared' | 'cart_merged'
  cartId: string
  itemId?: string
  productId?: string
  quantity?: number
  timestamp: string
  metadata?: Record<string, any>
}
