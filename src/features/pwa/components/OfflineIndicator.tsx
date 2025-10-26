import React, { useState, useEffect } from 'react'

export interface OfflineIndicatorProps {
    className?: string
    showWhenOnline?: boolean
    autoHide?: boolean
    hideDelay?: number
    onOnline?: () => void
    onOffline?: () => void
}

export default function OfflineIndicator({
    className = '',
    showWhenOnline = false,
    autoHide = true,
    hideDelay = 3000,
    onOnline,
    onOffline,
}: OfflineIndicatorProps) {
    const [isOnline, setIsOnline] = useState(true)
    const [isVisible, setIsVisible] = useState(false)
    const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)
    const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setIsVisible(true)
            setLastOnlineTime(new Date())
            onOnline?.()

            if (autoHide) {
                setTimeout(() => {
                    setIsVisible(false)
                }, hideDelay)
            }
        }

        const handleOffline = () => {
            setIsOnline(false)
            setIsVisible(true)
            setLastOfflineTime(new Date())
            onOffline?.()
        }

        // Check initial online status
        setIsOnline(navigator.onLine)
        if (navigator.onLine && showWhenOnline) {
            setIsVisible(true)
            if (autoHide) {
                setTimeout(() => {
                    setIsVisible(false)
                }, hideDelay)
            }
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [showWhenOnline, autoHide, hideDelay, onOnline, onOffline])

    // Don't show if not visible
    if (!isVisible) {
        return null
    }

    const getStatusText = () => {
        if (isOnline) {
            return 'You are back online'
        } else {
            return 'You are currently offline'
        }
    }

    const getStatusIcon = () => {
        if (isOnline) {
            return (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        } else {
            return (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        }
    }

    const getStatusColor = () => {
        if (isOnline) {
            return 'bg-green-50 border-green-200 text-green-800'
        } else {
            return 'bg-red-50 border-red-200 text-red-800'
        }
    }

    const getTimeText = () => {
        if (isOnline && lastOnlineTime) {
            return `Connected at ${lastOnlineTime.toLocaleTimeString()}`
        } else if (!isOnline && lastOfflineTime) {
            return `Disconnected at ${lastOfflineTime.toLocaleTimeString()}`
        }
        return null
    }

    return (
        <div className={`fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto ${className}`}>
            <div className={`rounded-lg border p-3 ${getStatusColor()}`}>
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                        {getStatusIcon()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                            {getStatusText()}
                        </p>
                        {getTimeText() && (
                            <p className="text-xs opacity-75 mt-1">
                                {getTimeText()}
                            </p>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {!isOnline && (
                    <div className="mt-2 text-xs opacity-75">
                        <p>Some features may be limited while offline. Your data will sync when you're back online.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
