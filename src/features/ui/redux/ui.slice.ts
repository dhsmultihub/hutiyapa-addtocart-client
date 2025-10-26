import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
    timestamp: string
}

export interface Modal {
    id: string
    type: string
    isOpen: boolean
    data?: any
}

export interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    timestamp: string
}

export interface UIState {
    // Theme and appearance
    theme: 'light' | 'dark' | 'system'
    sidebarOpen: boolean
    mobileMenuOpen: boolean

    // Loading states
    globalLoading: boolean
    pageLoading: boolean

    // Notifications and toasts
    notifications: Notification[]
    toasts: Toast[]

    // Modals and overlays
    modals: Modal[]

    // Search and filters
    searchOpen: boolean
    searchQuery: string
    searchSuggestions: string[]

    // Cart and checkout UI
    cartDrawerOpen: boolean
    checkoutStep: number

    // Product view preferences
    productViewMode: 'grid' | 'list'
    productsPerPage: number

    // Error states
    globalError: string | null
    pageError: string | null

    // Success states
    globalSuccess: string | null

    // User preferences
    preferences: {
        autoSave: boolean
        notifications: boolean
        emailUpdates: boolean
        darkMode: boolean
        language: string
        currency: string
        timezone: string
    }

    // Analytics and tracking
    analytics: {
        pageViews: number
        sessionStart: string | null
        lastActivity: string | null
    }
}

const initialState: UIState = {
    // Theme and appearance
    theme: 'system',
    sidebarOpen: false,
    mobileMenuOpen: false,

    // Loading states
    globalLoading: false,
    pageLoading: false,

    // Notifications and toasts
    notifications: [],
    toasts: [],

    // Modals and overlays
    modals: [],

    // Search and filters
    searchOpen: false,
    searchQuery: '',
    searchSuggestions: [],

    // Cart and checkout UI
    cartDrawerOpen: false,
    checkoutStep: 1,

    // Product view preferences
    productViewMode: 'grid',
    productsPerPage: 12,

    // Error states
    globalError: null,
    pageError: null,

    // Success states
    globalSuccess: null,

    // User preferences
    preferences: {
        autoSave: true,
        notifications: true,
        emailUpdates: false,
        darkMode: false,
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
    },

    // Analytics and tracking
    analytics: {
        pageViews: 0,
        sessionStart: null,
        lastActivity: null,
    },
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Theme actions
        setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
            state.theme = action.payload
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light'
        },

        // Sidebar actions
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen
        },

        // Mobile menu actions
        setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.mobileMenuOpen = action.payload
        },
        toggleMobileMenu: (state) => {
            state.mobileMenuOpen = !state.mobileMenuOpen
        },

        // Loading actions
        setGlobalLoading: (state, action: PayloadAction<boolean>) => {
            state.globalLoading = action.payload
        },
        setPageLoading: (state, action: PayloadAction<boolean>) => {
            state.pageLoading = action.payload
        },

        // Notification actions
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
            const notification: Notification = {
                ...action.payload,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
            }
            state.notifications.push(notification)
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload)
        },
        clearNotifications: (state) => {
            state.notifications = []
        },

        // Toast actions
        addToast: (state, action: PayloadAction<Omit<Toast, 'id' | 'timestamp'>>) => {
            const toast: Toast = {
                ...action.payload,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
            }
            state.toasts.push(toast)
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload)
        },
        clearToasts: (state) => {
            state.toasts = []
        },

        // Modal actions
        openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
            const modal: Modal = {
                id: Math.random().toString(36).substr(2, 9),
                type: action.payload.type,
                isOpen: true,
                data: action.payload.data,
            }
            state.modals.push(modal)
        },
        closeModal: (state, action: PayloadAction<string>) => {
            const modal = state.modals.find(m => m.id === action.payload)
            if (modal) {
                modal.isOpen = false
            }
        },
        removeModal: (state, action: PayloadAction<string>) => {
            state.modals = state.modals.filter(m => m.id !== action.payload)
        },
        clearModals: (state) => {
            state.modals = []
        },

        // Search actions
        setSearchOpen: (state, action: PayloadAction<boolean>) => {
            state.searchOpen = action.payload
        },
        toggleSearch: (state) => {
            state.searchOpen = !state.searchOpen
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload
        },
        setSearchSuggestions: (state, action: PayloadAction<string[]>) => {
            state.searchSuggestions = action.payload
        },
        clearSearch: (state) => {
            state.searchQuery = ''
            state.searchSuggestions = []
        },

        // Cart drawer actions
        setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.cartDrawerOpen = action.payload
        },
        toggleCartDrawer: (state) => {
            state.cartDrawerOpen = !state.cartDrawerOpen
        },

        // Checkout actions
        setCheckoutStep: (state, action: PayloadAction<number>) => {
            state.checkoutStep = action.payload
        },
        nextCheckoutStep: (state) => {
            state.checkoutStep += 1
        },
        previousCheckoutStep: (state) => {
            state.checkoutStep = Math.max(1, state.checkoutStep - 1)
        },
        resetCheckout: (state) => {
            state.checkoutStep = 1
        },

        // Product view actions
        setProductViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
            state.productViewMode = action.payload
        },
        setProductsPerPage: (state, action: PayloadAction<number>) => {
            state.productsPerPage = action.payload
        },

        // Error actions
        setGlobalError: (state, action: PayloadAction<string | null>) => {
            state.globalError = action.payload
        },
        setPageError: (state, action: PayloadAction<string | null>) => {
            state.pageError = action.payload
        },
        clearErrors: (state) => {
            state.globalError = null
            state.pageError = null
        },

        // Success actions
        setGlobalSuccess: (state, action: PayloadAction<string | null>) => {
            state.globalSuccess = action.payload
        },
        clearSuccess: (state) => {
            state.globalSuccess = null
        },

        // Preferences actions
        updatePreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
            state.preferences = { ...state.preferences, ...action.payload }
        },
        resetPreferences: (state) => {
            state.preferences = initialState.preferences
        },

        // Analytics actions
        trackPageView: (state) => {
            state.analytics.pageViews += 1
            state.analytics.lastActivity = new Date().toISOString()
        },
        setSessionStart: (state, action: PayloadAction<string>) => {
            state.analytics.sessionStart = action.payload
        },
        updateLastActivity: (state) => {
            state.analytics.lastActivity = new Date().toISOString()
        },

        // Reset actions
        resetUI: (state) => {
            return { ...initialState, preferences: state.preferences }
        },
    },
})

export const {
    setTheme,
    toggleTheme,
    setSidebarOpen,
    toggleSidebar,
    setMobileMenuOpen,
    toggleMobileMenu,
    setGlobalLoading,
    setPageLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    addToast,
    removeToast,
    clearToasts,
    openModal,
    closeModal,
    removeModal,
    clearModals,
    setSearchOpen,
    toggleSearch,
    setSearchQuery,
    setSearchSuggestions,
    clearSearch,
    setCartDrawerOpen,
    toggleCartDrawer,
    setCheckoutStep,
    nextCheckoutStep,
    previousCheckoutStep,
    resetCheckout,
    setProductViewMode,
    setProductsPerPage,
    setGlobalError,
    setPageError,
    clearErrors,
    setGlobalSuccess,
    clearSuccess,
    updatePreferences,
    resetPreferences,
    trackPageView,
    setSessionStart,
    updateLastActivity,
    resetUI,
} = uiSlice.actions

export default uiSlice.reducer
