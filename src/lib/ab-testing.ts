interface ABTest {
    id: string
    name: string
    description: string
    status: 'draft' | 'running' | 'paused' | 'completed'
    startDate: string
    endDate?: string
    variants: ABTestVariant[]
    trafficAllocation: number
    targetAudience?: TargetAudience
    successMetrics: string[]
    createdAt: string
    updatedAt: string
}

interface ABTestVariant {
    id: string
    name: string
    description: string
    weight: number
    config: Record<string, any>
    isControl: boolean
}

interface TargetAudience {
    segments: string[]
    countries?: string[]
    devices?: string[]
    browsers?: string[]
    trafficPercentage?: number
}

interface ABTestResult {
    testId: string
    variantId: string
    userId: string
    sessionId: string
    timestamp: number
    events: ABTestEvent[]
}

interface ABTestEvent {
    event: string
    properties: Record<string, any>
    timestamp: number
}

interface ABTestMetrics {
    testId: string
    variantId: string
    participants: number
    conversions: number
    conversionRate: number
    revenue: number
    averageOrderValue: number
    bounceRate: number
    timeOnPage: number
    clickThroughRate: number
}

interface FeatureFlag {
    id: string
    name: string
    description: string
    enabled: boolean
    variants: FeatureFlagVariant[]
    targetAudience?: TargetAudience
    createdAt: string
    updatedAt: string
}

interface FeatureFlagVariant {
    id: string
    name: string
    weight: number
    config: Record<string, any>
    isDefault: boolean
}

export class ABTestingManager {
    private static instance: ABTestingManager
    private tests: Map<string, ABTest> = new Map()
    private featureFlags: Map<string, FeatureFlag> = new Map()
    private results: Map<string, ABTestResult[]> = new Map()
    private debug: boolean = false

    constructor(debug: boolean = false) {
        this.debug = debug
    }

    static getInstance(debug: boolean = false): ABTestingManager {
        if (!ABTestingManager.instance) {
            ABTestingManager.instance = new ABTestingManager(debug)
        }
        return ABTestingManager.instance
    }

    private log(message: string, data?: any): void {
        if (this.debug) {
            console.log(`[ABTestingManager] ${message}`, data)
        }
    }

