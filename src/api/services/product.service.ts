import { httpClient, ApiResponse } from '../client'
import { Product, ProductSearchParams } from '../../types/api.types'

export interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    categories: string[]
    brands: string[]
    priceRange: {
      min: number
      max: number
    }
  }
}

export interface ProductSearchResponse {
  products: Product[]
  suggestions: string[]
  total: number
  query: string
}

export interface ProductRecommendationsResponse {
  products: Product[]
  type: 'similar' | 'related' | 'frequently_bought' | 'trending'
}

export interface ProductReview {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  verified: boolean
  helpful: number
  createdAt: string
}

export interface ProductReviewsResponse {
  reviews: ProductReview[]
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

class ProductService {
  // Get all products with filters and pagination
  async getProducts(params?: ProductSearchParams): Promise<ApiResponse<ProductListResponse>> {
    return httpClient.get<ProductListResponse>('/products', { params })
  }

  // Get single product by ID
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return httpClient.get<Product>(`/products/${id}`)
  }

  // Search products
  async searchProducts(query: string, params?: Partial<ProductSearchParams>): Promise<ApiResponse<ProductSearchResponse>> {
    return httpClient.get<ProductSearchResponse>('/products/search', {
      params: { query, ...params }
    })
  }

  // Get featured products
  async getFeaturedProducts(limit?: number): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/featured', {
      params: { limit }
    })
  }

  // Get new products
  async getNewProducts(limit?: number): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/new', {
      params: { limit }
    })
  }

  // Get sale products
  async getSaleProducts(limit?: number): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/sale', {
      params: { limit }
    })
  }

  // Get trending products
  async getTrendingProducts(limit?: number): Promise<ApiResponse<Product[]>> {
    return httpClient.get<Product[]>('/products/trending', {
      params: { limit }
    })
  }

  // Get product recommendations
  async getProductRecommendations(productId: string, type?: 'similar' | 'related' | 'frequently_bought'): Promise<ApiResponse<ProductRecommendationsResponse>> {
    return httpClient.get<ProductRecommendationsResponse>(`/products/${productId}/recommendations`, {
      params: { type }
    })
  }

  // Get product reviews
  async getProductReviews(productId: string, page?: number, limit?: number): Promise<ApiResponse<ProductReviewsResponse>> {
    return httpClient.get<ProductReviewsResponse>(`/products/${productId}/reviews`, {
      params: { page, limit }
    })
  }

  // Add product review
  async addProductReview(productId: string, review: {
    rating: number
    title: string
    comment: string
  }): Promise<ApiResponse<ProductReview>> {
    return httpClient.post<ProductReview>(`/products/${productId}/reviews`, review)
  }

  // Update product review
  async updateProductReview(productId: string, reviewId: string, review: {
    rating?: number
    title?: string
    comment?: string
  }): Promise<ApiResponse<ProductReview>> {
    return httpClient.patch<ProductReview>(`/products/${productId}/reviews/${reviewId}`, review)
  }

  // Delete product review
  async deleteProductReview(productId: string, reviewId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/products/${productId}/reviews/${reviewId}`)
  }

  // Get product variants
  async getProductVariants(productId: string): Promise<ApiResponse<any[]>> {
    return httpClient.get<any[]>(`/products/${productId}/variants`)
  }

  // Validate product availability
  async validateProduct(productId: string, variantId?: string, quantity?: number): Promise<ApiResponse<{
    available: boolean
    stock: number
    message?: string
  }>> {
    return httpClient.post<{
      available: boolean
      stock: number
      message?: string
    }>(`/products/${productId}/validate`, { variantId, quantity })
  }

  // Get product categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    return httpClient.get<string[]>('/products/categories')
  }

  // Get product brands
  async getBrands(): Promise<ApiResponse<string[]>> {
    return httpClient.get<string[]>('/products/brands')
  }

  // Get product tags
  async getTags(): Promise<ApiResponse<string[]>> {
    return httpClient.get<string[]>('/products/tags')
  }

  // Get products by category
  async getProductsByCategory(category: string, params?: Partial<ProductSearchParams>): Promise<ApiResponse<ProductListResponse>> {
    return httpClient.get<ProductListResponse>(`/products/category/${category}`, { params })
  }

  // Get products by brand
  async getProductsByBrand(brand: string, params?: Partial<ProductSearchParams>): Promise<ApiResponse<ProductListResponse>> {
    return httpClient.get<ProductListResponse>(`/products/brand/${brand}`, { params })
  }

  // Get products by tag
  async getProductsByTag(tag: string, params?: Partial<ProductSearchParams>): Promise<ApiResponse<ProductListResponse>> {
    return httpClient.get<ProductListResponse>(`/products/tag/${tag}`, { params })
  }

  // Compare products
  async compareProducts(productIds: string[]): Promise<ApiResponse<{
    products: Product[]
    comparison: any[]
  }>> {
    return httpClient.post<{
      products: Product[]
      comparison: any[]
    }>('/products/compare', { productIds })
  }

  // Get product analytics
  async getProductAnalytics(productId: string): Promise<ApiResponse<{
    views: number
    cartAdds: number
    purchases: number
    conversionRate: number
  }>> {
    return httpClient.get<{
      views: number
      cartAdds: number
      purchases: number
      conversionRate: number
    }>(`/products/${productId}/analytics`)
  }

  // Track product view
  async trackProductView(productId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>(`/products/${productId}/track`, { action: 'view' })
  }

  // Track product interaction
  async trackProductInteraction(productId: string, action: string, data?: any): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>(`/products/${productId}/track`, { action, data })
  }
}

export const productService = new ProductService()
export default productService
