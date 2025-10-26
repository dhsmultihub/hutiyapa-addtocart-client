export interface PerformanceConfig {
    enableCoreWebVitals: boolean
    enableCustomMetrics: boolean
    enableAlerts: boolean
    enableReporting: boolean
    reportingEndpoint: string
    thresholds: {
        lcp: { good: number; needsImprovement: number }
        fid: { good: number; needsImprovement: number }
        cls: { good: number; needsImprovement: number }
        fcp: { good: number; needsImprovement: number }
        ttfb: { good: number; needsImprovement: number }
    }
}

export interface PerformanceData {
    metrics: Record<string, number | null>
    alerts: Array<{
        id: string
        metric: string
        value: number
        threshold: number
        severity: 'warning' | 'error'
        message: string
        timestamp: string
    }>
    timestamp: string
    url: string
    userAgent: string
}

export interface BundleAnalysis {
    totalSize: number
    gzippedSize: number
    chunks: Array<{
        name: string
        size: number
        gzippedSize: number
        modules: Array<{
            name: string
            size: number
            gzippedSize: number
        }>
    }>
    duplicates: Array<{
        name: string
        size: number
        chunks: string[]
    }>
    recommendations: Array<{
        type: 'warning' | 'suggestion'
        message: string
        impact: 'high' | 'medium' | 'low'
    }>
}

