// import { MockedFunction } from 'jest-mock'

// Mock API responses
export const mockApiResponses = {
    // Auth responses
    login: {
        success: {
            user: {
                id: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                isEmailVerified: true,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z',
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
        },
        error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
        },
    },

    register: {
        success: {
            user: {
                id: '2',
                email: 'newuser@example.com',
                firstName: 'New',
                lastName: 'User',
                isEmailVerified: false,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z',
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
        },
        error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS',
        },
    },

    // Product responses
    products: {
        list: {
            products: [
                {
                    id: '1',
                    name: 'Test Product 1',
                    price: 99.99,
                    description: 'Test product 1 description',
                    image: 'https://example.com/image1.jpg',
                    category: 'Electronics',
                    brand: 'Test Brand',
                    inStock: true,
                    stock: 100,
                    rating: 4.5,
                    reviewCount: 10,
                },
                {
                    id: '2',
                    name: 'Test Product 2',
                    price: 149.99,
                    description: 'Test product 2 description',
                    image: 'https://example.com/image2.jpg',
                    category: 'Electronics',
                    brand: 'Test Brand',
                    inStock: true,
                    stock: 50,
                    rating: 4.2,
                    reviewCount: 5,
                },
            ],
            total: 2,
            page: 1,
            limit: 10,
        },
        single: {
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
            images: [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg',
            ],
            specifications: {
                weight: '1kg',
                dimensions: '10x10x10cm',
                color: 'Black',
            },
        },
    },

    // Cart responses
    cart: {
        get: {
            items: [
                {
                    id: '1',
                    productId: '1',
                    product: {
                        id: '1',
                        name: 'Test Product',
                        price: 99.99,
                        image: 'https://example.com/image.jpg',
                    },
                    quantity: 2,
                    price: 99.99,
                    total: 199.98,
                },
            ],
            subtotal: 199.98,
            total: 199.98,
            itemCount: 1,
            isEmpty: false,
        },
        add: {
            success: true,
            message: 'Item added to cart',
        },
        update: {
            success: true,
            message: 'Cart updated',
        },
        remove: {
            success: true,
            message: 'Item removed from cart',
        },
        clear: {
            success: true,
            message: 'Cart cleared',
        },
    },

    // Checkout responses
    checkout: {
        create: {
            orderId: 'order-123',
            status: 'pending',
            total: 199.98,
            items: [
                {
                    productId: '1',
                    quantity: 2,
                    price: 99.99,
                    total: 199.98,
                },
            ],
        },
        payment: {
            success: true,
            transactionId: 'txn-123',
            status: 'completed',
        },
    },

    // Error responses
    errors: {
        network: {
            message: 'Network error',
            code: 'NETWORK_ERROR',
        },
        server: {
            message: 'Internal server error',
            code: 'SERVER_ERROR',
        },
        validation: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: {
                email: 'Invalid email format',
                password: 'Password too short',
            },
        },
        unauthorized: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
        },
        forbidden: {
            message: 'Forbidden',
            code: 'FORBIDDEN',
        },
        notFound: {
            message: 'Not found',
            code: 'NOT_FOUND',
        },
    },
}

// Mock fetch function
export const mockFetch = (responses: Record<string, any> = {}) => {
    const defaultResponses = {
        '/api/v1/auth/login': mockApiResponses.login.success,
        '/api/v1/auth/register': mockApiResponses.register.success,
        '/api/v1/products': mockApiResponses.products.list,
        '/api/v1/products/1': mockApiResponses.products.single,
        '/api/v1/cart': mockApiResponses.cart.get,
        '/api/v1/cart/add': mockApiResponses.cart.add,
        '/api/v1/cart/update': mockApiResponses.cart.update,
        '/api/v1/cart/remove': mockApiResponses.cart.remove,
        '/api/v1/cart/clear': mockApiResponses.cart.clear,
        '/api/v1/checkout': mockApiResponses.checkout.create,
        '/api/v1/checkout/payment': mockApiResponses.checkout.payment,
    }

    const allResponses = { ...defaultResponses, ...responses }

    global.fetch = jest.fn().mockImplementation((url: string, _options: any = {}) => {
        const response = allResponses[url]

        if (!response) {
            return Promise.reject(new Error(`No mock response for ${url}`))
        }

        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(response),
                    text: () => Promise.resolve(JSON.stringify(response)),
                })
            }, 100)
        })
    })
}

