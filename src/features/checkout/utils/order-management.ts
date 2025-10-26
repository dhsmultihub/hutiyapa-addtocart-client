import { CartItem } from '../../cart/redux/cart.slice'
import { Address } from '../../address/redux/address.slice'

export interface Order {
    id: string
    orderNumber: string
    customerId: string
    status: OrderStatus
    items: OrderItem[]
    shipping: OrderShipping
    billing: OrderBilling
    payment: OrderPayment
    totals: OrderTotals
    timeline: OrderTimelineEvent[]
    tracking: OrderTracking
    createdAt: string
    updatedAt: string
}

export interface OrderItem {
    productId: string
    name: string
    sku: string
    price: number
    quantity: number
    total: number
    image: string
    variant?: {
        size?: string
        color?: string
        material?: string
    }
}

export interface OrderShipping {
    address: Address
    method: string
    cost: number
    estimatedDelivery: string
    trackingNumber?: string
    carrier?: string
}

export interface OrderBilling {
    address: Address
    sameAsShipping: boolean
}

export interface OrderPayment {
    method: string
    status: PaymentStatus
    transactionId?: string
    amount: number
    currency: string
    processedAt?: string
}

export interface OrderTotals {
    subtotal: number
    shipping: number
    tax: number
    discount: number
    total: number
}

export interface OrderTimelineEvent {
    id: string
    status: OrderStatus
    message: string
    timestamp: string
    isVisible: boolean
}

export interface OrderTracking {
    status: OrderStatus
    location?: string
    estimatedDelivery?: string
    lastUpdated: string
    events: TrackingEvent[]
}

export interface TrackingEvent {
    id: string
    status: string
    location: string
    description: string
    timestamp: string
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
    | 'returned'

export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'refunded'
    | 'cancelled'

export interface OrderFilter {
    status?: OrderStatus[]
    dateRange?: {
        start: string
        end: string
    }
    customerId?: string
    search?: string
}

export interface OrderSort {
    field: 'createdAt' | 'updatedAt' | 'total' | 'status'
    order: 'asc' | 'desc'
}

export interface OrderAnalytics {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    conversionRate: number
    statusDistribution: { [status in OrderStatus]: number }
    monthlyRevenue: Array<{ month: string; revenue: number }>
    topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>
}

export class OrderManagement {
    private orders: Map<string, Order> = new Map()
    private orderCounter: number = 0

    /**
     * Create new order
     */
    createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline' | 'tracking'>): Order {
        const orderId = this.generateOrderId()
        const orderNumber = this.generateOrderNumber()
        const now = new Date().toISOString()

        const order: Order = {
            ...orderData,
            id: orderId,
            orderNumber,
            createdAt: now,
            updatedAt: now,
            timeline: this.createInitialTimeline(orderData.status),
            tracking: this.createInitialTracking(orderData.status),
        }

        this.orders.set(orderId, order)
        return order
    }

    /**
     * Get order by ID
     */
    getOrder(orderId: string): Order | null {
        return this.orders.get(orderId) || null
    }

    /**
     * Get order by order number
     */
    getOrderByNumber(orderNumber: string): Order | null {
        for (const order of this.orders.values()) {
            if (order.orderNumber === orderNumber) {
                return order
            }
        }
        return null
    }

    /**
     * Get orders by customer
     */
    getOrdersByCustomer(customerId: string, filter?: OrderFilter, sort?: OrderSort): Order[] {
        let orders = Array.from(this.orders.values()).filter(order => order.customerId === customerId)

        if (filter) {
            orders = this.applyOrderFilter(orders, filter)
        }

        if (sort) {
            orders = this.applyOrderSort(orders, sort)
        }

        return orders
    }

    /**
     * Get all orders
     */
    getAllOrders(filter?: OrderFilter, sort?: OrderSort, pagination?: { page: number; limit: number }): {
        orders: Order[]
        total: number
        pagination: { page: number; limit: number; totalPages: number }
    } {
        let orders = Array.from(this.orders.values())

        if (filter) {
            orders = this.applyOrderFilter(orders, filter)
        }

        if (sort) {
            orders = this.applyOrderSort(orders, sort)
        }

        const total = orders.length
        const totalPages = pagination ? Math.ceil(total / pagination.limit) : 1
        const page = pagination?.page || 1
        const limit = pagination?.limit || 10
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit

        const paginatedOrders = orders.slice(startIndex, endIndex)

        return {
            orders: paginatedOrders,
            total,
            pagination: { page, limit, totalPages },
        }
    }

    /**
     * Update order status
     */
    updateOrderStatus(orderId: string, status: OrderStatus, message?: string): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        const oldStatus = order.status
        order.status = status
        order.updatedAt = new Date().toISOString()

