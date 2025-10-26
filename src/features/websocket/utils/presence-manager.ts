import { useWebSocket } from '../hooks/useWebSocket'
import { useRealtimeEvents } from '../hooks/useRealtimeEvents'

export interface UserPresence {
    userId: string
    sessionId: string
    status: 'online' | 'offline' | 'away' | 'busy'
    lastSeen: string
    activity?: string
    location?: string
    device?: string
    isTyping?: boolean
    typingIn?: string
    metadata?: Record<string, any>
}

export interface PresenceEvent {
    type: 'user.online' | 'user.offline' | 'user.away' | 'user.busy' | 'user.typing' | 'user.activity'
    userId: string
    sessionId: string
    status: UserPresence['status']
    activity?: string
    location?: string
    device?: string
    isTyping?: boolean
    typingIn?: string
    timestamp: string
    metadata?: Record<string, any>
}

export interface PresenceManager {
    users: Map<string, UserPresence>
    sessions: Map<string, string> // sessionId -> userId
    isOnline: boolean
    currentUser?: UserPresence
    onUserStatusChange?: (user: UserPresence) => void
    onUserActivity?: (user: UserPresence) => void
    onUserTyping?: (user: UserPresence) => void
}

export class PresenceManagerClass {
    private users: Map<string, UserPresence> = new Map()
    private sessions: Map<string, string> = new Map()
    private isOnline: boolean = false
    private currentUser?: UserPresence
    private eventHandlers: Map<string, (event: PresenceEvent) => void> = new Map()
    private heartbeatInterval?: NodeJS.Timeout
    private activityTimeout?: NodeJS.Timeout
    private typingTimeout?: NodeJS.Timeout

    constructor() {
        this.setupEventHandlers()
    }

    /**
     * Initialize presence for user
     */
    initializePresence(userId: string, sessionId: string, metadata?: Record<string, any>): void {
        const presence: UserPresence = {
            userId,
            sessionId,
            status: 'online',
            lastSeen: new Date().toISOString(),
            activity: 'active',
            location: this.getLocation(),
            device: this.getDevice(),
            isTyping: false,
            metadata,
        }

        this.currentUser = presence
        this.users.set(userId, presence)
        this.sessions.set(sessionId, userId)
        this.isOnline = true

        // Start heartbeat
        this.startHeartbeat()

        // Emit online event
        this.emitPresenceEvent({
            type: 'user.online',
            userId,
            sessionId,
            status: 'online',
            activity: 'active',
            location: presence.location,
            device: presence.device,
            timestamp: new Date().toISOString(),
            metadata,
        })
    }

    /**
     * Update user presence
     */
    updatePresence(updates: Partial<UserPresence>): void {
        if (!this.currentUser) return

        const updatedPresence: UserPresence = {
            ...this.currentUser,
            ...updates,
            lastSeen: new Date().toISOString(),
        }

        this.currentUser = updatedPresence
        this.users.set(this.currentUser.userId, updatedPresence)

        // Emit presence update event
        this.emitPresenceEvent({
            type: 'user.activity',
            userId: this.currentUser.userId,
            sessionId: this.currentUser.sessionId,
            status: this.currentUser.status,
            activity: this.currentUser.activity,
            location: this.currentUser.location,
            device: this.currentUser.device,
            isTyping: this.currentUser.isTyping,
            typingIn: this.currentUser.typingIn,
            timestamp: new Date().toISOString(),
            metadata: this.currentUser.metadata,
        })
    }

    /**
     * Set user status
     */
    setStatus(status: UserPresence['status']): void {
        this.updatePresence({ status })
    }

    /**
     * Set user activity
     */
    setActivity(activity: string): void {
        this.updatePresence({ activity })
    }

    /**
     * Set user location
     */
    setLocation(location: string): void {
        this.updatePresence({ location })
    }

    /**
     * Set typing status
     */
    setTyping(isTyping: boolean, typingIn?: string): void {
        this.updatePresence({ isTyping, typingIn })

        // Clear typing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        // Auto-clear typing after 3 seconds
        if (isTyping) {
            this.typingTimeout = setTimeout(() => {
                this.setTyping(false)
            }, 3000)
        }
    }

    /**
     * Set user away
     */
    setAway(): void {
        this.setStatus('away')
        this.setActivity('away')
    }

    /**
     * Set user busy
     */
    setBusy(): void {
        this.setStatus('busy')
        this.setActivity('busy')
    }

    /**
     * Set user online
     */
    setOnline(): void {
        this.setStatus('online')
        this.setActivity('active')
    }

