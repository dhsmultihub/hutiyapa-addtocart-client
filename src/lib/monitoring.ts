interface MonitoringConfig {
    sentryDsn?: string
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    enablePerformanceMonitoring: boolean
    enableErrorTracking: boolean
    enableUserTracking: boolean
    enableAnalytics: boolean
}

interface ErrorInfo {
    message: string
    stack?: string
    component?: string
    userId?: string
    sessionId?: string
    url?: string
    userAgent?: string
    timestamp: number
}

interface PerformanceMetric {
    name: string
    value: number
    timestamp: number
    url: string
    userId?: string
}

interface UserEvent {
    event: string
    properties: Record<string, any>
    userId?: string
    sessionId?: string
    timestamp: number
}

export class MonitoringManager {
    private static instance: MonitoringManager
    private config: MonitoringConfig
    private errorQueue: ErrorInfo[] = []
    private performanceQueue: PerformanceMetric[] = []
    private eventQueue: UserEvent[] = []
    private isOnline: boolean = true

    constructor(config: MonitoringConfig) {
        this.config = config
        this.initializeMonitoring()
    }

    static getInstance(config?: MonitoringConfig): MonitoringManager {
        if (!MonitoringManager.instance) {
            MonitoringManager.instance = new MonitoringManager(config || {
                logLevel: 'info',
                enablePerformanceMonitoring: true,
                enableErrorTracking: true,
                enableUserTracking: true,
                enableAnalytics: true,
            })
        }
        return MonitoringManager.instance
    }

    private initializeMonitoring(): void {
        if (typeof window === 'undefined') return

        // Initialize Sentry if DSN is provided
        if (this.config.sentryDsn) {
            this.initializeSentry()
        }

        // Initialize performance monitoring
        if (this.config.enablePerformanceMonitoring) {
            this.initializePerformanceMonitoring()
        }

        // Initialize error tracking
        if (this.config.enableErrorTracking) {
            this.initializeErrorTracking()
        }

        // Initialize user tracking
        if (this.config.enableUserTracking) {
            this.initializeUserTracking()
        }

        // Initialize online/offline detection
        this.initializeConnectivityMonitoring()

        // Start periodic data flushing
        this.startPeriodicFlush()
    }

    private initializeSentry(): void {
        if (typeof window !== 'undefined' && this.config.sentryDsn) {
            // This would initialize Sentry in a real implementation
            console.log('Sentry initialized with DSN:', this.config.sentryDsn)
        }
    }

    private initializePerformanceMonitoring(): void {
        if (typeof window === 'undefined') return

        // Monitor Core Web Vitals
        this.monitorCoreWebVitals()

        // Monitor page load performance
        this.monitorPageLoadPerformance()

        // Monitor user interactions
        this.monitorUserInteractions()

        // Monitor resource loading
        this.monitorResourceLoading()
    }

    private monitorCoreWebVitals(): void {
        if (typeof window === 'undefined') return

        // Monitor Largest Contentful Paint (LCP)
        this.observeLCP()

        // Monitor First Input Delay (FID)
        this.observeFID()

        // Monitor Cumulative Layout Shift (CLS)
        this.observeCLS()

        // Monitor First Contentful Paint (FCP)
        this.observeFCP()
    }

