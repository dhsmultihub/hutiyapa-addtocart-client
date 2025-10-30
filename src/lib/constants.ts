// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_CART_API_BASE_URL || 'http://localhost:8000/api/v1',
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
} as const

// Application Configuration
export const APP_CONFIG = {
    NAME: 'E-commerce Cart',
    VERSION: '1.0.0',
    DESCRIPTION: 'Enterprise-grade e-commerce frontend with advanced cart management',
    AUTHOR: 'VC (programmerviva)',
    URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

// Cart Configuration
export const CART_CONFIG = {
    MAX_ITEMS: 100,
    MAX_QUANTITY_PER_ITEM: 99,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const

// Pagination Configuration
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// UI Configuration
export const UI_CONFIG = {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
    ANIMATION_DURATION: 200,
    LOADING_TIMEOUT: 10000,
} as const

// Validation Configuration
export const VALIDATION_CONFIG = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
} as const

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTH_ERROR: 'Authentication failed. Please login again.',
    CART_ERROR: 'Cart operation failed. Please try again.',
    CHECKOUT_ERROR: 'Checkout failed. Please try again.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
    ITEM_ADDED: 'Item added to cart successfully',
    ITEM_REMOVED: 'Item removed from cart',
    ITEM_UPDATED: 'Cart updated successfully',
    CART_CLEARED: 'Cart cleared successfully',
    ORDER_PLACED: 'Order placed successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
    CART: 'ecommerce_cart',
    USER: 'ecommerce_user',
    THEME: 'ecommerce_theme',
    PREFERENCES: 'ecommerce_preferences',
    SESSION: 'ecommerce_session',
} as const

// API Endpoints
export const API_ENDPOINTS = {
    // Cart
    CART: '/cart',
    CART_ITEMS: '/cart/items',
    CART_BULK: '/cart/bulk',

    // Products
    PRODUCTS: '/products',
    PRODUCT_SEARCH: '/products/search',
    PRODUCT_VALIDATE: '/products/validate',

    // Checkout
    CHECKOUT: '/checkout',
    CHECKOUT_INITIALIZE: '/checkout/initialize',
    CHECKOUT_COMPLETE: '/checkout/complete',

    // Orders
    ORDERS: '/orders',

    // Pricing
    PRICING: '/pricing',
    PRICING_CALCULATE: '/pricing/calculate',

    // Sessions
    SESSIONS: '/sessions',

    // Health
    HEALTH: '/health',
    HEALTH_READY: '/health/ready',
    HEALTH_LIVE: '/health/live',
} as const

// WebSocket Events
export const WS_EVENTS = {
    // Cart Events
    CART_UPDATED: 'cart.updated',
    CART_ITEM_ADDED: 'cart.item.added',
    CART_ITEM_REMOVED: 'cart.item.removed',
    CART_ITEM_UPDATED: 'cart.item.updated',

    // Product Events
    PRODUCT_PRICE_CHANGED: 'product.price.changed',
    PRODUCT_STOCK_UPDATED: 'product.stock.updated',

    // Order Events
    ORDER_CREATED: 'order.created',
    ORDER_STATUS_CHANGED: 'order.status.changed',

    // Notification Events
    NOTIFICATION_NEW: 'notification.new',
    NOTIFICATION_READ: 'notification.read',
} as const

// Theme Configuration
export const THEME_CONFIG = {
    DEFAULT: 'light',
    OPTIONS: ['light', 'dark', 'system'],
} as const

// Breakpoints
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
} as const
