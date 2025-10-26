import { User } from '../redux/auth.slice'

export interface AuthCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterData {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phone?: string
    acceptTerms: boolean
    marketingEmails?: boolean
}

export interface PasswordResetData {
    email: string
}

export interface PasswordChangeData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export interface AuthResponse {
    success: boolean
    user?: User
    token?: string
    refreshToken?: string
    message?: string
    error?: string
}

export interface AuthSession {
    user: User
    token: string
    refreshToken: string
    expiresAt: string
    lastActivity: string
    deviceInfo: DeviceInfo
}

export interface DeviceInfo {
    userAgent: string
    platform: string
    browser: string
    os: string
    ip?: string
    location?: string
}

export interface AuthValidation {
    isValid: boolean
    errors: AuthError[]
    warnings: AuthWarning[]
}

export interface AuthError {
    field: string
    message: string
    code: string
}

export interface AuthWarning {
    field: string
    message: string
    code: string
}

export interface AuthSecurity {
    passwordStrength: number
    securityScore: number
    riskLevel: 'low' | 'medium' | 'high'
    recommendations: string[]
}

export class AuthFlow {
    private static readonly PASSWORD_MIN_LENGTH = 8
    private static readonly PASSWORD_MAX_LENGTH = 128
    private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
    private static readonly REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

    /**
     * Validate login credentials
     */
    static validateLogin(credentials: AuthCredentials): AuthValidation {
        const errors: AuthError[] = []
        const warnings: AuthWarning[] = []

        // Email validation
        if (!credentials.email) {
            errors.push({
                field: 'email',
                message: 'Email is required',
                code: 'EMAIL_REQUIRED',
            })
        } else if (!this.isValidEmail(credentials.email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format',
                code: 'INVALID_EMAIL',
            })
        }

