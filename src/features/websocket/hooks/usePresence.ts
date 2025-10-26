import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import { useRealtimeEvents } from './useRealtimeEvents'
import { presenceManager, UserPresence, PresenceEvent } from '../utils/presence-manager'

export interface UsePresenceOptions {
    userId?: string
    sessionId?: string
    autoConnect?: boolean
    onStatusChange?: (user: UserPresence) => void
    onActivity?: (user: UserPresence) => void
    onTyping?: (user: UserPresence) => void
}

export interface UsePresenceReturn {
    currentUser: UserPresence | null
    onlineUsers: UserPresence[]
    awayUsers: UserPresence[]
    busyUsers: UserPresence[]
    offlineUsers: UserPresence[]
    typingUsers: UserPresence[]
    isOnline: boolean
    statistics: {
        totalUsers: number
        onlineUsers: number
        awayUsers: number
        busyUsers: number
        offlineUsers: number
        typingUsers: number
    }
    setStatus: (status: UserPresence['status']) => void
    setActivity: (activity: string) => void
    setLocation: (location: string) => void
    setTyping: (isTyping: boolean, typingIn?: string) => void
    setAway: () => void
    setBusy: () => void
    setOnline: () => void
    setOffline: () => void
    getUserPresence: (userId: string) => UserPresence | null
    isUserOnline: (userId: string) => boolean
    isUserTyping: (userId: string) => boolean
    initialize: (userId: string, sessionId: string, metadata?: Record<string, any>) => void
    destroy: () => void
}

