interface AnalyticsEvent {
    event: string
    properties?: Record<string, any>
    userId?: string
    sessionId?: string
    timestamp?: number
}

interface EcommerceEvent {
    event: string
    ecommerce: {
        currency: string
        value: number
        items: Array<{
            item_id: string
            item_name: string
            item_category: string
            item_brand?: string
            price: number
            quantity: number
        }>
    }
}

interface UserProperties {
    userId: string
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
    createdAt?: string
    lastLogin?: string
    totalOrders?: number
    totalSpent?: number
    preferredLanguage?: string
    timezone?: string
}

interface PageViewEvent {
    page: string
    title: string
    url: string
    referrer?: string
    timestamp?: number
}

interface SearchEvent {
    search_term: string
    results_count: number
    filters?: Record<string, any>
    sort?: string
    category?: string
}

interface CartEvent {
    event: 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout'
    currency: string
    value: number
    items: Array<{
        item_id: string
        item_name: string
        item_category: string
        item_brand?: string
        price: number
        quantity: number
    }>
}

interface CheckoutEvent {
    event: 'begin_checkout' | 'add_payment_info' | 'add_shipping_info' | 'purchase'
    currency: string
    value: number
    transaction_id?: string
    items: Array<{
        item_id: string
        item_name: string
        item_category: string
        item_brand?: string
        price: number
        quantity: number
    }>
    payment_method?: string
    shipping_method?: string
    coupon?: string
}

interface PerformanceEvent {
    event: 'page_load' | 'first_contentful_paint' | 'largest_contentful_paint' | 'first_input_delay' | 'cumulative_layout_shift'
    value: number
    page: string
    timestamp: number
}

export class AnalyticsManager {
    private static instance: AnalyticsManager
    private userId: string | null = null
    private sessionId: string | null = null
    private debug: boolean = false

    constructor(debug: boolean = false) {
        this.debug = debug
        this.sessionId = this.generateSessionId()
    }