    private observeLCP(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const lastEntry = entries[entries.length - 1] as any

                if (lastEntry) {
                    this.trackPerformanceMetric('lcp', lastEntry.startTime)
                }
            })

            observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (error) {
            console.error('Error observing LCP:', error)
        }
    }

    private observeFID(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    const fid = entry.processingStart - entry.startTime
                    this.trackPerformanceMetric('fid', fid)
                })
            })

            observer.observe({ entryTypes: ['first-input'] })
        } catch (error) {
            console.error('Error observing FID:', error)
        }
    }

    private observeCLS(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

        try {
            let clsValue = 0
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value
                    }
                })
                this.trackPerformanceMetric('cls', clsValue)
            })

            observer.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
            console.error('Error observing CLS:', error)
        }
    }

    private observeFCP(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    this.trackPerformanceMetric('fcp', entry.startTime)
                })
            })

            observer.observe({ entryTypes: ['paint'] })
        } catch (error) {
            console.error('Error observing FCP:', error)
        }
    }

    private monitorPageLoadPerformance(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0] as any
            if (navigation) {
                const metrics = {
                    pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint(),
                }

                Object.entries(metrics).forEach(([name, value]) => {
                    this.trackPerformanceMetric(name, value as number)
                })
            }
        })
    }

    private getFirstPaint(): number {
        const paintEntries = performance.getEntriesByType('paint')
        const fpEntry = paintEntries.find(entry => entry.name === 'first-paint')
        return fpEntry ? fpEntry.startTime : 0
    }

    private getFirstContentfulPaint(): number {
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        return fcpEntry ? fcpEntry.startTime : 0
    }

    private monitorUserInteractions(): void {
        if (typeof window === 'undefined') return

        let interactionCount = 0
        let lastInteractionTime = 0

        const trackInteraction = (event: Event) => {
            interactionCount++
            lastInteractionTime = Date.now()

            this.trackUserEvent('user_interaction', {
                type: event.type,
                target: (event.target as HTMLElement)?.tagName,
                interactionCount,
                lastInteractionTime,
            })
        }

        const events = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart']
        events.forEach(eventType => {
            document.addEventListener(eventType, trackInteraction, { passive: true })
        })
    }

    private monitorResourceLoading(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource')
            const totalSize = resources.reduce((sum, resource: any) => sum + resource.transferSize, 0)
            const failedResources = resources.filter((resource: any) => resource.transferSize === 0).length

            this.trackPerformanceMetric('totalResources', resources.length)
            this.trackPerformanceMetric('totalSize', totalSize)
            this.trackPerformanceMetric('failedResources', failedResources)
        })
    }

    private initializeErrorTracking(): void {
        if (typeof window === 'undefined') return

        // Global error handler
        window.addEventListener('error', (event) => {
            this.trackError({
                message: event.message,
                stack: event.error?.stack,
                component: 'global',
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
            })
        })

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                component: 'promise',
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
            })
        })
    }

    private initializeUserTracking(): void {
        if (typeof window === 'undefined') return

        // Track page views
        this.trackUserEvent('page_view', {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
        })

        // Track session start
        this.trackUserEvent('session_start', {
            sessionId: this.generateSessionId(),
            timestamp: Date.now(),
        })
    }

    private initializeConnectivityMonitoring(): void {
        if (typeof window === 'undefined') return

        this.isOnline = navigator.onLine

        window.addEventListener('online', () => {
            this.isOnline = true
            this.trackUserEvent('connection_restored', { timestamp: Date.now() })
            this.flushQueues()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            this.trackUserEvent('connection_lost', { timestamp: Date.now() })
        })
    }

    private startPeriodicFlush(): void {
        if (typeof window === 'undefined') return

        // Flush data every 30 seconds
        setInterval(() => {
            this.flushQueues()
        }, 30000)

        // Flush data before page unload
        window.addEventListener('beforeunload', () => {
            this.flushQueues()
        })
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Public API methods
    trackError(error: ErrorInfo): void {
        this.errorQueue.push(error)
        this.log('Error tracked', error)

        if (this.isOnline) {
            this.flushErrorQueue()
        }
    }

    trackPerformanceMetric(name: string, value: number): void {
        const metric: PerformanceMetric = {
            name,
            value,
            timestamp: Date.now(),
            url: window.location.href,
        }

        this.performanceQueue.push(metric)
        this.log('Performance metric tracked', metric)

        if (this.isOnline) {
            this.flushPerformanceQueue()
        }
    }

    trackUserEvent(event: string, properties: Record<string, any> = {}): void {
        const userEvent: UserEvent = {
            event,
            properties,
            timestamp: Date.now(),
        }

        this.eventQueue.push(userEvent)
        this.log('User event tracked', userEvent)

        if (this.isOnline) {
            this.flushEventQueue()
        }
    }

    private flushQueues(): void {
        this.flushErrorQueue()
        this.flushPerformanceQueue()
        this.flushEventQueue()
    }

    private flushErrorQueue(): void {
        if (this.errorQueue.length === 0) return

        const errors = [...this.errorQueue]
        this.errorQueue = []

        // Send errors to monitoring service
        this.sendToMonitoringService('errors', errors)
    }

    private flushPerformanceQueue(): void {
        if (this.performanceQueue.length === 0) return

        const metrics = [...this.performanceQueue]
        this.performanceQueue = []

        // Send metrics to monitoring service
        this.sendToMonitoringService('performance', metrics)
    }

    private flushEventQueue(): void {
        if (this.eventQueue.length === 0) return

        const events = [...this.eventQueue]
        this.eventQueue = []

        // Send events to monitoring service
        this.sendToMonitoringService('events', events)
    }

    private sendToMonitoringService(type: string, data: any[]): void {
        if (typeof window === 'undefined') return

        // This would send data to a monitoring service in a real implementation
        console.log(`Sending ${type} data to monitoring service:`, data)
    }

    private log(message: string, data?: any): void {
        if (this.config.logLevel === 'debug') {
            console.log(`[Monitoring] ${message}`, data)
        }
    }

    // Configuration methods
    updateConfig(newConfig: Partial<MonitoringConfig>): void {
        this.config = { ...this.config, ...newConfig }
    }

    getConfig(): MonitoringConfig {
        return { ...this.config }
    }

    // Health check
    getHealthStatus(): { status: string; metrics: any } {
        return {
            status: 'healthy',
            metrics: {
                errorQueueLength: this.errorQueue.length,
                performanceQueueLength: this.performanceQueue.length,
                eventQueueLength: this.eventQueue.length,
                isOnline: this.isOnline,
            },
        }
    }
}

// Export singleton instance
export const monitoring = MonitoringManager.getInstance()

// Export types
export type {
    MonitoringConfig,
    ErrorInfo,
    PerformanceMetric,
    UserEvent,
}