    // AB Test Management
    createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): string {
        const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const newTest: ABTest = {
            ...test,
            id,
            createdAt: now,
            updatedAt: now,
        }

        this.tests.set(id, newTest)
        this.log('AB test created', newTest)
        return id
    }

    getTest(testId: string): ABTest | undefined {
        return this.tests.get(testId)
    }

    updateTest(testId: string, updates: Partial<ABTest>): boolean {
        const test = this.tests.get(testId)
        if (!test) return false

        const updatedTest = {
            ...test,
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        this.tests.set(testId, updatedTest)
        this.log('AB test updated', updatedTest)
        return true
    }

    deleteTest(testId: string): boolean {
        const deleted = this.tests.delete(testId)
        if (deleted) {
            this.results.delete(testId)
            this.log('AB test deleted', { testId })
        }
        return deleted
    }

    getAllTests(): ABTest[] {
        return Array.from(this.tests.values())
    }

    // Test Assignment
    assignUserToTest(userId: string, testId: string): string | null {
        const test = this.tests.get(testId)
        if (!test || test.status !== 'running') return null

        // Check if user is already assigned
        const existingResult = this.results.get(testId)?.find(r => r.userId === userId)
        if (existingResult) return existingResult.variantId

        // Check target audience
        if (!this.isUserInTargetAudience(userId, test.targetAudience)) return null

        // Assign variant based on weight
        const variant = this.selectVariant(test.variants)
        if (!variant) return null

        // Record assignment
        const result: ABTestResult = {
            testId,
            variantId: variant.id,
            userId,
            sessionId: this.generateSessionId(),
            timestamp: Date.now(),
            events: [],
        }

        if (!this.results.has(testId)) {
            this.results.set(testId, [])
        }
        this.results.get(testId)!.push(result)

        this.log('User assigned to test', { userId, testId, variantId: variant.id })
        return variant.id
    }

    private selectVariant(variants: ABTestVariant[]): ABTestVariant | null {
        if (variants.length === 0) return null

        const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0)
        const random = Math.random() * totalWeight

        let currentWeight = 0
        for (const variant of variants) {
            currentWeight += variant.weight
            if (random <= currentWeight) {
                return variant
            }
        }

        return variants[variants.length - 1]
    }

    private isUserInTargetAudience(userId: string, targetAudience?: TargetAudience): boolean {
        if (!targetAudience) return true

        // Check segments
        if (targetAudience.segments && targetAudience.segments.length > 0) {
            // This would check user segments in a real implementation
            // For now, we'll assume all users are in the target audience
        }

        // Check countries
        if (targetAudience.countries && targetAudience.countries.length > 0) {
            // This would check user's country in a real implementation
        }

        // Check devices
        if (targetAudience.devices && targetAudience.devices.length > 0) {
            const userAgent = navigator.userAgent
            const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
            const isDesktop = !isMobile

            if (targetAudience.devices.includes('mobile') && !isMobile) return false
            if (targetAudience.devices.includes('desktop') && !isDesktop) return false
        }

        // Check browsers
        if (targetAudience.browsers && targetAudience.browsers.length > 0) {
            const userAgent = navigator.userAgent
            const isChrome = /Chrome/.test(userAgent)
            const isFirefox = /Firefox/.test(userAgent)
            const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)

            if (targetAudience.browsers.includes('chrome') && !isChrome) return false
            if (targetAudience.browsers.includes('firefox') && !isFirefox) return false
            if (targetAudience.browsers.includes('safari') && !isSafari) return false
        }

        return true
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Event Tracking
    trackEvent(testId: string, userId: string, event: string, properties: Record<string, any> = {}): void {
        const testResults = this.results.get(testId)
        if (!testResults) return

        const userResult = testResults.find(r => r.userId === userId)
        if (!userResult) return

        const testEvent: ABTestEvent = {
            event,
            properties,
            timestamp: Date.now(),
        }

        userResult.events.push(testEvent)
        this.log('AB test event tracked', { testId, userId, event, properties })
    }

    // Feature Flag Management
    createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): string {
        const id = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const newFlag: FeatureFlag = {
            ...flag,
            id,
            createdAt: now,
            updatedAt: now,
        }

        this.featureFlags.set(id, newFlag)
        this.log('Feature flag created', newFlag)
        return id
    }

    getFeatureFlag(flagId: string): FeatureFlag | undefined {
        return this.featureFlags.get(flagId)
    }

    updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): boolean {
        const flag = this.featureFlags.get(flagId)
        if (!flag) return false

        const updatedFlag = {
            ...flag,
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        this.featureFlags.set(flagId, updatedFlag)
        this.log('Feature flag updated', updatedFlag)
        return true
    }

    deleteFeatureFlag(flagId: string): boolean {
        const deleted = this.featureFlags.delete(flagId)
        if (deleted) {
            this.log('Feature flag deleted', { flagId })
        }
        return deleted
    }

    getAllFeatureFlags(): FeatureFlag[] {
        return Array.from(this.featureFlags.values())
    }

    // Feature Flag Evaluation
    evaluateFeatureFlag(flagId: string, userId: string): any {
        const flag = this.featureFlags.get(flagId)
        if (!flag || !flag.enabled) return null

        // Check target audience
        if (!this.isUserInTargetAudience(userId, flag.targetAudience)) return null

        // Select variant
        const variant = this.selectVariant(flag.variants)
        if (!variant) return null

        this.log('Feature flag evaluated', { flagId, userId, variantId: variant.id })
        return variant.config
    }

    // Analytics and Reporting
    getTestMetrics(testId: string): ABTestMetrics[] {
        const test = this.tests.get(testId)
        const testResults = this.results.get(testId)
        if (!test || !testResults) return []

        const metrics: ABTestMetrics[] = []

        for (const variant of test.variants) {
            const variantResults = testResults.filter(r => r.variantId === variant.id)
            const participants = variantResults.length
            const conversions = variantResults.filter(r =>
                r.events.some(e => e.event === 'conversion')
            ).length
            const conversionRate = participants > 0 ? conversions / participants : 0

            // Calculate revenue and AOV
            const revenueEvents = variantResults.flatMap(r =>
                r.events.filter(e => e.event === 'purchase')
            )
            const revenue = revenueEvents.reduce((sum, event) =>
                sum + (event.properties.value || 0), 0
            )
            const averageOrderValue = conversions > 0 ? revenue / conversions : 0

            // Calculate bounce rate
            const bounceEvents = variantResults.filter(r =>
                r.events.some(e => e.event === 'bounce')
            ).length
            const bounceRate = participants > 0 ? bounceEvents / participants : 0

            // Calculate time on page
            const timeOnPageEvents = variantResults.flatMap(r =>
                r.events.filter(e => e.event === 'time_on_page')
            )
            const timeOnPage = timeOnPageEvents.length > 0
                ? timeOnPageEvents.reduce((sum, event) => sum + (event.properties.duration || 0), 0) / timeOnPageEvents.length
                : 0

            // Calculate click-through rate
            const clickEvents = variantResults.flatMap(r =>
                r.events.filter(e => e.event === 'click')
            ).length
            const clickThroughRate = participants > 0 ? clickEvents / participants : 0

            metrics.push({
                testId,
                variantId: variant.id,
                participants,
                conversions,
                conversionRate,
                revenue,
                averageOrderValue,
                bounceRate,
                timeOnPage,
                clickThroughRate,
            })
        }

        return metrics
    }

    // Test Results
    getTestResults(testId: string): ABTestResult[] {
        return this.results.get(testId) || []
    }

    // Clear all data
    clearAll(): void {
        this.tests.clear()
        this.featureFlags.clear()
        this.results.clear()
        this.log('All AB testing data cleared')
    }

    // Export data
    exportData(): any {
        return {
            tests: Array.from(this.tests.entries()),
            featureFlags: Array.from(this.featureFlags.entries()),
            results: Array.from(this.results.entries()),
        }
    }

    // Import data
    importData(data: any): void {
        if (data.tests) {
            this.tests = new Map(data.tests)
        }
        if (data.featureFlags) {
            this.featureFlags = new Map(data.featureFlags)
        }
        if (data.results) {
            this.results = new Map(data.results)
        }
        this.log('AB testing data imported')
    }
}

// Export singleton instance
export const abTestingManager = ABTestingManager.getInstance()

// Export types
export type {
    ABTest,
    ABTestVariant,
    TargetAudience,
    ABTestResult,
    ABTestEvent,
    ABTestMetrics,
    FeatureFlag,
    FeatureFlagVariant,
}
