import { User } from '../redux/auth.slice'

export interface AuthAnalyticsEvent {
    id: string
    userId?: string
    sessionId: string
    event: string
    category: 'authentication' | 'authorization' | 'security' | 'user_management'
    action: string
    timestamp: string
    metadata: Record<string, any>
    ipAddress?: string
    userAgent?: string
    location?: string
}

export interface AuthMetrics {
    totalUsers: number
    activeUsers: number
    newRegistrations: number
    loginAttempts: number
    successfulLogins: number
    failedLogins: number
    passwordResets: number
    emailVerifications: number
    socialLogins: number
    securityIncidents: number
    averageSessionDuration: number
    conversionRate: number
}

export interface AuthTrends {
    daily: Array<{ date: string; registrations: number; logins: number; failures: number }>
    weekly: Array<{ week: string; registrations: number; logins: number; failures: number }>
    monthly: Array<{ month: string; registrations: number; logins: number; failures: number }>
}

export interface SecurityMetrics {
    totalThreats: number
    blockedIPs: number
    suspiciousActivities: number
    bruteForceAttempts: number
    phishingAttempts: number
    malwareDetections: number
    securityScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface UserBehavior {
    userId: string
    loginFrequency: number
    averageSessionDuration: number
    preferredLoginMethod: string
    deviceTypes: { [device: string]: number }
    locations: { [location: string]: number }
    riskScore: number
    lastActivity: string
}

export interface AuthAnalytics {
    metrics: AuthMetrics
    trends: AuthTrends
    security: SecurityMetrics
    userBehavior: UserBehavior[]
    insights: AnalyticsInsight[]
    recommendations: AnalyticsRecommendation[]
}

export interface AnalyticsInsight {
    id: string
    title: string
    description: string
    type: 'security' | 'performance' | 'user_experience' | 'conversion'
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence: number
    actionable: boolean
    impact: number
    timestamp: string
}

export interface AnalyticsRecommendation {
    id: string
    title: string
    description: string
    category: 'security' | 'performance' | 'user_experience' | 'conversion'
    priority: 'low' | 'medium' | 'high' | 'critical'
    effort: 'low' | 'medium' | 'high'
    impact: number
    implementation: string[]
    metrics: string[]
}

export class AuthAnalyticsEngine {
    private events: AuthAnalyticsEvent[] = []
    private sessionId: string
    private startTime: number

    constructor() {
        this.sessionId = this.generateSessionId()
        this.startTime = Date.now()
    }

    /**
     * Track authentication event
     */
    trackAuthEvent(
        event: string,
        category: AuthAnalyticsEvent['category'],
        action: string,
        userId?: string,
        metadata: Record<string, any> = {}
    ): void {
        const analyticsEvent: AuthAnalyticsEvent = {
            id: this.generateEventId(),
            userId,
            sessionId: this.sessionId,
            event,
            category,
            action,
            timestamp: new Date().toISOString(),
            metadata,
            ipAddress: this.getClientIP(),
            userAgent: this.getUserAgent(),
            location: this.getLocation(),
        }

        this.events.push(analyticsEvent)
        this.sendToAnalyticsService(analyticsEvent)
    }

    /**
     * Track user registration
     */
    trackUserRegistration(userId: string, method: string, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('user_registration', 'authentication', 'register', userId, {
            method,
            ...metadata,
        })
    }

    /**
     * Track user login
     */
    trackUserLogin(userId: string, method: string, success: boolean, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('user_login', 'authentication', 'login', userId, {
            method,
            success,
            ...metadata,
        })
    }

    /**
     * Track user logout
     */
    trackUserLogout(userId: string, sessionDuration: number, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('user_logout', 'authentication', 'logout', userId, {
            sessionDuration,
            ...metadata,
        })
    }

    /**
     * Track password reset
     */
    trackPasswordReset(userId: string, method: string, success: boolean, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('password_reset', 'authentication', 'reset_password', userId, {
            method,
            success,
            ...metadata,
        })
    }

    /**
     * Track email verification
     */
    trackEmailVerification(userId: string, success: boolean, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('email_verification', 'authentication', 'verify_email', userId, {
            success,
            ...metadata,
        })
    }

