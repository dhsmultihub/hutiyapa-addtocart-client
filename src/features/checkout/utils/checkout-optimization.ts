import { CheckoutData } from './checkout-flow'

export interface ABTest {
    id: string
    name: string
    description: string
    status: 'draft' | 'running' | 'paused' | 'completed'
    startDate: string
    endDate?: string
    variants: ABTestVariant[]
    metrics: ABTestMetrics
    results: ABTestResults
}

export interface ABTestVariant {
    id: string
    name: string
    description: string
    weight: number
    isControl: boolean
    configuration: CheckoutConfiguration
    traffic: number
    conversions: number
    conversionRate: number
}

export interface CheckoutConfiguration {
    layout: 'single-page' | 'multi-step' | 'sidebar'
    steps: CheckoutStepConfig[]
    design: CheckoutDesignConfig
    features: CheckoutFeatureConfig
    validation: CheckoutValidationConfig
}

export interface CheckoutStepConfig {
    id: string
    title: string
    description: string
    isVisible: boolean
    isRequired: boolean
    order: number
    fields: CheckoutFieldConfig[]
}

export interface CheckoutFieldConfig {
    id: string
    type: 'text' | 'email' | 'tel' | 'select' | 'checkbox' | 'radio'
    label: string
    placeholder?: string
    isRequired: boolean
    isVisible: boolean
    validation: FieldValidationConfig
    options?: CheckoutFieldOption[]
}

export interface CheckoutFieldOption {
    value: string
    label: string
    isDefault?: boolean
}

export interface FieldValidationConfig {
    rules: ValidationRule[]
    errorMessage: string
    successMessage?: string
}

export interface ValidationRule {
    type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern'
    value?: any
    message: string
}

export interface CheckoutDesignConfig {
    theme: 'light' | 'dark' | 'auto'
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    borderRadius: number
    spacing: number
    animations: boolean
    progressIndicator: boolean
    trustSignals: boolean
}

export interface CheckoutFeatureConfig {
    autoSave: boolean
    guestCheckout: boolean
    socialLogin: boolean
    addressAutocomplete: boolean
    paymentMethods: string[]
    shippingOptions: string[]
    couponCode: boolean
    giftCard: boolean
    expressCheckout: boolean
}

export interface CheckoutValidationConfig {
    realTimeValidation: boolean
    showErrorsInline: boolean
    preventSubmissionOnError: boolean
    customValidationRules: ValidationRule[]
}

export interface ABTestMetrics {
    primaryMetric: string
    secondaryMetrics: string[]
    minimumSampleSize: number
    confidenceLevel: number
    power: number
}

export interface ABTestResults {
    isSignificant: boolean
    confidenceInterval: [number, number]
    pValue: number
    winner?: string
    improvement: number
    recommendation: string
}

export interface OptimizationSuggestion {
    id: string
    title: string
    description: string
    category: 'layout' | 'design' | 'features' | 'validation' | 'performance'
    priority: 'high' | 'medium' | 'low'
    estimatedImpact: number
    effort: 'low' | 'medium' | 'high'
    implementation: string[]
    metrics: string[]
}

export interface CheckoutOptimization {
    suggestions: OptimizationSuggestion[]
    tests: ABTest[]
    performance: OptimizationPerformance
    insights: OptimizationInsight[]
}

export interface OptimizationPerformance {
    currentConversionRate: number
    targetConversionRate: number
    improvement: number
    bottlenecks: string[]
    opportunities: string[]
}

export interface OptimizationInsight {
    id: string
    title: string
    description: string
    confidence: number
    source: 'analytics' | 'user_feedback' | 'heatmaps' | 'session_recordings'
    actionable: boolean
    impact: 'high' | 'medium' | 'low'
}

export class CheckoutOptimizationEngine {
    private tests: Map<string, ABTest> = new Map()
    private suggestions: OptimizationSuggestion[] = []
    private performance: OptimizationPerformance
    private insights: OptimizationInsight[] = []

    constructor() {
        this.performance = this.initializePerformance()
        this.generateInitialSuggestions()
        this.generateInitialInsights()
    }

    /**
     * Create A/B test
     */
    createABTest(testData: Omit<ABTest, 'id' | 'metrics' | 'results'>): ABTest {
        const test: ABTest = {
            ...testData,
            id: this.generateTestId(),
            metrics: this.getDefaultMetrics(),
            results: this.getDefaultResults(),
        }

        this.tests.set(test.id, test)
        return test
    }

    /**
     * Start A/B test
     */
    startABTest(testId: string): boolean {
        const test = this.tests.get(testId)
        if (!test || test.status !== 'draft') return false

        test.status = 'running'
        test.startDate = new Date().toISOString()
        this.tests.set(testId, test)
        return true
    }

    /**
     * Stop A/B test
     */
    stopABTest(testId: string): boolean {
        const test = this.tests.get(testId)
        if (!test || test.status !== 'running') return false

        test.status = 'completed'
        test.endDate = new Date().toISOString()
        test.results = this.calculateTestResults(test)
        this.tests.set(testId, test)
        return true
    }

