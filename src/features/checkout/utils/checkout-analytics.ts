import { CheckoutData } from './checkout-flow'

export interface CheckoutAnalyticsEvent {
    event: string
    step: string
    userId?: string
    sessionId: string
    timestamp: number
    data: any
}

export interface CheckoutMetrics {
    totalCheckouts: number
    completedCheckouts: number
    abandonedCheckouts: number
    conversionRate: number
    averageCheckoutTime: number
    averageOrderValue: number
    stepCompletionRates: { [step: string]: number }
    abandonmentPoints: { [step: string]: number }
    paymentMethodDistribution: { [method: string]: number }
    deviceDistribution: { [device: string]: number }
    browserDistribution: { [browser: string]: number }
}

export interface CheckoutFunnel {
    step: string
    entered: number
    completed: number
    abandoned: number
    conversionRate: number
    averageTime: number
}

export interface CheckoutAbandonment {
    step: string
    count: number
    percentage: number
    commonReasons: string[]
    recoveryRate: number
}

export interface CheckoutOptimization {
    step: string
    currentConversionRate: number
    potentialImprovements: string[]
    estimatedImpact: number
    priority: 'high' | 'medium' | 'low'
}

export interface CheckoutAnalytics {
    metrics: CheckoutMetrics
    funnel: CheckoutFunnel[]
    abandonment: CheckoutAbandonment[]
    optimization: CheckoutOptimization[]
    trends: {
        daily: Array<{ date: string; checkouts: number; conversions: number }>
        weekly: Array<{ week: string; checkouts: number; conversions: number }>
        monthly: Array<{ month: string; checkouts: number; conversions: number }>
    }
}

export class CheckoutAnalyticsEngine {
    private events: CheckoutAnalyticsEvent[] = []
    private sessionId: string
    private startTime: number

    constructor() {
        this.sessionId = this.generateSessionId()
        this.startTime = Date.now()
    }

