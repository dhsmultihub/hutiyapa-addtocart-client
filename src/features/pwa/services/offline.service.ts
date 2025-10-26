import { CartState } from '../../cart/redux/cart.slice'

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

export interface OfflineQueue {
    actions: OfflineAction[]
    isOnline: boolean
    lastSync: string | null
    pendingCount: number
}

export interface OfflineCapabilities {
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

export interface OfflineData {
    products: any[]
    cart: CartState
    user: any
    orders: any[]
    lastUpdated: string
    version: string
}

export class OfflineService {
    private static readonly DB_NAME = 'HutiyapaOfflineDB'
    private static readonly DB_VERSION = 1
    private static readonly STORES = {
        ACTIONS: 'offlineActions',
        DATA: 'offlineData',
        CACHE: 'offlineCache',
    }

    private db: IDBDatabase | null = null
    private isOnline: boolean = true
    private offlineQueue: OfflineQueue = {
        actions: [],
        isOnline: true,
        lastSync: null,
        pendingCount: 0,
    }

    private capabilities: OfflineCapabilities = {
        canBrowseProducts: true,
        canViewCart: true,
        canAddToCart: true,
        canRemoveFromCart: true,
        canUpdateCart: true,
        canViewProfile: true,
        canViewOrders: true,
        canSearch: true,
        canFilter: true,
    }

    constructor() {
        this.initializeDatabase()
        this.setupOnlineListener()
    }

    /**
     * Initialize IndexedDB
     */
    private async initializeDatabase(): Promise<void> {
        try {
            const request = indexedDB.open(OfflineService.DB_NAME, OfflineService.DB_VERSION)

            request.onerror = () => {
                console.error('Failed to open IndexedDB')
            }

            request.onsuccess = () => {
                this.db = request.result
                this.loadOfflineQueue()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result

                // Create offline actions store
                if (!db.objectStoreNames.contains(OfflineService.STORES.ACTIONS)) {
                    const actionsStore = db.createObjectStore(OfflineService.STORES.ACTIONS, {
                        keyPath: 'id',
                        autoIncrement: true,
                    })
                    actionsStore.createIndex('type', 'type', { unique: false })
                    actionsStore.createIndex('timestamp', 'timestamp', { unique: false })
                    actionsStore.createIndex('priority', 'priority', { unique: false })
                }

                // Create offline data store
                if (!db.objectStoreNames.contains(OfflineService.STORES.DATA)) {
                    const dataStore = db.createObjectStore(OfflineService.STORES.DATA, {
                        keyPath: 'key',
                    })
                }

                // Create offline cache store
                if (!db.objectStoreNames.contains(OfflineService.STORES.CACHE)) {
                    const cacheStore = db.createObjectStore(OfflineService.STORES.CACHE, {
                        keyPath: 'url',
                    })
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
                }
            }
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error)
        }
    }

    /**
     * Setup online/offline listener
     */
    private setupOnlineListener(): void {
        if (typeof window !== 'undefined') {
            this.isOnline = navigator.onLine

            window.addEventListener('online', () => {
                this.isOnline = true
                this.offlineQueue.isOnline = true
                this.syncOfflineActions()
            })

            window.addEventListener('offline', () => {
                this.isOnline = false
                this.offlineQueue.isOnline = false
            })
        }
    }