        // Password validation
        if (!credentials.password) {
            errors.push({
                field: 'password',
                message: 'Password is required',
                code: 'PASSWORD_REQUIRED',
            })
        } else if (credentials.password.length < this.PASSWORD_MIN_LENGTH) {
            errors.push({
                field: 'password',
                message: `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters`,
                code: 'PASSWORD_TOO_SHORT',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Validate registration data
     */
    static validateRegistration(data: RegisterData): AuthValidation {
        const errors: AuthError[] = []
        const warnings: AuthWarning[] = []

        // Email validation
        if (!data.email) {
            errors.push({
                field: 'email',
                message: 'Email is required',
                code: 'EMAIL_REQUIRED',
            })
        } else if (!this.isValidEmail(data.email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format',
                code: 'INVALID_EMAIL',
            })
        }

        // Password validation
        if (!data.password) {
            errors.push({
                field: 'password',
                message: 'Password is required',
                code: 'PASSWORD_REQUIRED',
            })
        } else {
            const passwordValidation = this.validatePassword(data.password)
            errors.push(...passwordValidation.errors)
            warnings.push(...passwordValidation.warnings)
        }

        // Confirm password validation
        if (!data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Please confirm your password',
                code: 'CONFIRM_PASSWORD_REQUIRED',
            })
        } else if (data.password !== data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Passwords do not match',
                code: 'PASSWORDS_DO_NOT_MATCH',
            })
        }

        // Name validation
        if (!data.firstName) {
            errors.push({
                field: 'firstName',
                message: 'First name is required',
                code: 'FIRST_NAME_REQUIRED',
            })
        } else if (data.firstName.length < 2) {
            errors.push({
                field: 'firstName',
                message: 'First name must be at least 2 characters',
                code: 'FIRST_NAME_TOO_SHORT',
            })
        }

        if (!data.lastName) {
            errors.push({
                field: 'lastName',
                message: 'Last name is required',
                code: 'LAST_NAME_REQUIRED',
            })
        } else if (data.lastName.length < 2) {
            errors.push({
                field: 'lastName',
                message: 'Last name must be at least 2 characters',
                code: 'LAST_NAME_TOO_SHORT',
            })
        }

        // Phone validation (optional)
        if (data.phone && !this.isValidPhone(data.phone)) {
            warnings.push({
                field: 'phone',
                message: 'Phone number format may be invalid',
                code: 'INVALID_PHONE_FORMAT',
            })
        }

        // Terms acceptance validation
        if (!data.acceptTerms) {
            errors.push({
                field: 'acceptTerms',
                message: 'You must accept the terms and conditions',
                code: 'TERMS_NOT_ACCEPTED',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Validate password strength
     */
    static validatePassword(password: string): AuthValidation {
        const errors: AuthError[] = []
        const warnings: AuthWarning[] = []

        if (password.length < this.PASSWORD_MIN_LENGTH) {
            errors.push({
                field: 'password',
                message: `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters`,
                code: 'PASSWORD_TOO_SHORT',
            })
        }

        if (password.length > this.PASSWORD_MAX_LENGTH) {
            errors.push({
                field: 'password',
                message: `Password must be no more than ${this.PASSWORD_MAX_LENGTH} characters`,
                code: 'PASSWORD_TOO_LONG',
            })
        }

        // Check for common patterns
        if (!/[A-Z]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding uppercase letters',
                code: 'NO_UPPERCASE',
            })
        }

        if (!/[a-z]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding lowercase letters',
                code: 'NO_LOWERCASE',
            })
        }

        if (!/[0-9]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding numbers',
                code: 'NO_NUMBERS',
            })
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding special characters',
                code: 'NO_SPECIAL_CHARS',
            })
        }

        // Check for common passwords
        if (this.isCommonPassword(password)) {
            errors.push({
                field: 'password',
                message: 'This password is too common. Please choose a stronger password.',
                code: 'COMMON_PASSWORD',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Calculate password strength
     */
    static calculatePasswordStrength(password: string): number {
        let strength = 0

        // Length bonus
        if (password.length >= 8) strength += 1
        if (password.length >= 12) strength += 1
        if (password.length >= 16) strength += 1

        // Character variety bonus
        if (/[A-Z]/.test(password)) strength += 1
        if (/[a-z]/.test(password)) strength += 1
        if (/[0-9]/.test(password)) strength += 1
        if (/[^A-Za-z0-9]/.test(password)) strength += 1

        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) strength -= 1 // Repeated characters
        if (/123|abc|qwe/i.test(password)) strength -= 1 // Sequential patterns

        return Math.max(0, Math.min(10, strength))
    }

    /**
     * Validate password change
     */
    static validatePasswordChange(data: PasswordChangeData): AuthValidation {
        const errors: AuthError[] = []
        const warnings: AuthWarning[] = []

        // Current password validation
        if (!data.currentPassword) {
            errors.push({
                field: 'currentPassword',
                message: 'Current password is required',
                code: 'CURRENT_PASSWORD_REQUIRED',
            })
        }

        // New password validation
        if (!data.newPassword) {
            errors.push({
                field: 'newPassword',
                message: 'New password is required',
                code: 'NEW_PASSWORD_REQUIRED',
            })
        } else {
            const passwordValidation = this.validatePassword(data.newPassword)
            errors.push(...passwordValidation.errors)
            warnings.push(...passwordValidation.warnings)
        }

        // Confirm password validation
        if (!data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Please confirm your new password',
                code: 'CONFIRM_PASSWORD_REQUIRED',
            })
        } else if (data.newPassword !== data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Passwords do not match',
                code: 'PASSWORDS_DO_NOT_MATCH',
            })
        }

        // Check if new password is different from current
        if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
            errors.push({
                field: 'newPassword',
                message: 'New password must be different from current password',
                code: 'SAME_PASSWORD',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Create authentication session
     */
    static createSession(user: User, token: string, refreshToken: string): AuthSession {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + this.SESSION_DURATION)

        return {
            user,
            token,
            refreshToken,
            expiresAt: expiresAt.toISOString(),
            lastActivity: now.toISOString(),
            deviceInfo: this.getDeviceInfo(),
        }
    }

    /**
     * Check if session is valid
     */
    static isSessionValid(session: AuthSession): boolean {
        const now = new Date()
        const expiresAt = new Date(session.expiresAt)
        return expiresAt > now
    }

    /**
     * Refresh session
     */
    static refreshSession(session: AuthSession, newToken: string, newRefreshToken: string): AuthSession {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + this.SESSION_DURATION)

        return {
            ...session,
            token: newToken,
            refreshToken: newRefreshToken,
            expiresAt: expiresAt.toISOString(),
            lastActivity: now.toISOString(),
        }
    }

    /**
     * Calculate security score
     */
    static calculateSecurityScore(user: User, session: AuthSession): AuthSecurity {
        let score = 0
        const recommendations: string[] = []

        // Email verification
        if (user.isEmailVerified) {
            score += 20
        } else {
            recommendations.push('Verify your email address')
        }

        // Password strength (would need to be stored securely)
        score += 30 // Placeholder

        // Session security
        if (this.isSessionValid(session)) {
            score += 20
        } else {
            recommendations.push('Session has expired')
        }

        // Device security
        if (this.isSecureDevice(session.deviceInfo)) {
            score += 15
        } else {
            recommendations.push('Use a secure device')
        }

        // Recent activity
        const lastActivity = new Date(session.lastActivity)
        const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60)
        if (hoursSinceActivity < 24) {
            score += 15
        } else {
            recommendations.push('Consider logging out inactive sessions')
        }

        const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high'

        return {
            passwordStrength: 0, // Would need secure storage
            securityScore: score,
            riskLevel,
            recommendations,
        }
    }

    /**
     * Validate email format
     */
    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    /**
     * Validate phone format
     */
    private static isValidPhone(phone: string): boolean {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        return phoneRegex.test(phone.replace(/\s/g, ''))
    }

    /**
     * Check if password is common
     */
    private static isCommonPassword(password: string): boolean {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
        ]
        return commonPasswords.includes(password.toLowerCase())
    }

    /**
     * Get device information
     */
    private static getDeviceInfo(): DeviceInfo {
        if (typeof window === 'undefined') {
            return {
                userAgent: 'Server',
                platform: 'Server',
                browser: 'Server',
                os: 'Server',
            }
        }

        const userAgent = navigator.userAgent
        const platform = navigator.platform
        const browser = this.getBrowser(userAgent)
        const os = this.getOS(userAgent)

        return {
            userAgent,
            platform,
            browser,
            os,
        }
    }

    /**
     * Get browser name
     */
    private static getBrowser(userAgent: string): string {
        if (userAgent.includes('Chrome')) return 'Chrome'
        if (userAgent.includes('Firefox')) return 'Firefox'
        if (userAgent.includes('Safari')) return 'Safari'
        if (userAgent.includes('Edge')) return 'Edge'
        if (userAgent.includes('Opera')) return 'Opera'
        return 'Unknown'
    }

    /**
     * Get operating system
     */
    private static getOS(userAgent: string): string {
        if (userAgent.includes('Windows')) return 'Windows'
        if (userAgent.includes('Mac')) return 'macOS'
        if (userAgent.includes('Linux')) return 'Linux'
        if (userAgent.includes('Android')) return 'Android'
        if (userAgent.includes('iOS')) return 'iOS'
        return 'Unknown'
    }

    /**
     * Check if device is secure
     */
    private static isSecureDevice(deviceInfo: DeviceInfo): boolean {
        // Check for secure browsers
        const secureBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
        if (!secureBrowsers.includes(deviceInfo.browser)) {
            return false
        }

        // Check for secure operating systems
        const secureOS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android']
        if (!secureOS.includes(deviceInfo.os)) {
            return false
        }

        return true
    }

    /**
     * Generate secure token
     */
    static generateSecureToken(): string {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Hash password (client-side for validation only)
     */
    static async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Verify password (client-side for validation only)
     */
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        const passwordHash = await this.hashPassword(password)
        return passwordHash === hash
    }
}

export default AuthFlow