    /**
     * Set user offline
     */
    setOffline(): void {
        if (!this.currentUser) return

        this.setStatus('offline')
        this.setActivity('offline')
        this.isOnline = false

        // Stop heartbeat
        this.stopHeartbeat()

        // Emit offline event
        this.emitPresenceEvent({
            type: 'user.offline',
            userId: this.currentUser.userId,
            sessionId: this.currentUser.sessionId,
            status: 'offline',
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Get user presence
     */
    getUserPresence(userId: string): UserPresence | null {
        return this.users.get(userId) || null
    }

    /**
     * Get all online users
     */
    getOnlineUsers(): UserPresence[] {
        return Array.from(this.users.values()).filter(user => user.status === 'online')
    }

    /**
     * Get users by status
     */
    getUsersByStatus(status: UserPresence['status']): UserPresence[] {
        return Array.from(this.users.values()).filter(user => user.status === status)
    }

    /**
     * Get typing users
     */
    getTypingUsers(): UserPresence[] {
        return Array.from(this.users.values()).filter(user => user.isTyping)
    }

    /**
     * Get current user presence
     */
    getCurrentUser(): UserPresence | null {
        return this.currentUser || null
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean {
        const user = this.getUserPresence(userId)
        return user ? user.status === 'online' : false
    }

    /**
     * Check if user is typing
     */
    isUserTyping(userId: string): boolean {
        const user = this.getUserPresence(userId)
        return user ? user.isTyping || false : false
    }

    /**
     * Get presence statistics
     */
    getPresenceStatistics(): {
        totalUsers: number
        onlineUsers: number
        awayUsers: number
        busyUsers: number
        offlineUsers: number
        typingUsers: number
    } {
        const users = Array.from(this.users.values())

        return {
            totalUsers: users.length,
            onlineUsers: users.filter(u => u.status === 'online').length,
            awayUsers: users.filter(u => u.status === 'away').length,
            busyUsers: users.filter(u => u.status === 'busy').length,
            offlineUsers: users.filter(u => u.status === 'offline').length,
            typingUsers: users.filter(u => u.isTyping).length,
        }
    }

    /**
     * Handle presence event
     */
    handlePresenceEvent(event: PresenceEvent): void {
        const { userId, sessionId, status, activity, location, device, isTyping, typingIn, metadata } = event

        const presence: UserPresence = {
            userId,
            sessionId,
            status,
            lastSeen: event.timestamp,
            activity,
            location,
            device,
            isTyping,
            typingIn,
            metadata,
        }

        this.users.set(userId, presence)
        this.sessions.set(sessionId, userId)

        // Notify event handlers
        this.eventHandlers.forEach(handler => {
            try {
                handler(event)
            } catch (error) {
                console.error('Error in presence event handler:', error)
            }
        })
    }

    /**
     * Subscribe to presence events
     */
    subscribe(eventType: string, handler: (event: PresenceEvent) => void): string {
        const subscriptionId = this.generateSubscriptionId()
        this.eventHandlers.set(subscriptionId, handler)
        return subscriptionId
    }

    /**
     * Unsubscribe from presence events
     */
    unsubscribe(subscriptionId: string): boolean {
        return this.eventHandlers.delete(subscriptionId)
    }

    /**
     * Start heartbeat
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.currentUser && this.isOnline) {
                this.updatePresence({ lastSeen: new Date().toISOString() })
            }
        }, 30000) // 30 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = undefined
        }
    }

    /**
     * Emit presence event
     */
    private emitPresenceEvent(event: PresenceEvent): void {
        // This would typically send to WebSocket or event system
        console.log('Presence event:', event)
    }

    /**
     * Setup event handlers
     */
    private setupEventHandlers(): void {
        // Handle page visibility changes
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.setAway()
                } else {
                    this.setOnline()
                }
            })

            // Handle page unload
            window.addEventListener('beforeunload', () => {
                this.setOffline()
            })
        }

        // Handle activity timeout
        this.setupActivityTimeout()
    }

    /**
     * Setup activity timeout
     */
    private setupActivityTimeout(): void {
        const resetActivity = () => {
            if (this.currentUser && this.currentUser.status === 'online') {
                this.setActivity('active')
            }
        }

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

        events.forEach(event => {
            document.addEventListener(event, () => {
                clearTimeout(this.activityTimeout)
                resetActivity()
                this.activityTimeout = setTimeout(() => {
                    this.setAway()
                }, 300000) // 5 minutes
            })
        })
    }

    /**
     * Get user location
     */
    private getLocation(): string {
        // This would typically get location from IP or user settings
        return 'Unknown'
    }

    /**
     * Get user device
     */
    private getDevice(): string {
        if (typeof navigator === 'undefined') return 'Unknown'

        const userAgent = navigator.userAgent
        if (userAgent.includes('Mobile')) return 'Mobile'
        if (userAgent.includes('Tablet')) return 'Tablet'
        return 'Desktop'
    }

    /**
     * Generate subscription ID
     */
    private generateSubscriptionId(): string {
        return `presence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Destroy presence manager
     */
    destroy(): void {
        this.setOffline()
        this.stopHeartbeat()
        this.users.clear()
        this.sessions.clear()
        this.eventHandlers.clear()

        if (this.activityTimeout) {
            clearTimeout(this.activityTimeout)
        }

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }
    }
}

export const presenceManager = new PresenceManagerClass()
export default presenceManager