export class PerformanceUtils {
    private static readonly DEFAULT_THRESHOLDS = {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1800, needsImprovement: 3000 },
        ttfb: { good: 800, needsImprovement: 1800 },
    }

    /**
     * Get performance configuration
     */
    static getConfig(): PerformanceConfig {
        return {
            enableCoreWebVitals: true,
            enableCustomMetrics: true,
            enableAlerts: true,
            enableReporting: process.env.NODE_ENV === 'production',
            reportingEndpoint: '/api/performance',
            thresholds: this.DEFAULT_THRESHOLDS,
        }
    }

    /**
     * Measure page load performance
     */
    static measurePageLoad(): {
        pageLoadTime: number
        domContentLoaded: number
        windowLoad: number
        ttfb: number
        fcp: number | null
        lcp: number | null
        fid: number | null
        cls: number | null
    } {
        const timing = performance.timing
        // const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        return {
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            windowLoad: timing.loadEventEnd - timing.navigationStart,
            ttfb: timing.responseStart - timing.navigationStart,
            fcp: this.getFCP(),
            lcp: this.getLCP(),
            fid: this.getFID(),
            cls: this.getCLS(),
        }
    }

    /**
     * Get First Contentful Paint
     */
    static getFCP(): number | null {
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        return fcpEntry ? fcpEntry.startTime : null
    }

    /**
     * Get Largest Contentful Paint
     */
    static getLCP(): number | null {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
        const lastEntry = lcpEntries[lcpEntries.length - 1]
        return lastEntry ? lastEntry.startTime : null
    }

    /**
     * Get First Input Delay
     */
    static getFID(): number | null {
        const fidEntries = performance.getEntriesByType('first-input')
        const firstEntry = fidEntries[0]
        return firstEntry ? (firstEntry as any).processingStart - firstEntry.startTime : null
    }

    /**
     * Get Cumulative Layout Shift
     */
    static getCLS(): number | null {
        let clsValue = 0
        const clsEntries = performance.getEntriesByType('layout-shift')

        clsEntries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value
            }
        })

        return clsValue
    }

    /**
     * Measure component render time
     */
    static measureComponentRender(componentName: string, renderFunction: () => void): number {
        const startTime = performance.now()
        renderFunction()
        const endTime = performance.now()
        const renderTime = endTime - startTime

        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
        return renderTime
    }

    /**
     * Measure API call performance
     */
    static async measureApiCall<T>(
        apiCall: () => Promise<T>,
        endpoint: string
    ): Promise<{ result: T; responseTime: number }> {
        const startTime = performance.now()

        try {
            const result = await apiCall()
            const endTime = performance.now()
            const responseTime = endTime - startTime

            console.log(`API call to ${endpoint}: ${responseTime.toFixed(2)}ms`)
            return { result, responseTime }
        } catch (error) {
            const endTime = performance.now()
            const responseTime = endTime - startTime

            console.error(`API call to ${endpoint} failed after ${responseTime.toFixed(2)}ms:`, error)
            throw error
        }
    }

    /**
     * Get memory usage
     */
    static getMemoryUsage(): {
        used: number
        total: number
        limit: number
    } | null {
        if (!('memory' in performance)) return null

        const memory = (performance as any).memory
        return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
        }
    }

    /**
     * Get connection information
     */
    static getConnectionInfo(): {
        effectiveType: string
        downlink: number
        rtt: number
        saveData: boolean
    } | null {
        if (!('connection' in navigator)) return null

        const connection = (navigator as any).connection
        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
        }
    }

    /**
     * Check if performance is good
     */
    static isPerformanceGood(metrics: Record<string, number | null>): boolean {
        const thresholds = this.DEFAULT_THRESHOLDS

        // Check LCP
        if (metrics.lcp !== null && metrics.lcp !== undefined && metrics.lcp > thresholds.lcp.good) {
            return false
        }

        // Check FID
        if (metrics.fid !== null && metrics.fid !== undefined && metrics.fid > thresholds.fid.good) {
            return false
        }

        // Check CLS
        if (metrics.cls !== null && metrics.cls !== undefined && metrics.cls > thresholds.cls.good) {
            return false
        }

        // Check FCP
        if (metrics.fcp !== null && metrics.fcp !== undefined && metrics.fcp > thresholds.fcp.good) {
            return false
        }

        // Check TTFB
        if (metrics.ttfb !== null && metrics.ttfb !== undefined && metrics.ttfb > thresholds.ttfb.good) {
            return false
        }

        return true
    }

    /**
     * Get performance score
     */
    static getPerformanceScore(metrics: Record<string, number | null>): {
        score: number
        grade: 'A' | 'B' | 'C' | 'D' | 'F'
        breakdown: Record<string, { score: number; grade: string }>
    } {
        const thresholds = this.DEFAULT_THRESHOLDS
        const breakdown: Record<string, { score: number; grade: string }> = {}
        let totalScore = 0
        let metricCount = 0

        // LCP Score
        if (metrics.lcp !== null) {
            const lcpScore = this.calculateMetricScore(metrics.lcp || 0, thresholds.lcp)
            breakdown.lcp = { score: lcpScore, grade: this.getGrade(lcpScore) }
            totalScore += lcpScore
            metricCount++
        }

        // FID Score
        if (metrics.fid !== null) {
            const fidScore = this.calculateMetricScore(metrics.fid || 0, thresholds.fid)
            breakdown.fid = { score: fidScore, grade: this.getGrade(fidScore) }
            totalScore += fidScore
            metricCount++
        }

        // CLS Score
        if (metrics.cls !== null) {
            const clsScore = this.calculateMetricScore(metrics.cls || 0, thresholds.cls)
            breakdown.cls = { score: clsScore, grade: this.getGrade(clsScore) }
            totalScore += clsScore
            metricCount++
        }

        // FCP Score
        if (metrics.fcp !== null) {
            const fcpScore = this.calculateMetricScore(metrics.fcp || 0, thresholds.fcp)
            breakdown.fcp = { score: fcpScore, grade: this.getGrade(fcpScore) }
            totalScore += fcpScore
            metricCount++
        }

        // TTFB Score
        if (metrics.ttfb !== null) {
            const ttfbScore = this.calculateMetricScore(metrics.ttfb || 0, thresholds.ttfb)
            breakdown.ttfb = { score: ttfbScore, grade: this.getGrade(ttfbScore) }
            totalScore += ttfbScore
            metricCount++
        }

        const averageScore = metricCount > 0 ? totalScore / metricCount : 0

        return {
            score: Math.round(averageScore),
            grade: this.getGrade(averageScore),
            breakdown,
        }
    }

    /**
     * Calculate metric score
     */
    private static calculateMetricScore(value: number, threshold: { good: number; needsImprovement: number }): number {
        if (value <= threshold.good) {
            return 100
        } else if (value <= threshold.needsImprovement) {
            return 75
        } else {
            return 25
        }
    }

    /**
     * Get grade from score
     */
    private static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score >= 90) return 'A'
        if (score >= 80) return 'B'
        if (score >= 70) return 'C'
        if (score >= 60) return 'D'
        return 'F'
    }

    /**
     * Analyze bundle size
     */
    static analyzeBundleSize(): BundleAnalysis {
        // This would typically analyze the actual bundle
        // For now, return a mock analysis
        return {
            totalSize: 0,
            gzippedSize: 0,
            chunks: [],
            duplicates: [],
            recommendations: [
                {
                    type: 'suggestion',
                    message: 'Consider code splitting for large components',
                    impact: 'high',
                },
                {
                    type: 'warning',
                    message: 'Bundle size is above recommended threshold',
                    impact: 'medium',
                },
            ],
        }
    }

    /**
     * Get performance recommendations
     */
    static getPerformanceRecommendations(metrics: Record<string, number | null>): Array<{
        type: 'warning' | 'suggestion'
        message: string
        impact: 'high' | 'medium' | 'low'
        actionable: boolean
    }> {
        const recommendations: Array<{
            type: 'warning' | 'suggestion'
            message: string
            impact: 'high' | 'medium' | 'low'
            actionable: boolean
        }> = []

        const thresholds = this.DEFAULT_THRESHOLDS

        // LCP recommendations
        if (metrics.lcp !== null && metrics.lcp !== undefined && metrics.lcp > thresholds.lcp.good) {
            recommendations.push({
                type: 'warning',
                message: 'LCP is slow. Optimize images, use efficient loading strategies, and minimize render-blocking resources.',
                impact: 'high',
                actionable: true,
            })
        }

        // FID recommendations
        if (metrics.fid !== null && metrics.fid !== undefined && metrics.fid > thresholds.fid.good) {
            recommendations.push({
                type: 'warning',
                message: 'FID is slow. Reduce JavaScript execution time and optimize third-party scripts.',
                impact: 'high',
                actionable: true,
            })
        }

        // CLS recommendations
        if (metrics.cls !== null && metrics.cls !== undefined && metrics.cls > thresholds.cls.good) {
            recommendations.push({
                type: 'warning',
                message: 'CLS is high. Ensure images and ads have size attributes, and avoid inserting content above existing content.',
                impact: 'high',
                actionable: true,
            })
        }

        // FCP recommendations
        if (metrics.fcp !== null && metrics.fcp !== undefined && metrics.fcp > thresholds.fcp.good) {
            recommendations.push({
                type: 'suggestion',
                message: 'FCP can be improved. Optimize critical rendering path and reduce server response time.',
                impact: 'medium',
                actionable: true,
            })
        }

        // TTFB recommendations
        if (metrics.ttfb !== null && metrics.ttfb !== undefined && metrics.ttfb > thresholds.ttfb.good) {
            recommendations.push({
                type: 'suggestion',
                message: 'TTFB is slow. Optimize server response time and use CDN for static assets.',
                impact: 'medium',
                actionable: true,
            })
        }

        return recommendations
    }

    /**
     * Export performance data
     */
    static exportPerformanceData(metrics: Record<string, number | null>): string {
        const data: PerformanceData = {
            metrics,
            alerts: [],
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        }

        return JSON.stringify(data, null, 2)
    }

    /**
     * Import performance data
     */
    static importPerformanceData(data: string): PerformanceData {
        try {
            return JSON.parse(data)
        } catch (error) {
            throw new Error('Invalid performance data format')
        }
    }

    /**
     * Get performance summary
     */
    static getPerformanceSummary(metrics: Record<string, number | null>): {
        overall: 'good' | 'needs-improvement' | 'poor'
        score: number
        grade: string
        criticalIssues: number
        recommendations: number
    } {
        const score = this.getPerformanceScore(metrics)
        const isGood = this.isPerformanceGood(metrics)
        const recommendations = this.getPerformanceRecommendations(metrics)

        let overall: 'good' | 'needs-improvement' | 'poor'
        if (isGood) {
            overall = 'good'
        } else if (score.score >= 70) {
            overall = 'needs-improvement'
        } else {
            overall = 'poor'
        }

        return {
            overall,
            score: score.score,
            grade: score.grade,
            criticalIssues: recommendations.filter(r => r.type === 'warning').length,
            recommendations: recommendations.length,
        }
    }
}

export default PerformanceUtils