    /**
     * Get test variant for user
     */
    getTestVariant(testId: string, userId: string): ABTestVariant | null {
        const test = this.tests.get(testId)
        if (!test || test.status !== 'running') return null

        // Simple hash-based assignment
        const hash = this.hashString(userId + testId)
        const random = hash % 100

        let cumulativeWeight = 0
        for (const variant of test.variants) {
            cumulativeWeight += variant.weight
            if (random < cumulativeWeight) {
                return variant
            }
        }

        return test.variants[0] // Fallback to first variant
    }

    /**
     * Track test conversion
     */
    trackTestConversion(testId: string, variantId: string, userId: string, value: number = 1): void {
        const test = this.tests.get(testId)
        if (!test) return

        const variant = test.variants.find(v => v.id === variantId)
        if (!variant) return

        variant.conversions += value
        variant.conversionRate = variant.traffic > 0 ? (variant.conversions / variant.traffic) * 100 : 0

        this.tests.set(testId, test)
    }

    /**
     * Track test traffic
     */
    trackTestTraffic(testId: string, variantId: string): void {
        const test = this.tests.get(testId)
        if (!test) return

        const variant = test.variants.find(v => v.id === variantId)
        if (!variant) return

        variant.traffic++
        variant.conversionRate = variant.traffic > 0 ? (variant.conversions / variant.traffic) * 100 : 0

        this.tests.set(testId, test)
    }

    /**
     * Get optimization suggestions
     */
    getOptimizationSuggestions(): OptimizationSuggestion[] {
        return this.suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    }

    /**
     * Get active A/B tests
     */
    getActiveTests(): ABTest[] {
        return Array.from(this.tests.values()).filter(test => test.status === 'running')
    }

    /**
     * Get test results
     */
    getTestResults(testId: string): ABTestResults | null {
        const test = this.tests.get(testId)
        return test ? test.results : null
    }

    /**
     * Get optimization performance
     */
    getOptimizationPerformance(): OptimizationPerformance {
        return this.performance
    }

    /**
     * Get optimization insights
     */
    getOptimizationInsights(): OptimizationInsight[] {
        return this.insights.sort((a, b) => b.confidence - a.confidence)
    }

    /**
     * Generate optimization report
     */
    generateOptimizationReport(): {
        summary: string
        recommendations: string[]
        nextSteps: string[]
        metrics: { [key: string]: number }
    } {
        const activeTests = this.getActiveTests()
        const suggestions = this.getOptimizationSuggestions()
        const insights = this.getOptimizationInsights()

        const summary = `Found ${suggestions.length} optimization opportunities and ${activeTests.length} active tests`

        const recommendations = suggestions
            .filter(s => s.priority === 'high')
            .map(s => s.title)

        const nextSteps = [
            'Implement high-priority suggestions',
            'Monitor A/B test results',
            'Analyze user feedback',
            'Update optimization strategy',
        ]

        const metrics = {
            totalSuggestions: suggestions.length,
            activeTests: activeTests.length,
            highPrioritySuggestions: suggestions.filter(s => s.priority === 'high').length,
            averageImpact: suggestions.reduce((sum, s) => sum + s.estimatedImpact, 0) / suggestions.length,
        }

        return {
            summary,
            recommendations,
            nextSteps,
            metrics,
        }
    }

    /**
     * Calculate test results
     */
    private calculateTestResults(test: ABTest): ABTestResults {
        const controlVariant = test.variants.find(v => v.isControl)
        const treatmentVariants = test.variants.filter(v => !v.isControl)

        if (!controlVariant || treatmentVariants.length === 0) {
            return this.getDefaultResults()
        }

        let winner: string | undefined
        let improvement = 0
        let isSignificant = false

        // Find the best performing variant
        const bestVariant = treatmentVariants.reduce((best, current) =>
            current.conversionRate > best.conversionRate ? current : best
        )

        if (bestVariant.conversionRate > controlVariant.conversionRate) {
            winner = bestVariant.id
            improvement = bestVariant.conversionRate - controlVariant.conversionRate

            // Simple significance test (would use proper statistical test in production)
            isSignificant = improvement > 5 && bestVariant.traffic > 100
        }

        const confidenceInterval: [number, number] = [
            Math.max(0, bestVariant.conversionRate - 2),
            Math.min(100, bestVariant.conversionRate + 2)
        ]

        const pValue = this.calculatePValue(controlVariant, bestVariant)
        const recommendation = this.generateRecommendation(winner, improvement, isSignificant)

        return {
            isSignificant,
            confidenceInterval,
            pValue,
            winner,
            improvement,
            recommendation,
        }
    }

