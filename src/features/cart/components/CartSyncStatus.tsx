'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useCart } from '../hooks/useCart'
import { cartPersistence } from '../utils/cart-persistence'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Cloud,
  CloudOff,
  Sync
} from 'lucide-react'

interface CartSyncStatusProps {
  className?: string
}

export default function CartSyncStatus({ className }: CartSyncStatusProps) {
  const { items, subtotal } = useCart()
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean
    lastSync: number | null
    pendingChanges: boolean
  }>({
    isOnline: true,
    lastSync: null,
    pendingChanges: false,
  })
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const checkSyncStatus = useCallback(() => {
    const status = cartPersistence.getSyncStatus()
    setSyncStatus(status)
  }, [])

  useEffect(() => {
    // Check initial sync status
    checkSyncStatus()
    
    // Set up periodic status checks
    const interval = setInterval(checkSyncStatus, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [checkSyncStatus])

  // Use useRef to store timeout so it persists across renders
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const performSync = useCallback(async () => {
    if (syncing) return

    setSyncing(true)
    setSyncError(null)

    try {
      const result = await cartPersistence.forceSync({
        items,
        subtotal,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        saved: [],
        couponCode: undefined,
        couponDiscount: 0,
        giftCardCode: undefined,
        giftCardAmountApplied: 0,
        total: subtotal,
      })

      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: Date.now(),
          pendingChanges: false,
        }))
      } else {
        setSyncError(result.message)
      }
    } catch (error: any) {
      setSyncError(error.message)
    } finally {
      setSyncing(false)
    }
  }, [syncing, items, subtotal])

  const debouncedSync = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setSyncStatus(prev => {
        if (prev.isOnline && !syncing) {
          performSync()
        }
        return prev
      })
    }, 2000) // 2 second delay
  }, [syncing, performSync])

  useEffect(() => {
    // Auto-sync when cart changes
    if (items.length > 0) {
      debouncedSync()
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [items.length, subtotal, debouncedSync])

  const handleManualSync = useCallback(() => {
    performSync()
  }, [performSync])

  const getStatusIcon = () => {
    if (syncing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
    }
    
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-600" />
    }
    
    if (syncStatus.pendingChanges) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
    
    if (syncStatus.lastSync) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    return <Cloud className="h-4 w-4 text-gray-600" />
  }

  const getStatusText = () => {
    if (syncing) {
      return 'Syncing...'
    }
    
    if (!syncStatus.isOnline) {
      return 'Offline'
    }
    
    if (syncStatus.pendingChanges) {
      return 'Pending sync'
    }
    
    if (syncStatus.lastSync) {
      const timeAgo = Date.now() - syncStatus.lastSync
      if (timeAgo < 60000) { // Less than 1 minute
        return 'Just synced'
      } else if (timeAgo < 3600000) { // Less than 1 hour
        return `Synced ${Math.floor(timeAgo / 60000)}m ago`
      } else {
        return `Synced ${Math.floor(timeAgo / 3600000)}h ago`
      }
    }
    
    return 'Not synced'
  }

  const getStatusColor = () => {
    if (syncing) {
      return 'bg-blue-100 text-blue-800'
    }
    
    if (!syncStatus.isOnline) {
      return 'bg-red-100 text-red-800'
    }
    
    if (syncStatus.pendingChanges) {
      return 'bg-yellow-100 text-yellow-800'
    }
    
    if (syncStatus.lastSync) {
      return 'bg-green-100 text-green-800'
    }
    
    return 'bg-gray-100 text-gray-800'
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900">Cart Sync</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
          
          {syncStatus.isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={syncing}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Sync className="h-4 w-4 mr-1" />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </div>

      {syncError && (
        <Alert className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sync failed: {syncError}
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!syncStatus.isOnline && (
        <Alert className="mb-3">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Your cart will sync automatically when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {syncStatus.pendingChanges && syncStatus.isOnline && (
        <Alert className="mb-3">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Your cart will sync automatically in a few seconds.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500">
        {syncStatus.isOnline ? (
          <div className="flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            <span>Connected to cloud</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <CloudOff className="h-3 w-3" />
            <span>Offline mode - changes saved locally</span>
          </div>
        )}
      </div>
    </div>
  )
}
