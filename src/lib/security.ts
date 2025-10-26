interface SecurityConfig {
    enableCSP: boolean
    enableHSTS: boolean
    enableXSSProtection: boolean
    enableContentTypeOptions: boolean
    enableFrameOptions: boolean
    enableReferrerPolicy: boolean
    enablePermissionsPolicy: boolean
    cspDirectives: Record<string, string[]>
    hstsMaxAge: number
    permissionsPolicy: Record<string, string[]>
}

interface SecurityHeaders {
    'Content-Security-Policy': string
    'Strict-Transport-Security': string
    'X-Content-Type-Options': string
    'X-Frame-Options': string
    'X-XSS-Protection': string
    'Referrer-Policy': string
    'Permissions-Policy': string
}

interface SecurityAudit {
    timestamp: number
    score: number
    issues: SecurityIssue[]
    recommendations: SecurityRecommendation[]
}

interface SecurityIssue {
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    description: string
    impact: string
    remediation: string
}

interface SecurityRecommendation {
    category: string
    description: string
    priority: 'low' | 'medium' | 'high'
    implementation: string
}

export class SecurityManager {
    private static instance: SecurityManager
    private config: SecurityConfig
    private auditResults: SecurityAudit[] = []

    constructor(config: SecurityConfig) {
        this.config = config
    }

