export interface PushNotification {
    id: string
    title: string
    body: string
    icon?: string
    badge?: string
    image?: string
    tag?: string
    data?: any
    actions?: NotificationAction[]
    requireInteraction?: boolean
    silent?: boolean
    timestamp: number
    isRead: boolean
}

export interface PushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

export interface PushServiceConfig {
    vapidPublicKey: string
    vapidPrivateKey: string
    serverUrl: string
    autoSubscribe: boolean
    enableBackgroundSync: boolean
    enableBadge: boolean
    enableSound: boolean
    enableVibration: boolean
}

export interface PushServiceStats {
    totalNotifications: number
    unreadNotifications: number
    subscriptionCount: number
    lastNotification: Date | null
    averageResponseTime: number
}

export class PushService {
    private static readonly STORAGE_KEY = 'push-notifications'
    private static readonly SUBSCRIPTION_KEY = 'push-subscription'
    private static readonly CONFIG_KEY = 'push-config'

    private config: PushServiceConfig
    private notifications: PushNotification[] = []
    private subscription: PushSubscription | null = null
    private isSupported: boolean = false
    private isSubscribed: boolean = false

    constructor(config: Partial<PushServiceConfig> = {}) {
        this.config = {
            vapidPublicKey: config.vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
            vapidPrivateKey: config.vapidPrivateKey || process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY || '',
            serverUrl: config.serverUrl || process.env.NEXT_PUBLIC_PUSH_SERVER_URL || '',
            autoSubscribe: config.autoSubscribe ?? true,
            enableBackgroundSync: config.enableBackgroundSync ?? true,
            enableBadge: config.enableBadge ?? true,
            enableSound: config.enableSound ?? true,
            enableVibration: config.enableVibration ?? true,
        }

        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
        this.loadNotifications()
        this.loadSubscription()
        this.setupEventListeners()
    }

    /**
     * Check if push notifications are supported
     */
    isPushSupported(): boolean {
        return this.isSupported
    }

    /**
     * Check if user has granted permission
     */
    async getPermissionStatus(): Promise<NotificationPermission> {
        if (!this.isSupported) {
            return 'denied'
        }
        return Notification.permission
    }

