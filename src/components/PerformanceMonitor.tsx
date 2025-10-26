import React, { useState, useEffect, useCallback } from 'react'

export interface PerformanceMetrics {
    // Core Web Vitals
    lcp: number | null // Largest Contentful Paint
    fid: number | null // First Input Delay
    cls: number | null // Cumulative Layout Shift
    fcp: number | null // First Contentful Paint
    ttfb: number | null // Time to First Byte

    // Additional metrics
    fmp: number | null // First Meaningful Paint
    si: number | null // Speed Index
    tbt: number | null // Total Blocking Time

    // Custom metrics
    pageLoadTime: number
    domContentLoaded: number
    windowLoad: number
    memoryUsage: number | null
    connectionSpeed: string | null
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

export interface PerformanceMonitorProps {
    className?: string
    showMetrics?: boolean
    enableAlerts?: boolean
    enableReporting?: boolean
    reportingEndpoint?: string
    thresholds?: Partial<PerformanceThresholds>
    onAlert?: (alert: PerformanceAlert) => void
    onMetricUpdate?: (metrics: PerformanceMetrics) => void
}

export default function PerformanceMonitor({
    className = '',
    showMetrics = false,
    enableAlerts = true,
    enableReporting = false,
    reportingEndpoint = '/api/performance',
    thresholds = {},
    onAlert,
    onMetricUpdate,
}: PerformanceMonitorProps) {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        fmp: null,
        si: null,
        tbt: null,
        pageLoadTime: 0,
        domContentLoaded: 0,
        windowLoad: 0,
        memoryUsage: null,
        connectionSpeed: null,
    })

    const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
    const [isVisible, setIsVisible] = useState(showMetrics)

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
        // LCP - Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const lastEntry = entries[entries.length - 1]
                setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
            })
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

            // FID - First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
                })
            })
            fidObserver.observe({ entryTypes: ['first-input'] })

            // CLS - Cumulative Layout Shift
            let clsValue = 0
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (!(entry as any).hadRecentInput) {
                        clsValue += (entry as any).value
                        setMetrics(prev => ({ ...prev, cls: clsValue }))
                    }
                })
            })
            clsObserver.observe({ entryTypes: ['layout-shift'] })

            // FCP - First Contentful Paint
            const fcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
                    }
                })
            })
            fcpObserver.observe({ entryTypes: ['paint'] })
        }
    }, [])

    // Measure additional metrics
    const measureAdditionalMetrics = useCallback(() => {
        // Page load time
        const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        setMetrics(prev => ({ ...prev, pageLoadTime }))

        // DOM content loaded
        const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        setMetrics(prev => ({ ...prev, domContentLoaded }))

        // Window load
        const windowLoad = performance.timing.loadEventEnd - performance.timing.navigationStart
        setMetrics(prev => ({ ...prev, windowLoad }))

        // Memory usage (if available)
        if ('memory' in performance) {
            const memory = (performance as any).memory
            setMetrics(prev => ({
                ...prev,
                memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
            }))
        }

        // Connection speed
        if ('connection' in navigator) {
            const connection = (navigator as any).connection
            setMetrics(prev => ({ ...prev, connectionSpeed: connection.effectiveType }))
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

    // Initialize monitoring
    useEffect(() => {
        measureCoreWebVitals()
        measureAdditionalMetrics()

        // Measure TTFB
        const ttfb = performance.timing.responseStart - performance.timing.navigationStart
        updateMetrics({ ttfb })

        // Measure FMP (simplified)
        const fmp = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        updateMetrics({ fmp })

    }, [measureCoreWebVitals, measureAdditionalMetrics, updateMetrics])

    // Get metric status
    const getMetricStatus = (metric: keyof PerformanceMetrics, value: number | null) => {
        if (value === null) return 'unknown'

        const threshold = finalThresholds[metric as keyof PerformanceThresholds]
        if (!threshold) return 'unknown'

        if (value <= threshold.good) return 'good'
        if (value <= threshold.needsImprovement) return 'needs-improvement'
        return 'poor'
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-green-600'
            case 'needs-improvement': return 'text-yellow-600'
            case 'poor': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good': return '✅'
            case 'needs-improvement': return '⚠️'
            case 'poor': return '❌'
            default: return '❓'
        }
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Performance Monitor</h3>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Core Web Vitals */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Core Web Vitals</h4>
                        <div className="space-y-2">
                            {metrics.lcp !== null && (
                                <div className="flex items-center justify-between text-sm">
                                    <span>LCP</span>
                                    <span className={getStatusColor(getMetricStatus('lcp', metrics.lcp))}>
                                        {getStatusIcon(getMetricStatus('lcp', metrics.lcp))} {metrics.lcp.toFixed(0)}ms
                                    </span>
                                </div>
                            )}
                            {metrics.fid !== null && (
                                <div className="flex items-center justify-between text-sm">
                                    <span>FID</span>
                                    <span className={getStatusColor(getMetricStatus('fid', metrics.fid))}>
                                        {getStatusIcon(getMetricStatus('fid', metrics.fid))} {metrics.fid.toFixed(0)}ms
                                    </span>
                                </div>
                            )}
                            {metrics.cls !== null && (
                                <div className="flex items-center justify-between text-sm">
                                    <span>CLS</span>
                                    <span className={getStatusColor(getMetricStatus('cls', metrics.cls))}>
                                        {getStatusIcon(getMetricStatus('cls', metrics.cls))} {metrics.cls.toFixed(3)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Metrics */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Metrics</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Page Load</span>
                                <span>{metrics.pageLoadTime.toFixed(0)}ms</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>DOM Ready</span>
                                <span>{metrics.domContentLoaded.toFixed(0)}ms</span>
                            </div>
                            {metrics.memoryUsage && (
                                <div className="flex items-center justify-between text-sm">
                                    <span>Memory</span>
                                    <span>{metrics.memoryUsage.toFixed(1)}MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Alerts</h4>
                            <div className="space-y-1">
                                {alerts.slice(-3).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`text-xs p-2 rounded ${alert.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                            }`}
                                    >
                                        {alert.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