// Mock fetch with error
export const mockFetchError = (error: any) => {
    global.fetch = jest.fn().mockRejectedValue(error)
}

// Mock fetch with specific response
export const mockFetchResponse = (url: string, response: any, status = 200) => {
    global.fetch = jest.fn().mockImplementation((requestUrl: string) => {
        if (requestUrl === url) {
            return Promise.resolve({
                ok: status >= 200 && status < 300,
                status,
                json: () => Promise.resolve(response),
                text: () => Promise.resolve(JSON.stringify(response)),
            })
        }
        return Promise.reject(new Error(`No mock response for ${requestUrl}`))
    })
}

// Mock WebSocket
export const mockWebSocket = () => {
    const mockWs = {
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: 1,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
    }

    global.WebSocket = jest.fn().mockImplementation(() => mockWs)
    return mockWs
}

// Mock localStorage
export const mockLocalStorage = () => {
    const store: Record<string, string> = {}

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key])
        }),
        length: Object.keys(store).length,
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
    }
}

// Mock sessionStorage
export const mockSessionStorage = () => {
    const store: Record<string, string> = {}

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key])
        }),
        length: Object.keys(store).length,
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
    }
}

// Mock performance
export const mockPerformance = () => {
    const mockPerf = {
        now: jest.fn(() => Date.now()),
        timing: {
            navigationStart: 0,
            loadEventEnd: 1000,
            domContentLoadedEventEnd: 500,
            responseStart: 100,
        },
        getEntriesByType: jest.fn(() => []),
        mark: jest.fn(),
        measure: jest.fn(),
        clearMarks: jest.fn(),
        clearMeasures: jest.fn(),
    }

    global.performance = mockPerf as any
    return mockPerf
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
    const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }

    global.IntersectionObserver = jest.fn().mockImplementation(() => mockObserver)
    return mockObserver
}

// Mock ResizeObserver
export const mockResizeObserver = () => {
    const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }

    global.ResizeObserver = jest.fn().mockImplementation(() => mockObserver)
    return mockObserver
}

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
    const mockMedia = {
        matches,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((_query: any) => ({
            ...mockMedia,
            media: query,
        })),
    })

    return mockMedia
}

// Mock crypto
export const mockCrypto = () => {
    const mockCryptoObj = {
        randomUUID: jest.fn(() => 'mock-uuid'),
        getRandomValues: jest.fn((arr: any) => arr.map(() => Math.floor(Math.random() * 256))),
    }

    global.crypto = mockCryptoObj as any
    return mockCryptoObj
}

// Mock URL
export const mockURL = () => {
    const mockUrl = {
        createObjectURL: jest.fn(() => 'mock-object-url'),
        revokeObjectURL: jest.fn(),
    }

    global.URL.createObjectURL = mockUrl.createObjectURL
    global.URL.revokeObjectURL = mockUrl.revokeObjectURL
    return mockUrl
}

// Mock navigator
export const mockNavigator = () => {
    const mockNav = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        onLine: true,
        language: 'en-US',
        languages: ['en-US', 'en'],
        platform: 'Win32',
        cookieEnabled: true,
        doNotTrack: null,
    }

    Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: mockNav.userAgent,
    })

    Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: mockNav.onLine,
    })

    return mockNav
}

// Mock window.location
export const mockLocation = (url = 'http://localhost:3000') => {
    const mockLoc = {
        href: url,
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
    }

    // delete window.location
    window.location = mockLoc as any
    return mockLoc
}

// Mock console
export const mockConsole = () => {
    const mockConsoleObj = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    }

    global.console = mockConsoleObj as any
    return mockConsoleObj
}

