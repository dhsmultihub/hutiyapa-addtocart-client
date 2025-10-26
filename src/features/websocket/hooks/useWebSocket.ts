import { useState, useEffect, useCallback, useRef } from 'react'
import { websocketManager } from '../utils/websocket-manager'
import { realtimeEventManager } from '../utils/realtime-events'
import { WebSocketConfig, WebSocketConnection, WebSocketMessage } from '../utils/websocket-manager'
import { RealtimeEvent } from '../utils/realtime-events'

export interface UseWebSocketOptions {
    autoConnect?: boolean
    reconnectOnClose?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
    heartbeatInterval?: number
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Error) => void
    onMessage?: (message: WebSocketMessage) => void
}

export interface UseWebSocketReturn {
    connection: WebSocketConnection | null
    isConnected: boolean
    isConnecting: boolean
    error: Error | null
    connect: (config?: Partial<WebSocketConfig>) => Promise<boolean>
    disconnect: () => void
    send: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => boolean
    subscribe: (event: string, callback: (data: any) => void) => string
    unsubscribe: (subscriptionId: string) => boolean
    lastMessage: WebSocketMessage | null
    messageHistory: WebSocketMessage[]
    clearHistory: () => void
}

export function useWebSocket(
    connectionId: string = 'default',
    options: UseWebSocketOptions = {}
): UseWebSocketReturn {
    const [connection, setConnection] = useState<WebSocketConnection | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
    const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([])

    const messageHistoryRef = useRef<WebSocketMessage[]>([])
    const maxHistorySize = 100

    const {
        autoConnect = true,
        reconnectOnClose = true,
        reconnectInterval = 5000,
        maxReconnectAttempts = 5,
        heartbeatInterval = 30000,
        onConnect,
        onDisconnect,
        onError,
        onMessage,
    } = options

    // Connect to WebSocket
    const connect = useCallback(async (config?: Partial<WebSocketConfig>): Promise<boolean> => {
        if (isConnecting) return false

        setIsConnecting(true)
        setError(null)

        try {
            const fullConfig: WebSocketConfig = {
                url: config?.url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
                protocols: config?.protocols,
                reconnectInterval: config?.reconnectInterval || reconnectInterval,
                maxReconnectAttempts: config?.maxReconnectAttempts || maxReconnectAttempts,
                heartbeatInterval: config?.heartbeatInterval || heartbeatInterval,
                timeout: config?.timeout || 10000,
            }

            const success = await websocketManager.connect(connectionId, fullConfig)

            if (success) {
                setIsConnected(true)
                setConnection(websocketManager.getConnectionStatus(connectionId))
                onConnect?.()
            }

            return success
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Connection failed')
            setError(error)
            onError?.(error)
            return false
        } finally {
            setIsConnecting(false)
        }
    }, [connectionId, isConnecting, reconnectInterval, maxReconnectAttempts, heartbeatInterval, onConnect, onError])

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        websocketManager.disconnect(connectionId)
        setIsConnected(false)
        setConnection(null)
        onDisconnect?.()
    }, [connectionId, onDisconnect])

    // Send message
    const send = useCallback((message: Omit<WebSocketMessage, 'id' | 'timestamp'>): boolean => {
        if (!isConnected) return false
        return websocketManager.send(connectionId, message)
    }, [connectionId, isConnected])

    // Subscribe to event
    const subscribe = useCallback((event: string, callback: (data: any) => void): string => {
        return websocketManager.subscribe(connectionId, event, callback)
    }, [connectionId])

    // Unsubscribe from event
    const unsubscribe = useCallback((subscriptionId: string): boolean => {
        return websocketManager.unsubscribe(connectionId, subscriptionId)
    }, [connectionId])

    // Clear message history
    const clearHistory = useCallback(() => {
        setMessageHistory([])
        messageHistoryRef.current = []
    }, [])

    // Handle incoming messages
    useEffect(() => {
        const handleMessage = (message: WebSocketMessage) => {
            setLastMessage(message)

            // Add to history
            const newHistory = [...messageHistoryRef.current, message]
            if (newHistory.length > maxHistorySize) {
                newHistory.shift()
            }
            messageHistoryRef.current = newHistory
            setMessageHistory(newHistory)

            // Handle with realtime event manager
            realtimeEventManager.handleWebSocketMessage(message)

            // Call custom message handler
            onMessage?.(message)
        }

        websocketManager.setMessageHandler(connectionId, handleMessage)

        return () => {
            websocketManager.removeMessageHandler(connectionId)
        }
    }, [connectionId, onMessage])

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && !isConnected && !isConnecting) {
            connect()
        }
    }, [autoConnect, isConnected, isConnecting, connect])

    // Update connection status
    useEffect(() => {
        const interval = setInterval(() => {
            const currentConnection = websocketManager.getConnectionStatus(connectionId)
            if (currentConnection) {
                setConnection(currentConnection)
                setIsConnected(currentConnection.status === 'connected')
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [connectionId])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isConnected) {
                disconnect()
            }
        }
    }, [isConnected, disconnect])

    return {
        connection,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        send,
        subscribe,
        unsubscribe,
        lastMessage,
        messageHistory,
        clearHistory,
    }
}

export default useWebSocket