    /**
     * Track checkout started
     */
    trackCheckoutStarted(userId?: string, data?: any): void {
        this.addEvent('checkout_started', 'cart', userId, {
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track step entered
     */
    trackStepEntered(step: string, userId?: string, data?: any): void {
        this.addEvent('step_entered', step, userId, {
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track step completed
     */
    trackStepCompleted(step: string, userId?: string, data?: any): void {
        this.addEvent('step_completed', step, userId, {
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track step abandoned
     */
    trackStepAbandoned(step: string, reason: string, userId?: string, data?: any): void {
        this.addEvent('step_abandoned', step, userId, {
            reason,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track payment method selected
     */
    trackPaymentMethodSelected(method: string, userId?: string, data?: any): void {
        this.addEvent('payment_method_selected', 'payment', userId, {
            method,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track payment initiated
     */
    trackPaymentInitiated(paymentId: string, amount: number, userId?: string, data?: any): void {
        this.addEvent('payment_initiated', 'payment', userId, {
            paymentId,
            amount,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track payment completed
     */
    trackPaymentCompleted(paymentId: string, amount: number, userId?: string, data?: any): void {
        this.addEvent('payment_completed', 'payment', userId, {
            paymentId,
            amount,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track payment failed
     */
    trackPaymentFailed(paymentId: string, error: string, userId?: string, data?: any): void {
        this.addEvent('payment_failed', 'payment', userId, {
            paymentId,
            error,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track checkout completed
     */
    trackCheckoutCompleted(orderId: string, orderValue: number, userId?: string, data?: any): void {
        this.addEvent('checkout_completed', 'review', userId, {
            orderId,
            orderValue,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track checkout abandoned
     */
    trackCheckoutAbandoned(step: string, reason: string, userId?: string, data?: any): void {
        this.addEvent('checkout_abandoned', step, userId, {
            reason,
            ...data,
            timestamp: Date.now(),
        })
    }

    /**
     * Track form field interaction
     */
    trackFormFieldInteraction(field: string, action: string, step: string, userId?: string): void {
        this.addEvent('form_field_interaction', step, userId, {
            field,
            action,
            timestamp: Date.now(),
        })
    }

    /**
     * Track validation error
     */
    trackValidationError(field: string, error: string, step: string, userId?: string): void {
        this.addEvent('validation_error', step, userId, {
            field,
            error,
            timestamp: Date.now(),
        })
    }

    /**
     * Track shipping method selected
     */
    trackShippingMethodSelected(method: string, cost: number, userId?: string): void {
        this.addEvent('shipping_method_selected', 'shipping', userId, {
            method,
            cost,
            timestamp: Date.now(),
        })
    }

    /**
     * Track coupon applied
     */
    trackCouponApplied(code: string, discount: number, userId?: string): void {
        this.addEvent('coupon_applied', 'cart', userId, {
            code,
            discount,
            timestamp: Date.now(),
        })
    }

    /**
     * Track gift card applied
     */
    trackGiftCardApplied(code: string, amount: number, userId?: string): void {
        this.addEvent('gift_card_applied', 'cart', userId, {
            code,
            amount,
            timestamp: Date.now(),
        })
    }

    /**
     * Get checkout analytics
     */
    getCheckoutAnalytics(): CheckoutAnalytics {
        const metrics = this.calculateMetrics()
        const funnel = this.calculateFunnel()
        const abandonment = this.calculateAbandonment()
        const optimization = this.calculateOptimization()
        const trends = this.calculateTrends()

        return {
            metrics,
            funnel,
            abandonment,
            optimization,
            trends,
        }
    }

    /**
     * Get checkout metrics
     */
    getCheckoutMetrics(): CheckoutMetrics {
        return this.calculateMetrics()
    }

    /**
     * Get checkout funnel
     */
    getCheckoutFunnel(): CheckoutFunnel[] {
        return this.calculateFunnel()
    }

    /**
     * Get abandonment analysis
     */
    getAbandonmentAnalysis(): CheckoutAbandonment[] {
        return this.calculateAbandonment()
    }

    /**
     * Get optimization suggestions
     */
    getOptimizationSuggestions(): CheckoutOptimization[] {
        return this.calculateOptimization()
    }

    /**
     * Get conversion rate by step
     */
    getConversionRateByStep(): { [step: string]: number } {
        const stepStats = new Map<string, { entered: number; completed: number }>()

        this.events.forEach(event => {
            if (event.event === 'step_entered') {
                const stats = stepStats.get(event.step) || { entered: 0, completed: 0 }
                stats.entered++
                stepStats.set(event.step, stats)
            } else if (event.event === 'step_completed') {
                const stats = stepStats.get(event.step) || { entered: 0, completed: 0 }
                stats.completed++
                stepStats.set(event.step, stats)
            }
        })

        const conversionRates: { [step: string]: number } = {}
        stepStats.forEach((stats, step) => {
            conversionRates[step] = stats.entered > 0 ? (stats.completed / stats.entered) * 100 : 0
        })

        return conversionRates
    }

    /**
     * Get average time by step
     */
    getAverageTimeByStep(): { [step: string]: number } {
        const stepTimes = new Map<string, number[]>()
        const stepStartTimes = new Map<string, number>()

        this.events.forEach(event => {
            if (event.event === 'step_entered') {
                stepStartTimes.set(event.step, event.timestamp)
            } else if (event.event === 'step_completed') {
                const startTime = stepStartTimes.get(event.step)
                if (startTime) {
                    const duration = event.timestamp - startTime
                    const times = stepTimes.get(event.step) || []
                    times.push(duration)
                    stepTimes.set(event.step, times)
                    stepStartTimes.delete(event.step)
                }
            }
        })

        const averageTimes: { [step: string]: number } = {}
        stepTimes.forEach((times, step) => {
            averageTimes[step] = times.reduce((sum, time) => sum + time, 0) / times.length
        })

        return averageTimes
    }

    /**
     * Get device and browser distribution
     */
    getDeviceDistribution(): { devices: { [device: string]: number }; browsers: { [browser: string]: number } } {
        const deviceCounts: { [device: string]: number } = {}
        const browserCounts: { [browser: string]: number } = {}

        this.events.forEach(event => {
            if (event.data.device) {
                deviceCounts[event.data.device] = (deviceCounts[event.data.device] || 0) + 1
            }
            if (event.data.browser) {
                browserCounts[event.data.browser] = (browserCounts[event.data.browser] || 0) + 1
            }
        })

        return {
            devices: deviceCounts,
            browsers: browserCounts,
        }
    }

    /**
     * Export analytics data
     */
    exportAnalytics(): string {
        const data = {
            events: this.events,
            analytics: this.getCheckoutAnalytics(),
            exportedAt: new Date().toISOString(),
        }

        return JSON.stringify(data, null, 2)
    }

    /**
     * Add event to analytics
     */
    private addEvent(event: string, step: string, userId?: string, data?: any): void {
        const analyticsEvent: CheckoutAnalyticsEvent = {
            event,
            step,
            userId,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            data: data || {},
        }

        this.events.push(analyticsEvent)
        this.sendToAnalyticsService(analyticsEvent)
    }

    /**
     * Calculate metrics
     */
    private calculateMetrics(): CheckoutMetrics {
        const totalCheckouts = this.events.filter(e => e.event === 'checkout_started').length
        const completedCheckouts = this.events.filter(e => e.event === 'checkout_completed').length
        const abandonedCheckouts = this.events.filter(e => e.event === 'checkout_abandoned').length
        const conversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0

        const checkoutTimes = this.events
            .filter(e => e.event === 'checkout_completed')
            .map(e => e.data.duration || 0)
        const averageCheckoutTime = checkoutTimes.length > 0
            ? checkoutTimes.reduce((sum, time) => sum + time, 0) / checkoutTimes.length
            : 0

        const orderValues = this.events
            .filter(e => e.event === 'checkout_completed')
            .map(e => e.data.orderValue || 0)
        const averageOrderValue = orderValues.length > 0
            ? orderValues.reduce((sum, value) => sum + value, 0) / orderValues.length
            : 0

        const stepCompletionRates = this.getConversionRateByStep()
        const abandonmentPoints = this.calculateAbandonmentPoints()
        const paymentMethodDistribution = this.calculatePaymentMethodDistribution()
        const deviceDistribution = this.getDeviceDistribution()

        return {
            totalCheckouts,
            completedCheckouts,
            abandonedCheckouts,
            conversionRate,
            averageCheckoutTime,
            averageOrderValue,
            stepCompletionRates,
            abandonmentPoints,
            paymentMethodDistribution,
            deviceDistribution: deviceDistribution.devices,
            browserDistribution: deviceDistribution.browsers,
        }
    }

    /**
     * Calculate funnel
     */
    private calculateFunnel(): CheckoutFunnel[] {
        const steps = ['cart', 'shipping', 'billing', 'payment', 'review']
        const funnel: CheckoutFunnel[] = []

        steps.forEach(step => {
            const entered = this.events.filter(e => e.event === 'step_entered' && e.step === step).length
            const completed = this.events.filter(e => e.event === 'step_completed' && e.step === step).length
            const abandoned = this.events.filter(e => e.event === 'step_abandoned' && e.step === step).length
            const conversionRate = entered > 0 ? (completed / entered) * 100 : 0

            const stepTimes = this.events
                .filter(e => e.event === 'step_completed' && e.step === step)
                .map(e => e.data.duration || 0)
            const averageTime = stepTimes.length > 0
                ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
                : 0

            funnel.push({
                step,
                entered,
                completed,
                abandoned,
                conversionRate,
                averageTime,
            })
        })

        return funnel
    }

    /**
     * Calculate abandonment
     */
    private calculateAbandonment(): CheckoutAbandonment[] {
        const steps = ['cart', 'shipping', 'billing', 'payment', 'review']
        const abandonment: CheckoutAbandonment[] = []

        steps.forEach(step => {
            const abandoned = this.events.filter(e => e.event === 'step_abandoned' && e.step === step).length
            const total = this.events.filter(e => e.step === step).length
            const percentage = total > 0 ? (abandoned / total) * 100 : 0

            const reasons = this.events
                .filter(e => e.event === 'step_abandoned' && e.step === step)
                .map(e => e.data.reason)
                .filter(Boolean)

            const commonReasons = this.getMostCommonReasons(reasons)
            const recoveryRate = this.calculateRecoveryRate(step)

            abandonment.push({
                step,
                count: abandoned,
                percentage,
                commonReasons,
                recoveryRate,
            })
        })

        return abandonment
    }

    /**
     * Calculate optimization suggestions
     */
    private calculateOptimization(): CheckoutOptimization[] {
        const steps = ['cart', 'shipping', 'billing', 'payment', 'review']
        const optimization: CheckoutOptimization[] = []

        steps.forEach(step => {
            const conversionRate = this.getConversionRateByStep()[step] || 0
            const potentialImprovements = this.getPotentialImprovements(step)
            const estimatedImpact = this.estimateImpact(step, potentialImprovements)
            const priority = this.determinePriority(conversionRate, estimatedImpact)

            optimization.push({
                step,
                currentConversionRate: conversionRate,
                potentialImprovements,
                estimatedImpact,
                priority,
            })
        })

        return optimization
    }

    /**
     * Calculate trends
     */
    private calculateTrends(): CheckoutAnalytics['trends'] {
        const daily = this.calculateDailyTrends()
        const weekly = this.calculateWeeklyTrends()
        const monthly = this.calculateMonthlyTrends()

        return {
            daily,
            weekly,
            monthly,
        }
    }

    /**
     * Calculate abandonment points
     */
    private calculateAbandonmentPoints(): { [step: string]: number } {
        const abandonmentPoints: { [step: string]: number } = {}

        this.events.forEach(event => {
            if (event.event === 'step_abandoned') {
                abandonmentPoints[event.step] = (abandonmentPoints[event.step] || 0) + 1
            }
        })

        return abandonmentPoints
    }

    /**
     * Calculate payment method distribution
     */
    private calculatePaymentMethodDistribution(): { [method: string]: number } {
        const methodCounts: { [method: string]: number } = {}

        this.events.forEach(event => {
            if (event.event === 'payment_method_selected' && event.data.method) {
                methodCounts[event.data.method] = (methodCounts[event.data.method] || 0) + 1
            }
        })

        return methodCounts
    }

    /**
     * Get most common reasons
     */
    private getMostCommonReasons(reasons: string[]): string[] {
        const reasonCounts = new Map<string, number>()

        reasons.forEach(reason => {
            reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
        })

        return Array.from(reasonCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([reason]) => reason)
    }

    /**
     * Calculate recovery rate
     */
    private calculateRecoveryRate(step: string): number {
        const abandoned = this.events.filter(e => e.event === 'step_abandoned' && e.step === step).length
        const recovered = this.events.filter(e => e.event === 'step_entered' && e.step === step && e.data.recovered).length

        return abandoned > 0 ? (recovered / abandoned) * 100 : 0
    }

    /**
     * Get potential improvements
     */
    private getPotentialImprovements(step: string): string[] {
        const improvements: string[] = []

        switch (step) {
            case 'cart':
                improvements.push('Simplify cart review process', 'Add trust signals', 'Show security badges')
                break
            case 'shipping':
                improvements.push('Auto-fill address fields', 'Add address validation', 'Show shipping options clearly')
                break
            case 'billing':
                improvements.push('Enable same as shipping option', 'Add billing address validation')
                break
            case 'payment':
                improvements.push('Add more payment options', 'Show security indicators', 'Simplify payment form')
                break
            case 'review':
                improvements.push('Show order summary clearly', 'Add edit options', 'Show security badges')
                break
        }

        return improvements
    }

    /**
     * Estimate impact
     */
    private estimateImpact(step: string, improvements: string[]): number {
        // This would be calculated based on historical data and A/B testing results
        return Math.random() * 20 // Placeholder calculation
    }

    /**
     * Determine priority
     */
    private determinePriority(conversionRate: number, estimatedImpact: number): 'high' | 'medium' | 'low' {
        if (conversionRate < 50 && estimatedImpact > 15) return 'high'
        if (conversionRate < 70 && estimatedImpact > 10) return 'medium'
        return 'low'
    }

    /**
     * Calculate daily trends
     */
    private calculateDailyTrends(): Array<{ date: string; checkouts: number; conversions: number }> {
        const dailyData = new Map<string, { checkouts: number; conversions: number }>()

        this.events.forEach(event => {
            const date = new Date(event.timestamp).toISOString().split('T')[0]
            const data = dailyData.get(date) || { checkouts: 0, conversions: 0 }

            if (event.event === 'checkout_started') {
                data.checkouts++
            } else if (event.event === 'checkout_completed') {
                data.conversions++
            }

            dailyData.set(date, data)
        })

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    /**
     * Calculate weekly trends
     */
    private calculateWeeklyTrends(): Array<{ week: string; checkouts: number; conversions: number }> {
        const weeklyData = new Map<string, { checkouts: number; conversions: number }>()

        this.events.forEach(event => {
            const date = new Date(event.timestamp)
            const week = this.getWeekString(date)
            const data = weeklyData.get(week) || { checkouts: 0, conversions: 0 }

            if (event.event === 'checkout_started') {
                data.checkouts++
            } else if (event.event === 'checkout_completed') {
                data.conversions++
            }

            weeklyData.set(week, data)
        })

        return Array.from(weeklyData.entries())
            .map(([week, data]) => ({ week, ...data }))
            .sort((a, b) => a.week.localeCompare(b.week))
    }

    /**
     * Calculate monthly trends
     */
    private calculateMonthlyTrends(): Array<{ month: string; checkouts: number; conversions: number }> {
        const monthlyData = new Map<string, { checkouts: number; conversions: number }>()

        this.events.forEach(event => {
            const month = new Date(event.timestamp).toISOString().substring(0, 7)
            const data = monthlyData.get(month) || { checkouts: 0, conversions: 0 }

            if (event.event === 'checkout_started') {
                data.checkouts++
            } else if (event.event === 'checkout_completed') {
                data.conversions++
            }

            monthlyData.set(month, data)
        })

        return Array.from(monthlyData.entries())
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
    }

    /**
     * Get week string
     */
    private getWeekString(date: Date): string {
        const year = date.getFullYear()
        const week = this.getWeekNumber(date)
        return `${year}-W${week.toString().padStart(2, '0')}`
    }

    /**
     * Get week number
     */
    private getWeekNumber(date: Date): number {
        const firstDay = new Date(date.getFullYear(), 0, 1)
        const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000
        return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
    }

    /**
     * Send to analytics service
     */
    private sendToAnalyticsService(event: CheckoutAnalyticsEvent): void {
        try {
            // Send to Google Analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', event.event, {
                    event_category: 'Checkout',
                    event_label: event.step,
                    value: 1,
                    custom_map: {
                        step: event.step,
                        user_id: event.userId,
                        session_id: event.sessionId,
                        timestamp: event.timestamp,
                    }
                })
            }

            // Send to custom analytics endpoint
            this.sendToCustomAnalytics(event)
        } catch (error) {
            console.error('Failed to send analytics event:', error)
        }
    }

    /**
     * Send to custom analytics
     */
    private async sendToCustomAnalytics(event: CheckoutAnalyticsEvent): Promise<void> {
        try {
            // This would typically send to your analytics service
            console.log('Checkout analytics event:', event)
        } catch (error) {
            console.error('Failed to send to custom analytics:', error)
        }
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export const checkoutAnalytics = new CheckoutAnalyticsEngine()
export default checkoutAnalytics
