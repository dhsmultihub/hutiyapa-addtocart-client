import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '../store'
import { API_CONFIG } from '../lib/constants'

// Base API configuration
export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: API_CONFIG.BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as RootState
            const token = state.auth?.token

            if (token) {
                headers.set('authorization', `Bearer ${token}`)
            }

            headers.set('content-type', 'application/json')
            headers.set('accept', 'application/json')

            return headers
        },
        timeout: API_CONFIG.TIMEOUT,
    }),
    tagTypes: [
        'Cart',
        'Products',
        'User',
        'Orders',
        'Addresses',
        'Categories',
        'Brands',
        'Tags',
        'FeaturedProducts',
        'NewProducts',
        'SaleProducts',
    ],
    endpoints: (builder) => ({
        // Health check
        healthCheck: builder.query<{ status: string; timestamp: string }, void>({
            query: () => '/health',
            providesTags: [],
        }),

        // Cart endpoints
        getCart: builder.query<any, void>({
            query: () => '/cart',
            providesTags: ['Cart'],
        }),
        addToCart: builder.mutation<any, { productId: string; quantity: number; variantId?: string }>({
            query: (body) => ({
                url: '/cart/items',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Cart'],
        }),
        updateCartItem: builder.mutation<any, { itemId: string; quantity: number }>({
            query: ({ itemId, quantity }) => ({
                url: `/cart/items/${itemId}`,
                method: 'PATCH',
                body: { quantity },
            }),
            invalidatesTags: ['Cart'],
        }),
        removeFromCart: builder.mutation<any, string>({
            query: (itemId) => ({
                url: `/cart/items/${itemId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),
        clearCart: builder.mutation<any, void>({
            query: () => ({
                url: '/cart',
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),

        // Products endpoints
        getProducts: builder.query<any, {
            page?: number;
            limit?: number;
            category?: string;
            brand?: string;
            minPrice?: number;
            maxPrice?: number;
            search?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }>({
            query: (params) => ({
                url: '/products',
                params,
            }),
            providesTags: ['Products'],
        }),
        getProduct: builder.query<any, string>({
            query: (id) => `/products/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Products', id }],
        }),
        searchProducts: builder.query<any, { query: string; page?: number; limit?: number }>({
            query: (params) => ({
                url: '/products/search',
                params,
            }),
            providesTags: ['Products'],
        }),
        getFeaturedProducts: builder.query<any, { limit?: number }>({
            query: (params) => ({
                url: '/products/featured',
                params,
            }),
            providesTags: ['FeaturedProducts'],
        }),
        getNewProducts: builder.query<any, { limit?: number }>({
            query: (params) => ({
                url: '/products/new',
                params,
            }),
            providesTags: ['NewProducts'],
        }),
        getSaleProducts: builder.query<any, { limit?: number }>({
            query: (params) => ({
                url: '/products/sale',
                params,
            }),
            providesTags: ['SaleProducts'],
        }),

        // Categories endpoints
        getCategories: builder.query<any, void>({
            query: () => '/categories',
            providesTags: ['Categories'],
        }),
        getCategory: builder.query<any, string>({
            query: (id) => `/categories/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Categories', id }],
        }),

        // Brands endpoints
        getBrands: builder.query<any, void>({
            query: () => '/brands',
            providesTags: ['Brands'],
        }),
        getBrand: builder.query<any, string>({
            query: (id) => `/brands/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Brands', id }],
        }),

        // Tags endpoints
        getTags: builder.query<any, void>({
            query: () => '/tags',
            providesTags: ['Tags'],
        }),

        // User authentication endpoints
        login: builder.mutation<any, { email: string; password: string }>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),
        register: builder.mutation<any, {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
        }>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.mutation<any, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['User', 'Cart'],
        }),
        refreshToken: builder.mutation<any, { refreshToken: string }>({
            query: (body) => ({
                url: '/auth/refresh',
                method: 'POST',
                body,
            }),
        }),
        getProfile: builder.query<any, void>({
            query: () => '/auth/profile',
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation<any, Partial<any>>({
            query: (profileData) => ({
                url: '/auth/profile',
                method: 'PATCH',
                body: profileData,
            }),
            invalidatesTags: ['User'],
        }),
        changePassword: builder.mutation<any, {
            currentPassword: string;
            newPassword: string;
        }>({
            query: (passwordData) => ({
                url: '/auth/change-password',
                method: 'POST',
                body: passwordData,
            }),
        }),
        resetPassword: builder.mutation<any, { email: string }>({
            query: (body) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body,
            }),
        }),
        verifyEmail: builder.mutation<any, { token: string }>({
            query: (body) => ({
                url: '/auth/verify-email',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        // Addresses endpoints
        getAddresses: builder.query<any, void>({
            query: () => '/addresses',
            providesTags: ['Addresses'],
        }),
        getAddress: builder.query<any, string>({
            query: (id) => `/addresses/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Addresses', id }],
        }),
        createAddress: builder.mutation<any, any>({
            query: (addressData) => ({
                url: '/addresses',
                method: 'POST',
                body: addressData,
            }),
            invalidatesTags: ['Addresses'],
        }),
        updateAddress: builder.mutation<any, { id: string; data: any }>({
            query: ({ id, data }) => ({
                url: `/addresses/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Addresses'],
        }),
        deleteAddress: builder.mutation<any, string>({
            query: (id) => ({
                url: `/addresses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Addresses'],
        }),

        // Orders endpoints
        getOrders: builder.query<any, { page?: number; limit?: number }>({
            query: (params) => ({
                url: '/orders',
                params,
            }),
            providesTags: ['Orders'],
        }),
        getOrder: builder.query<any, string>({
            query: (id) => `/orders/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
        }),
        createOrder: builder.mutation<any, any>({
            query: (orderData) => ({
                url: '/orders',
                method: 'POST',
                body: orderData,
            }),
            invalidatesTags: ['Orders', 'Cart'],
        }),
        updateOrder: builder.mutation<any, { id: string; data: any }>({
            query: ({ id, data }) => ({
                url: `/orders/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),

        // Checkout endpoints
        initializeCheckout: builder.mutation<any, any>({
            query: (checkoutData) => ({
                url: '/checkout/initialize',
                method: 'POST',
                body: checkoutData,
            }),
            invalidatesTags: ['Cart'],
        }),
        completeCheckout: builder.mutation<any, { checkoutId: string; paymentData: any }>({
            query: ({ checkoutId, paymentData }) => ({
                url: `/checkout/${checkoutId}/complete`,
                method: 'POST',
                body: paymentData,
            }),
            invalidatesTags: ['Cart', 'Orders'],
        }),

        // Pricing endpoints
        calculatePricing: builder.mutation<any, any>({
            query: (pricingData) => ({
                url: '/pricing/calculate',
                method: 'POST',
                body: pricingData,
            }),
        }),
        getDiscounts: builder.query<any, void>({
            query: () => '/pricing/discounts',
            providesTags: [],
        }),

        // Sessions endpoints
        createSession: builder.mutation<any, any>({
            query: (sessionData) => ({
                url: '/sessions',
                method: 'POST',
                body: sessionData,
            }),
        }),
        syncSession: builder.mutation<any, { sessionId: string; data: any }>({
            query: ({ sessionId, data }) => ({
                url: `/sessions/${sessionId}/sync`,
                method: 'POST',
                body: data,
            }),
        }),
    }),
})

// Export hooks for usage in functional components
export const {
    useHealthCheckQuery,
    useGetCartQuery,
    useAddToCartMutation,
    useUpdateCartItemMutation,
    useRemoveFromCartMutation,
    useClearCartMutation,
    useGetProductsQuery,
    useGetProductQuery,
    useSearchProductsQuery,
    useGetFeaturedProductsQuery,
    useGetNewProductsQuery,
    useGetSaleProductsQuery,
    useGetCategoriesQuery,
    useGetCategoryQuery,
    useGetBrandsQuery,
    useGetBrandQuery,
    useGetTagsQuery,
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useResetPasswordMutation,
    useVerifyEmailMutation,
    useGetAddressesQuery,
    useGetAddressQuery,
    useCreateAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useGetOrdersQuery,
    useGetOrderQuery,
    useCreateOrderMutation,
    useUpdateOrderMutation,
    useInitializeCheckoutMutation,
    useCompleteCheckoutMutation,
    useCalculatePricingMutation,
    useGetDiscountsQuery,
    useCreateSessionMutation,
    useSyncSessionMutation,
} = api

export default api