    /**
     * Request permission for push notifications
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported) {
            throw new Error('Push notifications are not supported')
        }

        try {
            const permission = await Notification.requestPermission()
            return permission
        } catch (error) {
            console.error('Failed to request notification permission:', error)
            throw error
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe(): Promise<PushSubscription | null> {
        if (!this.isSupported) {
            throw new Error('Push notifications are not supported')
        }

        try {
            // Check permission
            const permission = await this.getPermissionStatus()
            if (permission !== 'granted') {
                const newPermission = await this.requestPermission()
                if (newPermission !== 'granted') {
                    throw new Error('Notification permission denied')
                }
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                throw new Error('Service worker not found')
            }

            // Subscribe to push manager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey),
            })

            this.subscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
                    auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
                },
            }

            this.isSubscribed = true
            this.saveSubscription()

            // Send subscription to server
            await this.sendSubscriptionToServer()

            return this.subscription
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
            throw error
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<void> {
        if (!this.isSupported || !this.subscription) {
            return
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    await subscription.unsubscribe()
                }
            }

            this.subscription = null
            this.isSubscribed = false
            this.saveSubscription()

            // Notify server about unsubscription
            await this.sendUnsubscriptionToServer()
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error)
            throw error
        }
    }

    /**
     * Check if subscribed
     */
    async isSubscribedToPush(): Promise<boolean> {
        if (!this.isSupported) {
            return false
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                return false
            }

            const subscription = await registration.pushManager.getSubscription()
            return !!subscription
        } catch (error) {
            console.error('Failed to check subscription status:', error)
            return false
        }
    }

    /**
     * Send test notification
     */
    async sendTestNotification(): Promise<void> {
        if (!this.isSupported) {
            throw new Error('Push notifications are not supported')
        }

        const permission = await this.getPermissionStatus()
        if (permission !== 'granted') {
            throw new Error('Notification permission not granted')
        }

        const notification = new Notification('Test Notification', {
            body: 'This is a test notification from Hutiyapa Cart',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'test',
            requireInteraction: true,
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close()
        }, 5000)
    }

    /**
     * Get notifications
     */
    getNotifications(): PushNotification[] {
        return [...this.notifications]
    }

    /**
     * Get unread notifications
     */
    getUnreadNotifications(): PushNotification[] {
        return this.notifications.filter(notification => !notification.isRead)
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): void {
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification) {
            notification.isRead = true
            this.saveNotifications()
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void {
        this.notifications.forEach(notification => {
            notification.isRead = true
        })
        this.saveNotifications()
    }

    /**
     * Remove notification
     */
    removeNotification(notificationId: string): void {
        this.notifications = this.notifications.filter(n => n.id !== notificationId)
        this.saveNotifications()
    }

    /**
     * Clear all notifications
     */
    clearNotifications(): void {
        this.notifications = []
        this.saveNotifications()
    }

    /**
     * Get push service statistics
     */
    getStats(): PushServiceStats {
        const unreadCount = this.getUnreadNotifications().length
        const lastNotification = this.notifications.length > 0
            ? new Date(Math.max(...this.notifications.map(n => n.timestamp)))
            : null

        return {
            totalNotifications: this.notifications.length,
            unreadNotifications: unreadCount,
            subscriptionCount: this.isSubscribed ? 1 : 0,
            lastNotification,
            averageResponseTime: 0, // This would be calculated from actual response times
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<PushServiceConfig>): void {
        this.config = { ...this.config, ...config }
        this.saveConfig()
    }

    /**
     * Get configuration
     */
    getConfig(): PushServiceConfig {
        return { ...this.config }
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        if (!this.isSupported) return

        // Listen for push events
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                this.handlePushNotification(event.data.payload)
            }
        })

        // Listen for notification clicks
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement
            if (target.closest('[data-notification-id]')) {
                const notificationId = target.closest('[data-notification-id]')?.getAttribute('data-notification-id')
                if (notificationId) {
                    this.markAsRead(notificationId)
                }
            }
        })
    }

    /**
     * Handle push notification
     */
    private handlePushNotification(payload: any): void {
        const notification: PushNotification = {
            id: payload.id || this.generateNotificationId(),
            title: payload.title || 'New Notification',
            body: payload.body || '',
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/badge-72x72.png',
            image: payload.image,
            tag: payload.tag,
            data: payload.data,
            actions: payload.actions || [],
            requireInteraction: payload.requireInteraction || false,
            silent: payload.silent || false,
            timestamp: Date.now(),
            isRead: false,
        }

        this.notifications.unshift(notification)
        this.saveNotifications()

        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
            this.showBrowserNotification(notification)
        }
    }

    /**
     * Show browser notification
     */
    private showBrowserNotification(notification: PushNotification): void {
        const browserNotification = new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            image: notification.image,
            tag: notification.tag,
            data: notification.data,
            actions: notification.actions,
            requireInteraction: notification.requireInteraction,
            silent: notification.silent,
        })

        // Handle notification click
        browserNotification.onclick = () => {
            window.focus()
            this.markAsRead(notification.id)
            browserNotification.close()
        }

        // Auto-close after 5 seconds if not requiring interaction
        if (!notification.requireInteraction) {
            setTimeout(() => {
                browserNotification.close()
            }, 5000)
        }
    }

    /**
     * Send subscription to server
     */
    private async sendSubscriptionToServer(): Promise<void> {
        if (!this.subscription || !this.config.serverUrl) {
            return
        }

        try {
            await fetch(`${this.config.serverUrl}/api/v1/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: this.subscription,
                    vapidPublicKey: this.config.vapidPublicKey,
                }),
            })
        } catch (error) {
            console.error('Failed to send subscription to server:', error)
        }
    }

    /**
     * Send unsubscription to server
     */
    private async sendUnsubscriptionToServer(): Promise<void> {
        if (!this.config.serverUrl) {
            return
        }

        try {
            await fetch(`${this.config.serverUrl}/api/v1/push/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: this.subscription?.endpoint,
                }),
            })
        } catch (error) {
            console.error('Failed to send unsubscription to server:', error)
        }
    }

    /**
     * Load notifications from storage
     */
    private loadNotifications(): void {
        try {
            const stored = localStorage.getItem(PushService.STORAGE_KEY)
            if (stored) {
                this.notifications = JSON.parse(stored)
            }
        } catch (error) {
            console.error('Failed to load notifications:', error)
        }
    }

    /**
     * Save notifications to storage
     */
    private saveNotifications(): void {
        try {
            localStorage.setItem(PushService.STORAGE_KEY, JSON.stringify(this.notifications))
        } catch (error) {
            console.error('Failed to save notifications:', error)
        }
    }

    /**
     * Load subscription from storage
     */
    private loadSubscription(): void {
        try {
            const stored = localStorage.getItem(PushService.SUBSCRIPTION_KEY)
            if (stored) {
                this.subscription = JSON.parse(stored)
                this.isSubscribed = true
            }
        } catch (error) {
            console.error('Failed to load subscription:', error)
        }
    }

    /**
     * Save subscription to storage
     */
    private saveSubscription(): void {
        try {
            if (this.subscription) {
                localStorage.setItem(PushService.SUBSCRIPTION_KEY, JSON.stringify(this.subscription))
            } else {
                localStorage.removeItem(PushService.SUBSCRIPTION_KEY)
            }
        } catch (error) {
            console.error('Failed to save subscription:', error)
        }
    }

    /**
     * Save configuration to storage
     */
    private saveConfig(): void {
        try {
            localStorage.setItem(PushService.CONFIG_KEY, JSON.stringify(this.config))
        } catch (error) {
            console.error('Failed to save configuration:', error)
        }
    }

    /**
     * Convert URL-safe base64 to Uint8Array
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
    }

    /**
     * Generate notification ID
     */
    private generateNotificationId(): string {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export const pushService = new PushService()
export default pushService