export function usePresence(options: UsePresenceOptions = {}): UsePresenceReturn {
    const [currentUser, setCurrentUser] = useState<UserPresence | null>(null)
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
    const [awayUsers, setAwayUsers] = useState<UserPresence[]>([])
    const [busyUsers, setBusyUsers] = useState<UserPresence[]>([])
    const [offlineUsers, setOfflineUsers] = useState<UserPresence[]>([])
    const [typingUsers, setTypingUsers] = useState<UserPresence[]>([])
    const [isOnline, setIsOnline] = useState(false)
    const [statistics, setStatistics] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        awayUsers: 0,
        busyUsers: 0,
        offlineUsers: 0,
        typingUsers: 0,
    })

    const {
        userId,
        sessionId,
        autoConnect = true,
        onStatusChange,
        onActivity,
        onTyping,
    } = options

    const subscriptionRef = useRef<string | null>(null)

    // WebSocket connection
    const { isConnected, send } = useWebSocket('presence', {
        autoConnect,
        onConnect: () => {
            setIsOnline(true)
        },
        onDisconnect: () => {
            setIsOnline(false)
        },
    })

    // Realtime events
    const { subscribe, unsubscribe } = useRealtimeEvents({
        eventTypes: ['user'],
        autoSubscribe: true,
    })

    // Handle presence events
    const handlePresenceEvent = useCallback((event: PresenceEvent) => {
        switch (event.type) {
            case 'user.online':
                handleUserOnline(event)
                break
            case 'user.offline':
                handleUserOffline(event)
                break
            case 'user.away':
                handleUserAway(event)
                break
            case 'user.busy':
                handleUserBusy(event)
                break
            case 'user.typing':
                handleUserTyping(event)
                break
            case 'user.activity':
                handleUserActivity(event)
                break
        }
    }, [])

    // Handle user online
    const handleUserOnline = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: 'online',
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: event.isTyping,
            typingIn: event.typingIn,
            metadata: event.metadata,
        }

        setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== user.userId)
            return [...filtered, user]
        })

        setAwayUsers(prev => prev.filter(u => u.userId !== user.userId))
        setBusyUsers(prev => prev.filter(u => u.userId !== user.userId))
        setOfflineUsers(prev => prev.filter(u => u.userId !== user.userId))

        if (user.userId === currentUser?.userId) {
            setCurrentUser(user)
        }

        onStatusChange?.(user)
    }, [currentUser, onStatusChange])

    // Handle user offline
    const handleUserOffline = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: 'offline',
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: false,
            metadata: event.metadata,
        }

        setOfflineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== user.userId)
            return [...filtered, user]
        })

        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId))
        setAwayUsers(prev => prev.filter(u => u.userId !== user.userId))
        setBusyUsers(prev => prev.filter(u => u.userId !== user.userId))
        setTypingUsers(prev => prev.filter(u => u.userId !== user.userId))

        if (user.userId === currentUser?.userId) {
            setCurrentUser(user)
        }

        onStatusChange?.(user)
    }, [currentUser, onStatusChange])

    // Handle user away
    const handleUserAway = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: 'away',
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: event.isTyping,
            typingIn: event.typingIn,
            metadata: event.metadata,
        }

        setAwayUsers(prev => {
            const filtered = prev.filter(u => u.userId !== user.userId)
            return [...filtered, user]
        })

        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId))
        setBusyUsers(prev => prev.filter(u => u.userId !== user.userId))
        setOfflineUsers(prev => prev.filter(u => u.userId !== user.userId))

        if (user.userId === currentUser?.userId) {
            setCurrentUser(user)
        }

        onStatusChange?.(user)
    }, [currentUser, onStatusChange])

    // Handle user busy
    const handleUserBusy = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: 'busy',
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: event.isTyping,
            typingIn: event.typingIn,
            metadata: event.metadata,
        }

        setBusyUsers(prev => {
            const filtered = prev.filter(u => u.userId !== user.userId)
            return [...filtered, user]
        })

        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId))
        setAwayUsers(prev => prev.filter(u => u.userId !== user.userId))
        setOfflineUsers(prev => prev.filter(u => u.userId !== user.userId))

        if (user.userId === currentUser?.userId) {
            setCurrentUser(user)
        }

        onStatusChange?.(user)
    }, [currentUser, onStatusChange])

    // Handle user typing
    const handleUserTyping = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: event.status,
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: event.isTyping,
            typingIn: event.typingIn,
            metadata: event.metadata,
        }

        if (event.isTyping) {
            setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== user.userId)
                return [...filtered, user]
            })
        } else {
            setTypingUsers(prev => prev.filter(u => u.userId !== user.userId))
        }

        onTyping?.(user)
    }, [onTyping])

    // Handle user activity
    const handleUserActivity = useCallback((event: PresenceEvent) => {
        const user: UserPresence = {
            userId: event.userId,
            sessionId: event.sessionId,
            status: event.status,
            lastSeen: event.timestamp,
            activity: event.activity,
            location: event.location,
            device: event.device,
            isTyping: event.isTyping,
            typingIn: event.typingIn,
            metadata: event.metadata,
        }

        // Update user in appropriate list
        switch (event.status) {
            case 'online':
                setOnlineUsers(prev => {
                    const filtered = prev.filter(u => u.userId !== user.userId)
                    return [...filtered, user]
                })
                break
            case 'away':
                setAwayUsers(prev => {
                    const filtered = prev.filter(u => u.userId !== user.userId)
                    return [...filtered, user]
                })
                break
            case 'busy':
                setBusyUsers(prev => {
                    const filtered = prev.filter(u => u.userId !== user.userId)
                    return [...filtered, user]
                })
                break
            case 'offline':
                setOfflineUsers(prev => {
                    const filtered = prev.filter(u => u.userId !== user.userId)
                    return [...filtered, user]
                })
                break
        }

        if (user.userId === currentUser?.userId) {
            setCurrentUser(user)
        }

        onActivity?.(user)
    }, [currentUser, onActivity])

    // Set user status
    const setStatus = useCallback((status: UserPresence['status']) => {
        if (!currentUser) return

        presenceManager.setStatus(status)
        setCurrentUser(prev => prev ? { ...prev, status } : null)
    }, [currentUser])

    // Set user activity
    const setActivity = useCallback((activity: string) => {
        if (!currentUser) return

        presenceManager.setActivity(activity)
        setCurrentUser(prev => prev ? { ...prev, activity } : null)
    }, [currentUser])

    // Set user location
    const setLocation = useCallback((location: string) => {
        if (!currentUser) return

        presenceManager.setLocation(location)
        setCurrentUser(prev => prev ? { ...prev, location } : null)
    }, [currentUser])

    // Set typing status
    const setTyping = useCallback((isTyping: boolean, typingIn?: string) => {
        if (!currentUser) return

        presenceManager.setTyping(isTyping, typingIn)
        setCurrentUser(prev => prev ? { ...prev, isTyping, typingIn } : null)
    }, [currentUser])

    // Set user away
    const setAway = useCallback(() => {
        presenceManager.setAway()
        setStatus('away')
    }, [setStatus])

    // Set user busy
    const setBusy = useCallback(() => {
        presenceManager.setBusy()
        setStatus('busy')
    }, [setStatus])

    // Set user online
    const setOnline = useCallback(() => {
        presenceManager.setOnline()
        setStatus('online')
    }, [setStatus])

    // Set user offline
    const setOffline = useCallback(() => {
        presenceManager.setOffline()
        setStatus('offline')
    }, [setStatus])

    // Get user presence
    const getUserPresence = useCallback((userId: string): UserPresence | null => {
        return presenceManager.getUserPresence(userId)
    }, [])

    // Check if user is online
    const isUserOnline = useCallback((userId: string): boolean => {
        return presenceManager.isUserOnline(userId)
    }, [])

    // Check if user is typing
    const isUserTyping = useCallback((userId: string): boolean => {
        return presenceManager.isUserTyping(userId)
    }, [])

    // Initialize presence
    const initialize = useCallback((userId: string, sessionId: string, metadata?: Record<string, any>) => {
        presenceManager.initializePresence(userId, sessionId, metadata)
        setCurrentUser(presenceManager.getCurrentUser())
    }, [])

    // Destroy presence
    const destroy = useCallback(() => {
        presenceManager.destroy()
        setCurrentUser(null)
        setOnlineUsers([])
        setAwayUsers([])
        setBusyUsers([])
        setOfflineUsers([])
        setTypingUsers([])
        setIsOnline(false)
    }, [])

    // Update statistics
    const updateStatistics = useCallback(() => {
        const stats = presenceManager.getPresenceStatistics()
        setStatistics(stats)
    }, [])

    // Subscribe to presence events
    useEffect(() => {
        if (isConnected) {
            const subscriptionId = subscribe('user', (event) => {
                handlePresenceEvent(event)
                updateStatistics()
            })

            subscriptionRef.current = subscriptionId

            return () => {
                if (subscriptionRef.current) {
                    unsubscribe(subscriptionRef.current)
                }
            }
        }
    }, [isConnected, subscribe, unsubscribe, handlePresenceEvent, updateStatistics])

    // Initialize if userId and sessionId are provided
    useEffect(() => {
        if (userId && sessionId && autoConnect) {
            initialize(userId, sessionId)
        }
    }, [userId, sessionId, autoConnect, initialize])

    // Update statistics periodically
    useEffect(() => {
        const interval = setInterval(updateStatistics, 5000) // Every 5 seconds
        return () => clearInterval(interval)
    }, [updateStatistics])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                unsubscribe(subscriptionRef.current)
            }
        }
    }, [unsubscribe])

    return {
        currentUser,
        onlineUsers,
        awayUsers,
        busyUsers,
        offlineUsers,
        typingUsers,
        isOnline,
        statistics,
        setStatus,
        setActivity,
        setLocation,
        setTyping,
        setAway,
        setBusy,
        setOnline,
        setOffline,
        getUserPresence,
        isUserOnline,
        isUserTyping,
        initialize,
        destroy,
    }
}

export default usePresence
