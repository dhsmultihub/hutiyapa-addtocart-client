import React, { useState, useEffect, useCallback } from 'react'
import { useRealtimeEvents } from '../hooks/useRealtimeEvents'
import { useWebSocket } from '../hooks/useWebSocket'
import { WS_EVENTS } from '../../../lib/constants'

export interface Notification {
    id: string
    title: string
    message: string
    category: 'info' | 'warning' | 'error' | 'success'
    isRead: boolean
    timestamp: string
    userId?: string
    metadata?: Record<string, any>
}

export interface RealtimeNotificationsProps {
    className?: string
    maxNotifications?: number
    autoHide?: boolean
    hideDelay?: number
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    onNotificationClick?: (notification: Notification) => void
    onNotificationDismiss?: (notification: Notification) => void
}

export default function RealtimeNotifications({
    className = '',
    maxNotifications = 10,
    autoHide = true,
    hideDelay = 5000,
    position = 'top-right',
    onNotificationClick,
    onNotificationDismiss,
}: RealtimeNotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isVisible, setIsVisible] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    // WebSocket connection
    const { isConnected, send } = useWebSocket('notifications', {
        autoConnect: true,
    })

    // Realtime events
    const { subscribe, unsubscribe } = useRealtimeEvents({
        eventTypes: ['notification'],
        autoSubscribe: true,
    })

    // Handle new notification
    const handleNewNotification = useCallback((event: any) => {
        if (event.type === 'notification' && event.event === 'notification.new') {
            const notification: Notification = {
                id: event.data.notificationId,
                title: event.data.title,
                message: event.data.message,
                category: event.data.category,
                isRead: false,
                timestamp: event.data.timestamp,
                userId: event.data.userId,
                metadata: event.data.metadata,
            }

            setNotifications(prev => {
                const newNotifications = [notification, ...prev]
                return newNotifications.slice(0, maxNotifications)
            })

            setUnreadCount(prev => prev + 1)

            // Auto-hide notification
            if (autoHide) {
                setTimeout(() => {
                    handleDismissNotification(notification.id)
                }, hideDelay)
            }
        }
    }, [maxNotifications, autoHide, hideDelay])

    // Handle notification read
    const handleNotificationRead = useCallback((event: any) => {
        if (event.type === 'notification' && event.event === 'notification.read') {
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === event.data.notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            )
        }
    }, [])

    // Handle notification deleted
    const handleNotificationDeleted = useCallback((event: any) => {
        if (event.type === 'notification' && event.event === 'notification.deleted') {
            setNotifications(prev =>
                prev.filter(notification => notification.id !== event.data.notificationId)
            )
        }
    }, [])

    // Subscribe to notification events
    useEffect(() => {
        const subscriptionId = subscribe('notification', (event) => {
            switch (event.event) {
                case 'notification.new':
                    handleNewNotification(event)
                    break
                case 'notification.read':
                    handleNotificationRead(event)
                    break
                case 'notification.deleted':
                    handleNotificationDeleted(event)
                    break
            }
        })

        return () => {
            unsubscribe(subscriptionId)
        }
    }, [subscribe, unsubscribe, handleNewNotification, handleNotificationRead, handleNotificationDeleted])

    // Mark notification as read
    const handleReadNotification = useCallback((notificationId: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            )
        )

        setUnreadCount(prev => Math.max(0, prev - 1))

        // Send read event to server
        if (isConnected) {
            send({
                type: 'notification',
                event: 'notification.read',
                data: { notificationId },
            })
        }

        onNotificationClick?.(notifications.find(n => n.id === notificationId)!)
    }, [isConnected, send, onNotificationClick, notifications])

    // Dismiss notification
    const handleDismissNotification = useCallback((notificationId: string) => {
        const notification = notifications.find(n => n.id === notificationId)
        if (notification) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            setUnreadCount(prev => Math.max(0, prev - 1))
            onNotificationDismiss?.(notification)
        }
    }, [notifications, onNotificationDismiss])

    // Mark all as read
    const handleMarkAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true }))
        )
        setUnreadCount(0)

        // Send mark all read event to server
        if (isConnected) {
            send({
                type: 'notification',
                event: 'notification.mark_all_read',
                data: { timestamp: Date.now() },
            })
        }
    }, [isConnected, send])

    // Clear all notifications
    const handleClearAll = useCallback(() => {
        setNotifications([])
        setUnreadCount(0)
    }, [])

    // Get notification icon
    const getNotificationIcon = (category: Notification['category']) => {
        switch (category) {
            case 'success':
                return '✅'
            case 'warning':
                return '⚠️'
            case 'error':
                return '❌'
            case 'info':
            default:
                return 'ℹ️'
        }
    }

    // Get notification color
    const getNotificationColor = (category: Notification['category']) => {
        switch (category) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800'
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800'
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800'
            case 'info':
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800'
        }
    }

    // Get position classes
    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4'
            case 'top-right':
                return 'top-4 right-4'
            case 'bottom-left':
                return 'bottom-4 left-4'
            case 'bottom-right':
                return 'bottom-4 right-4'
            default:
                return 'top-4 right-4'
        }
    }

    if (!isVisible || notifications.length === 0) {
        return null
    }

    return (
        <div className={`fixed ${getPositionClasses()} z-50 max-w-sm w-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={handleClearAll}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="space-y-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`relative p-3 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${notification.isRead ? 'opacity-60' : ''
                            } ${getNotificationColor(notification.category)}`}
                    >
                        <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0">
                                <span className="text-sm">
                                    {getNotificationIcon(notification.category)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">
                                    {notification.title}
                                </h4>
                                <p className="text-sm mt-1 text-gray-600">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex items-center space-x-1">
                                {!notification.isRead && (
                                    <button
                                        onClick={() => handleReadNotification(notification.id)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Mark read
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDismissNotification(notification.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connection Status */}
            {!isConnected && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        ⚠️ Notifications are offline. Reconnecting...
                    </p>
                </div>
            )}
        </div>
    )
}
