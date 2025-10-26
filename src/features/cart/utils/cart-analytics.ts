import { CartState, CartItem } from '../redux/cart.slice'

export interface CartAnalyticsEvent {
    event: string
    timestamp: number
    userId?: string
    sessionId: string
    data: any
}

export interface CartMetrics {
    totalItems: number
    totalValue: number
    averageItemValue: number
    cartAbandonmentRate: number
    conversionRate: number
    popularProducts: Array<{
        productId: string
        name: string
        views: number
        adds: number
        purchases: number
    }>
}

export interface CartBehaviorData {
    timeSpent: number
    pageViews: number
    interactions: number
    cartModifications: number
    checkoutAttempts: number
    abandonedAt: string | null
}

export class CartAnalytics {
    private static readonly SESSION_KEY = 'cart_session'
    private static readonly EVENTS_KEY = 'cart_events'
    private sessionId: string
    private startTime: number
    private events: CartAnalyticsEvent[] = []

    constructor() {
        this.sessionId = this.generateSessionId()
        this.startTime = Date.now()
        this.loadEvents()
    }

    /**
     * Track cart item added
     */
    trackItemAdded(item: CartItem, source: string = 'unknown'): void {
        this.addEvent('cart_item_added', {
            itemId: item.id,
            itemName: item.title,
            price: item.price,
            quantity: item.quantity,
            source,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart item removed
     */
    trackItemRemoved(item: CartItem, reason: string = 'user_action'): void {
        this.addEvent('cart_item_removed', {
            itemId: item.id,
            itemName: item.title,
            price: item.price,
            quantity: item.quantity,
            reason,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart item quantity changed
     */
    trackQuantityChanged(item: CartItem, oldQuantity: number, newQuantity: number): void {
        this.addEvent('cart_quantity_changed', {
            itemId: item.id,
            itemName: item.title,
            oldQuantity,
            newQuantity,
            change: newQuantity - oldQuantity,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart viewed
     */
    trackCartViewed(cart: CartState): void {
        this.addEvent('cart_viewed', {
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            totalQuantity: cart.totalQuantity,
            hasCoupon: !!cart.couponCode,
            hasGiftCard: !!cart.giftCardCode,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart abandoned
     */
    trackCartAbandoned(cart: CartState, reason: string = 'user_navigation'): void {
        this.addEvent('cart_abandoned', {
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            totalQuantity: cart.totalQuantity,
            timeSpent: Date.now() - this.startTime,
            reason,
            timestamp: Date.now(),
        })
    }

    /**
     * Track checkout started
     */
    trackCheckoutStarted(cart: CartState): void {
        this.addEvent('checkout_started', {
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            totalQuantity: cart.totalQuantity,
            timestamp: Date.now(),
        })
    }

    /**
     * Track checkout completed
     */
    trackCheckoutCompleted(cart: CartState, orderId: string): void {
        this.addEvent('checkout_completed', {
            orderId,
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            totalQuantity: cart.totalQuantity,
            timestamp: Date.now(),
        })
    }

    /**
     * Track coupon applied
     */
    trackCouponApplied(code: string, discount: number, cartValue: number): void {
        this.addEvent('coupon_applied', {
            code,
            discount,
            cartValue,
            discountPercentage: (discount / cartValue) * 100,
            timestamp: Date.now(),
        })
    }

    /**
     * Track gift card applied
     */
    trackGiftCardApplied(code: string, amount: number, cartValue: number): void {
        this.addEvent('gift_card_applied', {
            code,
            amount,
            cartValue,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart cleared
     */
    trackCartCleared(cart: CartState, reason: string = 'user_action'): void {
        this.addEvent('cart_cleared', {
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            reason,
            timestamp: Date.now(),
        })
    }

    /**
     * Track product viewed in cart
     */
    trackProductViewed(productId: string, productName: string, price: number): void {
        this.addEvent('product_viewed', {
            productId,
            productName,
            price,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart shared
     */
    trackCartShared(method: string, cart: CartState): void {
        this.addEvent('cart_shared', {
            method,
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            timestamp: Date.now(),
        })
    }

    /**
     * Track cart saved for later
     */
    trackCartSavedForLater(cart: CartState): void {
        this.addEvent('cart_saved_for_later', {
            itemCount: cart.items.length,
            totalValue: cart.subtotal,
            timestamp: Date.now(),
        })
    }

    /**
     * Get cart behavior data
     */
    getCartBehaviorData(): CartBehaviorData {
        const timeSpent = Date.now() - this.startTime
        const pageViews = this.events.filter(e => e.event === 'cart_viewed').length
        const interactions = this.events.length
        const cartModifications = this.events.filter(e =>
            e.event === 'cart_item_added' ||
            e.event === 'cart_item_removed' ||
            e.event === 'cart_quantity_changed'
        ).length
        const checkoutAttempts = this.events.filter(e => e.event === 'checkout_started').length
        const abandonedAt = this.events.find(e => e.event === 'cart_abandoned')?.timestamp || null

        return {
            timeSpent,
            pageViews,
            interactions,
            cartModifications,
            checkoutAttempts,
            abandonedAt,
        }
    }

    /**
     * Get cart metrics
     */
    getCartMetrics(): CartMetrics {
        const totalItems = this.events
            .filter(e => e.event === 'cart_item_added')
            .reduce((sum, e) => sum + (e.data.quantity || 0), 0)

        const totalValue = this.events
            .filter(e => e.event === 'cart_viewed')
            .reduce((sum, e) => sum + (e.data.totalValue || 0), 0)

        const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0

        const cartAbandonmentRate = this.calculateAbandonmentRate()
        const conversionRate = this.calculateConversionRate()

        const popularProducts = this.getPopularProducts()

        return {
            totalItems,
            totalValue,
            averageItemValue,
            cartAbandonmentRate,
            conversionRate,
            popularProducts,
        }
    }

    /**
     * Calculate cart abandonment rate
     */
    private calculateAbandonmentRate(): number {
        const cartViews = this.events.filter(e => e.event === 'cart_viewed').length
        const cartAbandoned = this.events.filter(e => e.event === 'cart_abandoned').length

        return cartViews > 0 ? (cartAbandoned / cartViews) * 100 : 0
    }

    /**
     * Calculate conversion rate
     */
    private calculateConversionRate(): number {
        const checkoutStarted = this.events.filter(e => e.event === 'checkout_started').length
        const checkoutCompleted = this.events.filter(e => e.event === 'checkout_completed').length

        return checkoutStarted > 0 ? (checkoutCompleted / checkoutStarted) * 100 : 0
    }

    /**
     * Get popular products
     */
    private getPopularProducts(): Array<{
        productId: string
        name: string
        views: number
        adds: number
        purchases: number
    }> {
        const productMap = new Map<string, {
            productId: string
            name: string
            views: number
            adds: number
            purchases: number
        }>()

        this.events.forEach(event => {
            if (event.data.productId) {
                const productId = event.data.productId
                const productName = event.data.productName || event.data.itemName || 'Unknown'

                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        productId,
                        name: productName,
                        views: 0,
                        adds: 0,
                        purchases: 0,
                    })
                }

                const product = productMap.get(productId)!

                switch (event.event) {
                    case 'product_viewed':
                        product.views++
                        break
                    case 'cart_item_added':
                        product.adds++
                        break
                    case 'checkout_completed':
                        product.purchases++
                        break
                }
            }
        })

        return Array.from(productMap.values())
            .sort((a, b) => b.adds - a.adds)
            .slice(0, 10)
    }

    /**
     * Add event to analytics
     */
    private addEvent(event: string, data: any): void {
        const analyticsEvent: CartAnalyticsEvent = {
            event,
            timestamp: Date.now(),
            userId: this.getUserId(),
            sessionId: this.sessionId,
            data,
        }

        this.events.push(analyticsEvent)
        this.saveEvents()
        this.sendToAnalytics(analyticsEvent)
    }

    /**
     * Send event to analytics service
     */
    private sendToAnalytics(event: CartAnalyticsEvent): void {
        try {
            // Send to Google Analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', event.event, {
                    event_category: 'Cart',
                    event_label: event.data.itemName || event.data.productName,
                    value: event.data.totalValue || event.data.price,
                    custom_map: {
                        session_id: event.sessionId,
                        user_id: event.userId,
                        timestamp: event.timestamp,
                    }
                })
            }

            // Send to custom analytics endpoint
            this.sendToCustomAnalytics(event)
        } catch (error) {
            console.error('Failed to send analytics event:', error)
        }
    }

    /**
     * Send to custom analytics endpoint
     */
    private async sendToCustomAnalytics(event: CartAnalyticsEvent): Promise<void> {
        try {
            // This would typically send to your analytics service
            console.log('Analytics event:', event)
        } catch (error) {
            console.error('Failed to send to custom analytics:', error)
        }
    }

    /**
     * Load events from storage
     */
    private loadEvents(): void {
        try {
            const stored = localStorage.getItem(this.EVENTS_KEY)
            if (stored) {
                this.events = JSON.parse(stored)
            }
        } catch (error) {
            console.error('Failed to load analytics events:', error)
            this.events = []
        }
    }

    /**
     * Save events to storage
     */
    private saveEvents(): void {
        try {
            localStorage.setItem(this.EVENTS_KEY, JSON.stringify(this.events))
        } catch (error) {
            console.error('Failed to save analytics events:', error)
        }
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Get user ID
     */
    private getUserId(): string | undefined {
        // This would typically come from auth state
        return undefined
    }

    /**
     * Clear analytics data
     */
    clearAnalytics(): void {
        this.events = []
        this.saveEvents()
    }

    /**
     * Export analytics data
     */
    exportAnalytics(): string {
        return JSON.stringify({
            sessionId: this.sessionId,
            startTime: this.startTime,
            events: this.events,
            behavior: this.getCartBehaviorData(),
            metrics: this.getCartMetrics(),
        }, null, 2)
    }
}

export const cartAnalytics = new CartAnalytics()
export default cartAnalytics
