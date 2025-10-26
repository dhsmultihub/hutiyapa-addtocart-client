import { WS_EVENTS } from '../../../lib/constants'

export interface WebSocketConfig {
    url: string
    protocols?: string[]
    reconnectInterval: number
    maxReconnectAttempts: number
    heartbeatInterval: number
    timeout: number
}

export interface WebSocketMessage {
    id: string
    type: string
    event: string
    data: any
    timestamp: string
    userId?: string
    sessionId?: string
}

export interface WebSocketConnection {
    id: string
    url: string
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
    lastConnected?: string
    reconnectAttempts: number
    isReconnecting: boolean
}

export interface WebSocketEvent {
    type: string
    event: string
    data: any
    timestamp: string
}

export interface WebSocketSubscription {
    id: string
    event: string
    callback: (data: any) => void
    isActive: boolean
    createdAt: string
}

export class WebSocketManager {
    private connections: Map<string, WebSocket> = new Map()
    private connectionConfigs: Map<string, WebSocketConfig> = new Map()
    private subscriptions: Map<string, WebSocketSubscription[]> = new Map()
    private messageQueue: WebSocketMessage[] = []
    private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
    private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
    private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map()

    constructor() {
        this.setupDefaultConfig()
    }

    /**
     * Connect to WebSocket
     */
    connect(connectionId: string, config: Partial<WebSocketConfig> = {}): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const fullConfig = this.mergeConfig(config)
                this.connectionConfigs.set(connectionId, fullConfig)

                const ws = new WebSocket(fullConfig.url, fullConfig.protocols)
                this.connections.set(connectionId, ws)

                ws.onopen = () => {
                    console.log(`WebSocket connected: ${connectionId}`)
                    this.setupHeartbeat(connectionId)
                    this.processMessageQueue(connectionId)
                    resolve(true)
                }

                ws.onmessage = (event) => {
                    this.handleMessage(connectionId, event)
                }

                ws.onclose = (event) => {
                    console.log(`WebSocket closed: ${connectionId}`, event)
                    this.cleanup(connectionId)
                    this.handleReconnect(connectionId)
                }

                ws.onerror = (error) => {
                    console.error(`WebSocket error: ${connectionId}`, error)
                    this.cleanup(connectionId)
                    reject(error)
                }

