import { WS_EVENTS } from '../../../lib/constants'
import { WebSocketMessage } from './websocket-manager'

export interface RealtimeEvent {
    id: string
    type: string
    event: string
    data: any
    timestamp: string
    userId?: string
    sessionId?: string
    metadata?: Record<string, any>
}

export interface CartEvent {
    type: 'cart.updated' | 'cart.item.added' | 'cart.item.removed' | 'cart.item.updated'
    cartId: string
    userId: string
    item?: {
        id: string
        productId: string
        quantity: number
        price: number
        name: string
        image?: string
    }
    changes?: {
        field: string
        oldValue: any
        newValue: any
    }[]
    timestamp: string
}

export interface ProductEvent {
    type: 'product.price.changed' | 'product.stock.updated' | 'product.availability.changed'
    productId: string
    changes: {
        field: string
        oldValue: any
        newValue: any
    }[]
    timestamp: string
}

export interface OrderEvent {
    type: 'order.created' | 'order.status.changed' | 'order.updated' | 'order.cancelled'
    orderId: string
    userId: string
    status: string
    changes?: {
        field: string
        oldValue: any
        newValue: any
    }[]
    timestamp: string
}

export interface NotificationEvent {
    type: 'notification.new' | 'notification.read' | 'notification.deleted'
    notificationId: string
    userId: string
    title: string
    message: string
    category: 'info' | 'warning' | 'error' | 'success'
    isRead: boolean
    timestamp: string
}

export interface UserEvent {
    type: 'user.online' | 'user.offline' | 'user.typing' | 'user.activity'
    userId: string
    sessionId: string
    activity?: string
    location?: string
    device?: string
    timestamp: string
}

export interface SystemEvent {
    type: 'system.maintenance' | 'system.update' | 'system.alert'
    message: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    scheduledAt?: string
    duration?: number
    timestamp: string
}

export type RealtimeEventData =
    | CartEvent
    | ProductEvent
    | OrderEvent
    | NotificationEvent
    | UserEvent
    | SystemEvent

export interface EventHandler {
    (event: RealtimeEvent): void
}

export interface EventSubscription {
    id: string
    eventType: string
    handler: EventHandler
    isActive: boolean
    createdAt: string
}

export class RealtimeEventManager {
    private eventHandlers: Map<string, EventHandler[]> = new Map()
    private subscriptions: Map<string, EventSubscription> = new Map()
    private eventHistory: RealtimeEvent[] = []
    private maxHistorySize: number = 1000

    constructor() {
        this.setupDefaultHandlers()
    }