// Mock setTimeout and setInterval
export const mockTimers = () => {
    jest.useFakeTimers()

    return {
        advanceTimersByTime: (ms: number) => jest.advanceTimersByTime(ms),
        runAllTimers: () => jest.runAllTimers(),
        runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
        clearAllTimers: () => jest.clearAllTimers(),
        restore: () => jest.useRealTimers(),
    }
}

// Mock environment variables
export const mockEnv = (env: Record<string, string> = {}) => {
    const originalEnv = process.env

    process.env = {
        ...originalEnv,
        ...env,
    }

    return {
        restore: () => {
            process.env = originalEnv
        },
    }
}

// Mock Redux store
export const mockStore = (initialState = {}) => {
    const store = {
        getState: jest.fn(() => initialState),
        dispatch: jest.fn(),
        subscribe: jest.fn(),
        replaceReducer: jest.fn(),
    }

    return store
}

// Mock React hooks
export const mockUseState = <T>(initialState: T) => {
    const setState = jest.fn()
    const useState = jest.fn(() => [initialState, setState])

    return { useState, setState }
}

export const mockUseEffect = () => {
    const useEffect = jest.fn()
    return useEffect
}

export const mockUseCallback = () => {
    const useCallback = jest.fn((fn: any) => fn)
    return useCallback
}

export const mockUseMemo = () => {
    const useMemo = jest.fn((fn: any) => fn())
    return useMemo
}

// Mock React Router
export const mockRouter = (router = {}) => {
    const mockRouterObj = {
        route: '/',
        pathname: '/',
        query: {},
        asPath: '/',
        push: jest.fn(),
        pop: jest.fn(),
        reload: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn().mockResolvedValue(undefined),
        beforePopState: jest.fn(),
        events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        },
        isFallback: false,
        ...router,
    }

    return mockRouterObj
}

// Mock Next.js navigation
export const mockNavigation = () => {
    const mockNav = {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }

    return mockNav
}

// Mock search params
export const mockSearchParams = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)

    return {
        get: jest.fn((key: string) => searchParams.get(key)),
        getAll: jest.fn((key: string) => searchParams.getAll(key)),
        has: jest.fn((key: string) => searchParams.has(key)),
        keys: jest.fn(() => Array.from(searchParams.keys())),
        values: jest.fn(() => Array.from(searchParams.values())),
        entries: jest.fn(() => Array.from(searchParams.entries())),
        forEach: jest.fn((callback: any) => searchParams.forEach(callback)),
        toString: jest.fn(() => searchParams.toString()),
    }
}

// Mock pathname
export const mockPathname = (pathname = '/') => {
    return pathname
}

// Clean up all mocks
export const cleanupMocks = () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    // Reset global mocks
    global.fetch = jest.fn()
    global.WebSocket = jest.fn()
    global.localStorage = mockLocalStorage()
    global.sessionStorage = mockSessionStorage()
    global.performance = mockPerformance() as any
    global.IntersectionObserver = jest.fn()
    global.ResizeObserver = jest.fn()
    global.crypto = mockCrypto() as any
    global.URL.createObjectURL = jest.fn()
    global.URL.revokeObjectURL = jest.fn()

    // Reset window mocks
    window.location = mockLocation() as any
    window.matchMedia = jest.fn()

    // Reset navigator mocks
    Object.defineProperty(global.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })

    Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        value: true,
    })
}

// Export all mocks
export default {
    mockApiResponses,
    mockFetch,
    mockFetchError,
    mockFetchResponse,
    mockWebSocket,
    mockLocalStorage,
    mockSessionStorage,
    mockPerformance,
    mockIntersectionObserver,
    mockResizeObserver,
    mockMatchMedia,
    mockCrypto,
    mockURL,
    mockNavigator,
    mockLocation,
    mockConsole,
    mockTimers,
    mockEnv,
    mockStore,
    mockUseState,
    mockUseEffect,
    mockUseCallback,
    mockUseMemo,
    mockRouter,
    mockNavigation,
    mockSearchParams,
    mockPathname,
    cleanupMocks,
}