                // Set connection timeout
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        ws.close()
                        reject(new Error('Connection timeout'))
                    }
                }, fullConfig.timeout)

            } catch (error) {
                console.error(`Failed to create WebSocket connection: ${connectionId}`, error)
                reject(error)
            }
        })
    }

    /**
     * Disconnect WebSocket
     */
    disconnect(connectionId: string): void {
        const ws = this.connections.get(connectionId)
        if (ws) {
            ws.close()
            this.cleanup(connectionId)
        }
    }

    /**
     * Send message
     */
    send(connectionId: string, message: Omit<WebSocketMessage, 'id' | 'timestamp'>): boolean {
        const ws = this.connections.get(connectionId)
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            // Queue message for later sending
            this.queueMessage(connectionId, message)
            return false
        }

        try {
            const fullMessage: WebSocketMessage = {
                ...message,
                id: this.generateMessageId(),
                timestamp: new Date().toISOString(),
            }

            ws.send(JSON.stringify(fullMessage))
            return true
        } catch (error) {
            console.error(`Failed to send message: ${connectionId}`, error)
            return false
        }
    }

    /**
     * Subscribe to event
     */
    subscribe(
        connectionId: string,
        event: string,
        callback: (data: any) => void
    ): string {
        const subscriptionId = this.generateSubscriptionId()
        const subscription: WebSocketSubscription = {
            id: subscriptionId,
            event,
            callback,
            isActive: true,
            createdAt: new Date().toISOString(),
        }

        const subscriptions = this.subscriptions.get(connectionId) || []
        subscriptions.push(subscription)
        this.subscriptions.set(connectionId, subscriptions)

        return subscriptionId
    }

    /**
     * Unsubscribe from event
     */
    unsubscribe(connectionId: string, subscriptionId: string): boolean {
        const subscriptions = this.subscriptions.get(connectionId)
        if (!subscriptions) return false

        const index = subscriptions.findIndex(sub => sub.id === subscriptionId)
        if (index === -1) return false

        subscriptions[index].isActive = false
        return true
    }

    /**
     * Get connection status
     */
    getConnectionStatus(connectionId: string): WebSocketConnection | null {
        const ws = this.connections.get(connectionId)
        const config = this.connectionConfigs.get(connectionId)

        if (!ws || !config) return null

        let status: WebSocketConnection['status'] = 'disconnected'
        if (ws.readyState === WebSocket.CONNECTING) status = 'connecting'
        else if (ws.readyState === WebSocket.OPEN) status = 'connected'
        else if (ws.readyState === WebSocket.CLOSED) status = 'disconnected'
        else if (ws.readyState === WebSocket.CLOSING) status = 'disconnected'

        return {
            id: connectionId,
            url: config.url,
            status,
            lastConnected: status === 'connected' ? new Date().toISOString() : undefined,
            reconnectAttempts: 0,
            isReconnecting: false,
        }
    }

    /**
     * Get all connections
     */
    getAllConnections(): WebSocketConnection[] {
        const connections: WebSocketConnection[] = []

        for (const connectionId of this.connections.keys()) {
            const status = this.getConnectionStatus(connectionId)
            if (status) {
                connections.push(status)
            }
        }

        return connections
    }

    /**
     * Check if connected
     */
    isConnected(connectionId: string): boolean {
        const ws = this.connections.get(connectionId)
        return ws ? ws.readyState === WebSocket.OPEN : false
    }

    /**
     * Get active subscriptions
     */
    getActiveSubscriptions(connectionId: string): WebSocketSubscription[] {
        const subscriptions = this.subscriptions.get(connectionId) || []
        return subscriptions.filter(sub => sub.isActive)
    }

    /**
     * Send heartbeat
     */
    sendHeartbeat(connectionId: string): boolean {
        return this.send(connectionId, {
            type: 'heartbeat',
            event: 'ping',
            data: { timestamp: Date.now() },
        })
    }

    /**
     * Setup default configuration
     */
    private setupDefaultConfig(): void {
        // Default configuration will be set when first connection is made
    }

    /**
     * Merge configuration with defaults
     */
    private mergeConfig(config: Partial<WebSocketConfig>): WebSocketConfig {
        return {
            url: config.url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
            protocols: config.protocols,
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 5,
            heartbeatInterval: config.heartbeatInterval || 30000,
            timeout: config.timeout || 10000,
        }
    }

    /**
     * Handle incoming message
     */
    private handleMessage(connectionId: string, event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data)

            // Handle heartbeat response
            if (message.type === 'heartbeat' && message.event === 'pong') {
                return
            }

            // Notify message handlers
            const handler = this.messageHandlers.get(connectionId)
            if (handler) {
                handler(message)
            }

            // Notify subscribers
            this.notifySubscribers(connectionId, message)

        } catch (error) {
            console.error(`Failed to parse WebSocket message: ${connectionId}`, error)
        }
    }

    /**
     * Notify subscribers
     */
    private notifySubscribers(connectionId: string, message: WebSocketMessage): void {
        const subscriptions = this.getActiveSubscriptions(connectionId)

        subscriptions.forEach(subscription => {
            if (subscription.event === message.event || subscription.event === '*') {
                try {
                    subscription.callback(message.data)
                } catch (error) {
                    console.error(`Error in subscription callback: ${subscription.id}`, error)
                }
            }
        })
    }

    /**
     * Handle reconnection
     */
    private handleReconnect(connectionId: string): void {
        const config = this.connectionConfigs.get(connectionId)
        if (!config) return

        const timeout = this.reconnectTimeouts.get(connectionId)
        if (timeout) {
            clearTimeout(timeout)
        }

        const reconnectTimeout = setTimeout(() => {
            this.attemptReconnect(connectionId)
        }, config.reconnectInterval)

        this.reconnectTimeouts.set(connectionId, reconnectTimeout)
    }

    /**
     * Attempt reconnection
     */
    private async attemptReconnect(connectionId: string): Promise<void> {
        const config = this.connectionConfigs.get(connectionId)
        if (!config) return

        try {
            await this.connect(connectionId, config)
            console.log(`WebSocket reconnected: ${connectionId}`)
        } catch (error) {
            console.error(`WebSocket reconnection failed: ${connectionId}`, error)

            // Check if we should try again
            const currentAttempts = this.getReconnectAttempts(connectionId)
            if (currentAttempts < config.maxReconnectAttempts) {
                this.handleReconnect(connectionId)
            } else {
                console.error(`Max reconnection attempts reached: ${connectionId}`)
            }
        }
    }

    /**
     * Get reconnect attempts
     */
    private getReconnectAttempts(connectionId: string): number {
        // This would track reconnect attempts in a real implementation
        return 0
    }

    /**
     * Setup heartbeat
     */
    private setupHeartbeat(connectionId: string): void {
        const config = this.connectionConfigs.get(connectionId)
        if (!config) return

        const interval = setInterval(() => {
            if (this.isConnected(connectionId)) {
                this.sendHeartbeat(connectionId)
            } else {
                clearInterval(interval)
            }
        }, config.heartbeatInterval)

        this.heartbeatIntervals.set(connectionId, interval)
    }

    /**
     * Queue message for later sending
     */
    private queueMessage(connectionId: string, message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
        const fullMessage: WebSocketMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
        }

        this.messageQueue.push(fullMessage)
    }

    /**
     * Process queued messages
     */
    private processMessageQueue(connectionId: string): void {
        const ws = this.connections.get(connectionId)
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        const messages = this.messageQueue.filter(msg =>
            msg.sessionId === connectionId || !msg.sessionId
        )

        messages.forEach(message => {
            try {
                ws.send(JSON.stringify(message))
                this.messageQueue = this.messageQueue.filter(msg => msg.id !== message.id)
            } catch (error) {
                console.error(`Failed to send queued message: ${message.id}`, error)
            }
        })
    }

    /**
     * Cleanup connection
     */
    private cleanup(connectionId: string): void {
        // Clear heartbeat interval
        const heartbeatInterval = this.heartbeatIntervals.get(connectionId)
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            this.heartbeatIntervals.delete(connectionId)
        }

        // Clear reconnect timeout
        const reconnectTimeout = this.reconnectTimeouts.get(connectionId)
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            this.reconnectTimeouts.delete(connectionId)
        }

        // Remove connection
        this.connections.delete(connectionId)
    }

    /**
     * Set message handler
     */
    setMessageHandler(connectionId: string, handler: (message: WebSocketMessage) => void): void {
        this.messageHandlers.set(connectionId, handler)
    }

    /**
     * Remove message handler
     */
    removeMessageHandler(connectionId: string): void {
        this.messageHandlers.delete(connectionId)
    }

    /**
     * Generate message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate subscription ID
     */
    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Destroy all connections
     */
    destroy(): void {
        for (const connectionId of this.connections.keys()) {
            this.disconnect(connectionId)
        }

        this.connections.clear()
        this.connectionConfigs.clear()
        this.subscriptions.clear()
        this.messageQueue = []
        this.messageHandlers.clear()
    }
}

export const websocketManager = new WebSocketManager()
export default websocketManager
