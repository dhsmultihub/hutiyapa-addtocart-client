import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../../store'
import { useWebSocket } from './useWebSocket'
import { useRealtimeEvents } from './useRealtimeEvents'
import { WS_EVENTS } from '../../../lib/constants'

export interface RealtimeSyncOptions {
    syncCart?: boolean
    syncProducts?: boolean
    syncOrders?: boolean
    syncNotifications?: boolean
    syncInterval?: number
    onSyncStart?: () => void
    onSyncComplete?: () => void
    onSyncError?: (error: Error) => void
}

export interface SyncStatus {
    isOnline: boolean
    isSyncing: boolean
    lastSync: string | null
    syncCount: number
    errorCount: number
    pendingChanges: boolean
}

export interface UseRealtimeSyncReturn {
    status: SyncStatus
    syncCart: () => Promise<void>
    syncProducts: () => Promise<void>
    syncOrders: () => Promise<void>
    syncNotifications: () => Promise<void>
    syncAll: () => Promise<void>
    forceSync: () => Promise<void>
    clearSyncStatus: () => void
}

export function useRealtimeSync(
    options: RealtimeSyncOptions = {}
): UseRealtimeSyncReturn {
    const dispatch = useDispatch<AppDispatch>()
    const [status, setStatus] = useState<SyncStatus>({
        isOnline: true,
        isSyncing: false,
        lastSync: null,
        syncCount: 0,
        errorCount: 0,
        pendingChanges: false,
    })

    const {
        syncCart = true,
        syncProducts = true,
        syncOrders = true,
        syncNotifications = true,
        syncInterval = 30000,
        onSyncStart,
        onSyncComplete,
        onSyncError,
    } = options

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastSyncRef = useRef<string | null>(null)

    // WebSocket connection
    const { isConnected, send, subscribe, unsubscribe } = useWebSocket('realtime-sync', {
        autoConnect: true,
        onConnect: () => {
            setStatus(prev => ({ ...prev, isOnline: true }))
        },
        onDisconnect: () => {
            setStatus(prev => ({ ...prev, isOnline: false }))
        },
        onError: (error) => {
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
            onSyncError?.(error)
        },
    })

    // Realtime events
    const { subscribe: subscribeEvent, unsubscribe: unsubscribeEvent } = useRealtimeEvents({
        eventTypes: ['cart', 'product', 'order', 'notification'],
        onEvent: (event) => {
            handleRealtimeEvent(event)
        },
    })

    // Handle realtime events
    const handleRealtimeEvent = useCallback((event: any) => {
        switch (event.type) {
            case 'cart':
                handleCartEvent(event)
                break
            case 'product':
                handleProductEvent(event)
                break
            case 'order':
                handleOrderEvent(event)
                break
            case 'notification':
                handleNotificationEvent(event)
                break
        }
    }, [])

    // Handle cart events
    const handleCartEvent = useCallback((event: any) => {
        switch (event.event) {
            case 'cart.updated':
                // Update cart state
                dispatch({ type: 'cart/syncFromServer', payload: event.data })
                break
            case 'cart.item.added':
                // Add item to cart
                dispatch({ type: 'cart/addItem', payload: event.data.item })
                break
            case 'cart.item.removed':
                // Remove item from cart
                dispatch({ type: 'cart/removeItem', payload: event.data.item })
                break
            case 'cart.item.updated':
                // Update cart item
                dispatch({ type: 'cart/updateItem', payload: event.data.item })
                break
        }
    }, [dispatch])

    // Handle product events
    const handleProductEvent = useCallback((event: any) => {
        switch (event.event) {
            case 'product.price.changed':
                // Update product price
                dispatch({ type: 'products/updatePrice', payload: event.data })
                break
            case 'product.stock.updated':
                // Update product stock
                dispatch({ type: 'products/updateStock', payload: event.data })
                break
            case 'product.availability.changed':
                // Update product availability
                dispatch({ type: 'products/updateAvailability', payload: event.data })
                break
        }
    }, [dispatch])

    // Handle order events
    const handleOrderEvent = useCallback((event: any) => {
        switch (event.event) {
            case 'order.created':
                // Handle new order
                dispatch({ type: 'orders/addOrder', payload: event.data })
                break
            case 'order.status.changed':
                // Update order status
                dispatch({ type: 'orders/updateStatus', payload: event.data })
                break
            case 'order.updated':
                // Update order
                dispatch({ type: 'orders/updateOrder', payload: event.data })
                break
            case 'order.cancelled':
                // Cancel order
                dispatch({ type: 'orders/cancelOrder', payload: event.data })
                break
        }
    }, [dispatch])

    // Handle notification events
    const handleNotificationEvent = useCallback((event: any) => {
        switch (event.event) {
            case 'notification.new':
                // Add new notification
                dispatch({ type: 'notifications/add', payload: event.data })
                break
            case 'notification.read':
                // Mark notification as read
                dispatch({ type: 'notifications/markRead', payload: event.data })
                break
            case 'notification.deleted':
                // Remove notification
                dispatch({ type: 'notifications/remove', payload: event.data })
                break
        }
    }, [dispatch])

    // Sync cart
    const syncCart = useCallback(async () => {
        if (!isConnected) return

        try {
            setStatus(prev => ({ ...prev, isSyncing: true }))
            onSyncStart?.()

            // Send cart sync request
            send({
                type: 'sync',
                event: 'cart.sync',
                data: { timestamp: Date.now() },
            })

            setStatus(prev => ({
                ...prev,
                lastSync: new Date().toISOString(),
                syncCount: prev.syncCount + 1,
                isSyncing: false,
            }))

            onSyncComplete?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Cart sync failed')
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1, isSyncing: false }))
            onSyncError?.(err)
        }
    }, [isConnected, send, onSyncStart, onSyncComplete, onSyncError])

    // Sync products
    const syncProducts = useCallback(async () => {
        if (!isConnected) return

        try {
            setStatus(prev => ({ ...prev, isSyncing: true }))
            onSyncStart?.()

            // Send products sync request
            send({
                type: 'sync',
                event: 'products.sync',
                data: { timestamp: Date.now() },
            })

            setStatus(prev => ({
                ...prev,
                lastSync: new Date().toISOString(),
                syncCount: prev.syncCount + 1,
                isSyncing: false,
            }))

            onSyncComplete?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Products sync failed')
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1, isSyncing: false }))
            onSyncError?.(err)
        }
    }, [isConnected, send, onSyncStart, onSyncComplete, onSyncError])

    // Sync orders
    const syncOrders = useCallback(async () => {
        if (!isConnected) return

        try {
            setStatus(prev => ({ ...prev, isSyncing: true }))
            onSyncStart?.()

            // Send orders sync request
            send({
                type: 'sync',
                event: 'orders.sync',
                data: { timestamp: Date.now() },
            })

            setStatus(prev => ({
                ...prev,
                lastSync: new Date().toISOString(),
                syncCount: prev.syncCount + 1,
                isSyncing: false,
            }))

            onSyncComplete?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Orders sync failed')
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1, isSyncing: false }))
            onSyncError?.(err)
        }
    }, [isConnected, send, onSyncStart, onSyncComplete, onSyncError])

    // Sync notifications
    const syncNotifications = useCallback(async () => {
        if (!isConnected) return

        try {
            setStatus(prev => ({ ...prev, isSyncing: true }))
            onSyncStart?.()

            // Send notifications sync request
            send({
                type: 'sync',
                event: 'notifications.sync',
                data: { timestamp: Date.now() },
            })

            setStatus(prev => ({
                ...prev,
                lastSync: new Date().toISOString(),
                syncCount: prev.syncCount + 1,
                isSyncing: false,
            }))

            onSyncComplete?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Notifications sync failed')
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1, isSyncing: false }))
            onSyncError?.(err)
        }
    }, [isConnected, send, onSyncStart, onSyncComplete, onSyncError])

    // Sync all
    const syncAll = useCallback(async () => {
        if (!isConnected) return

        try {
            setStatus(prev => ({ ...prev, isSyncing: true }))
            onSyncStart?.()

            const syncPromises = []

            if (syncCart) syncPromises.push(syncCart())
            if (syncProducts) syncPromises.push(syncProducts())
            if (syncOrders) syncPromises.push(syncOrders())
            if (syncNotifications) syncPromises.push(syncNotifications())

            await Promise.all(syncPromises)

            setStatus(prev => ({
                ...prev,
                lastSync: new Date().toISOString(),
                syncCount: prev.syncCount + 1,
                isSyncing: false,
            }))

            onSyncComplete?.()
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Sync all failed')
            setStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1, isSyncing: false }))
            onSyncError?.(err)
        }
    }, [isConnected, syncCart, syncProducts, syncOrders, syncNotifications, onSyncStart, onSyncComplete, onSyncError])

    // Force sync
    const forceSync = useCallback(async () => {
        await syncAll()
    }, [syncAll])

    // Clear sync status
    const clearSyncStatus = useCallback(() => {
        setStatus({
            isOnline: true,
            isSyncing: false,
            lastSync: null,
            syncCount: 0,
            errorCount: 0,
            pendingChanges: false,
        })
    }, [])

    // Setup periodic sync
    useEffect(() => {
        if (syncInterval > 0 && isConnected) {
            syncTimeoutRef.current = setInterval(() => {
                syncAll()
            }, syncInterval)
        }

        return () => {
            if (syncTimeoutRef.current) {
                clearInterval(syncTimeoutRef.current)
            }
        }
    }, [syncInterval, isConnected, syncAll])

    // Setup event subscriptions
    useEffect(() => {
        if (isConnected) {
            // Subscribe to cart events
            if (syncCart) {
                subscribe(WS_EVENTS.CART_UPDATED, (data) => {
                    handleCartEvent({ type: 'cart', event: 'cart.updated', data })
                })
            }

            // Subscribe to product events
            if (syncProducts) {
                subscribe(WS_EVENTS.PRODUCT_PRICE_CHANGED, (data) => {
                    handleProductEvent({ type: 'product', event: 'product.price.changed', data })
                })
                subscribe(WS_EVENTS.PRODUCT_STOCK_UPDATED, (data) => {
                    handleProductEvent({ type: 'product', event: 'product.stock.updated', data })
                })
            }

            // Subscribe to order events
            if (syncOrders) {
                subscribe(WS_EVENTS.ORDER_CREATED, (data) => {
                    handleOrderEvent({ type: 'order', event: 'order.created', data })
                })
                subscribe(WS_EVENTS.ORDER_STATUS_CHANGED, (data) => {
                    handleOrderEvent({ type: 'order', event: 'order.status.changed', data })
                })
            }

            // Subscribe to notification events
            if (syncNotifications) {
                subscribe(WS_EVENTS.NOTIFICATION_NEW, (data) => {
                    handleNotificationEvent({ type: 'notification', event: 'notification.new', data })
                })
                subscribe(WS_EVENTS.NOTIFICATION_READ, (data) => {
                    handleNotificationEvent({ type: 'notification', event: 'notification.read', data })
                })
            }
        }

        return () => {
            // Cleanup subscriptions
            unsubscribe(WS_EVENTS.CART_UPDATED)
            unsubscribe(WS_EVENTS.PRODUCT_PRICE_CHANGED)
            unsubscribe(WS_EVENTS.PRODUCT_STOCK_UPDATED)
            unsubscribe(WS_EVENTS.ORDER_CREATED)
            unsubscribe(WS_EVENTS.ORDER_STATUS_CHANGED)
            unsubscribe(WS_EVENTS.NOTIFICATION_NEW)
            unsubscribe(WS_EVENTS.NOTIFICATION_READ)
        }
    }, [isConnected, syncCart, syncProducts, syncOrders, syncNotifications, subscribe, unsubscribe, handleCartEvent, handleProductEvent, handleOrderEvent, handleNotificationEvent])

    // Update online status
    useEffect(() => {
        setStatus(prev => ({ ...prev, isOnline: isConnected }))
    }, [isConnected])

    return {
        status,
        syncCart,
        syncProducts,
        syncOrders,
        syncNotifications,
        syncAll,
        forceSync,
        clearSyncStatus,
    }
}

export default useRealtimeSync
