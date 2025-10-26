// Test data fixtures for consistent testing

export const userFixtures = {
    validUser: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        isEmailVerified: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    newUser: {
        id: '2',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567891',
        isEmailVerified: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    adminUser: {
        id: '3',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567892',
        isEmailVerified: true,
        role: 'admin',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
}

export const productFixtures = {
    electronics: {
        id: '1',
        name: 'Wireless Headphones',
        price: 99.99,
        description: 'High-quality wireless headphones with noise cancellation',
        image: 'https://example.com/headphones.jpg',
        category: 'Electronics',
        brand: 'TechBrand',
        inStock: true,
        stock: 100,
        rating: 4.5,
        reviewCount: 25,
        images: [
            'https://example.com/headphones1.jpg',
            'https://example.com/headphones2.jpg',
        ],
        specifications: {
            weight: '250g',
            dimensions: '20x15x8cm',
            color: 'Black',
            connectivity: 'Bluetooth 5.0',
            battery: '30 hours',
        },
        tags: ['wireless', 'headphones', 'bluetooth', 'noise-cancellation'],
    },

    clothing: {
        id: '2',
        name: 'Cotton T-Shirt',
        price: 29.99,
        description: 'Comfortable cotton t-shirt in various colors',
        image: 'https://example.com/tshirt.jpg',
        category: 'Clothing',
        brand: 'FashionBrand',
        inStock: true,
        stock: 50,
        rating: 4.2,
        reviewCount: 15,
        images: [
            'https://example.com/tshirt1.jpg',
            'https://example.com/tshirt2.jpg',
        ],
        specifications: {
            material: '100% Cotton',
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Black', 'White', 'Blue', 'Red'],
            care: 'Machine washable',
        },
        tags: ['clothing', 't-shirt', 'cotton', 'casual'],
    },

    books: {
        id: '3',
        name: 'JavaScript Guide',
        price: 49.99,
        description: 'Comprehensive guide to JavaScript programming',
        image: 'https://example.com/book.jpg',
        category: 'Books',
        brand: 'TechBooks',
        inStock: true,
        stock: 25,
        rating: 4.8,
        reviewCount: 30,
        images: [
            'https://example.com/book1.jpg',
            'https://example.com/book2.jpg',
        ],
        specifications: {
            pages: 500,
            language: 'English',
            format: 'Paperback',
            isbn: '978-1234567890',
            author: 'John Doe',
        },
        tags: ['books', 'javascript', 'programming', 'guide'],
    },
}

export const cartFixtures = {
    emptyCart: {
        items: [],
        subtotal: 0,
        total: 0,
        itemCount: 0,
        isEmpty: true,
    },

    singleItemCart: {
        items: [
            {
                id: '1',
                productId: '1',
                product: productFixtures.electronics,
                quantity: 1,
                price: 99.99,
                total: 99.99,
            },
        ],
        subtotal: 99.99,
        total: 99.99,
        itemCount: 1,
        isEmpty: false,
    },

    multipleItemsCart: {
        items: [
            {
                id: '1',
                productId: '1',
                product: productFixtures.electronics,
                quantity: 2,
                price: 99.99,
                total: 199.98,
            },
            {
                id: '2',
                productId: '2',
                product: productFixtures.clothing,
                quantity: 1,
                price: 29.99,
                total: 29.99,
            },
        ],
        subtotal: 229.97,
        total: 229.97,
        itemCount: 2,
        isEmpty: false,
    },
}

export const addressFixtures = {
    homeAddress: {
        id: '1',
        type: 'home',
        firstName: 'Test',
        lastName: 'User',
        company: '',
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        phone: '+1234567890',
        isDefault: true,
    },

    workAddress: {
        id: '2',
        type: 'work',
        firstName: 'Test',
        lastName: 'User',
        company: 'Tech Corp',
        address1: '456 Business Ave',
        address2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'US',
        phone: '+1234567890',
        isDefault: false,
    },
}

export const orderFixtures = {
    pendingOrder: {
        id: 'order-123',
        status: 'pending',
        total: 199.98,
        subtotal: 199.98,
        tax: 0,
        shipping: 0,
        items: [
            {
                productId: '1',
                product: productFixtures.electronics,
                quantity: 2,
                price: 99.99,
                total: 199.98,
            },
        ],
        shippingAddress: addressFixtures.homeAddress,
        billingAddress: addressFixtures.homeAddress,
        paymentMethod: 'credit_card',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    completedOrder: {
        id: 'order-456',
        status: 'completed',
        total: 99.99,
        subtotal: 99.99,
        tax: 0,
        shipping: 0,
        items: [
            {
                productId: '1',
                product: productFixtures.electronics,
                quantity: 1,
                price: 99.99,
                total: 99.99,
            },
        ],
        shippingAddress: addressFixtures.homeAddress,
        billingAddress: addressFixtures.homeAddress,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        trackingNumber: 'TRK123456789',
        shippedAt: '2023-01-02T00:00:00Z',
        deliveredAt: '2023-01-05T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-05T00:00:00Z',
    },
}

export const paymentFixtures = {
    creditCard: {
        type: 'credit_card',
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Test User',
    },

    paypal: {
        type: 'paypal',
        email: 'test@example.com',
    },

    stripe: {
        type: 'stripe',
        paymentMethodId: 'pm_1234567890',
    },
}

export const notificationFixtures = {
    orderConfirmation: {
        id: '1',
        type: 'order_confirmation',
        title: 'Order Confirmed',
        message: 'Your order #123 has been confirmed',
        data: {
            orderId: 'order-123',
            total: 199.98,
        },
        isRead: false,
        createdAt: '2023-01-01T00:00:00Z',
    },

    shippingUpdate: {
        id: '2',
        type: 'shipping_update',
        title: 'Order Shipped',
        message: 'Your order #123 has been shipped',
        data: {
            orderId: 'order-123',
            trackingNumber: 'TRK123456789',
        },
        isRead: false,
        createdAt: '2023-01-02T00:00:00Z',
    },

    priceDrop: {
        id: '3',
        type: 'price_drop',
        title: 'Price Drop Alert',
        message: 'The price of Wireless Headphones has dropped to $79.99',
        data: {
            productId: '1',
            oldPrice: 99.99,
            newPrice: 79.99,
        },
        isRead: false,
        createdAt: '2023-01-03T00:00:00Z',
    },
}

export const searchFixtures = {
    electronicsQuery: {
        query: 'wireless headphones',
        filters: {
            category: 'Electronics',
            priceRange: { min: 50, max: 200 },
            brand: 'TechBrand',
            inStock: true,
        },
        sort: 'price_asc',
        page: 1,
        limit: 10,
    },

    clothingQuery: {
        query: 'cotton t-shirt',
        filters: {
            category: 'Clothing',
            priceRange: { min: 20, max: 50 },
            brand: 'FashionBrand',
            inStock: true,
        },
        sort: 'rating_desc',
        page: 1,
        limit: 10,
    },
}

export const reviewFixtures = {
    positiveReview: {
        id: '1',
        productId: '1',
        userId: '1',
        rating: 5,
        title: 'Excellent product!',
        comment: 'Great sound quality and comfortable to wear',
        isVerified: true,
        helpful: 10,
        createdAt: '2023-01-01T00:00:00Z',
    },

    negativeReview: {
        id: '2',
        productId: '1',
        userId: '2',
        rating: 2,
        title: 'Not as expected',
        comment: 'Sound quality could be better',
        isVerified: true,
        helpful: 2,
        createdAt: '2023-01-02T00:00:00Z',
    },

    neutralReview: {
        id: '3',
        productId: '1',
        userId: '3',
        rating: 3,
        title: 'Average product',
        comment: 'It works but nothing special',
        isVerified: false,
        helpful: 1,
        createdAt: '2023-01-03T00:00:00Z',
    },
}

export const couponFixtures = {
    percentageCoupon: {
        id: '1',
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minOrderAmount: 100,
        maxDiscount: 50,
        isActive: true,
        expiresAt: '2023-12-31T23:59:59Z',
        usageLimit: 100,
        usedCount: 25,
    },

    fixedCoupon: {
        id: '2',
        code: 'SAVE10',
        type: 'fixed',
        value: 10,
        minOrderAmount: 50,
        maxDiscount: 10,
        isActive: true,
        expiresAt: '2023-12-31T23:59:59Z',
        usageLimit: 50,
        usedCount: 10,
    },

    freeShippingCoupon: {
        id: '3',
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minOrderAmount: 75,
        maxDiscount: 0,
        isActive: true,
        expiresAt: '2023-12-31T23:59:59Z',
        usageLimit: 200,
        usedCount: 50,
    },
}

export const wishlistFixtures = {
    emptyWishlist: {
        items: [],
        itemCount: 0,
        isEmpty: true,
    },

    populatedWishlist: {
        items: [
            {
                id: '1',
                productId: '1',
                product: productFixtures.electronics,
                addedAt: '2023-01-01T00:00:00Z',
            },
            {
                id: '2',
                productId: '2',
                product: productFixtures.clothing,
                addedAt: '2023-01-02T00:00:00Z',
            },
        ],
        itemCount: 2,
        isEmpty: false,
    },
}

export const analyticsFixtures = {
    pageView: {
        page: '/products',
        title: 'Products',
        url: 'https://example.com/products',
        referrer: 'https://google.com',
        timestamp: '2023-01-01T00:00:00Z',
        userId: '1',
        sessionId: 'session-123',
    },

    productView: {
        productId: '1',
        productName: 'Wireless Headphones',
        category: 'Electronics',
        price: 99.99,
        timestamp: '2023-01-01T00:00:00Z',
        userId: '1',
        sessionId: 'session-123',
    },

    addToCart: {
        productId: '1',
        productName: 'Wireless Headphones',
        quantity: 1,
        price: 99.99,
        total: 99.99,
        timestamp: '2023-01-01T00:00:00Z',
        userId: '1',
        sessionId: 'session-123',
    },

    purchase: {
        orderId: 'order-123',
        total: 199.98,
        items: [
            {
                productId: '1',
                productName: 'Wireless Headphones',
                quantity: 2,
                price: 99.99,
                total: 199.98,
            },
        ],
        timestamp: '2023-01-01T00:00:00Z',
        userId: '1',
        sessionId: 'session-123',
    },
}

export const errorFixtures = {
    validationError: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
            email: 'Invalid email format',
            password: 'Password must be at least 8 characters',
        },
    },

    networkError: {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        status: 0,
    },

    serverError: {
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        status: 500,
    },

    unauthorizedError: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        status: 401,
    },

    forbiddenError: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
        status: 403,
    },

    notFoundError: {
        message: 'Not found',
        code: 'NOT_FOUND',
        status: 404,
    },
}

export const performanceFixtures = {
    coreWebVitals: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 800,
    },

    performanceMetrics: {
        pageLoadTime: 2000,
        domContentLoaded: 1500,
        windowLoad: 2000,
        memoryUsage: 50,
        connectionSpeed: '4g',
    },
}

export const accessibilityFixtures = {
    keyboardNavigation: {
        tabOrder: ['header', 'main', 'footer'],
        focusableElements: ['button', 'input', 'link', 'select'],
        skipLinks: ['skip-to-main', 'skip-to-nav'],
    },

    screenReader: {
        landmarks: ['banner', 'main', 'navigation', 'contentinfo'],
        headings: ['h1', 'h2', 'h3'],
        altText: ['Product image', 'Logo', 'Icon'],
    },

    colorContrast: {
        primary: '#000000',
        secondary: '#666666',
        background: '#FFFFFF',
        ratio: 4.5,
    },
}

export default {
    userFixtures,
    productFixtures,
    cartFixtures,
    addressFixtures,
    orderFixtures,
    paymentFixtures,
    notificationFixtures,
    searchFixtures,
    reviewFixtures,
    couponFixtures,
    wishlistFixtures,
    analyticsFixtures,
    errorFixtures,
    performanceFixtures,
    accessibilityFixtures,
}