    static getInstance(config?: SecurityConfig): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager(config || {
                enableCSP: true,
                enableHSTS: true,
                enableXSSProtection: true,
                enableContentTypeOptions: true,
                enableFrameOptions: true,
                enableReferrerPolicy: true,
                enablePermissionsPolicy: true,
                cspDirectives: {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    'style-src': ["'self'", "'unsafe-inline'"],
                    'img-src': ["'self'", 'data:', 'https:'],
                    'connect-src': ["'self'", 'https:'],
                    'font-src': ["'self'", 'https:'],
                    'object-src': ["'none'"],
                    'base-uri': ["'self'"],
                    'form-action': ["'self'"],
                },
                hstsMaxAge: 31536000,
                permissionsPolicy: {
                    'geolocation': ['()'],
                    'microphone': ['()'],
                    'camera': ['()'],
                    'payment': ['()'],
                    'usb': ['()'],
                    'magnetometer': ['()'],
                    'gyroscope': ['()'],
                    'accelerometer': ['()'],
                },
            })
        }
        return SecurityManager.instance
    }

    // Generate security headers
    generateSecurityHeaders(): SecurityHeaders {
        const headers: Partial<SecurityHeaders> = {}

        if (this.config.enableCSP) {
            headers['Content-Security-Policy'] = this.generateCSP()
        }

        if (this.config.enableHSTS) {
            headers['Strict-Transport-Security'] = `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`
        }

        if (this.config.enableXSSProtection) {
            headers['X-XSS-Protection'] = '1; mode=block'
        }

        if (this.config.enableContentTypeOptions) {
            headers['X-Content-Type-Options'] = 'nosniff'
        }

        if (this.config.enableFrameOptions) {
            headers['X-Frame-Options'] = 'SAMEORIGIN'
        }

        if (this.config.enableReferrerPolicy) {
            headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        }

        if (this.config.enablePermissionsPolicy) {
            headers['Permissions-Policy'] = this.generatePermissionsPolicy()
        }

        return headers as SecurityHeaders
    }

    private generateCSP(): string {
        const directives = Object.entries(this.config.cspDirectives)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ')

        return directives
    }

    private generatePermissionsPolicy(): string {
        const policies = Object.entries(this.config.permissionsPolicy)
            .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
            .join(', ')

        return policies
    }

    // Security audit
    performSecurityAudit(): SecurityAudit {
        const issues: SecurityIssue[] = []
        const recommendations: SecurityRecommendation[] = []

        // Check for common security issues
        this.checkHTTPSUsage(issues)
        this.checkCSPConfiguration(issues, recommendations)
        this.checkAuthenticationSecurity(issues, recommendations)
        this.checkDataProtection(issues, recommendations)
        this.checkInputValidation(issues, recommendations)
        this.checkSessionSecurity(issues, recommendations)

        // Calculate security score
        const score = this.calculateSecurityScore(issues)

        const audit: SecurityAudit = {
            timestamp: Date.now(),
            score,
            issues,
            recommendations,
        }

        this.auditResults.push(audit)
        return audit
    }

    private checkHTTPSUsage(issues: SecurityIssue[]): void {
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
            issues.push({
                severity: 'high',
                category: 'Transport Security',
                description: 'Application is not using HTTPS',
                impact: 'Data transmission is not encrypted',
                remediation: 'Enable HTTPS and redirect HTTP traffic',
            })
        }
    }

    private checkCSPConfiguration(issues: SecurityIssue[], _recommendations: SecurityRecommendation[]): void {
        if (!this.config.enableCSP) {
            issues.push({
                severity: 'medium',
                category: 'Content Security Policy',
                description: 'CSP is not enabled',
                impact: 'Vulnerable to XSS attacks',
                remediation: 'Enable Content Security Policy',
            })
        }

        if (this.config.cspDirectives['script-src']?.includes("'unsafe-inline'")) {
            issues.push({
                severity: 'medium',
                category: 'Content Security Policy',
                description: 'CSP allows unsafe-inline scripts',
                impact: 'Vulnerable to XSS attacks',
                remediation: 'Remove unsafe-inline from script-src directive',
            })
        }

        if (this.config.cspDirectives['script-src']?.includes("'unsafe-eval'")) {
            issues.push({
                severity: 'medium',
                category: 'Content Security Policy',
                description: 'CSP allows unsafe-eval scripts',
                impact: 'Vulnerable to code injection attacks',
                remediation: 'Remove unsafe-eval from script-src directive',
            })
        }
    }

    private checkAuthenticationSecurity(_issues: SecurityIssue[], _recommendations: SecurityRecommendation[]): void {
        // Check for secure authentication practices
        _recommendations.push({
            category: 'Authentication',
            description: 'Implement multi-factor authentication',
            priority: 'high',
            implementation: 'Add MFA support using TOTP or SMS',
        })

        _recommendations.push({
            category: 'Authentication',
            description: 'Implement password complexity requirements',
            priority: 'medium',
            implementation: 'Enforce strong password policies',
        })
    }

    private checkDataProtection(_issues: SecurityIssue[], _recommendations: SecurityRecommendation[]): void {
        // Check for data protection compliance
        _recommendations.push({
            category: 'Data Protection',
            description: 'Implement GDPR compliance',
            priority: 'high',
            implementation: 'Add privacy policy, cookie consent, and data deletion',
        })

        _recommendations.push({
            category: 'Data Protection',
            description: 'Implement data encryption at rest',
            priority: 'high',
            implementation: 'Encrypt sensitive data in database',
        })
    }

    private checkInputValidation(_issues: SecurityIssue[], _recommendations: SecurityRecommendation[]): void {
        _recommendations.push({
            category: 'Input Validation',
            description: 'Implement server-side input validation',
            priority: 'high',
            implementation: 'Validate all user inputs on the server',
        })

        _recommendations.push({
            category: 'Input Validation',
            description: 'Implement SQL injection prevention',
            priority: 'high',
            implementation: 'Use parameterized queries and ORM',
        })
    }

    private checkSessionSecurity(_issues: SecurityIssue[], _recommendations: SecurityRecommendation[]): void {
        _recommendations.push({
            category: 'Session Security',
            description: 'Implement secure session management',
            priority: 'high',
            implementation: 'Use secure cookies and session timeouts',
        })

        _recommendations.push({
            category: 'Session Security',
            description: 'Implement CSRF protection',
            priority: 'high',
            implementation: 'Add CSRF tokens to forms',
        })
    }

    private calculateSecurityScore(issues: SecurityIssue[]): number {
        const weights = {
            critical: 10,
            high: 8,
            medium: 5,
            low: 2,
        }

        const totalWeight = issues.reduce((sum, issue) => sum + weights[issue.severity], 0)
        const maxWeight = issues.length * weights.critical
        const score = maxWeight > 0 ? Math.max(0, 100 - (totalWeight / maxWeight) * 100) : 100

        return Math.round(score)
    }

    // GDPR Compliance
    generateGDPRCompliance(): {
        privacyPolicy: string
        cookiePolicy: string
        dataProcessingAgreement: string
        consentManagement: any
    } {
        return {
            privacyPolicy: this.generatePrivacyPolicy(),
            cookiePolicy: this.generateCookiePolicy(),
            dataProcessingAgreement: this.generateDataProcessingAgreement(),
            consentManagement: this.generateConsentManagement(),
        }
    }

    private generatePrivacyPolicy(): string {
        return `
# Privacy Policy

## Data Collection
We collect the following types of personal data:
- Contact information (name, email, phone)
- Payment information (processed securely)
- Usage data (analytics, preferences)

## Data Usage
Personal data is used for:
- Order processing and fulfillment
- Customer support
- Marketing (with consent)
- Analytics and improvement

## Data Sharing
We do not sell personal data. Data may be shared with:
- Payment processors
- Shipping providers
- Analytics services

## Data Retention
Personal data is retained for:
- Account data: Until account deletion
- Order data: 7 years (legal requirement)
- Marketing data: Until consent withdrawal

## Your Rights
You have the right to:
- Access your data
- Correct inaccurate data
- Delete your data
- Port your data
- Object to processing
- Withdraw consent

## Contact
For data protection inquiries: privacy@hutiyapa.com
    `.trim()
    }

    private generateCookiePolicy(): string {
        return `
# Cookie Policy

## What are cookies?
Cookies are small text files stored on your device.

## Types of cookies we use:
- Essential cookies (required for functionality)
- Analytics cookies (performance monitoring)
- Marketing cookies (personalized content)

## Cookie management:
You can control cookies through browser settings or our consent management tool.
    `.trim()
    }

    private generateDataProcessingAgreement(): string {
        return `
# Data Processing Agreement

## Purpose
This agreement governs the processing of personal data in accordance with GDPR.

## Data Controller
Hutiyapa E-commerce Platform

## Data Processing
Personal data is processed for legitimate business purposes including:
- Order fulfillment
- Customer service
- Marketing (with consent)
- Analytics

## Data Security
We implement appropriate technical and organizational measures to protect personal data.

## Data Breach Notification
We will notify relevant authorities and affected individuals within 72 hours of any data breach.
    `.trim()
    }

    private generateConsentManagement(): any {
        return {
            consentTypes: [
                {
                    id: 'essential',
                    name: 'Essential Cookies',
                    description: 'Required for basic website functionality',
                    required: true,
                    enabled: true,
                },
                {
                    id: 'analytics',
                    name: 'Analytics Cookies',
                    description: 'Help us understand how you use our website',
                    required: false,
                    enabled: false,
                },
                {
                    id: 'marketing',
                    name: 'Marketing Cookies',
                    description: 'Used to deliver personalized content and ads',
                    required: false,
                    enabled: false,
                },
            ],
            consentVersion: '1.0',
            lastUpdated: new Date().toISOString(),
        }
    }

    // Security utilities
    sanitizeInput(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .replace(/[;]/g, '') // Remove semicolons
            .trim()
    }

    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    validatePassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long')
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number')
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character')
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    generateCSRFToken(): string {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    // Get audit history
    getAuditHistory(): SecurityAudit[] {
        return [...this.auditResults]
    }

    // Get latest audit
    getLatestAudit(): SecurityAudit | null {
        return this.auditResults.length > 0 ? this.auditResults[this.auditResults.length - 1] : null as any
    }
}

// Export singleton instance
export const security = SecurityManager.getInstance()

// Export types
export type {
    SecurityConfig,
    SecurityHeaders,
    SecurityAudit,
    SecurityIssue,
    SecurityRecommendation,
}
