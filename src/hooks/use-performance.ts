import { useState, useEffect, useCallback, useRef } from 'react'

export interface PerformanceMetrics {
    // Core Web Vitals
    lcp: number | null
    fid: number | null
    cls: number | null
    fcp: number | null
    ttfb: number | null

    // Additional metrics
    pageLoadTime: number
    domContentLoaded: number
    windowLoad: number
    memoryUsage: number | null
    connectionSpeed: string | null

    // Custom metrics
    renderTime: number
    componentMountTime: number
    apiResponseTime: number
    bundleSize: number | null
}

export interface PerformanceThresholds {
    lcp: { good: number; needsImprovement: number }
    fid: { good: number; needsImprovement: number }
    cls: { good: number; needsImprovement: number }
    fcp: { good: number; needsImprovement: number }
    ttfb: { good: number; needsImprovement: number }
}

export interface PerformanceAlert {
    id: string
    metric: string
    value: number
    threshold: number
    severity: 'warning' | 'error'
    message: string
    timestamp: string
}

export interface UsePerformanceOptions {
    enableCoreWebVitals?: boolean
    enableCustomMetrics?: boolean
    enableAlerts?: boolean
    enableReporting?: boolean
    reportingEndpoint?: string
    thresholds?: Partial<PerformanceThresholds>
    onAlert?: (alert: PerformanceAlert) => void
    onMetricUpdate?: (metrics: PerformanceMetrics) => void
}

export interface UsePerformanceReturn {
    metrics: PerformanceMetrics
    alerts: PerformanceAlert[]
    isMonitoring: boolean
    startMonitoring: () => void
    stopMonitoring: () => void
    measureRenderTime: (componentName: string) => () => void
    measureApiCall: (endpoint: string) => () => void
    getMetricStatus: (metric: keyof PerformanceMetrics, value: number | null) => string
    clearAlerts: () => void
    exportMetrics: () => string
}

