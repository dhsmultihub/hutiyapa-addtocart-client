import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { analytics, PageViewEvent, SearchEvent, CartEvent, CheckoutEvent, PerformanceEvent } from '../lib/analytics'

interface UseAnalyticsOptions {
    trackPageViews?: boolean
    trackPerformance?: boolean
    trackErrors?: boolean
    debug?: boolean
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
    const {
        trackPageViews = true,
        trackPerformance = true,
        trackErrors = true,
        debug = false,
    } = options

    const router = useRouter()

    // Track page views
    useEffect(() => {
        if (!trackPageViews) return

        const handleRouteChange = (url: string) => {
            const pageViewEvent: PageViewEvent = {
                page: url,
                title: document.title,
                url: window.location.href,
                referrer: document.referrer,
                timestamp: Date.now(),
            }

            analytics.trackPageView(pageViewEvent)
        }

        // Track initial page load
        handleRouteChange(router.asPath)

        // Track route changes
        router.events.on('routeChangeComplete', handleRouteChange)

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [router, trackPageViews])

    // Track performance metrics
    useEffect(() => {
        if (!trackPerformance || typeof window === 'undefined') return

        const trackPerformanceMetrics = () => {
            // Track Core Web Vitals
            if ('web-vital' in window) {
                // This would be implemented with web-vitals library
                // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
            }

            // Track page load time
            const pageLoadTime = performance.now()
            const performanceEvent: PerformanceEvent = {
                event: 'page_load',
                value: pageLoadTime,
                page: router.asPath,
                timestamp: Date.now(),
            }
            analytics.trackPerformance(performanceEvent)
        }

        // Track performance after page load
        if (document.readyState === 'complete') {
            trackPerformanceMetrics()
        } else {
            window.addEventListener('load', trackPerformanceMetrics)
        }

        return () => {
            window.removeEventListener('load', trackPerformanceMetrics)
        }
    }, [router, trackPerformance])

    // Track errors
    useEffect(() => {
        if (!trackErrors || typeof window === 'undefined') return

        const handleError = (event: ErrorEvent) => {
            const error = new Error(event.message)
            error.stack = event.error?.stack
            analytics.trackError(error, 'JavaScript Error')
        }

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = new Error(event.reason)
            analytics.trackError(error, 'Unhandled Promise Rejection')
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [trackErrors])

    // Track search
    const trackSearch = useCallback((searchTerm: string, resultsCount: number, filters?: Record<string, any>, sort?: string, category?: string) => {
        const searchEvent: SearchEvent = {
            search_term: searchTerm,
            results_count: resultsCount,
            filters,
            sort,
            category,
        }
        analytics.trackSearch(searchEvent)
    }, [])

    // Track cart events
    const trackCartEvent = useCallback((event: 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout', items: any[], currency: string = 'USD') => {
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const cartEvent: CartEvent = {
            event,
            currency,
            value: totalValue,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                item_brand: item.brand,
                price: item.price,
                quantity: item.quantity,
            })),
        }
        analytics.trackCartEvent(cartEvent)
    }, [])

    // Track checkout events
    const trackCheckoutEvent = useCallback((event: 'begin_checkout' | 'add_payment_info' | 'add_shipping_info' | 'purchase', items: any[], currency: string = 'USD', transactionId?: string, paymentMethod?: string, shippingMethod?: string, coupon?: string) => {
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const checkoutEvent: CheckoutEvent = {
            event,
            currency,
            value: totalValue,
            transaction_id: transactionId,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                item_brand: item.brand,
                price: item.price,
                quantity: item.quantity,
            })),
            payment_method: paymentMethod,
            shipping_method: shippingMethod,
            coupon,
        }
        analytics.trackCheckoutEvent(checkoutEvent)
    }, [])

    // Track custom events
    const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
        analytics.trackCustomEvent({
            event,
            properties,
            timestamp: Date.now(),
        })
    }, [])

    // Track funnel steps
    const trackFunnelStep = useCallback((step: string, stepNumber: number, totalSteps: number, properties?: Record<string, any>) => {
        analytics.trackFunnelStep(step, stepNumber, totalSteps, properties)
    }, [])

    // Track A/B tests
    const trackABTest = useCallback((testName: string, variant: string, properties?: Record<string, any>) => {
        analytics.trackABTest(testName, variant, properties)
    }, [])

    // Set user properties
    const setUserProperties = useCallback((properties: any) => {
        analytics.setUserProperties(properties)
    }, [])

    // Set user ID
    const setUserId = useCallback((userId: string) => {
        analytics.setUserId(userId)
    }, [])

    return {
        trackSearch,
        trackCartEvent,
        trackCheckoutEvent,
        trackEvent,
        trackFunnelStep,
        trackABTest,
        setUserProperties,
        setUserId,
    }
}

export default useAnalytics
