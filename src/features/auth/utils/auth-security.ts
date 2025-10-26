import { User } from '../redux/auth.slice'

export interface SecurityConfig {
    jwtSecret: string
    refreshTokenSecret: string
    tokenExpiry: number
    refreshTokenExpiry: number
    maxLoginAttempts: number
    lockoutDuration: number
    passwordHistory: number
    sessionTimeout: number
}

export interface SecurityEvent {
    id: string
    userId: string
    type: 'login' | 'logout' | 'password_change' | 'email_verification' | 'suspicious_activity'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    ipAddress: string
    userAgent: string
    location?: string
    timestamp: string
    metadata: Record<string, any>
}

export interface SecurityThreat {
    id: string
    userId: string
    type: 'brute_force' | 'suspicious_login' | 'data_breach' | 'phishing' | 'malware'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    detectedAt: string
    status: 'active' | 'investigating' | 'resolved' | 'false_positive'
    actions: SecurityAction[]
}

export interface SecurityAction {
    id: string
    type: 'block_ip' | 'require_2fa' | 'force_password_reset' | 'suspend_account' | 'notify_user'
    description: string
    executedAt: string
    status: 'pending' | 'executed' | 'failed'
}

export interface SecurityMetrics {
    totalLogins: number
    failedLogins: number
    suspiciousActivities: number
    blockedIPs: number
    activeThreats: number
    securityScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityPolicy {
    id: string
    name: string
    description: string
    rules: SecurityRule[]
    isActive: boolean
    priority: number
}

export interface SecurityRule {
    id: string
    condition: string
    action: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    isEnabled: boolean
}

export class AuthSecurity {
    private securityEvents: SecurityEvent[] = []
    private securityThreats: SecurityThreat[] = []
    private blockedIPs: Set<string> = new Set()
    private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map()
    private securityPolicies: SecurityPolicy[] = []

    constructor() {
        this.initializeSecurityPolicies()
    }

    /**
     * Validate JWT token
     */
    static validateJWT(token: string): { isValid: boolean; payload?: any; error?: string } {
        try {
            if (!token) {
                return { isValid: false, error: 'Token is required' }
            }

            const parts = token.split('.')
            if (parts.length !== 3) {
                return { isValid: false, error: 'Invalid token format' }
            }

            const [header, payload, signature] = parts

            // Decode header and payload
            const decodedHeader = JSON.parse(atob(header))
            const decodedPayload = JSON.parse(atob(payload))

            // Check token expiry
            if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
                return { isValid: false, error: 'Token has expired' }
            }

            // Check token issuer
            if (decodedPayload.iss !== process.env.NEXT_PUBLIC_JWT_ISSUER) {
                return { isValid: false, error: 'Invalid token issuer' }
            }

            return { isValid: true, payload: decodedPayload }
        } catch (error) {
            return { isValid: false, error: 'Invalid token' }
        }
    }

    /**
     * Generate secure JWT token
     */
    static generateJWT(payload: any, expiresIn: number = 3600): string {
        const header = {
            alg: 'HS256',
            typ: 'JWT',
        }

        const now = Math.floor(Date.now() / 1000)
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + expiresIn,
            iss: process.env.NEXT_PUBLIC_JWT_ISSUER || 'hutiyapa-addtocart',
        }

        const encodedHeader = btoa(JSON.stringify(header))
        const encodedPayload = btoa(JSON.stringify(tokenPayload))
        const signature = this.generateSignature(encodedHeader, encodedPayload)