    static getInstance(debug: boolean = false): AnalyticsManager {
        if (!AnalyticsManager.instance) {
            AnalyticsManager.instance = new AnalyticsManager(debug)
        }
        return AnalyticsManager.instance
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private log(message: string, data?: any): void {
        if (this.debug) {
            console.log(`[Analytics] ${message}`, data)
        }
    }

    // User Management
    setUserId(userId: string): void {
        this.userId = userId
        this.log('User ID set', { userId })

        // Set user ID in all analytics platforms
        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
                    user_id: userId,
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('init', process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID, {
                    external_id: userId,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.identify(userId)
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().setUserId(userId)
            }

            // Segment
            if (window.analytics) {
                window.analytics.identify(userId)
            }
        }
    }

    setUserProperties(properties: UserProperties): void {
        this.log('User properties set', properties)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
                    custom_map: {
                        user_id: properties.userId,
                        email: properties.email,
                        first_name: properties.firstName,
                        last_name: properties.lastName,
                        phone: properties.phone,
                        total_orders: properties.totalOrders,
                        total_spent: properties.totalSpent,
                    },
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.people.set(properties)
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().setUserProperties(properties)
            }

            // Segment
            if (window.analytics) {
                window.analytics.identify(properties.userId, properties)
            }
        }
    }

    // Page Tracking
    trackPageView(event: PageViewEvent): void {
        this.log('Page view tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
                    page_title: event.title,
                    page_location: event.url,
                    page_referrer: event.referrer,
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', 'PageView')
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track('Page View', {
                    page: event.page,
                    title: event.title,
                    url: event.url,
                    referrer: event.referrer,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent('Page View', {
                    page: event.page,
                    title: event.title,
                    url: event.url,
                    referrer: event.referrer,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.page(event.page, {
                    title: event.title,
                    url: event.url,
                    referrer: event.referrer,
                })
            }
        }
    }

    // E-commerce Tracking
    trackEcommerceEvent(event: EcommerceEvent): void {
        this.log('E-commerce event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', event.event, event.ecommerce)
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', event.event, {
                    value: event.ecommerce.value,
                    currency: event.ecommerce.currency,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track(event.event, event.ecommerce)
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent(event.event, event.ecommerce)
            }

            // Segment
            if (window.analytics) {
                window.analytics.track(event.event, event.ecommerce)
            }
        }
    }

    // Cart Tracking
    trackCartEvent(event: CartEvent): void {
        this.log('Cart event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', event.event, {
                    currency: event.currency,
                    value: event.value,
                    items: event.items,
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', event.event, {
                    value: event.value,
                    currency: event.currency,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track(event.event, {
                    currency: event.currency,
                    value: event.value,
                    items: event.items,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent(event.event, {
                    currency: event.currency,
                    value: event.value,
                    items: event.items,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track(event.event, {
                    currency: event.currency,
                    value: event.value,
                    items: event.items,
                })
            }
        }
    }

    // Checkout Tracking
    trackCheckoutEvent(event: CheckoutEvent): void {
        this.log('Checkout event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', event.event, {
                    currency: event.currency,
                    value: event.value,
                    transaction_id: event.transaction_id,
                    items: event.items,
                    payment_method: event.payment_method,
                    shipping_method: event.shipping_method,
                    coupon: event.coupon,
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', event.event, {
                    value: event.value,
                    currency: event.currency,
                    content_ids: event.items.map(item => item.item_id),
                    content_type: 'product',
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track(event.event, {
                    currency: event.currency,
                    value: event.value,
                    transaction_id: event.transaction_id,
                    items: event.items,
                    payment_method: event.payment_method,
                    shipping_method: event.shipping_method,
                    coupon: event.coupon,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent(event.event, {
                    currency: event.currency,
                    value: event.value,
                    transaction_id: event.transaction_id,
                    items: event.items,
                    payment_method: event.payment_method,
                    shipping_method: event.shipping_method,
                    coupon: event.coupon,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track(event.event, {
                    currency: event.currency,
                    value: event.value,
                    transaction_id: event.transaction_id,
                    items: event.items,
                    payment_method: event.payment_method,
                    shipping_method: event.shipping_method,
                    coupon: event.coupon,
                })
            }
        }
    }

    // Search Tracking
    trackSearch(event: SearchEvent): void {
        this.log('Search event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', 'search', {
                    search_term: event.search_term,
                    results_count: event.results_count,
                    filters: event.filters,
                    sort: event.sort,
                    category: event.category,
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', 'Search', {
                    search_string: event.search_term,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track('Search', {
                    search_term: event.search_term,
                    results_count: event.results_count,
                    filters: event.filters,
                    sort: event.sort,
                    category: event.category,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent('Search', {
                    search_term: event.search_term,
                    results_count: event.results_count,
                    filters: event.filters,
                    sort: event.sort,
                    category: event.category,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track('Search', {
                    search_term: event.search_term,
                    results_count: event.results_count,
                    filters: event.filters,
                    sort: event.sort,
                    category: event.category,
                })
            }
        }
    }

    // Performance Tracking
    trackPerformance(event: PerformanceEvent): void {
        this.log('Performance event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', event.event, {
                    value: event.value,
                    page: event.page,
                    timestamp: event.timestamp,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track(event.event, {
                    value: event.value,
                    page: event.page,
                    timestamp: event.timestamp,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent(event.event, {
                    value: event.value,
                    page: event.page,
                    timestamp: event.timestamp,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track(event.event, {
                    value: event.value,
                    page: event.page,
                    timestamp: event.timestamp,
                })
            }
        }
    }

    // Custom Event Tracking
    trackCustomEvent(event: AnalyticsEvent): void {
        this.log('Custom event tracked', event)

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', event.event, {
                    ...event.properties,
                    user_id: event.userId || this.userId,
                    session_id: event.sessionId || this.sessionId,
                    timestamp: event.timestamp || Date.now(),
                })
            }

            // Facebook Pixel
            if (window.fbq) {
                window.fbq('track', event.event, event.properties)
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track(event.event, {
                    ...event.properties,
                    user_id: event.userId || this.userId,
                    session_id: event.sessionId || this.sessionId,
                    timestamp: event.timestamp || Date.now(),
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent(event.event, {
                    ...event.properties,
                    user_id: event.userId || this.userId,
                    session_id: event.sessionId || this.sessionId,
                    timestamp: event.timestamp || Date.now(),
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track(event.event, {
                    ...event.properties,
                    user_id: event.userId || this.userId,
                    session_id: event.sessionId || this.sessionId,
                    timestamp: event.timestamp || Date.now(),
                })
            }
        }
    }

    // Error Tracking
    trackError(error: Error, context?: string): void {
        this.log('Error tracked', { error: error.message, context })

        if (typeof window !== 'undefined') {
            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                    description: error.message,
                    fatal: false,
                    context: context,
                })
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track('Error', {
                    message: error.message,
                    stack: error.stack,
                    context: context,
                })
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent('Error', {
                    message: error.message,
                    stack: error.stack,
                    context: context,
                })
            }

            // Segment
            if (window.analytics) {
                window.analytics.track('Error', {
                    message: error.message,
                    stack: error.stack,
                    context: context,
                })
            }
        }
    }

    // Conversion Funnel Tracking
    trackFunnelStep(step: string, stepNumber: number, totalSteps: number, properties?: Record<string, any>): void {
        this.log('Funnel step tracked', { step, stepNumber, totalSteps, properties })

        if (typeof window !== 'undefined') {
            const funnelData = {
                step,
                step_number: stepNumber,
                total_steps: totalSteps,
                progress: (stepNumber / totalSteps) * 100,
                ...properties,
            }

            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', 'funnel_step', funnelData)
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track('Funnel Step', funnelData)
            }

            // Amplitude
            if (window.amplitude) {
                window.amplitude.getInstance().logEvent('Funnel Step', funnelData)
            }

            // Segment
            if (window.analytics) {
                window.analytics.track('Funnel Step', funnelData)
            }
        }
    }

    // A/B Test Tracking
    trackABTest(testName: string, variant: string, properties?: Record<string, any>): void {
        this.log('A/B test tracked', { testName, variant, properties })

        if (typeof window !== 'undefined') {
            const abTestData = {
                test_name: testName,
                variant,
                ...properties,
            }

            // Google Analytics
            if ((window as any).gtag) {
                (window as any).gtag('event', 'ab_test', abTestData)
            }

            // Mixpanel
            if (window.mixpanel) {
                window.mixpanel.track('A/B Test', abTestData)
            }

            // Amplitude
            if ((window as any).amplitude) {
                (window as any).amplitude.getInstance().logEvent('A/B Test', abTestData)
            }

            // Segment
            if ((window as any).analytics) {
                (window as any).analytics.track('A/B Test', abTestData)
            }
        }
    }

    // Reset Analytics
    reset(): void {
        this.userId = null
        this.sessionId = this.generateSessionId()
        this.log('Analytics reset')
    }
}

// Export singleton instance
export const analytics = AnalyticsManager.getInstance(process.env.NODE_ENV === 'development')

// Export types
export type {
    AnalyticsEvent,
    EcommerceEvent,
    UserProperties,
    PageViewEvent,
    SearchEvent,
    CartEvent,
    CheckoutEvent,
    PerformanceEvent,
}
