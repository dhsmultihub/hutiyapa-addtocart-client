// Base API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: string
    code?: string
    details?: any
}

export interface ApiError {
    success: false
    error: string
    code: string
    details?: any
    timestamp: string
    path: string
    method: string
}

// Pagination Types
export interface PaginationParams {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

// Request/Response Headers
export interface ApiHeaders {
    'Content-Type'?: string
    'Authorization'?: string
    'x-user-id'?: string
    'x-session-token'?: string
    'x-request-id'?: string
}

// API Configuration
export interface ApiConfig {
    baseURL: string
    timeout: number
    retries: number
    retryDelay: number
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Request Options
export interface RequestOptions {
    method: HttpMethod
    url: string
    data?: any
    params?: Record<string, any>
    headers?: ApiHeaders
    timeout?: number
}

// Response Interceptor Types
export interface ResponseInterceptor {
    onFulfilled?: (response: any) => any
    onRejected?: (error: any) => any
}

// Request Interceptor Types
export interface RequestInterceptor {
    onFulfilled?: (config: any) => any
    onRejected?: (error: any) => any
}

// Product Types
export interface Product {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    discount?: number
    images: string[]
    category: string
    brand: string
    tags: string[]
    stock: number
    sku: string
    weight?: number
    dimensions?: {
        length: number
        width: number
        height: number
    }
    rating: number
    reviewCount: number
    featured: boolean
    new: boolean
    sale: boolean
    trending: boolean
    variants?: ProductVariant[]
    specifications?: Record<string, any>
    createdAt: string
    updatedAt: string
}

export interface ProductVariant {
    id: string
    name: string
    price: number
    stock: number
    sku: string
    attributes: Record<string, string>
    images?: string[]
}

export interface ProductSearchParams {
    query?: string
    category?: string
    brand?: string
    tags?: string[]
    minPrice?: number
    maxPrice?: number
    rating?: number
    inStock?: boolean
    featured?: boolean
    new?: boolean
    sale?: boolean
    trending?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export interface ProductFilter {
    categories: string[]
    brands: string[]
    priceRange: {
        min: number
        max: number
    }
    ratings: number[]
    tags: string[]
}