    /**
     * Track social login
     */
    trackSocialLogin(userId: string, provider: string, success: boolean, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('social_login', 'authentication', 'social_auth', userId, {
            provider,
            success,
            ...metadata,
        })
    }

    /**
     * Track security incident
     */
    trackSecurityIncident(
        userId: string,
        incidentType: string,
        severity: 'low' | 'medium' | 'high' | 'critical',
        metadata: Record<string, any> = {}
    ): void {
        this.trackAuthEvent('security_incident', 'security', 'incident', userId, {
            incidentType,
            severity,
            ...metadata,
        })
    }

    /**
     * Track failed login attempt
     */
    trackFailedLogin(email: string, reason: string, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('failed_login', 'security', 'login_failed', undefined, {
            email,
            reason,
            ...metadata,
        })
    }

    /**
     * Track brute force attempt
     */
    trackBruteForceAttempt(ipAddress: string, attempts: number, metadata: Record<string, any> = {}): void {
        this.trackAuthEvent('brute_force', 'security', 'brute_force', undefined, {
            ipAddress,
            attempts,
            ...metadata,
        })
    }

    /**
     * Track suspicious activity
     */
    trackSuspiciousActivity(
        userId: string,
        activityType: string,
        riskLevel: 'low' | 'medium' | 'high' | 'critical',
        metadata: Record<string, any> = {}
    ): void {
        this.trackAuthEvent('suspicious_activity', 'security', 'suspicious', userId, {
            activityType,
            riskLevel,
            ...metadata,
        })
    }

    /**
     * Get authentication analytics
     */
    getAuthAnalytics(): AuthAnalytics {
        const metrics = this.calculateAuthMetrics()
        const trends = this.calculateAuthTrends()
        const security = this.calculateSecurityMetrics()
        const userBehavior = this.calculateUserBehavior()
        const insights = this.generateInsights()
        const recommendations = this.generateRecommendations()

        return {
            metrics,
            trends,
            security,
            userBehavior,
            insights,
            recommendations,
        }
    }

    /**
     * Get authentication metrics
     */
    getAuthMetrics(): AuthMetrics {
        return this.calculateAuthMetrics()
    }

    /**
     * Get security metrics
     */
    getSecurityMetrics(): SecurityMetrics {
        return this.calculateSecurityMetrics()
    }

    /**
     * Get user behavior analytics
     */
    getUserBehavior(userId: string): UserBehavior | null {
        const userEvents = this.events.filter(e => e.userId === userId)
        if (userEvents.length === 0) return null

        const loginEvents = userEvents.filter(e => e.event === 'user_login')
        const logoutEvents = userEvents.filter(e => e.event === 'user_logout')

        const loginFrequency = loginEvents.length
        const averageSessionDuration = this.calculateAverageSessionDuration(userEvents)
        const preferredLoginMethod = this.getPreferredLoginMethod(userEvents)
        const deviceTypes = this.getDeviceDistribution(userEvents)
        const locations = this.getLocationDistribution(userEvents)
        const riskScore = this.calculateUserRiskScore(userEvents)
        const lastActivity = this.getLastActivity(userEvents)

        return {
            userId,
            loginFrequency,
            averageSessionDuration,
            preferredLoginMethod,
            deviceTypes,
            locations,
            riskScore,
            lastActivity,
        }
    }

    /**
     * Get authentication trends
     */
    getAuthTrends(): AuthTrends {
        return this.calculateAuthTrends()
    }

    /**
     * Get analytics insights
     */
    getAnalyticsInsights(): AnalyticsInsight[] {
        return this.generateInsights()
    }

    /**
     * Get analytics recommendations
     */
    getAnalyticsRecommendations(): AnalyticsRecommendation[] {
        return this.generateRecommendations()
    }

    /**
     * Export analytics data
     */
    exportAnalytics(): string {
        const data = {
            events: this.events,
            analytics: this.getAuthAnalytics(),
            exportedAt: new Date().toISOString(),
        }

        return JSON.stringify(data, null, 2)
    }

