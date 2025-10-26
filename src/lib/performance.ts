interface PerformanceMetric {
    name: string
    value: number
    delta: number
    id: string
    navigationType: string
}

interface CoreWebVitals {
    lcp: number | null
    fid: number | null
    cls: number | null
    fcp: number | null
    ttfb: number | null
}

interface PerformanceBudget {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
}

interface PerformanceReport {
    timestamp: number
    url: string
    userAgent: string
    connection: string
    deviceMemory?: number
    hardwareConcurrency?: number
    coreWebVitals: CoreWebVitals
    performanceMetrics: {
        pageLoadTime: number
        domContentLoaded: number
        windowLoad: number
        firstPaint: number
        firstContentfulPaint: number
        largestContentfulPaint: number
        firstInputDelay: number
        cumulativeLayoutShift: number
    }
    resourceMetrics: {
        totalResources: number
        totalSize: number
        loadTime: number
        failedResources: number
    }
    networkMetrics: {
        effectiveType: string
        downlink: number
        rtt: number
        saveData: boolean
    }
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private metrics: PerformanceMetric[] = []
    private budget: PerformanceBudget
    private debug: boolean = false

    constructor(budget?: PerformanceBudget, debug: boolean = false) {
        this.budget = budget || {
            lcp: 2500, // Largest Contentful Paint
            fid: 100,  // First Input Delay
            cls: 0.1,  // Cumulative Layout Shift
            fcp: 1800, // First Contentful Paint
            ttfb: 800, // Time to First Byte
        }
        this.debug = debug
    }