        // Add timeline event
        const timelineEvent: OrderTimelineEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status,
            message: message || this.getStatusMessage(status),
            timestamp: new Date().toISOString(),
            isVisible: true,
        }

        order.timeline.push(timelineEvent)

        // Update tracking
        order.tracking.status = status
        order.tracking.lastUpdated = new Date().toISOString()

        this.orders.set(orderId, order)
        return true
    }

    /**
     * Update payment status
     */
    updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, transactionId?: string): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        order.payment.status = paymentStatus
        order.payment.processedAt = new Date().toISOString()
        if (transactionId) {
            order.payment.transactionId = transactionId
        }

        order.updatedAt = new Date().toISOString()

        // Add timeline event
        const timelineEvent: OrderTimelineEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: order.status,
            message: `Payment ${paymentStatus}`,
            timestamp: new Date().toISOString(),
            isVisible: true,
        }

        order.timeline.push(timelineEvent)
        this.orders.set(orderId, order)
        return true
    }

    /**
     * Add tracking information
     */
    addTrackingInfo(orderId: string, trackingNumber: string, carrier: string): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        order.shipping.trackingNumber = trackingNumber
        order.shipping.carrier = carrier
        order.updatedAt = new Date().toISOString()

        // Add timeline event
        const timelineEvent: OrderTimelineEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: order.status,
            message: `Tracking number: ${trackingNumber}`,
            timestamp: new Date().toISOString(),
            isVisible: true,
        }

        order.timeline.push(timelineEvent)
        this.orders.set(orderId, order)
        return true
    }

    /**
     * Add tracking event
     */
    addTrackingEvent(orderId: string, event: Omit<TrackingEvent, 'id'>): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        const trackingEvent: TrackingEvent = {
            ...event,
            id: `tracking_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        }

        order.tracking.events.push(trackingEvent)
        order.tracking.lastUpdated = new Date().toISOString()
        order.updatedAt = new Date().toISOString()

        this.orders.set(orderId, order)
        return true
    }

    /**
     * Cancel order
     */
    cancelOrder(orderId: string, reason: string): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        // Check if order can be cancelled
        if (!this.canCancelOrder(order)) {
            return false
        }

        order.status = 'cancelled'
        order.updatedAt = new Date().toISOString()

        // Add timeline event
        const timelineEvent: OrderTimelineEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'cancelled',
            message: `Order cancelled: ${reason}`,
            timestamp: new Date().toISOString(),
            isVisible: true,
        }

        order.timeline.push(timelineEvent)
        this.orders.set(orderId, order)
        return true
    }

    /**
     * Refund order
     */
    refundOrder(orderId: string, amount: number, reason: string): boolean {
        const order = this.orders.get(orderId)
        if (!order) return false

        // Check if order can be refunded
        if (!this.canRefundOrder(order)) {
            return false
        }

        order.status = 'refunded'
        order.updatedAt = new Date().toISOString()

        // Add timeline event
        const timelineEvent: OrderTimelineEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'refunded',
            message: `Refund processed: $${amount} - ${reason}`,
            timestamp: new Date().toISOString(),
            isVisible: true,
        }

        order.timeline.push(timelineEvent)
        this.orders.set(orderId, order)
        return true
    }

    /**
     * Get order analytics
     */
    getOrderAnalytics(dateRange?: { start: string; end: string }): OrderAnalytics {
        let orders = Array.from(this.orders.values())

        if (dateRange) {
            orders = orders.filter(order => {
                const orderDate = new Date(order.createdAt)
                const startDate = new Date(dateRange.start)
                const endDate = new Date(dateRange.end)
                return orderDate >= startDate && orderDate <= endDate
            })
        }

        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0)
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        const statusDistribution: { [status in OrderStatus]: number } = {
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            refunded: 0,
            returned: 0,
        }

        orders.forEach(order => {
            statusDistribution[order.status]++
        })

        const monthlyRevenue = this.calculateMonthlyRevenue(orders)
        const topProducts = this.calculateTopProducts(orders)

        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            conversionRate: 0, // This would be calculated from cart analytics
            statusDistribution,
            monthlyRevenue,
            topProducts,
        }
    }

    /**
     * Get order timeline
     */
    getOrderTimeline(orderId: string): OrderTimelineEvent[] {
        const order = this.orders.get(orderId)
        if (!order) return []

        return order.timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }

    /**
     * Get order tracking
     */
    getOrderTracking(orderId: string): OrderTracking | null {
        const order = this.orders.get(orderId)
        if (!order) return null

        return order.tracking
    }

    /**
     * Search orders
     */
    searchOrders(query: string, limit: number = 10): Order[] {
        const searchTerms = query.toLowerCase().split(/\s+/)

        return Array.from(this.orders.values())
            .filter(order => {
                const searchableText = [
                    order.orderNumber,
                    order.customerId,
                    order.shipping.address.firstName,
                    order.shipping.address.lastName,
                    order.shipping.address.email,
                    ...order.items.map(item => item.name),
                ].join(' ').toLowerCase()

                return searchTerms.some(term => searchableText.includes(term))
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
    }

    /**
     * Generate order ID
     */
    private generateOrderId(): string {
        return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate order number
     */
    private generateOrderNumber(): string {
        this.orderCounter++
        const timestamp = Date.now().toString().slice(-6)
        return `ORD-${timestamp}-${this.orderCounter.toString().padStart(3, '0')}`
    }

    /**
     * Create initial timeline
     */
    private createInitialTimeline(status: OrderStatus): OrderTimelineEvent[] {
        return [
            {
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                status,
                message: 'Order created',
                timestamp: new Date().toISOString(),
                isVisible: true,
            },
        ]
    }

    /**
     * Create initial tracking
     */
    private createInitialTracking(status: OrderStatus): OrderTracking {
        return {
            status,
            lastUpdated: new Date().toISOString(),
            events: [],
        }
    }

    /**
     * Get status message
     */
    private getStatusMessage(status: OrderStatus): string {
        const messages: { [key in OrderStatus]: string } = {
            pending: 'Order is pending confirmation',
            confirmed: 'Order has been confirmed',
            processing: 'Order is being processed',
            shipped: 'Order has been shipped',
            delivered: 'Order has been delivered',
            cancelled: 'Order has been cancelled',
            refunded: 'Order has been refunded',
            returned: 'Order has been returned',
        }

        return messages[status]
    }

    /**
     * Check if order can be cancelled
     */
    private canCancelOrder(order: Order): boolean {
        return ['pending', 'confirmed'].includes(order.status)
    }

    /**
     * Check if order can be refunded
     */
    private canRefundOrder(order: Order): boolean {
        return ['delivered', 'shipped'].includes(order.status)
    }

    /**
     * Apply order filter
     */
    private applyOrderFilter(orders: Order[], filter: OrderFilter): Order[] {
        return orders.filter(order => {
            if (filter.status && !filter.status.includes(order.status)) {
                return false
            }

            if (filter.dateRange) {
                const orderDate = new Date(order.createdAt)
                const startDate = new Date(filter.dateRange.start)
                const endDate = new Date(filter.dateRange.end)
                if (orderDate < startDate || orderDate > endDate) {
                    return false
                }
            }

            if (filter.customerId && order.customerId !== filter.customerId) {
                return false
            }

            if (filter.search) {
                const searchTerms = filter.search.toLowerCase().split(/\s+/)
                const searchableText = [
                    order.orderNumber,
                    order.customerId,
                    order.shipping.address.firstName,
                    order.shipping.address.lastName,
                    ...order.items.map(item => item.name),
                ].join(' ').toLowerCase()

                if (!searchTerms.some(term => searchableText.includes(term))) {
                    return false
                }
            }

            return true
        })
    }

    /**
     * Apply order sort
     */
    private applyOrderSort(orders: Order[], sort: OrderSort): Order[] {
        return [...orders].sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sort.field) {
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
                    break
                case 'updatedAt':
                    aValue = new Date(a.updatedAt).getTime()
                    bValue = new Date(b.updatedAt).getTime()
                    break
                case 'total':
                    aValue = a.totals.total
                    bValue = b.totals.total
                    break
                case 'status':
                    aValue = a.status
                    bValue = b.status
                    break
                default:
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
            }

            if (aValue < bValue) {
                return sort.order === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sort.order === 'asc' ? 1 : -1
            }
            return 0
        })
    }

    /**
     * Calculate monthly revenue
     */
    private calculateMonthlyRevenue(orders: Order[]): Array<{ month: string; revenue: number }> {
        const monthlyData = new Map<string, number>()

        orders.forEach(order => {
            const month = order.createdAt.substring(0, 7) // YYYY-MM
            const revenue = monthlyData.get(month) || 0
            monthlyData.set(month, revenue + order.totals.total)
        })

        return Array.from(monthlyData.entries())
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))
    }

    /**
     * Calculate top products
     */
    private calculateTopProducts(orders: Order[]): Array<{ productId: string; name: string; quantity: number; revenue: number }> {
        const productData = new Map<string, { name: string; quantity: number; revenue: number }>()

        orders.forEach(order => {
            order.items.forEach(item => {
                const existing = productData.get(item.productId)
                if (existing) {
                    existing.quantity += item.quantity
                    existing.revenue += item.total
                } else {
                    productData.set(item.productId, {
                        name: item.name,
                        quantity: item.quantity,
                        revenue: item.total,
                    })
                }
            })
        })

        return Array.from(productData.entries())
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
    }
}

export const orderManagement = new OrderManagement()
export default orderManagement