    /**
     * Calculate authentication metrics
     */
    private calculateAuthMetrics(): AuthMetrics {
        const totalUsers = new Set(this.events.map(e => e.userId).filter(Boolean)).size
        const activeUsers = new Set(
            this.events
                .filter(e => e.event === 'user_login' && e.metadata.success)
                .map(e => e.userId)
                .filter(Boolean)
        ).size

        const newRegistrations = this.events.filter(e => e.event === 'user_registration').length
        const loginAttempts = this.events.filter(e => e.event === 'user_login').length
        const successfulLogins = this.events.filter(e => e.event === 'user_login' && e.metadata.success).length
        const failedLogins = this.events.filter(e => e.event === 'user_login' && !e.metadata.success).length
        const passwordResets = this.events.filter(e => e.event === 'password_reset').length
        const emailVerifications = this.events.filter(e => e.event === 'email_verification').length
        const socialLogins = this.events.filter(e => e.event === 'social_login').length
        const securityIncidents = this.events.filter(e => e.event === 'security_incident').length

        const averageSessionDuration = this.calculateAverageSessionDuration(this.events)
        const conversionRate = newRegistrations > 0 ? (successfulLogins / newRegistrations) * 100 : 0

        return {
            totalUsers,
            activeUsers,
            newRegistrations,
            loginAttempts,
            successfulLogins,
            failedLogins,
            passwordResets,
            emailVerifications,
            socialLogins,
            securityIncidents,
            averageSessionDuration,
            conversionRate,
        }
    }

    /**
     * Calculate security metrics
     */
    private calculateSecurityMetrics(): SecurityMetrics {
        const totalThreats = this.events.filter(e => e.category === 'security').length
        const blockedIPs = new Set(
            this.events
                .filter(e => e.event === 'brute_force')
                .map(e => e.metadata.ipAddress)
                .filter(Boolean)
        ).size

        const suspiciousActivities = this.events.filter(e => e.event === 'suspicious_activity').length
        const bruteForceAttempts = this.events.filter(e => e.event === 'brute_force').length
        const phishingAttempts = this.events.filter(e => e.metadata.incidentType === 'phishing').length
        const malwareDetections = this.events.filter(e => e.metadata.incidentType === 'malware').length

        const securityScore = this.calculateSecurityScore()
        const riskLevel = this.calculateRiskLevel(securityScore)

        return {
            totalThreats,
            blockedIPs,
            suspiciousActivities,
            bruteForceAttempts,
            phishingAttempts,
            malwareDetections,
            securityScore,
            riskLevel,
        }
    }

