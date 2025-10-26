import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeEventManager, RealtimeEvent, EventSubscription } from '../utils/realtime-events'

export interface UseRealtimeEventsOptions {
    eventTypes?: string[]
    userId?: string
    autoSubscribe?: boolean
    onEvent?: (event: RealtimeEvent) => void
    onError?: (error: Error) => void
}

export interface UseRealtimeEventsReturn {
    events: RealtimeEvent[]
    subscriptions: EventSubscription[]
    isSubscribed: boolean
    subscribe: (eventType: string, handler: (event: RealtimeEvent) => void) => string
    unsubscribe: (subscriptionId: string) => boolean
    unsubscribeAll: () => void
    clearEvents: () => void
    getEventHistory: (eventType?: string, limit?: number) => RealtimeEvent[]
    getEventStatistics: () => {
        totalEvents: number
        eventsByType: Record<string, number>
        eventsByHour: Record<string, number>
        recentActivity: number
    }
    filterEvents: (criteria: {
        eventType?: string
        userId?: string
        startDate?: string
        endDate?: string
        limit?: number
    }) => RealtimeEvent[]
}

export function useRealtimeEvents(
    options: UseRealtimeEventsOptions = {}
): UseRealtimeEventsReturn {
    const [events, setEvents] = useState<RealtimeEvent[]>([])
    const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([])
    const [isSubscribed, setIsSubscribed] = useState(false)

    const subscriptionsRef = useRef<Map<string, string>>(new Map())
    const {
        eventTypes = [],
        userId,
        autoSubscribe = true,
        onEvent,
        onError,
    } = options

    // Subscribe to event type
    const subscribe = useCallback((eventType: string, handler: (event: RealtimeEvent) => void): string => {
        try {
            const subscriptionId = realtimeEventManager.subscribe(eventType, handler)
            subscriptionsRef.current.set(eventType, subscriptionId)

            // Update subscriptions list
            const currentSubscriptions = realtimeEventManager.getActiveSubscriptions()
            setSubscriptions(currentSubscriptions)
            setIsSubscribed(true)

            return subscriptionId
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Subscription failed')
            onError?.(err)
            return ''
        }
    }, [onError])

    // Unsubscribe from event
    const unsubscribe = useCallback((subscriptionId: string): boolean => {
        try {
            const success = realtimeEventManager.unsubscribe(subscriptionId)

            if (success) {
                // Update subscriptions list
                const currentSubscriptions = realtimeEventManager.getActiveSubscriptions()
                setSubscriptions(currentSubscriptions)
                setIsSubscribed(currentSubscriptions.length > 0)
            }

            return success
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unsubscription failed')
            onError?.(err)
            return false
        }
    }, [onError])

    // Unsubscribe from all events
    const unsubscribeAll = useCallback(() => {
        try {
            subscriptionsRef.current.forEach((subscriptionId) => {
                realtimeEventManager.unsubscribe(subscriptionId)
            })
            subscriptionsRef.current.clear()

            setSubscriptions([])
            setIsSubscribed(false)
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unsubscribe all failed')
            onError?.(err)
        }
    }, [onError])

    // Clear events
    const clearEvents = useCallback(() => {
        setEvents([])
        realtimeEventManager.clearHistory()
    }, [])

    // Get event history
    const getEventHistory = useCallback((eventType?: string, limit?: number): RealtimeEvent[] => {
        return realtimeEventManager.getEventHistory(eventType, limit)
    }, [])

    // Get event statistics
    const getEventStatistics = useCallback(() => {
        return realtimeEventManager.getEventStatistics()
    }, [])

    // Filter events
    const filterEvents = useCallback((criteria: {
        eventType?: string
        userId?: string
        startDate?: string
        endDate?: string
        limit?: number
    }) => {
        return realtimeEventManager.filterEvents(criteria)
    }, [])

    // Handle incoming events
    const handleEvent = useCallback((event: RealtimeEvent) => {
        setEvents(prev => {
            const newEvents = [...prev, event]
            // Keep only last 100 events
            return newEvents.slice(-100)
        })

        onEvent?.(event)
    }, [onEvent])

    // Auto-subscribe to event types
    useEffect(() => {
        if (autoSubscribe && eventTypes.length > 0) {
            eventTypes.forEach(eventType => {
                if (!subscriptionsRef.current.has(eventType)) {
                    subscribe(eventType, handleEvent)
                }
            })
        }

        return () => {
            if (autoSubscribe) {
                unsubscribeAll()
            }
        }
    }, [autoSubscribe, eventTypes, subscribe, handleEvent, unsubscribeAll])

    // Load initial events
    useEffect(() => {
        const initialEvents = getEventHistory()
        setEvents(initialEvents)
    }, [getEventHistory])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubscribeAll()
        }
    }, [unsubscribeAll])

    return {
        events,
        subscriptions,
        isSubscribed,
        subscribe,
        unsubscribe,
        unsubscribeAll,
        clearEvents,
        getEventHistory,
        getEventStatistics,
        filterEvents,
    }
}

export default useRealtimeEvents