    /**
     * Calculate P-value (simplified)
     */
    private calculatePValue(control: ABTestVariant, treatment: ABTestVariant): number {
        // Simplified P-value calculation
        // In production, use proper statistical tests like chi-square or t-test
        const difference = Math.abs(treatment.conversionRate - control.conversionRate)
        const standardError = Math.sqrt(
            (control.conversionRate * (100 - control.conversionRate) / control.traffic) +
            (treatment.conversionRate * (100 - treatment.conversionRate) / treatment.traffic)
        )

        const zScore = difference / standardError
        return Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI)
    }

    /**
     * Generate recommendation
     */
    private generateRecommendation(winner: string | undefined, improvement: number, isSignificant: boolean): string {
        if (!winner) {
            return 'No significant difference found. Consider testing different variations.'
        }

        if (isSignificant) {
            return `Implement variant ${winner}. Expected improvement: ${improvement.toFixed(2)}%`
        } else {
            return `Variant ${winner} shows promise but needs more data. Continue testing.`
        }
    }

    /**
     * Initialize performance metrics
     */
    private initializePerformance(): OptimizationPerformance {
        return {
            currentConversionRate: 0,
            targetConversionRate: 0,
            improvement: 0,
            bottlenecks: [],
            opportunities: [],
        }
    }

    /**
     * Generate initial suggestions
     */
    private generateInitialSuggestions(): void {
        this.suggestions = [
            {
                id: 'suggestion_1',
                title: 'Simplify checkout form',
                description: 'Reduce form fields and improve user experience',
                category: 'layout',
                priority: 'high',
                estimatedImpact: 15,
                effort: 'medium',
                implementation: [
                    'Remove unnecessary fields',
                    'Add auto-complete for addresses',
                    'Implement single-page checkout',
                ],
                metrics: ['conversion_rate', 'form_completion_time'],
            },
            {
                id: 'suggestion_2',
                title: 'Add trust signals',
                description: 'Display security badges and customer reviews',
                category: 'design',
                priority: 'high',
                estimatedImpact: 12,
                effort: 'low',
                implementation: [
                    'Add SSL certificate badge',
                    'Display security logos',
                    'Show customer testimonials',
                ],
                metrics: ['conversion_rate', 'user_confidence'],
            },
            {
                id: 'suggestion_3',
                title: 'Implement guest checkout',
                description: 'Allow users to checkout without creating an account',
                category: 'features',
                priority: 'medium',
                estimatedImpact: 8,
                effort: 'medium',
                implementation: [
                    'Add guest checkout option',
                    'Simplify registration process',
                    'Offer account creation after purchase',
                ],
                metrics: ['conversion_rate', 'cart_abandonment'],
            },
            {
                id: 'suggestion_4',
                title: 'Optimize payment flow',
                description: 'Improve payment method selection and processing',
                category: 'features',
                priority: 'medium',
                estimatedImpact: 10,
                effort: 'high',
                implementation: [
                    'Add more payment options',
                    'Implement one-click payments',
                    'Improve payment validation',
                ],
                metrics: ['payment_success_rate', 'conversion_rate'],
            },
            {
                id: 'suggestion_5',
                title: 'Add progress indicator',
                description: 'Show users their progress through checkout',
                category: 'design',
                priority: 'low',
                estimatedImpact: 5,
                effort: 'low',
                implementation: [
                    'Add step-by-step progress bar',
                    'Show completion percentage',
                    'Add estimated time remaining',
                ],
                metrics: ['user_engagement', 'completion_rate'],
            },
        ]
    }

    /**
     * Generate initial insights
     */
    private generateInitialInsights(): void {
        this.insights = [
            {
                id: 'insight_1',
                title: 'High abandonment at payment step',
                description: 'Users are leaving during payment method selection',
                confidence: 85,
                source: 'analytics',
                actionable: true,
                impact: 'high',
            },
            {
                id: 'insight_2',
                title: 'Mobile users prefer single-page checkout',
                description: 'Mobile conversion rate is 40% higher with single-page layout',
                confidence: 78,
                source: 'analytics',
                actionable: true,
                impact: 'medium',
            },
            {
                id: 'insight_3',
                title: 'Address validation causes friction',
                description: 'Users struggle with address format validation',
                confidence: 92,
                source: 'user_feedback',
                actionable: true,
                impact: 'medium',
            },
            {
                id: 'insight_4',
                title: 'Payment security concerns',
                description: 'Users express concerns about payment security',
                confidence: 67,
                source: 'user_feedback',
                actionable: true,
                impact: 'high',
            },
        ]
    }

    /**
     * Get default metrics
     */
    private getDefaultMetrics(): ABTestMetrics {
        return {
            primaryMetric: 'conversion_rate',
            secondaryMetrics: ['cart_abandonment', 'payment_success', 'user_satisfaction'],
            minimumSampleSize: 1000,
            confidenceLevel: 95,
            power: 80,
        }
    }

    /**
     * Get default results
     */
    private getDefaultResults(): ABTestResults {
        return {
            isSignificant: false,
            confidenceInterval: [0, 0],
            pValue: 1,
            winner: undefined,
            improvement: 0,
            recommendation: 'Test needs more data',
        }
    }

    /**
     * Generate test ID
     */
    private generateTestId(): string {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Hash string for consistent variant assignment
     */
    private hashString(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
    }
}

export const checkoutOptimization = new CheckoutOptimizationEngine()
export default checkoutOptimization
