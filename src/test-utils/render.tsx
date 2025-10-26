import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { configureStore } from '@reduxjs/toolkit'
// import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
// import { store, persistor } from '../store'
import cartReducer from '../features/cart/redux/cart.slice'
import authReducer from '../features/auth/redux/auth.slice'
import productsReducer from '../features/products/redux/products.slice'
import uiReducer from '../features/ui/redux/ui.slice'

// Mock store for testing
const createMockStore = (preloadedState = {}) => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            auth: authReducer,
            products: productsReducer,
            ui: uiReducer,
        },
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                },
            }),
    })
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    preloadedState?: any
    store?: any
    withRouter?: boolean
    withTheme?: boolean
    withPersist?: boolean
}

const AllTheProviders = ({
    children,
    preloadedState = {},
    store: customStore,
    withRouter = true,
    withTheme = true,
    withPersist = false,
}: {
    children: React.ReactNode
    preloadedState?: any
    store?: any
    withRouter?: boolean
    withTheme?: boolean
    withPersist?: boolean
}) => {
    const testStore = customStore || createMockStore(preloadedState)

    let content = children

    // Add Redux Provider
    content = <Provider store={testStore}>{content}</Provider>

    // Add PersistGate if needed
    if (withPersist) {
        content = (
            <PersistGate loading={null} persistor={persistor}>
                {content}
            </PersistGate>
        )
    }

    // Add Router
    if (withRouter) {
        content = <BrowserRouter>{content}</BrowserRouter>
    }

    // Add Theme Provider
    if (withTheme) {
        content = (
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                {content}
            </ThemeProvider>
        )
    }

    return <>{content}</>
}

const customRender = (
    ui: ReactElement,
    options: CustomRenderOptions = {}
) => {
    const {
        preloadedState = {},
        store: customStore,
        withRouter = true,
        withTheme = true,
        withPersist = false,
        ...renderOptions
    } = options

    return render(ui, {
        wrapper: ({ children }) => (
            <AllTheProviders
                preloadedState={preloadedState}
                store={customStore}
                withRouter={withRouter}
                withTheme={withTheme}
                withPersist={withPersist}
            >
                {children}
            </AllTheProviders>
        ),
        ...renderOptions,
    })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Custom render functions for specific scenarios
export const renderWithStore = (
    ui: ReactElement,
    preloadedState = {},
    customStore?: any
) => {
    return customRender(ui, {
        preloadedState,
        store: customStore,
        withRouter: false,
        withTheme: false,
        withPersist: false,
    })
}

export const renderWithRouter = (ui: ReactElement) => {
    return customRender(ui, {
        withStore: false,
        withTheme: false,
        withPersist: false,
    })
}

export const renderWithTheme = (ui: ReactElement) => {
    return customRender(ui, {
        withRouter: false,
        withStore: false,
        withPersist: false,
    })
}

export const renderWithPersist = (
    ui: ReactElement,
    preloadedState = {}
) => {
    return customRender(ui, {
        preloadedState,
        withRouter: true,
        withTheme: true,
        withPersist: true,
    })
}

// Utility for testing async components
export const waitForLoadingToFinish = () => {
    return new Promise((resolve) => {
        setTimeout(resolve, 0)
    })
}

// Utility for testing with user interactions
export const userEvent = {
    click: async (element: HTMLElement) => {
        element.click()
        await waitForLoadingToFinish()
    },
    type: async (element: HTMLElement, text: string) => {
        element.focus()
        element.value = text
        element.dispatchEvent(new Event('input', { bubbles: true }))
        await waitForLoadingToFinish()
    },
    clear: async (element: HTMLElement) => {
        element.focus()
        element.value = ''
        element.dispatchEvent(new Event('input', { bubbles: true }))
        await waitForLoadingToFinish()
    },
}

// Mock store factory
export const createTestStore = (preloadedState = {}) => {
    return createMockStore(preloadedState)
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides,
})

export const createMockProduct = (overrides = {}) => ({
    id: '1',
    name: 'Test Product',
    price: 99.99,
    description: 'Test product description',
    image: 'https://example.com/image.jpg',
    category: 'Electronics',
    brand: 'Test Brand',
    inStock: true,
    stock: 100,
    rating: 4.5,
    reviewCount: 10,
    ...overrides,
})

export const createMockCartItem = (overrides = {}) => ({
    id: '1',
    productId: '1',
    product: createMockProduct(),
    quantity: 1,
    price: 99.99,
    total: 99.99,
    ...overrides,
})

export const createMockCart = (overrides = {}) => ({
    items: [createMockCartItem()],
    subtotal: 99.99,
    total: 99.99,
    itemCount: 1,
    isEmpty: false,
    ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    })
}

export const mockApiError = (message = 'API Error', _status = 500) => {
    return Promise.reject(new Error(message))
}

// Mock fetch responses
export const mockFetch = (responses: Record<string, any>) => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        const response = responses[url]
        if (response) {
            return Promise.resolve(mockApiResponse(response))
        }
        return Promise.reject(new Error(`No mock response for ${url}`))
    })
}

// Clean up function
export const cleanup = () => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
}