    /**
     * Subscribe to event type
     */
    subscribe(eventType: string, handler: EventHandler): string {
        const subscriptionId = this.generateSubscriptionId()

        const subscription: EventSubscription = {
            id: subscriptionId,
            eventType,
            handler,
            isActive: true,
            createdAt: new Date().toISOString(),
        }

        this.subscriptions.set(subscriptionId, subscription)

        // Add to event handlers
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, [])
        }
        this.eventHandlers.get(eventType)!.push(handler)

        return subscriptionId
    }

    /**
     * Unsubscribe from event
     */
    unsubscribe(subscriptionId: string): boolean {
        const subscription = this.subscriptions.get(subscriptionId)
        if (!subscription) return false

        subscription.isActive = false
        this.subscriptions.delete(subscriptionId)

        // Remove from event handlers
        const handlers = this.eventHandlers.get(subscription.eventType)
        if (handlers) {
            const index = handlers.indexOf(subscription.handler)
            if (index > -1) {
                handlers.splice(index, 1)
            }
        }

        return true
    }

    /**
     * Emit event
     */
    emit(event: RealtimeEvent): void {
        // Add to history
        this.addToHistory(event)

        // Notify handlers
        this.notifyHandlers(event)

        // Log event
        this.logEvent(event)
    }

    /**
     * Create cart event
     */
    createCartEvent(eventData: Omit<CartEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'cart',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Create product event
     */
    createProductEvent(eventData: Omit<ProductEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'product',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Create order event
     */
    createOrderEvent(eventData: Omit<OrderEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'order',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Create notification event
     */
    createNotificationEvent(eventData: Omit<NotificationEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'notification',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Create user event
     */
    createUserEvent(eventData: Omit<UserEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'user',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Create system event
     */
    createSystemEvent(eventData: Omit<SystemEvent, 'timestamp'>): RealtimeEvent {
        return {
            id: this.generateEventId(),
            type: 'system',
            event: eventData.type,
            data: eventData,
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * Handle WebSocket message
     */
    handleWebSocketMessage(message: WebSocketMessage): void {
        const event: RealtimeEvent = {
            id: message.id,
            type: message.type,
            event: message.event,
            data: message.data,
            timestamp: message.timestamp,
            userId: message.userId,
            sessionId: message.sessionId,
        }

        this.emit(event)
    }

    /**
     * Get event history
     */
    getEventHistory(eventType?: string, limit?: number): RealtimeEvent[] {
        let events = this.eventHistory

        if (eventType) {
            events = events.filter(event => event.type === eventType)
        }

        if (limit) {
            events = events.slice(-limit)
        }

        return events
    }

    /**
     * Get active subscriptions
     */
    getActiveSubscriptions(): EventSubscription[] {
        return Array.from(this.subscriptions.values()).filter(sub => sub.isActive)
    }

    /**
     * Get subscription by ID
     */
    getSubscription(subscriptionId: string): EventSubscription | null {
        return this.subscriptions.get(subscriptionId) || null
    }

    /**
     * Clear event history
     */
    clearHistory(): void {
        this.eventHistory = []
    }

    /**
     * Get event statistics
     */
    getEventStatistics(): {
        totalEvents: number
        eventsByType: Record<string, number>
        eventsByHour: Record<string, number>
        recentActivity: number
    } {
        const totalEvents = this.eventHistory.length
        const eventsByType: Record<string, number> = {}
        const eventsByHour: Record<string, number> = {}
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        let recentActivity = 0

        this.eventHistory.forEach(event => {
            // Count by type
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

            // Count by hour
            const hour = new Date(event.timestamp).getHours()
            eventsByHour[hour.toString()] = (eventsByHour[hour.toString()] || 0) + 1

            // Count recent activity
            if (new Date(event.timestamp) > oneHourAgo) {
                recentActivity++
            }
        })

        return {
            totalEvents,
            eventsByType,
            eventsByHour,
            recentActivity,
        }
    }

    /**
     * Filter events by criteria
     */
    filterEvents(criteria: {
        eventType?: string
        userId?: string
        startDate?: string
        endDate?: string
        limit?: number
    }): RealtimeEvent[] {
        let events = [...this.eventHistory]

        if (criteria.eventType) {
            events = events.filter(event => event.type === criteria.eventType)
        }

        if (criteria.userId) {
            events = events.filter(event => event.userId === criteria.userId)
        }

        if (criteria.startDate) {
            events = events.filter(event => event.timestamp >= criteria.startDate)
        }

        if (criteria.endDate) {
            events = events.filter(event => event.timestamp <= criteria.endDate)
        }

        if (criteria.limit) {
            events = events.slice(-criteria.limit)
        }

        return events
    }

    /**
     * Setup default handlers
     */
    private setupDefaultHandlers(): void {
        // Cart event handlers
        this.subscribe('cart', (event) => {
            console.log('Cart event received:', event)
        })

        // Product event handlers
        this.subscribe('product', (event) => {
            console.log('Product event received:', event)
        })

        // Order event handlers
        this.subscribe('order', (event) => {
            console.log('Order event received:', event)
        })

        // Notification event handlers
        this.subscribe('notification', (event) => {
            console.log('Notification event received:', event)
        })

        // User event handlers
        this.subscribe('user', (event) => {
            console.log('User event received:', event)
        })

        // System event handlers
        this.subscribe('system', (event) => {
            console.log('System event received:', event)
        })
    }

    /**
     * Add event to history
     */
    private addToHistory(event: RealtimeEvent): void {
        this.eventHistory.push(event)

        // Maintain history size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
        }
    }

    /**
     * Notify handlers
     */
    private notifyHandlers(event: RealtimeEvent): void {
        const handlers = this.eventHandlers.get(event.type) || []

        handlers.forEach(handler => {
            try {
                handler(event)
            } catch (error) {
                console.error(`Error in event handler for ${event.type}:`, error)
            }
        })
    }

    /**
     * Log event
     */
    private logEvent(event: RealtimeEvent): void {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[RealtimeEvent] ${event.type}.${event.event}:`, event.data)
        }
    }

    /**
     * Generate event ID
     */
    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate subscription ID
     */
    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Destroy all subscriptions
     */
    destroy(): void {
        this.eventHandlers.clear()
        this.subscriptions.clear()
        this.eventHistory = []
    }
}

export const realtimeEventManager = new RealtimeEventManager()
export default realtimeEventManager
