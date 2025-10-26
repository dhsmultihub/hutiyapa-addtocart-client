// import { Middleware } from '@reduxjs/toolkit'
// import { RootState } from '../store'

interface AnalyticsEvent {
    event: string
    category: string
    label?: string
    value?: number
    properties?: Record<string, any>
}

class Analytics {
    private events: AnalyticsEvent[] = []
    private sessionId: string
    private userId: string | null = null

    constructor() {
        this.sessionId = this.generateSessionId()
        this.trackSessionStart()
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private trackSessionStart() {
        this.track('session_start', 'User', 'Session Started', 1, {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
        })
    }

    track(event: string, category: string, label?: string, value?: number, properties?: Record<string, any>) {
        const analyticsEvent: AnalyticsEvent = {
            event,
            category,
            label,
            value,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString(),
            },
        }

        this.events.push(analyticsEvent)

        // Send to Google Analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', event, {
                event_category: category,
                event_label: label,
                value: value,
                custom_map: properties,
            })
        }

        // Send to custom analytics endpoint
        this.sendToAnalytics(analyticsEvent)

        // Console logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics]', analyticsEvent)
        }
    }

    private async sendToAnalytics(event: AnalyticsEvent) {
        try {
            // Send to your analytics endpoint
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            })
        } catch (error) {
            console.error('Failed to send analytics event:', error)
        }
    }

    setUserId(userId: string | null) {
        this.userId = userId
    }

    trackPageView(page: string, title?: string) {
        this.track('page_view', 'Navigation', page, 1, {
            page,
            title: title || page,
        })
    }

    trackUserAction(action: string, details?: Record<string, any>) {
        this.track('user_action', 'User', action, 1, details)
    }

    trackCartAction(action: string, productId?: string, quantity?: number) {
        this.track('cart_action', 'E-commerce', action, 1, {
            productId,
            quantity,
        })
    }

    trackProductView(productId: string, productName: string, category?: string) {
        this.track('product_view', 'E-commerce', 'Product Viewed', 1, {
            productId,
            productName,
            category,
        })
    }

    trackSearch(query: string, resultsCount?: number) {
        this.track('search', 'E-commerce', 'Product Search', 1, {
            query,
            resultsCount,
        })
    }

    trackCheckoutStep(step: number, stepName: string) {
        this.track('checkout_step', 'E-commerce', stepName, step, {
            step,
            stepName,
        })
    }

    trackPurchase(orderId: string, total: number, items: any[]) {
        this.track('purchase', 'E-commerce', 'Order Completed', total, {
            orderId,
            total,
            items: items.length,
        })
    }

    trackError(error: string, context?: string) {
        this.track('error', 'System', 'Error Occurred', 1, {
            error,
            context,
        })
    }

    getEvents(): AnalyticsEvent[] {
        return [...this.events]
    }

    clearEvents() {
        this.events = []
    }

    exportEvents(): string {
        return JSON.stringify(this.events, null, 2)
    }
}

const analytics = new Analytics()

export const analyticsMiddleware: any = (store: any) => (next: any) => (action: any) => {
    const result = next(action)
    // const state = store.getState()

    // Track specific Redux actions
    switch (action.type) {
        case 'cart/addItem':
            analytics.trackCartAction('add_item', action.payload.id, action.payload.quantity)
            break

        case 'cart/removeItem':
            analytics.trackCartAction('remove_item', action.payload)
            break

        case 'cart/clearCart':
            analytics.trackCartAction('clear_cart')
            break

        case 'auth/loginSuccess':
            analytics.setUserId(action.payload.user.id)
            analytics.trackUserAction('login_success', {
                userId: action.payload.user.id,
                email: action.payload.user.email,
            })
            break

        case 'auth/logout':
            analytics.trackUserAction('logout')
            analytics.setUserId(null)
            break

        case 'products/loadProductSuccess':
            analytics.trackProductView(
                action.payload.id,
                action.payload.title,
                action.payload.category
            )
            break

        case 'products/searchProductsSuccess':
            analytics.trackSearch(action.payload.query, action.payload.products.length)
            break

        case 'ui/trackPageView':
            analytics.trackPageView(action.payload.page, action.payload.title)
            break

        case 'ui/setCheckoutStep':
            analytics.trackCheckoutStep(action.payload, `Step ${action.payload}`)
            break

        case 'ui/setGlobalError':
            analytics.trackError(action.payload, 'Global Error')
            break

        case 'ui/setPageError':
            analytics.trackError(action.payload, 'Page Error')
            break
    }

    return result
}

export const pageViewMiddleware: any = (store: any) => (next: any) => (action: any) => {
    const result = next(action)

    // Track page views
    if (action.type === '@@router/LOCATION_CHANGE' || action.type === 'ui/trackPageView') {
        // const state = store.getState()
        const currentPage = window.location.pathname
        const pageTitle = document.title

        analytics.trackPageView(currentPage, pageTitle)
    }

    return result
}

export const errorTrackingMiddleware: any = (_store: any) => (next: any) => (action: any) => {
    try {
        return next(action)
    } catch (error) {
        // Track errors
        analytics.trackError(
            error instanceof Error ? error.message : String(error),
            `Redux Action: ${action.type}`
        )

        // Re-throw the error
        throw error
    }
}

export { analytics }
export default analyticsMiddleware
