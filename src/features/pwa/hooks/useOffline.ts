import { useState, useEffect, useCallback } from 'react'
import { offlineService } from '../services/offline.service'

export interface OfflineStatus {
    isOnline: boolean
    isOffline: boolean
    pendingActions: number
    lastSync: string | null
    capabilities: {
        canBrowseProducts: boolean
        canViewCart: boolean
        canAddToCart: boolean
        canRemoveFromCart: boolean
        canUpdateCart: boolean
        canViewProfile: boolean
        canViewOrders: boolean
        canSearch: boolean
        canFilter: boolean
    }
}

export interface OfflineAction {
    id: string
    type: 'cart' | 'order' | 'user' | 'product'
    action: string
    data: any
    timestamp: string
    retryCount: number
    maxRetries: number
    priority: 'high' | 'medium' | 'low'
}

export interface UseOfflineReturn {
    status: OfflineStatus
    actions: OfflineAction[]
    addAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<string>
    removeAction: (actionId: string) => Promise<void>
    syncActions: () => Promise<void>
    clearActions: () => Promise<void>
    isActionSupported: (type: string, action: string) => boolean
    getCachedData: (key: string) => Promise<any>
    cacheData: (key: string, data: any) => Promise<void>
    getOfflineQueueStatus: () => any
}

export function useOffline(): UseOfflineReturn {
    const [status, setStatus] = useState<OfflineStatus>({
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        pendingActions: 0,
        lastSync: null,
        capabilities: {
            canBrowseProducts: true,
            canViewCart: true,
            canAddToCart: true,
            canRemoveFromCart: true,
            canUpdateCart: true,
            canViewProfile: true,
            canViewOrders: true,
            canSearch: true,
            canFilter: true,
        },
    })

    const [actions, setActions] = useState<OfflineAction[]>([])

    // Update status
    const updateStatus = useCallback(() => {
        const offlineStatus = offlineService.getOfflineStatus()
        setStatus({
            isOnline: offlineStatus.isOnline,
            isOffline: !offlineStatus.isOnline,
            pendingActions: offlineStatus.pendingActions,
            lastSync: offlineStatus.lastSync,
            capabilities: offlineStatus.capabilities,
        })
    }, [])

    // Load actions
    const loadActions = useCallback(async () => {
        try {
            const offlineActions = await offlineService.getOfflineActions()
            setActions(offlineActions)
        } catch (error) {
            console.error('Failed to load offline actions:', error)
        }
    }, [])

    // Add action
    const addAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
        try {
            const actionId = await offlineService.addOfflineAction(action)
            await loadActions()
            updateStatus()
            return actionId
        } catch (error) {
            console.error('Failed to add offline action:', error)
            throw error
        }
    }, [loadActions, updateStatus])

    // Remove action
    const removeAction = useCallback(async (actionId: string): Promise<void> => {
        try {
            await offlineService.removeOfflineAction(actionId)
            await loadActions()
            updateStatus()
        } catch (error) {
            console.error('Failed to remove offline action:', error)
            throw error
        }
    }, [loadActions, updateStatus])

    // Sync actions
    const syncActions = useCallback(async (): Promise<void> => {
        try {
            await offlineService.syncOfflineActions()
            await loadActions()
            updateStatus()
        } catch (error) {
            console.error('Failed to sync offline actions:', error)
            throw error
        }
    }, [loadActions, updateStatus])

    // Clear actions
    const clearActions = useCallback(async (): Promise<void> => {
        try {
            await offlineService.clearOfflineQueue()
            await loadActions()
            updateStatus()
        } catch (error) {
            console.error('Failed to clear offline actions:', error)
            throw error
        }
    }, [loadActions, updateStatus])

    // Check if action is supported
    const isActionSupported = useCallback((type: string, action: string): boolean => {
        return offlineService.isActionSupportedOffline(type, action)
    }, [])

    // Get cached data
    const getCachedData = useCallback(async (key: string): Promise<any> => {
        try {
            return await offlineService.getCachedData(key)
        } catch (error) {
            console.error('Failed to get cached data:', error)
            return null
        }
    }, [])

    // Cache data
    const cacheData = useCallback(async (key: string, data: any): Promise<void> => {
        try {
            await offlineService.cacheData(key, data)
        } catch (error) {
            console.error('Failed to cache data:', error)
            throw error
        }
    }, [])

    // Get offline queue status
    const getOfflineQueueStatus = useCallback(() => {
        return offlineService.getOfflineQueueStatus()
    }, [])

    // Setup event listeners
    useEffect(() => {
        const handleOnline = () => {
            updateStatus()
            // Auto-sync when coming back online
            syncActions()
        }

        const handleOffline = () => {
            updateStatus()
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Initial load
        loadActions()
        updateStatus()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [loadActions, updateStatus, syncActions])

    // Periodic status update
    useEffect(() => {
        const interval = setInterval(() => {
            updateStatus()
        }, 5000) // Update every 5 seconds

        return () => clearInterval(interval)
    }, [updateStatus])

    return {
        status,
        actions,
        addAction,
        removeAction,
        syncActions,
        clearActions,
        isActionSupported,
        getCachedData,
        cacheData,
        getOfflineQueueStatus,
    }
}

export default useOffline
