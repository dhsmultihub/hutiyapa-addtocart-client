import { CartState, CartItem } from '../redux/cart.slice'
import { cartService } from '../../../api/services/cart.service'
import { authManager } from '../../../api/utils/auth-manager'

export interface CartSyncResult {
    success: boolean
    synced: boolean
    conflicts: CartConflict[]
    message: string
}

export interface CartConflict {
    type: 'quantity' | 'price' | 'availability' | 'removed'
    itemId: string
    localValue: any
    serverValue: any
    resolution: 'local' | 'server' | 'manual'
}

export interface CartBackup {
    cart: CartState
    timestamp: number
    version: string
    userId?: string
}

export class CartPersistence {
    private static readonly STORAGE_KEY = 'cart_backup'
    private static readonly SYNC_INTERVAL = 30000 // 30 seconds
    private static readonly MAX_RETRIES = 3
    private syncTimer: NodeJS.Timeout | null = null
    private isOnline = true

    constructor() {
        this.setupOnlineListener()
        this.startPeriodicSync()
    }

    /**
     * Save cart to localStorage
     */
    static saveCartToStorage(cart: CartState): void {
        try {
            const backup: CartBackup = {
                cart,
                timestamp: Date.now(),
                version: '1.0.0',
                userId: authManager.getAuthState().user?.id,
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup))
        } catch (error) {
            console.error('Failed to save cart to storage:', error)
        }
    }

    /**
     * Load cart from localStorage
     */
    static loadCartFromStorage(): CartState | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY)
            if (!stored) return null

            const backup: CartBackup = JSON.parse(stored)

            // Check if backup is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000 // 24 hours
            if (Date.now() - backup.timestamp > maxAge) {
                this.clearCartStorage()
                return null
            }

            return backup.cart
        } catch (error) {
            console.error('Failed to load cart from storage:', error)
            this.clearCartStorage()
            return null
        }
    }

    /**
     * Clear cart from localStorage
     */
    static clearCartStorage(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY)
        } catch (error) {
            console.error('Failed to clear cart storage:', error)
        }
    }

    /**
     * Sync cart with server
     */
    async syncCartWithServer(localCart: CartState): Promise<CartSyncResult> {
        try {
            if (!this.isOnline) {
                return {
                    success: false,
                    synced: false,
                    conflicts: [],
                    message: 'Offline - cart will sync when connection is restored',
                }
            }

            // Get server cart
            const serverResponse = await cartService.getCart()
            if (!serverResponse.success) {
                throw new Error(serverResponse.message)
            }

            const serverCart = serverResponse.data
            const conflicts = this.detectConflicts(localCart, serverCart)

            if (conflicts.length === 0) {
                // No conflicts, sync local cart to server
                await this.uploadCartToServer(localCart)
                return {
                    success: true,
                    synced: true,
                    conflicts: [],
                    message: 'Cart synced successfully',
                }
            } else {
                // Resolve conflicts
                const resolvedCart = await this.resolveConflicts(localCart, serverCart, conflicts)
                return {
                    success: true,
                    synced: true,
                    conflicts,
                    message: `Cart synced with ${conflicts.length} conflict(s) resolved`,
                }
            }
        } catch (error) {
            console.error('Failed to sync cart with server:', error)
            return {
                success: false,
                synced: false,
                conflicts: [],
                message: `Sync failed: ${error.message}`,
            }
        }
    }

    /**
     * Upload cart to server
     */
    private async uploadCartToServer(cart: CartState): Promise<void> {
        const cartItems = cart.items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            variantId: item.variantId,
        }))

        await cartService.addBulkToCart(cartItems)
    }

    /**
     * Detect conflicts between local and server cart
     */
    private detectConflicts(localCart: CartState, serverCart: any): CartConflict[] {
        const conflicts: CartConflict[] = []

        // Check for items that exist in local but not in server
        localCart.items.forEach(localItem => {
            const serverItem = serverCart.items?.find((s: any) => s.id === localItem.id)

            if (!serverItem) {
                conflicts.push({
                    type: 'removed',
                    itemId: localItem.id,
                    localValue: localItem,
                    serverValue: null,
                    resolution: 'local',
                })
            } else if (localItem.quantity !== serverItem.quantity) {
                conflicts.push({
                    type: 'quantity',
                    itemId: localItem.id,
                    localValue: localItem.quantity,
                    serverValue: serverItem.quantity,
                    resolution: 'local', // Prefer local changes
                })
            } else if (localItem.price !== serverItem.price) {
                conflicts.push({
                    type: 'price',
                    itemId: localItem.id,
                    localValue: localItem.price,
                    serverValue: serverItem.price,
                    resolution: 'server', // Prefer server prices
                })
            }
        })

        // Check for items that exist in server but not in local
        serverCart.items?.forEach((serverItem: any) => {
            const localItem = localCart.items.find(l => l.id === serverItem.id)

            if (!localItem) {
                conflicts.push({
                    type: 'removed',
                    itemId: serverItem.id,
                    localValue: null,
                    serverValue: serverItem,
                    resolution: 'server',
                })
            }
        })

        return conflicts
    }

    /**
     * Resolve conflicts between local and server cart
     */
    private async resolveConflicts(
        localCart: CartState,
        serverCart: any,
        conflicts: CartConflict[]
    ): Promise<CartState> {
        const resolvedCart = { ...localCart }

        for (const conflict of conflicts) {
            switch (conflict.type) {
                case 'quantity':
                    if (conflict.resolution === 'local') {
                        // Keep local quantity
                        const item = resolvedCart.items.find(i => i.id === conflict.itemId)
                        if (item) {
                            item.quantity = conflict.localValue
                        }
                    } else {
                        // Use server quantity
                        const item = resolvedCart.items.find(i => i.id === conflict.itemId)
                        if (item) {
                            item.quantity = conflict.serverValue
                        }
                    }
                    break

                case 'price':
                    if (conflict.resolution === 'server') {
                        // Use server price
                        const item = resolvedCart.items.find(i => i.id === conflict.itemId)
                        if (item) {
                            item.price = conflict.serverValue
                        }
                    }
                    break

                case 'removed':
                    if (conflict.resolution === 'server') {
                        // Add server item to local cart
                        resolvedCart.items.push(conflict.serverValue)
                    } else {
                        // Remove local item
                        resolvedCart.items = resolvedCart.items.filter(i => i.id !== conflict.itemId)
                    }
                    break
            }
        }

        // Recalculate totals
        this.recalculateTotals(resolvedCart)

        return resolvedCart
    }

    /**
     * Recalculate cart totals
     */
    private recalculateTotals(cart: CartState): void {
        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0)
        cart.total = cart.subtotal - cart.couponDiscount - cart.giftCardAmountApplied
    }

    /**
     * Start periodic sync
     */
    private startPeriodicSync(): void {
        this.syncTimer = setInterval(() => {
            if (this.isOnline) {
                this.performBackgroundSync()
            }
        }, this.STORAGE_KEY)
    }

    /**
     * Perform background sync
     */
    private async performBackgroundSync(): Promise<void> {
        try {
            const localCart = this.loadCartFromStorage()
            if (localCart) {
                await this.syncCartWithServer(localCart)
            }
        } catch (error) {
            console.error('Background sync failed:', error)
        }
    }

    /**
     * Setup online/offline listener
     */
    private setupOnlineListener(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true
                this.performBackgroundSync()
            })

            window.addEventListener('offline', () => {
                this.isOnline = false
            })
        }
    }

    /**
     * Force sync cart
     */
    async forceSync(cart: CartState): Promise<CartSyncResult> {
        return this.syncCartWithServer(cart)
    }

    /**
     * Get sync status
     */
    getSyncStatus(): {
        isOnline: boolean
        lastSync: number | null
        pendingChanges: boolean
    } {
        const lastSync = this.getLastSyncTime()
        const pendingChanges = this.hasPendingChanges()

        return {
            isOnline: this.isOnline,
            lastSync,
            pendingChanges,
        }
    }

    /**
     * Get last sync time
     */
    private getLastSyncTime(): number | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY)
            if (stored) {
                const backup: CartBackup = JSON.parse(stored)
                return backup.timestamp
            }
        } catch (error) {
            console.error('Failed to get last sync time:', error)
        }
        return null
    }

    /**
     * Check if there are pending changes
     */
    private hasPendingChanges(): boolean {
        // This would typically check if local cart differs from server
        // For now, we'll assume there are always pending changes
        return true
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer)
            this.syncTimer = null
        }
    }
}

export const cartPersistence = new CartPersistence()
export default cartPersistence
