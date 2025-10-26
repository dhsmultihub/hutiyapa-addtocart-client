import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ProductVariant {
    id: string
    name: string
    value: string
    price?: number
    stock?: number
    sku?: string
    image?: string
}

export interface Product {
    id: string
    title: string
    description: string
    price: number
    originalPrice?: number
    discount?: number
    images: string[]
    category: string
    brand: string
    sku: string
    slug: string
    variants?: ProductVariant[]
    inStock: boolean
    stockQuantity: number
    rating: number
    reviewCount: number
    tags: string[]
    isFeatured: boolean
    isNew: boolean
    isOnSale: boolean
    weight?: number
    dimensions?: {
        length: number
        width: number
        height: number
    }
    createdAt: string
    updatedAt: string
}

export interface ProductFilter {
    category?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    rating?: number
    inStock?: boolean
    isFeatured?: boolean
    isNew?: boolean
    isOnSale?: boolean
    tags?: string[]
}

export interface ProductSort {
    field: 'title' | 'price' | 'rating' | 'createdAt' | 'popularity'
    order: 'asc' | 'desc'
}

export interface ProductsState {
    products: Product[]
    featuredProducts: Product[]
    newProducts: Product[]
    saleProducts: Product[]
    categories: string[]
    brands: string[]
    tags: string[]
    currentProduct: Product | null
    searchQuery: string
    filters: ProductFilter
    sort: ProductSort
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    isLoading: boolean
    isSearching: boolean
    error: string | null
    lastUpdated: string | null
}

const initialState: ProductsState = {
    products: [],
    featuredProducts: [],
    newProducts: [],
    saleProducts: [],
    categories: [],
    brands: [],
    tags: [],
    currentProduct: null,
    searchQuery: '',
    filters: {},
    sort: {
        field: 'createdAt',
        order: 'desc',
    },
    pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    },
    isLoading: false,
    isSearching: false,
    error: null,
    lastUpdated: null,
}

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        // Product loading actions
        loadProductsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadProductsSuccess: (state, action: PayloadAction<{ products: Product[]; total: number }>) => {
            state.products = action.payload.products
            state.pagination.total = action.payload.total
            state.pagination.totalPages = Math.ceil(action.payload.total / state.pagination.limit)
            state.isLoading = false
            state.error = null
            state.lastUpdated = new Date().toISOString()
        },
        loadProductsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Featured products actions
        loadFeaturedProductsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadFeaturedProductsSuccess: (state, action: PayloadAction<Product[]>) => {
            state.featuredProducts = action.payload
            state.isLoading = false
            state.error = null
        },
        loadFeaturedProductsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // New products actions
        loadNewProductsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadNewProductsSuccess: (state, action: PayloadAction<Product[]>) => {
            state.newProducts = action.payload
            state.isLoading = false
            state.error = null
        },
        loadNewProductsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Sale products actions
        loadSaleProductsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadSaleProductsSuccess: (state, action: PayloadAction<Product[]>) => {
            state.saleProducts = action.payload
            state.isLoading = false
            state.error = null
        },
        loadSaleProductsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Single product actions
        loadProductStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadProductSuccess: (state, action: PayloadAction<Product>) => {
            state.currentProduct = action.payload
            state.isLoading = false
            state.error = null
        },
        loadProductFailure: (state, action: PayloadAction<string>) => {
            state.currentProduct = null
            state.isLoading = false
            state.error = action.payload
        },

        // Search actions
        searchProductsStart: (state) => {
            state.isSearching = true
            state.error = null
        },
        searchProductsSuccess: (state, action: PayloadAction<{ products: Product[]; total: number }>) => {
            state.products = action.payload.products
            state.pagination.total = action.payload.total
            state.pagination.totalPages = Math.ceil(action.payload.total / state.pagination.limit)
            state.isSearching = false
            state.error = null
            state.lastUpdated = new Date().toISOString()
        },
        searchProductsFailure: (state, action: PayloadAction<string>) => {
            state.isSearching = false
            state.error = action.payload
        },

        // Filter and sort actions
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload
        },
        setFilters: (state, action: PayloadAction<ProductFilter>) => {
            state.filters = { ...state.filters, ...action.payload }
            state.pagination.page = 1 // Reset to first page when filters change
        },
        clearFilters: (state) => {
            state.filters = {}
            state.pagination.page = 1
        },
        setSort: (state, action: PayloadAction<ProductSort>) => {
            state.sort = action.payload
        },
        setPagination: (state, action: PayloadAction<{ page: number; limit?: number }>) => {
            state.pagination.page = action.payload.page
            if (action.payload.limit) {
                state.pagination.limit = action.payload.limit
            }
        },

        // Categories and brands actions
        loadCategoriesStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadCategoriesSuccess: (state, action: PayloadAction<string[]>) => {
            state.categories = action.payload
            state.isLoading = false
            state.error = null
        },
        loadCategoriesFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        loadBrandsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadBrandsSuccess: (state, action: PayloadAction<string[]>) => {
            state.brands = action.payload
            state.isLoading = false
            state.error = null
        },
        loadBrandsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        loadTagsStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loadTagsSuccess: (state, action: PayloadAction<string[]>) => {
            state.tags = action.payload
            state.isLoading = false
            state.error = null
        },
        loadTagsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Product comparison actions
        addToComparison: (state, action: PayloadAction<string>) => {
            // This would be handled by a separate comparison slice
            // For now, we'll just track it in the state
        },
        removeFromComparison: (state, action: PayloadAction<string>) => {
            // This would be handled by a separate comparison slice
        },
        clearComparison: (state) => {
            // This would be handled by a separate comparison slice
        },

        // Wishlist actions (would be handled by a separate wishlist slice)
        addToWishlist: (state, action: PayloadAction<string>) => {
            // This would be handled by a separate wishlist slice
        },
        removeFromWishlist: (state, action: PayloadAction<string>) => {
            // This would be handled by a separate wishlist slice
        },

        // Clear error
        clearError: (state) => {
            state.error = null
        },

        // Reset state
        resetProducts: (state) => {
            state.products = []
            state.currentProduct = null
            state.searchQuery = ''
            state.filters = {}
            state.pagination = {
                page: 1,
                limit: 12,
                total: 0,
                totalPages: 0,
            }
            state.error = null
        },

        // Set loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
    },
})

export const {
    loadProductsStart,
    loadProductsSuccess,
    loadProductsFailure,
    loadFeaturedProductsStart,
    loadFeaturedProductsSuccess,
    loadFeaturedProductsFailure,
    loadNewProductsStart,
    loadNewProductsSuccess,
    loadNewProductsFailure,
    loadSaleProductsStart,
    loadSaleProductsSuccess,
    loadSaleProductsFailure,
    loadProductStart,
    loadProductSuccess,
    loadProductFailure,
    searchProductsStart,
    searchProductsSuccess,
    searchProductsFailure,
    setSearchQuery,
    setFilters,
    clearFilters,
    setSort,
    setPagination,
    loadCategoriesStart,
    loadCategoriesSuccess,
    loadCategoriesFailure,
    loadBrandsStart,
    loadBrandsSuccess,
    loadBrandsFailure,
    loadTagsStart,
    loadTagsSuccess,
    loadTagsFailure,
    addToComparison,
    removeFromComparison,
    clearComparison,
    addToWishlist,
    removeFromWishlist,
    clearError,
    resetProducts,
    setLoading,
} = productsSlice.actions

export default productsSlice.reducer