    static getInstance(budget?: PerformanceBudget, debug: boolean = false): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor(budget, debug)
        }
        return PerformanceMonitor.instance
    }

    private log(message: string, data?: any): void {
        if (this.debug) {
            console.log(`[PerformanceMonitor] ${message}`, data)
        }
    }

    // Initialize performance monitoring
    init(): void {
        if (typeof window === 'undefined') return

        this.log('Initializing performance monitoring')

        // Track Core Web Vitals
        this.trackCoreWebVitals()

        // Track performance metrics
        this.trackPerformanceMetrics()

        // Track resource metrics
        this.trackResourceMetrics()

        // Track network metrics
        this.trackNetworkMetrics()

        // Track user interactions
        this.trackUserInteractions()
    }

    // Track Core Web Vitals
    private trackCoreWebVitals(): void {
        if (typeof window === 'undefined') return

        // Track Largest Contentful Paint (LCP)
        this.trackLCP()

        // Track First Input Delay (FID)
        this.trackFID()

        // Track Cumulative Layout Shift (CLS)
        this.trackCLS()

        // Track First Contentful Paint (FCP)
        this.trackFCP()

        // Track Time to First Byte (TTFB)
        this.trackTTFB()
    }

    private trackLCP(): void {
        if (typeof window === 'undefined') return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const lastEntry = entries[entries.length - 1] as any

                if (lastEntry) {
                    const lcp = lastEntry.startTime
                    this.log('LCP tracked', { lcp })
                    this.reportMetric('lcp', lcp)
                }
            })

            observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (error) {
            this.log('Error tracking LCP', error)
        }
    }

    private trackFID(): void {
        if (typeof window === 'undefined') return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    const fid = entry.processingStart - entry.startTime
                    this.log('FID tracked', { fid })
                    this.reportMetric('fid', fid)
                })
            })

            observer.observe({ entryTypes: ['first-input'] })
        } catch (error) {
            this.log('Error tracking FID', error)
        }
    }

    private trackCLS(): void {
        if (typeof window === 'undefined') return

        try {
            let clsValue = 0
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value
                    }
                })
                this.log('CLS tracked', { cls: clsValue })
                this.reportMetric('cls', clsValue)
            })

            observer.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
            this.log('Error tracking CLS', error)
        }
    }

    private trackFCP(): void {
        if (typeof window === 'undefined') return

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry: any) => {
                    const fcp = entry.startTime
                    this.log('FCP tracked', { fcp })
                    this.reportMetric('fcp', fcp)
                })
            })

            observer.observe({ entryTypes: ['paint'] })
        } catch (error) {
            this.log('Error tracking FCP', error)
        }
    }

    private trackTTFB(): void {
        if (typeof window === 'undefined') return

        try {
            const navigation = performance.getEntriesByType('navigation')[0] as any
            if (navigation) {
                const ttfb = navigation.responseStart - navigation.requestStart
                this.log('TTFB tracked', { ttfb })
                this.reportMetric('ttfb', ttfb)
            }
        } catch (error) {
            this.log('Error tracking TTFB', error)
        }
    }

    // Track general performance metrics
    private trackPerformanceMetrics(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0] as any
            if (navigation) {
                const metrics = {
                    pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                    windowLoad: navigation.loadEventEnd - navigation.navigationStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint(),
                    largestContentfulPaint: this.getLargestContentfulPaint(),
                    firstInputDelay: this.getFirstInputDelay(),
                    cumulativeLayoutShift: this.getCumulativeLayoutShift(),
                }

                this.log('Performance metrics tracked', metrics)
                this.reportPerformanceMetrics(metrics)
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

    private getLargestContentfulPaint(): number {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
        return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1]?.startTime || 0 : 0
    }

    private getFirstInputDelay(): number {
        const fidEntries = performance.getEntriesByType('first-input')
        return fidEntries.length > 0 ? (fidEntries[0] as any).processingStart - fidEntries[0].startTime : 0
    }

    private getCumulativeLayoutShift(): number {
        const clsEntries = performance.getEntriesByType('layout-shift')
        return clsEntries.reduce((sum, entry: any) => sum + entry.value, 0)
    }

    // Track resource metrics
    private trackResourceMetrics(): void {
        if (typeof window === 'undefined') return

        window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource')
            const totalSize = resources.reduce((sum, resource: any) => sum + resource.transferSize, 0)
            const failedResources = resources.filter((resource: any) => resource.transferSize === 0).length

            const resourceMetrics = {
                totalResources: resources.length,
                totalSize,
                loadTime: performance.now(),
                failedResources,
            }

            this.log('Resource metrics tracked', resourceMetrics)
            this.reportResourceMetrics(resourceMetrics)
        })
    }

    // Track network metrics
    private trackNetworkMetrics(): void {
        if (typeof window === 'undefined') return

        const connection = (navigator as any).connection
        if (connection) {
            const networkMetrics = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
            }

            this.log('Network metrics tracked', networkMetrics)
            this.reportNetworkMetrics(networkMetrics)
        }
    }

    // Track user interactions
    private trackUserInteractions(): void {
        if (typeof window === 'undefined') return

        let interactionCount = 0
        let lastInteractionTime = 0

        const trackInteraction = (event: Event) => {
            interactionCount++
            lastInteractionTime = Date.now()

            this.log('User interaction tracked', {
                type: event.type,
                target: (event.target as HTMLElement)?.tagName,
                interactionCount,
                lastInteractionTime,
            })
        }

        // Track various user interactions
        const events = ['click', 'scroll', 'keydown', 'mousemove', 'touchstart']
        events.forEach(eventType => {
            document.addEventListener(eventType, trackInteraction, { passive: true })
        })
    }

    // Report metrics
    private reportMetric(name: string, value: number): void {
        const metric: PerformanceMetric = {
            name,
            value,
            delta: value,
            id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            navigationType: 'navigate',
        }

        this.metrics.push(metric)
        this.log('Metric reported', metric)

        // Check against budget
        this.checkBudget(name, value)

        // Send to analytics
        this.sendToAnalytics(name, value)
    }

    private reportPerformanceMetrics(metrics: any): void {
        this.log('Performance metrics reported', metrics)
        this.sendToAnalytics('performance_metrics', metrics)
    }

    private reportResourceMetrics(metrics: any): void {
        this.log('Resource metrics reported', metrics)
        this.sendToAnalytics('resource_metrics', metrics)
    }

    private reportNetworkMetrics(metrics: any): void {
        this.log('Network metrics reported', metrics)
        this.sendToAnalytics('network_metrics', metrics)
    }

    // Check performance budget
    private checkBudget(name: string, value: number): void {
        const budgetValue = this.budget[name as keyof PerformanceBudget]
        if (budgetValue && value > budgetValue) {
            this.log(`Performance budget exceeded for ${name}`, {
                value,
                budget: budgetValue,
                exceeded: value - budgetValue,
            })
            this.sendToAnalytics('performance_budget_exceeded', {
                metric: name,
                value,
                budget: budgetValue,
                exceeded: value - budgetValue,
            })
        }
    }

    // Send to analytics
    private sendToAnalytics(event: string, data: any): void {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', event, data)
        }
    }

    // Get performance report
    getPerformanceReport(): PerformanceReport {
        const navigation = performance.getEntriesByType('navigation')[0] as any
        const connection = (navigator as any).connection

        return {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: connection?.effectiveType || 'unknown',
            deviceMemory: (navigator as any).deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            coreWebVitals: {
                lcp: this.getLargestContentfulPaint(),
                fid: this.getFirstInputDelay(),
                cls: this.getCumulativeLayoutShift(),
                fcp: this.getFirstContentfulPaint(),
                ttfb: navigation ? navigation.responseStart - navigation.requestStart : null,
            },
            performanceMetrics: {
                pageLoadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
                windowLoad: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                largestContentfulPaint: this.getLargestContentfulPaint(),
                firstInputDelay: this.getFirstInputDelay(),
                cumulativeLayoutShift: this.getCumulativeLayoutShift(),
            },
            resourceMetrics: {
                totalResources: performance.getEntriesByType('resource').length,
                totalSize: performance.getEntriesByType('resource').reduce((sum, resource: any) => sum + resource.transferSize, 0),
                loadTime: performance.now(),
                failedResources: performance.getEntriesByType('resource').filter((resource: any) => resource.transferSize === 0).length,
            },
            networkMetrics: {
                effectiveType: connection?.effectiveType || 'unknown',
                downlink: connection?.downlink || 0,
                rtt: connection?.rtt || 0,
                saveData: connection?.saveData || false,
            },
        }
    }

    // Get all metrics
    getMetrics(): PerformanceMetric[] {
        return this.metrics
    }

    // Clear metrics
    clearMetrics(): void {
        this.metrics = []
        this.log('Metrics cleared')
    }

    // Set performance budget
    setBudget(budget: PerformanceBudget): void {
        this.budget = budget
        this.log('Performance budget updated', budget)
    }

    // Get performance budget
    getBudget(): PerformanceBudget {
        return this.budget
    }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Export types
export type {
    PerformanceMetric,
    CoreWebVitals,
    PerformanceBudget,
    PerformanceReport,
}