    /**
     * Add action to offline queue
     */
    async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
        const offlineAction: OfflineAction = {
            ...action,
            id: this.generateActionId(),
            timestamp: new Date().toISOString(),
            retryCount: 0,
        }

        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.ACTIONS], 'readwrite')
                const store = transaction.objectStore(OfflineService.STORES.ACTIONS)
                await store.add(offlineAction)
            }

            this.offlineQueue.actions.push(offlineAction)
            this.offlineQueue.pendingCount++

            // Try to sync immediately if online
            if (this.isOnline) {
                this.syncOfflineActions()
            }

            return offlineAction.id
        } catch (error) {
            console.error('Failed to add offline action:', error)
            throw error
        }
    }

    /**
     * Remove action from offline queue
     */
    async removeOfflineAction(actionId: string): Promise<void> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.ACTIONS], 'readwrite')
                const store = transaction.objectStore(OfflineService.STORES.ACTIONS)
                await store.delete(actionId)
            }

            this.offlineQueue.actions = this.offlineQueue.actions.filter(action => action.id !== actionId)
            this.offlineQueue.pendingCount = Math.max(0, this.offlineQueue.pendingCount - 1)
        } catch (error) {
            console.error('Failed to remove offline action:', error)
        }
    }

    /**
     * Get offline actions
     */
    async getOfflineActions(): Promise<OfflineAction[]> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.ACTIONS], 'readonly')
                const store = transaction.objectStore(OfflineService.STORES.ACTIONS)
                const request = store.getAll()

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
            }
            return this.offlineQueue.actions
        } catch (error) {
            console.error('Failed to get offline actions:', error)
            return []
        }
    }

    /**
     * Sync offline actions
     */
    async syncOfflineActions(): Promise<void> {
        if (!this.isOnline) return

        try {
            const actions = await this.getOfflineActions()
            const syncPromises = actions.map(action => this.syncAction(action))

            await Promise.allSettled(syncPromises)

            this.offlineQueue.lastSync = new Date().toISOString()
        } catch (error) {
            console.error('Failed to sync offline actions:', error)
        }
    }

    /**
     * Sync individual action
     */
    private async syncAction(action: OfflineAction): Promise<void> {
        try {
            const response = await fetch(`/api/v1/${action.type}/${action.action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(action.data),
            })

            if (response.ok) {
                await this.removeOfflineAction(action.id)
                console.log(`Offline action synced: ${action.id}`)
            } else {
                throw new Error(`HTTP ${response.status}`)
            }
        } catch (error) {
            console.error(`Failed to sync action ${action.id}:`, error)

            // Increment retry count
            action.retryCount++

            if (action.retryCount >= action.maxRetries) {
                console.error(`Action ${action.id} exceeded max retries, removing from queue`)
                await this.removeOfflineAction(action.id)
            }
        }
    }

    /**
     * Cache data for offline use
     */
    async cacheData(key: string, data: any): Promise<void> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.DATA], 'readwrite')
                const store = transaction.objectStore(OfflineService.STORES.DATA)
                await store.put({
                    key,
                    data,
                    timestamp: new Date().toISOString(),
                })
            }
        } catch (error) {
            console.error('Failed to cache data:', error)
        }
    }

    /**
     * Get cached data
     */
    async getCachedData(key: string): Promise<any | null> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.DATA], 'readonly')
                const store = transaction.objectStore(OfflineService.STORES.DATA)
                const request = store.get(key)

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => {
                        const result = request.result
                        resolve(result ? result.data : null)
                    }
                    request.onerror = () => reject(request.error)
                })
            }
            return null
        } catch (error) {
            console.error('Failed to get cached data:', error)
            return null
        }
    }

    /**
     * Cache API response
     */
    async cacheApiResponse(url: string, response: Response): Promise<void> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.CACHE], 'readwrite')
                const store = transaction.objectStore(OfflineService.STORES.CACHE)
                await store.put({
                    url,
                    response: await response.clone().text(),
                    timestamp: new Date().toISOString(),
                })
            }
        } catch (error) {
            console.error('Failed to cache API response:', error)
        }
    }

    /**
     * Get cached API response
     */
    async getCachedApiResponse(url: string): Promise<Response | null> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.CACHE], 'readonly')
                const store = transaction.objectStore(OfflineService.STORES.CACHE)
                const request = store.get(url)

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => {
                        const result = request.result
                        if (result) {
                            resolve(new Response(result.response))
                        } else {
                            resolve(null)
                        }
                    }
                    request.onerror = () => reject(request.error)
                })
            }
            return null
        } catch (error) {
            console.error('Failed to get cached API response:', error)
            return null
        }
    }

    /**
     * Get offline capabilities
     */
    getOfflineCapabilities(): OfflineCapabilities {
        return { ...this.capabilities }
    }

    /**
     * Update offline capabilities
     */
    updateOfflineCapabilities(capabilities: Partial<OfflineCapabilities>): void {
        this.capabilities = { ...this.capabilities, ...capabilities }
    }

    /**
     * Check if action is supported offline
     */
    isActionSupportedOffline(type: string, action: string): boolean {
        switch (type) {
            case 'cart':
                return action === 'add' || action === 'remove' || action === 'update'
            case 'user':
                return action === 'update' || action === 'view'
            case 'product':
                return action === 'view' || action === 'search'
            case 'order':
                return action === 'view'
            default:
                return false
        }
    }

    /**
     * Get offline queue status
     */
    getOfflineQueueStatus(): OfflineQueue {
        return { ...this.offlineQueue }
    }

    /**
     * Clear offline queue
     */
    async clearOfflineQueue(): Promise<void> {
        try {
            if (this.db) {
                const transaction = this.db.transaction([OfflineService.STORES.ACTIONS], 'readwrite')
                const store = transaction.objectStore(OfflineService.STORES.ACTIONS)
                await store.clear()
            }

            this.offlineQueue.actions = []
            this.offlineQueue.pendingCount = 0
        } catch (error) {
            console.error('Failed to clear offline queue:', error)
        }
    }

    /**
     * Load offline queue from IndexedDB
     */
    private async loadOfflineQueue(): Promise<void> {
        try {
            const actions = await this.getOfflineActions()
            this.offlineQueue.actions = actions
            this.offlineQueue.pendingCount = actions.length
        } catch (error) {
            console.error('Failed to load offline queue:', error)
        }
    }

    /**
     * Generate action ID
     */
    private generateActionId(): string {
        return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Check if online
     */
    isOnline(): boolean {
        return this.isOnline
    }

    /**
     * Get offline status
     */
    getOfflineStatus(): {
        isOnline: boolean
        pendingActions: number
        lastSync: string | null
        capabilities: OfflineCapabilities
    } {
        return {
            isOnline: this.isOnline,
            pendingActions: this.offlineQueue.pendingCount,
            lastSync: this.offlineQueue.lastSync,
            capabilities: this.capabilities,
        }
    }

    /**
     * Destroy service
     */
    destroy(): void {
        if (this.db) {
            this.db.close()
            this.db = null
        }
    }
}

export const offlineService = new OfflineService()
export default offlineService