export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
    const {
        enableCoreWebVitals = true,
        enableCustomMetrics = true,
        enableAlerts = true,
        enableReporting = false,
        reportingEndpoint = '/api/performance',
        thresholds = {},
        onAlert,
        onMetricUpdate,
    } = options

    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        pageLoadTime: 0,
        domContentLoaded: 0,
        windowLoad: 0,
        memoryUsage: null,
        connectionSpeed: null,
        renderTime: 0,
        componentMountTime: 0,
        apiResponseTime: 0,
        bundleSize: null,
    })

    const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
    const [isMonitoring, setIsMonitoring] = useState(false)
    const observersRef = useRef<PerformanceObserver[]>([])
    const startTimeRef = useRef<number>(0)

    // Default thresholds
    const defaultThresholds: PerformanceThresholds = {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1800, needsImprovement: 3000 },
        ttfb: { good: 800, needsImprovement: 1800 },
    }

    const finalThresholds = { ...defaultThresholds, ...thresholds }

    // Measure Core Web Vitals
    const measureCoreWebVitals = useCallback(() => {
        if (!enableCoreWebVitals || !('PerformanceObserver' in window)) return

        // LCP - Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            updateMetrics({ lcp: lastEntry.startTime })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        observersRef.current.push(lcpObserver)

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
                updateMetrics({ fid: entry.processingStart - entry.startTime })
            })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        observersRef.current.push(fidObserver)

        // CLS - Cumulative Layout Shift
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
                if (!(entry as any).hadRecentInput) {
                    clsValue += (entry as any).value
                    updateMetrics({ cls: clsValue })
                }
            })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        observersRef.current.push(clsObserver)

        // FCP - First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    updateMetrics({ fcp: entry.startTime })
                }
            })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        observersRef.current.push(fcpObserver)
    }, [enableCoreWebVitals])

    // Measure additional metrics
    const measureAdditionalMetrics = useCallback(() => {
        // Page load time
        const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        updateMetrics({ pageLoadTime })

        // DOM content loaded
        const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        updateMetrics({ domContentLoaded })

        // Window load
        const windowLoad = performance.timing.loadEventEnd - performance.timing.navigationStart
        updateMetrics({ windowLoad })

        // TTFB
        const ttfb = performance.timing.responseStart - performance.timing.navigationStart
        updateMetrics({ ttfb })

        // Memory usage (if available)
        if ('memory' in performance) {
            const memory = (performance as any).memory
            updateMetrics({
                memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
            })
        }

        // Connection speed
        if ('connection' in navigator) {
            const connection = (navigator as any).connection
            updateMetrics({ connectionSpeed: connection.effectiveType })
        }
    }, [])

    // Check thresholds and create alerts
    const checkThresholds = useCallback((newMetrics: PerformanceMetrics) => {
        if (!enableAlerts) return

        const newAlerts: PerformanceAlert[] = []

        // Check LCP
        if (newMetrics.lcp !== null) {
            if (newMetrics.lcp > finalThresholds.lcp.needsImprovement) {
                newAlerts.push({
                    id: `lcp-${Date.now()}`,
                    metric: 'LCP',
                    value: newMetrics.lcp,
                    threshold: finalThresholds.lcp.needsImprovement,
                    severity: 'error',
                    message: `LCP is ${newMetrics.lcp.toFixed(0)}ms, which is above the threshold of ${finalThresholds.lcp.needsImprovement}ms`,
                    timestamp: new Date().toISOString(),
                })
            } else if (newMetrics.lcp > finalThresholds.lcp.good) {
                newAlerts.push({
                    id: `lcp-${Date.now()}`,
                    metric: 'LCP',
                    value: newMetrics.lcp,
                    threshold: finalThresholds.lcp.good,
                    severity: 'warning',
                    message: `LCP is ${newMetrics.lcp.toFixed(0)}ms, which needs improvement`,
                    timestamp: new Date().toISOString(),
                })
            }
        }

        // Check FID
        if (newMetrics.fid !== null) {
            if (newMetrics.fid > finalThresholds.fid.needsImprovement) {
                newAlerts.push({
                    id: `fid-${Date.now()}`,
                    metric: 'FID',
                    value: newMetrics.fid,
                    threshold: finalThresholds.fid.needsImprovement,
                    severity: 'error',
                    message: `FID is ${newMetrics.fid.toFixed(0)}ms, which is above the threshold of ${finalThresholds.fid.needsImprovement}ms`,
                    timestamp: new Date().toISOString(),
                })
            } else if (newMetrics.fid > finalThresholds.fid.good) {
                newAlerts.push({
                    id: `fid-${Date.now()}`,
                    metric: 'FID',
                    value: newMetrics.fid,
                    threshold: finalThresholds.fid.good,
                    severity: 'warning',
                    message: `FID is ${newMetrics.fid.toFixed(0)}ms, which needs improvement`,
                    timestamp: new Date().toISOString(),
                })
            }
        }

        // Check CLS
        if (newMetrics.cls !== null) {
            if (newMetrics.cls > finalThresholds.cls.needsImprovement) {
                newAlerts.push({
                    id: `cls-${Date.now()}`,
                    metric: 'CLS',
                    value: newMetrics.cls,
                    threshold: finalThresholds.cls.needsImprovement,
                    severity: 'error',
                    message: `CLS is ${newMetrics.cls.toFixed(3)}, which is above the threshold of ${finalThresholds.cls.needsImprovement}`,
                    timestamp: new Date().toISOString(),
                })
            } else if (newMetrics.cls > finalThresholds.cls.good) {
                newAlerts.push({
                    id: `cls-${Date.now()}`,
                    metric: 'CLS',
                    value: newMetrics.cls,
                    threshold: finalThresholds.cls.good,
                    severity: 'warning',
                    message: `CLS is ${newMetrics.cls.toFixed(3)}, which needs improvement`,
                    timestamp: new Date().toISOString(),
                })
            }
        }

        // Add new alerts
        if (newAlerts.length > 0) {
            setAlerts(prev => [...prev, ...newAlerts])
            newAlerts.forEach(alert => onAlert?.(alert))
        }
    }, [enableAlerts, finalThresholds, onAlert])

    // Report metrics to server
    const reportMetrics = useCallback(async (metricsToReport: PerformanceMetrics) => {
        if (!enableReporting || !reportingEndpoint) return

        try {
            await fetch(reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metrics: metricsToReport,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                }),
            })
        } catch (error) {
            console.error('Failed to report performance metrics:', error)
        }
    }, [enableReporting, reportingEndpoint])

    // Update metrics
    const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
        setMetrics(prev => {
            const updated = { ...prev, ...newMetrics }
            checkThresholds(updated)
            onMetricUpdate?.(updated)
            reportMetrics(updated)
            return updated
        })
    }, [checkThresholds, onMetricUpdate, reportMetrics])

    // Start monitoring
    const startMonitoring = useCallback(() => {
        if (isMonitoring) return

        setIsMonitoring(true)
        startTimeRef.current = performance.now()

        if (enableCoreWebVitals) {
            measureCoreWebVitals()
        }

        if (enableCustomMetrics) {
            measureAdditionalMetrics()
        }
    }, [isMonitoring, enableCoreWebVitals, enableCustomMetrics, measureCoreWebVitals, measureAdditionalMetrics])

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false)

        // Disconnect all observers
        observersRef.current.forEach(observer => observer.disconnect())
        observersRef.current = []
    }, [])

    // Measure render time
    const measureRenderTime = useCallback((componentName: string) => {
        const startTime = performance.now()

        return () => {
            const endTime = performance.now()
            const renderTime = endTime - startTime

            updateMetrics({ renderTime: renderTime })

            console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
        }
    }, [updateMetrics])

    // Measure API call
    const measureApiCall = useCallback((endpoint: string) => {
        const startTime = performance.now()

        return () => {
            const endTime = performance.now()
            const responseTime = endTime - startTime

            updateMetrics({ apiResponseTime: responseTime })

            console.log(`API call to ${endpoint}: ${responseTime.toFixed(2)}ms`)
        }
    }, [updateMetrics])

    // Get metric status
    const getMetricStatus = useCallback((metric: keyof PerformanceMetrics, value: number | null) => {
        if (value === null) return 'unknown'

        const threshold = finalThresholds[metric as keyof PerformanceThresholds]
        if (!threshold) return 'unknown'

        if (value <= threshold.good) return 'good'
        if (value <= threshold.needsImprovement) return 'needs-improvement'
        return 'poor'
    }, [finalThresholds])

    // Clear alerts
    const clearAlerts = useCallback(() => {
        setAlerts([])
    }, [])

    // Export metrics
    const exportMetrics = useCallback(() => {
        return JSON.stringify({
            metrics,
            alerts,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        }, null, 2)
    }, [metrics, alerts])

    // Initialize monitoring on mount
    useEffect(() => {
        startMonitoring()

        return () => {
            stopMonitoring()
        }
    }, [startMonitoring, stopMonitoring])

    return {
        metrics,
        alerts,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        measureRenderTime,
        measureApiCall,
        getMetricStatus,
        clearAlerts,
        exportMetrics,
    }
}

export default usePerformance