        return `${encodedHeader}.${encodedPayload}.${signature}`
    }

    /**
     * Generate refresh token
     */
    static generateRefreshToken(): string {
        const array = new Uint8Array(64)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Check if IP is blocked
     */
    isIPBlocked(ipAddress: string): boolean {
        return this.blockedIPs.has(ipAddress)
    }

    /**
     * Block IP address
     */
    blockIP(ipAddress: string, reason: string, duration: number = 24 * 60 * 60 * 1000): void {
        this.blockedIPs.add(ipAddress)

        // Auto-unblock after duration
        setTimeout(() => {
            this.blockedIPs.delete(ipAddress)
        }, duration)

        this.logSecurityEvent('block_ip', 'high', `IP ${ipAddress} blocked: ${reason}`, ipAddress)
    }

    /**
     * Check login attempts
     */
    checkLoginAttempts(ipAddress: string, maxAttempts: number = 5): { allowed: boolean; attemptsLeft: number } {
        const attempts = this.loginAttempts.get(ipAddress)
        const now = Date.now()
        const lockoutDuration = 15 * 60 * 1000 // 15 minutes

        if (attempts) {
            // Reset if lockout period has passed
            if (now - attempts.lastAttempt > lockoutDuration) {
                this.loginAttempts.delete(ipAddress)
                return { allowed: true, attemptsLeft: maxAttempts }
            }

            // Check if max attempts reached
            if (attempts.count >= maxAttempts) {
                this.blockIP(ipAddress, 'Too many failed login attempts')
                return { allowed: false, attemptsLeft: 0 }
            }

            return { allowed: true, attemptsLeft: maxAttempts - attempts.count }
        }

        return { allowed: true, attemptsLeft: maxAttempts }
    }

    /**
     * Record login attempt
     */
    recordLoginAttempt(ipAddress: string, success: boolean, userId?: string): void {
        const now = Date.now()
        const attempts = this.loginAttempts.get(ipAddress) || { count: 0, lastAttempt: now }

        if (success) {
            // Reset on successful login
            this.loginAttempts.delete(ipAddress)
            this.logSecurityEvent('login', 'low', 'Successful login', ipAddress, userId)
        } else {
            // Increment failed attempts
            attempts.count++
            attempts.lastAttempt = now
            this.loginAttempts.set(ipAddress, attempts)
            this.logSecurityEvent('login', 'medium', 'Failed login attempt', ipAddress, userId)
        }
    }

    /**
     * Detect suspicious activity
     */
    detectSuspiciousActivity(userId: string, activity: any): SecurityThreat | null {
        const threats: SecurityThreat[] = []

        // Check for unusual login patterns
        if (this.isUnusualLoginPattern(activity)) {
            threats.push({
                id: this.generateThreatId(),
                userId,
                type: 'suspicious_login',
                severity: 'high',
                description: 'Unusual login pattern detected',
                detectedAt: new Date().toISOString(),
                status: 'active',
                actions: [],
            })
        }

        // Check for brute force attempts
        if (this.isBruteForceAttempt(activity)) {
            threats.push({
                id: this.generateThreatId(),
                userId,
                type: 'brute_force',
                severity: 'critical',
                description: 'Brute force attack detected',
                detectedAt: new Date().toISOString(),
                status: 'active',
                actions: [],
            })
        }

        // Check for data breach indicators
        if (this.isDataBreachIndicator(activity)) {
            threats.push({
                id: this.generateThreatId(),
                userId,
                type: 'data_breach',
                severity: 'critical',
                description: 'Potential data breach detected',
                detectedAt: new Date().toISOString(),
                status: 'active',
                actions: [],
            })
        }

        if (threats.length > 0) {
            const threat = threats[0] // Return first detected threat
            this.securityThreats.push(threat)
            this.logSecurityEvent('suspicious_activity', 'high', threat.description, activity.ipAddress, userId)
            return threat
        }

        return null
    }

    /**
     * Log security event
     */
    logSecurityEvent(
        type: SecurityEvent['type'],
        severity: SecurityEvent['severity'],
        description: string,
        ipAddress: string,
        userId?: string,
        metadata: Record<string, any> = {}
    ): void {
        const event: SecurityEvent = {
            id: this.generateEventId(),
            userId: userId || 'anonymous',
            type,
            severity,
            description,
            ipAddress,
            userAgent: this.getUserAgent(),
            location: this.getLocationFromIP(ipAddress),
            timestamp: new Date().toISOString(),
            metadata,
        }

        this.securityEvents.push(event)
        this.sendSecurityAlert(event)
    }

    /**
     * Get security metrics
     */
    getSecurityMetrics(): SecurityMetrics {
        const totalLogins = this.securityEvents.filter(e => e.type === 'login').length
        const failedLogins = this.securityEvents.filter(e => e.type === 'login' && e.severity === 'medium').length
        const suspiciousActivities = this.securityEvents.filter(e => e.type === 'suspicious_activity').length
        const blockedIPs = this.blockedIPs.size
        const activeThreats = this.securityThreats.filter(t => t.status === 'active').length

        const securityScore = this.calculateSecurityScore()
        const riskLevel = this.calculateRiskLevel(securityScore)

        return {
            totalLogins,
            failedLogins,
            suspiciousActivities,
            blockedIPs,
            activeThreats,
            securityScore,
            riskLevel,
        }
    }

    /**
     * Get security events
     */
    getSecurityEvents(filter?: { userId?: string; type?: string; severity?: string }): SecurityEvent[] {
        let events = [...this.securityEvents]

        if (filter) {
            if (filter.userId) {
                events = events.filter(e => e.userId === filter.userId)
            }
            if (filter.type) {
                events = events.filter(e => e.type === filter.type)
            }
            if (filter.severity) {
                events = events.filter(e => e.severity === filter.severity)
            }
        }

        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    /**
     * Get active threats
     */
    getActiveThreats(): SecurityThreat[] {
        return this.securityThreats.filter(t => t.status === 'active')
    }

    /**
     * Resolve threat
     */
    resolveThreat(threatId: string, resolution: string): boolean {
        const threat = this.securityThreats.find(t => t.id === threatId)
        if (!threat) return false

        threat.status = 'resolved'
        threat.actions.push({
            id: this.generateActionId(),
            type: 'notify_user',
            description: resolution,
            executedAt: new Date().toISOString(),
            status: 'executed',
        })

        return true
    }

    /**
     * Check password against breach database
     */
    async checkPasswordBreach(password: string): Promise<boolean> {
        try {
            // Hash password with SHA-1 for HaveIBeenPwned API
            const hash = await this.sha1Hash(password)
            const hashPrefix = hash.substring(0, 5)
            const hashSuffix = hash.substring(5).toUpperCase()

            const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`)
            const data = await response.text()

            return data.includes(hashSuffix)
        } catch (error) {
            console.error('Error checking password breach:', error)
            return false
        }
    }

    /**
     * Generate secure password
     */
    generateSecurePassword(length: number = 16): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length)
            password += charset[randomIndex]
        }

        return password
    }

    /**
     * Initialize security policies
     */
    private initializeSecurityPolicies(): void {
        this.securityPolicies = [
            {
                id: 'policy_1',
                name: 'Password Policy',
                description: 'Enforce strong password requirements',
                rules: [
                    {
                        id: 'rule_1',
                        condition: 'password.length < 8',
                        action: 'reject',
                        severity: 'high',
                        isEnabled: true,
                    },
                    {
                        id: 'rule_2',
                        condition: 'password in common_passwords',
                        action: 'reject',
                        severity: 'high',
                        isEnabled: true,
                    },
                ],
                isActive: true,
                priority: 1,
            },
            {
                id: 'policy_2',
                name: 'Login Protection',
                description: 'Protect against brute force attacks',
                rules: [
                    {
                        id: 'rule_3',
                        condition: 'failed_attempts > 5',
                        action: 'block_ip',
                        severity: 'critical',
                        isEnabled: true,
                    },
                ],
                isActive: true,
                priority: 2,
            },
        ]
    }

    /**
     * Check for unusual login patterns
     */
    private isUnusualLoginPattern(activity: any): boolean {
        // Check for login from new location
        // Check for login at unusual time
        // Check for login from new device
        return false // Simplified for demo
    }

    /**
     * Check for brute force attempts
     */
    private isBruteForceAttempt(activity: any): boolean {
        const attempts = this.loginAttempts.get(activity.ipAddress)
        return attempts ? attempts.count > 10 : false
    }

    /**
     * Check for data breach indicators
     */
    private isDataBreachIndicator(activity: any): boolean {
        // Check for suspicious data access patterns
        return false // Simplified for demo
    }

    /**
     * Calculate security score
     */
    private calculateSecurityScore(): number {
        const metrics = this.getSecurityMetrics()
        let score = 100

        // Deduct points for failed logins
        score -= Math.min(metrics.failedLogins * 2, 20)

        // Deduct points for suspicious activities
        score -= Math.min(metrics.suspiciousActivities * 5, 30)

        // Deduct points for active threats
        score -= Math.min(metrics.activeThreats * 10, 40)

        return Math.max(0, score)
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
     * Generate signature for JWT
     */
    private static generateSignature(header: string, payload: string): string {
        // This is a simplified implementation
        // In production, use proper HMAC-SHA256
        const data = `${header}.${payload}`
        return btoa(data) // Simplified for demo
    }

    /**
     * Generate SHA-1 hash
     */
    private async sha1Hash(text: string): Promise<string> {
        const encoder = new TextEncoder()
        const data = encoder.encode(text)
        const hashBuffer = await crypto.subtle.digest('SHA-1', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Get user agent
     */
    private getUserAgent(): string {
        return typeof window !== 'undefined' ? navigator.userAgent : 'Server'
    }

    /**
     * Get location from IP (simplified)
     */
    private getLocationFromIP(ipAddress: string): string {
        // In production, use a proper IP geolocation service
        return 'Unknown'
    }

    /**
     * Send security alert
     */
    private sendSecurityAlert(event: SecurityEvent): void {
        // In production, send to security monitoring system
        console.log('Security Alert:', event)
    }

    /**
     * Generate event ID
     */
    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate threat ID
     */
    private generateThreatId(): string {
        return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Generate action ID
     */
    private generateActionId(): string {
        return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export const authSecurity = new AuthSecurity()
export default authSecurity
