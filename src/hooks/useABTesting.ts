import { useState, useEffect, useCallback } from 'react'
import { abTestingManager, ABTest, FeatureFlag } from '../lib/ab-testing'

interface UseABTestingOptions {
    userId?: string
    debug?: boolean
}

export const useABTesting = (options: UseABTestingOptions = {}) => {
    const { userId, debug = false } = options
    const [tests, setTests] = useState<ABTest[]>([])
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
    const [assignments, setAssignments] = useState<Map<string, string>>(new Map())
    const [flagValues, setFlagValues] = useState<Map<string, any>>(new Map())

    // Load tests and feature flags
    useEffect(() => {
        const loadData = () => {
            const allTests = abTestingManager.getAllTests()
            const allFlags = abTestingManager.getAllFeatureFlags()

            setTests(allTests)
            setFeatureFlags(allFlags)
        }

        loadData()
    }, [])

    // Get user's test assignment
    const getTestAssignment = useCallback((testId: string): string | null => {
        if (!userId) return null

        const assignment = abTestingManager.assignUserToTest(userId, testId)
        if (assignment) {
            setAssignments(prev => new Map(prev.set(testId, assignment)))
        }
        return assignment
    }, [userId])

    // Get user's feature flag value
    const getFeatureFlagValue = useCallback((flagId: string): any => {
        if (!userId) return null

        const value = abTestingManager.evaluateFeatureFlag(flagId, userId)
        if (value !== null) {
            setFlagValues(prev => new Map(prev.set(flagId, value)))
        }
        return value
    }, [userId])

    // Track event for AB test
    const trackTestEvent = useCallback((testId: string, event: string, properties: Record<string, any> = {}) => {
        if (!userId) return

        abTestingManager.trackEvent(testId, userId, event, properties)
    }, [userId])

    // Create AB test
    const createTest = useCallback((test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>) => {
        const testId = abTestingManager.createTest(test)
        const allTests = abTestingManager.getAllTests()
        setTests(allTests)
        return testId
    }, [])

    // Update AB test
    const updateTest = useCallback((testId: string, updates: Partial<ABTest>) => {
        const success = abTestingManager.updateTest(testId, updates)
        if (success) {
            const allTests = abTestingManager.getAllTests()
            setTests(allTests)
        }
        return success
    }, [])

    // Delete AB test
    const deleteTest = useCallback((testId: string) => {
        const success = abTestingManager.deleteTest(testId)
        if (success) {
            const allTests = abTestingManager.getAllTests()
            setTests(allTests)
        }
        return success
    }, [])

    // Create feature flag
    const createFeatureFlag = useCallback((flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => {
        const flagId = abTestingManager.createFeatureFlag(flag)
        const allFlags = abTestingManager.getAllFeatureFlags()
        setFeatureFlags(allFlags)
        return flagId
    }, [])

    // Update feature flag
    const updateFeatureFlag = useCallback((flagId: string, updates: Partial<FeatureFlag>) => {
        const success = abTestingManager.updateFeatureFlag(flagId, updates)
        if (success) {
            const allFlags = abTestingManager.getAllFeatureFlags()
            setFeatureFlags(allFlags)
        }
        return success
    }, [])

    // Delete feature flag
    const deleteFeatureFlag = useCallback((flagId: string) => {
        const success = abTestingManager.deleteFeatureFlag(flagId)
        if (success) {
            const allFlags = abTestingManager.getAllFeatureFlags()
            setFeatureFlags(allFlags)
        }
        return success
    }, [])

    // Get test metrics
    const getTestMetrics = useCallback((testId: string) => {
        return abTestingManager.getTestMetrics(testId)
    }, [])

    // Get test results
    const getTestResults = useCallback((testId: string) => {
        return abTestingManager.getTestResults(testId)
    }, [])

    // Check if user is in test
    const isUserInTest = useCallback((testId: string): boolean => {
        if (!userId) return false
        return assignments.has(testId)
    }, [userId, assignments])

    // Get test variant
    const getTestVariant = useCallback((testId: string): string | null => {
        return assignments.get(testId) || null
    }, [assignments])

    // Check if feature flag is enabled
    const isFeatureEnabled = useCallback((flagId: string): boolean => {
        return flagValues.has(flagId)
    }, [flagValues])

    // Get feature flag value
    const getFlagValue = useCallback((flagId: string): any => {
        return flagValues.get(flagId) || null
    }, [flagValues])

    // Track conversion
    const trackConversion = useCallback((testId: string, value?: number, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'conversion', {
            value,
            ...properties,
        })
    }, [trackTestEvent])

    // Track click
    const trackClick = useCallback((testId: string, element: string, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'click', {
            element,
            ...properties,
        })
    }, [trackTestEvent])

    // Track view
    const trackView = useCallback((testId: string, page: string, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'view', {
            page,
            ...properties,
        })
    }, [trackTestEvent])

    // Track purchase
    const trackPurchase = useCallback((testId: string, value: number, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'purchase', {
            value,
            ...properties,
        })
    }, [trackTestEvent])

    // Track bounce
    const trackBounce = useCallback((testId: string, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'bounce', properties)
    }, [trackTestEvent])

    // Track time on page
    const trackTimeOnPage = useCallback((testId: string, duration: number, properties?: Record<string, any>) => {
        trackTestEvent(testId, 'time_on_page', {
            duration,
            ...properties,
        })
    }, [trackTestEvent])

    return {
        // Test management
        tests,
        createTest,
        updateTest,
        deleteTest,
        getTestAssignment,
        isUserInTest,
        getTestVariant,

        // Feature flag management
        featureFlags,
        createFeatureFlag,
        updateFeatureFlag,
        deleteFeatureFlag,
        getFeatureFlagValue,
        isFeatureEnabled,
        getFlagValue,

        // Event tracking
        trackTestEvent,
        trackConversion,
        trackClick,
        trackView,
        trackPurchase,
        trackBounce,
        trackTimeOnPage,

        // Analytics
        getTestMetrics,
        getTestResults,
    }
}

export default useABTesting