    /**
     * Calculate authentication trends
     */
    private calculateAuthTrends(): AuthTrends {
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
     * Calculate user behavior
     */
    private calculateUserBehavior(): UserBehavior[] {
        const userIds = new Set(this.events.map(e => e.userId).filter(Boolean))
        const userBehaviors: UserBehavior[] = []

        for (const userId of userIds) {
            const behavior = this.getUserBehavior(userId)
            if (behavior) {
                userBehaviors.push(behavior)
            }
        }

        return userBehaviors
    }

    /**
     * Generate insights
     */
    private generateInsights(): AnalyticsInsight[] {
        const insights: AnalyticsInsight[] = []

        // High failed login rate
        const failedLoginRate = this.calculateFailedLoginRate()
        if (failedLoginRate > 20) {
            insights.push({
                id: 'insight_1',
                title: 'High Failed Login Rate',
                description: `Failed login rate is ${failedLoginRate.toFixed(1)}%, which is above normal`,
                type: 'security',
                severity: 'high',
                confidence: 85,
                actionable: true,
                impact: 8,
                timestamp: new Date().toISOString(),
            })
        }

        // Low conversion rate
        const conversionRate = this.calculateConversionRate()
        if (conversionRate < 30) {
            insights.push({
                id: 'insight_2',
                title: 'Low Conversion Rate',
                description: `Registration to login conversion rate is ${conversionRate.toFixed(1)}%`,
                type: 'conversion',
                severity: 'medium',
                confidence: 90,
                actionable: true,
                impact: 7,
                timestamp: new Date().toISOString(),
            })
        }

        // Security incidents
        const securityIncidents = this.events.filter(e => e.event === 'security_incident').length
        if (securityIncidents > 10) {
            insights.push({
                id: 'insight_3',
                title: 'High Security Incident Rate',
                description: `${securityIncidents} security incidents detected`,
                type: 'security',
                severity: 'critical',
                confidence: 95,
                actionable: true,
                impact: 10,
                timestamp: new Date().toISOString(),
            })
        }

        return insights
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(): AnalyticsRecommendation[] {
        const recommendations: AnalyticsRecommendation[] = []

        // Security recommendations
        const failedLoginRate = this.calculateFailedLoginRate()
        if (failedLoginRate > 15) {
            recommendations.push({
                id: 'rec_1',
                title: 'Implement Rate Limiting',
                description: 'Add rate limiting to prevent brute force attacks',
                category: 'security',
                priority: 'high',
                effort: 'medium',
                impact: 8,
                implementation: [
                    'Add rate limiting middleware',
                    'Implement CAPTCHA after failed attempts',
                    'Add IP blocking for repeated failures',
                ],
                metrics: ['failed_login_rate', 'security_incidents'],
            })
        }

        // Performance recommendations
        const averageSessionDuration = this.calculateAverageSessionDuration(this.events)
        if (averageSessionDuration < 300) { // 5 minutes
            recommendations.push({
                id: 'rec_2',
                title: 'Improve User Experience',
                description: 'Average session duration is low, indicating UX issues',
                category: 'user_experience',
                priority: 'medium',
                effort: 'high',
                impact: 6,
                implementation: [
                    'Improve login form design',
                    'Add social login options',
                    'Implement remember me functionality',
                ],
                metrics: ['session_duration', 'user_retention'],
            })
        }

        return recommendations
    }

    /**
     * Calculate average session duration
     */
    private calculateAverageSessionDuration(events: AuthAnalyticsEvent[]): number {
        const sessionDurations = events
            .filter(e => e.event === 'user_logout' && e.metadata.sessionDuration)
            .map(e => e.metadata.sessionDuration)

        if (sessionDurations.length === 0) return 0
        return sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
    }

    /**
     * Get preferred login method
     */
    private getPreferredLoginMethod(events: AuthAnalyticsEvent[]): string {
        const loginMethods = events
            .filter(e => e.event === 'user_login' && e.metadata.method)
            .map(e => e.metadata.method)

        if (loginMethods.length === 0) return 'unknown'

        const methodCounts = loginMethods.reduce((counts, method) => {
            counts[method] = (counts[method] || 0) + 1
            return counts
        }, {} as Record<string, number>)

        return Object.entries(methodCounts).sort(([, a], [, b]) => b - a)[0][0]
    }

    /**
     * Get device distribution
     */
    private getDeviceDistribution(events: AuthAnalyticsEvent[]): { [device: string]: number } {
        const devices = events
            .filter(e => e.metadata.device)
            .map(e => e.metadata.device)

        return devices.reduce((counts, device) => {
            counts[device] = (counts[device] || 0) + 1
            return counts
        }, {} as Record<string, number>)
    }

    /**
     * Get location distribution
     */
    private getLocationDistribution(events: AuthAnalyticsEvent[]): { [location: string]: number } {
        const locations = events
            .filter(e => e.location)
            .map(e => e.location)

        return locations.reduce((counts, location) => {
            counts[location] = (counts[location] || 0) + 1
            return counts
        }, {} as Record<string, number>)
    }

    /**
     * Calculate user risk score
     */
    private calculateUserRiskScore(events: AuthAnalyticsEvent[]): number {
        let riskScore = 0

        // Failed logins
        const failedLogins = events.filter(e => e.event === 'user_login' && !e.metadata.success).length
        riskScore += failedLogins * 5

        // Security incidents
        const securityIncidents = events.filter(e => e.event === 'security_incident').length
        riskScore += securityIncidents * 10

        // Suspicious activities
        const suspiciousActivities = events.filter(e => e.event === 'suspicious_activity').length
        riskScore += suspiciousActivities * 15

        return Math.min(100, riskScore)
    }

    /**
     * Get last activity
     */
    private getLastActivity(events: AuthAnalyticsEvent[]): string {
        const sortedEvents = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        return sortedEvents[0]?.timestamp || new Date().toISOString()
    }

    /**
     * Calculate failed login rate
     */
    private calculateFailedLoginRate(): number {
        const totalLogins = this.events.filter(e => e.event === 'user_login').length
        const failedLogins = this.events.filter(e => e.event === 'user_login' && !e.metadata.success).length

        return totalLogins > 0 ? (failedLogins / totalLogins) * 100 : 0
    }

    /**
     * Calculate conversion rate
     */
    private calculateConversionRate(): number {
        const registrations = this.events.filter(e => e.event === 'user_registration').length
        const successfulLogins = this.events.filter(e => e.event === 'user_login' && e.metadata.success).length

        return registrations > 0 ? (successfulLogins / registrations) * 100 : 0
    }

    /**
     * Calculate security score
     */
    private calculateSecurityScore(): number {
        const totalEvents = this.events.length
        const securityEvents = this.events.filter(e => e.category === 'security').length

        return totalEvents > 0 ? Math.max(0, 100 - (securityEvents / totalEvents) * 100) : 100
    }

    /**
     * Calculate risk level
     */
    private calculateRiskLevel(securityScore: number): 'low' | 'medium' | 'high' | 'critical' {
        if (securityScore >= 80) return 'low'
        if (securityScore >= 60) return 'medium'
        if (securityScore >= 40) return 'high'
        return 'critical'
    }

    /**
     * Calculate daily trends
     */
    private calculateDailyTrends(): Array<{ date: string; registrations: number; logins: number; failures: number }> {
        const dailyData = new Map<string, { registrations: number; logins: number; failures: number }>()

        this.events.forEach(event => {
            const date = event.timestamp.split('T')[0]
            const data = dailyData.get(date) || { registrations: 0, logins: 0, failures: 0 }

            if (event.event === 'user_registration') {
                data.registrations++
            } else if (event.event === 'user_login') {
                data.logins++
                if (!event.metadata.success) {
                    data.failures++
                }
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
    private calculateWeeklyTrends(): Array<{ week: string; registrations: number; logins: number; failures: number }> {
        const weeklyData = new Map<string, { registrations: number; logins: number; failures: number }>()

        this.events.forEach(event => {
            const date = new Date(event.timestamp)
            const week = this.getWeekString(date)
            const data = weeklyData.get(week) || { registrations: 0, logins: 0, failures: 0 }

            if (event.event === 'user_registration') {
                data.registrations++
            } else if (event.event === 'user_login') {
                data.logins++
                if (!event.metadata.success) {
                    data.failures++
                }
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
    private calculateMonthlyTrends(): Array<{ month: string; registrations: number; logins: number; failures: number }> {
        const monthlyData = new Map<string, { registrations: number; logins: number; failures: number }>()

        this.events.forEach(event => {
            const month = event.timestamp.substring(0, 7) // YYYY-MM
            const data = monthlyData.get(month) || { registrations: 0, logins: 0, failures: 0 }

            if (event.event === 'user_registration') {
                data.registrations++
            } else if (event.event === 'user_login') {
                data.logins++
                if (!event.metadata.success) {
                    data.failures++
                }
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
    private sendToAnalyticsService(event: AuthAnalyticsEvent): void {
        try {
            // Send to Google Analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', event.event, {
                    event_category: event.category,
                    event_label: event.action,
                    value: 1,
                    custom_map: {
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
    private async sendToCustomAnalytics(event: AuthAnalyticsEvent): Promise<void> {
        try {
            // This would typically send to your analytics service
            console.log('Auth analytics event:', event)
        } catch (error) {
            console.error('Failed to send to custom analytics:', error)
        }
    }

    /**
     * Get client IP
     */
    private getClientIP(): string {
        // This would typically get the real IP address
        return '127.0.0.1'
    }

    /**
     * Get user agent
     */
    private getUserAgent(): string {
        return typeof window !== 'undefined' ? navigator.userAgent : 'Server'
    }

    /**
     * Get location
     */
    private getLocation(): string {
        // This would typically get the location from IP
        return 'Unknown'
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `auth_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate event ID
     */
    private generateEventId(): string {
        return `auth_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export const authAnalytics = new AuthAnalyticsEngine()
export default authAnalytics
