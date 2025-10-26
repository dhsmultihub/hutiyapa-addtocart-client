import { User } from '../redux/auth.slice'

export interface ValidationRule {
    field: string
    type: 'required' | 'email' | 'phone' | 'password' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
    value?: any
    message: string
    validator?: (value: any, data?: any) => boolean
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
    score: number
}

export interface ValidationError {
    field: string
    message: string
    code: string
    severity: 'error' | 'warning'
}

export interface ValidationWarning {
    field: string
    message: string
    code: string
    suggestion?: string
}

export interface SecurityCheck {
    type: 'password_strength' | 'email_verification' | 'phone_verification' | 'breach_check' | 'suspicious_activity'
    status: 'pass' | 'fail' | 'warning'
    message: string
    score: number
    recommendations: string[]
}

export interface ValidationContext {
    user?: User
    ipAddress?: string
    userAgent?: string
    timestamp?: string
    metadata?: Record<string, any>
}

export class AuthValidation {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    private static readonly PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/
    private static readonly PASSWORD_MIN_LENGTH = 8
    private static readonly PASSWORD_MAX_LENGTH = 128
    private static readonly COMMON_PASSWORDS = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]

    /**
     * Validate user registration data
     */
    static validateRegistration(data: any, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        // Email validation
        const emailValidation = this.validateEmail(data.email, context)
        errors.push(...emailValidation.errors)
        warnings.push(...emailValidation.warnings)
        score += emailValidation.score

        // Password validation
        const passwordValidation = this.validatePassword(data.password, context)
        errors.push(...passwordValidation.errors)
        warnings.push(...passwordValidation.warnings)
        score += passwordValidation.score

        // Name validation
        const nameValidation = this.validateName(data.firstName, data.lastName, context)
        errors.push(...nameValidation.errors)
        warnings.push(...nameValidation.warnings)
        score += nameValidation.score

        // Phone validation (optional)
        if (data.phone) {
            const phoneValidation = this.validatePhone(data.phone, context)
            errors.push(...phoneValidation.errors)
            warnings.push(...phoneValidation.warnings)
            score += phoneValidation.score
        }

        // Terms acceptance validation
        if (!data.acceptTerms) {
            errors.push({
                field: 'acceptTerms',
                message: 'You must accept the terms and conditions',
                code: 'TERMS_NOT_ACCEPTED',
                severity: 'error',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score,
        }
    }

    /**
     * Validate login credentials
     */
    static validateLogin(data: any, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        // Email validation
        const emailValidation = this.validateEmail(data.email, context)
        errors.push(...emailValidation.errors)
        warnings.push(...emailValidation.warnings)
        score += emailValidation.score

        // Password validation
        const passwordValidation = this.validatePassword(data.password, context)
        errors.push(...passwordValidation.errors)
        warnings.push(...passwordValidation.warnings)
        score += passwordValidation.score

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score,
        }
    }

    /**
     * Validate password change
     */
    static validatePasswordChange(data: any, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        // Current password validation
        if (!data.currentPassword) {
            errors.push({
                field: 'currentPassword',
                message: 'Current password is required',
                code: 'CURRENT_PASSWORD_REQUIRED',
                severity: 'error',
            })
        }

        // New password validation
        const passwordValidation = this.validatePassword(data.newPassword, context)
        errors.push(...passwordValidation.errors)
        warnings.push(...passwordValidation.warnings)
        score += passwordValidation.score

        // Confirm password validation
        if (!data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Please confirm your new password',
                code: 'CONFIRM_PASSWORD_REQUIRED',
                severity: 'error',
            })
        } else if (data.newPassword !== data.confirmPassword) {
            errors.push({
                field: 'confirmPassword',
                message: 'Passwords do not match',
                code: 'PASSWORDS_DO_NOT_MATCH',
                severity: 'error',
            })
        }

        // Check if new password is different from current
        if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
            errors.push({
                field: 'newPassword',
                message: 'New password must be different from current password',
                code: 'SAME_PASSWORD',
                severity: 'error',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score,
        }
    }

    /**
     * Validate email
     */
    static validateEmail(email: string, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        if (!email) {
            errors.push({
                field: 'email',
                message: 'Email is required',
                code: 'EMAIL_REQUIRED',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        // Format validation
        if (!this.EMAIL_REGEX.test(email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format',
                code: 'INVALID_EMAIL_FORMAT',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        score += 20

        // Check for disposable email
        if (this.isDisposableEmail(email)) {
            warnings.push({
                field: 'email',
                message: 'Disposable email addresses are not recommended',
                code: 'DISPOSABLE_EMAIL',
                suggestion: 'Please use a permanent email address',
            })
            score -= 5
        }

        // Check for common typos
        const typoCheck = this.checkEmailTypo(email)
        if (typoCheck.hasTypo) {
            warnings.push({
                field: 'email',
                message: `Did you mean ${typoCheck.suggestion}?`,
                code: 'EMAIL_TYPO',
                suggestion: typoCheck.suggestion,
            })
        }

        return { isValid: errors.length === 0, errors, warnings, score }
    }

    /**
     * Validate password
     */
    static validatePassword(password: string, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        if (!password) {
            errors.push({
                field: 'password',
                message: 'Password is required',
                code: 'PASSWORD_REQUIRED',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        // Length validation
        if (password.length < this.PASSWORD_MIN_LENGTH) {
            errors.push({
                field: 'password',
                message: `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters`,
                code: 'PASSWORD_TOO_SHORT',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        if (password.length > this.PASSWORD_MAX_LENGTH) {
            errors.push({
                field: 'password',
                message: `Password must be no more than ${this.PASSWORD_MAX_LENGTH} characters`,
                code: 'PASSWORD_TOO_LONG',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        score += 20

        // Character variety checks
        if (!/[A-Z]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding uppercase letters',
                code: 'NO_UPPERCASE',
                suggestion: 'Add uppercase letters for better security',
            })
            score -= 2
        }

        if (!/[a-z]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding lowercase letters',
                code: 'NO_LOWERCASE',
                suggestion: 'Add lowercase letters for better security',
            })
            score -= 2
        }

        if (!/[0-9]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding numbers',
                code: 'NO_NUMBERS',
                suggestion: 'Add numbers for better security',
            })
            score -= 2
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            warnings.push({
                field: 'password',
                message: 'Consider adding special characters',
                code: 'NO_SPECIAL_CHARS',
                suggestion: 'Add special characters for better security',
            })
            score -= 2
        }

        // Common password check
        if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
            errors.push({
                field: 'password',
                message: 'This password is too common. Please choose a stronger password.',
                code: 'COMMON_PASSWORD',
                severity: 'error',
            })
            score -= 10
        }

        // Sequential pattern check
        if (this.hasSequentialPattern(password)) {
            warnings.push({
                field: 'password',
                message: 'Avoid sequential patterns',
                code: 'SEQUENTIAL_PATTERN',
                suggestion: 'Use random characters instead of sequences',
            })
            score -= 5
        }

        // Repeated character check
        if (this.hasRepeatedCharacters(password)) {
            warnings.push({
                field: 'password',
                message: 'Avoid repeated characters',
                code: 'REPEATED_CHARS',
                suggestion: 'Use varied characters',
            })
            score -= 3
        }

        return { isValid: errors.length === 0, errors, warnings, score }
    }

    /**
     * Validate name
     */
    static validateName(firstName: string, lastName: string, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        // First name validation
        if (!firstName) {
            errors.push({
                field: 'firstName',
                message: 'First name is required',
                code: 'FIRST_NAME_REQUIRED',
                severity: 'error',
            })
        } else if (firstName.length < 2) {
            errors.push({
                field: 'firstName',
                message: 'First name must be at least 2 characters',
                code: 'FIRST_NAME_TOO_SHORT',
                severity: 'error',
            })
        } else if (firstName.length > 50) {
            errors.push({
                field: 'firstName',
                message: 'First name must be no more than 50 characters',
                code: 'FIRST_NAME_TOO_LONG',
                severity: 'error',
            })
        } else {
            score += 10
        }

        // Last name validation
        if (!lastName) {
            errors.push({
                field: 'lastName',
                message: 'Last name is required',
                code: 'LAST_NAME_REQUIRED',
                severity: 'error',
            })
        } else if (lastName.length < 2) {
            errors.push({
                field: 'lastName',
                message: 'Last name must be at least 2 characters',
                code: 'LAST_NAME_TOO_SHORT',
                severity: 'error',
            })
        } else if (lastName.length > 50) {
            errors.push({
                field: 'lastName',
                message: 'Last name must be no more than 50 characters',
                code: 'LAST_NAME_TOO_LONG',
                severity: 'error',
            })
        } else {
            score += 10
        }

        // Check for suspicious patterns
        if (this.hasSuspiciousPattern(firstName) || this.hasSuspiciousPattern(lastName)) {
            warnings.push({
                field: 'name',
                message: 'Name contains suspicious patterns',
                code: 'SUSPICIOUS_NAME',
                suggestion: 'Please use your real name',
            })
            score -= 5
        }

        return { isValid: errors.length === 0, errors, warnings, score }
    }

    /**
     * Validate phone number
     */
    static validatePhone(phone: string, context?: ValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationWarning[] = []
        let score = 0

        if (!phone) {
            return { isValid: true, errors, warnings, score }
        }

        // Format validation
        if (!this.PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
            errors.push({
                field: 'phone',
                message: 'Invalid phone number format',
                code: 'INVALID_PHONE_FORMAT',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, score }
        }

        score += 10

        // Check for suspicious patterns
        if (this.hasSuspiciousPhonePattern(phone)) {
            warnings.push({
                field: 'phone',
                message: 'Phone number contains suspicious patterns',
                code: 'SUSPICIOUS_PHONE',
                suggestion: 'Please use a valid phone number',
            })
            score -= 5
        }

        return { isValid: errors.length === 0, errors, warnings, score }
    }

    /**
     * Perform security checks
     */
    static async performSecurityChecks(data: any, context?: ValidationContext): Promise<SecurityCheck[]> {
        const checks: SecurityCheck[] = []

        // Password strength check
        if (data.password) {
            const passwordStrength = this.calculatePasswordStrength(data.password)
            checks.push({
                type: 'password_strength',
                status: passwordStrength >= 70 ? 'pass' : passwordStrength >= 50 ? 'warning' : 'fail',
                message: `Password strength: ${passwordStrength}%`,
                score: passwordStrength,
                recommendations: this.getPasswordRecommendations(data.password),
            })
        }

        // Email verification check
        if (data.email) {
            const emailScore = this.calculateEmailScore(data.email)
            checks.push({
                type: 'email_verification',
                status: emailScore >= 80 ? 'pass' : emailScore >= 60 ? 'warning' : 'fail',
                message: `Email verification score: ${emailScore}%`,
                score: emailScore,
                recommendations: this.getEmailRecommendations(data.email),
            })
        }

        // Breach check (simulated)
        if (data.password) {
            const breachCheck = await this.checkPasswordBreach(data.password)
            checks.push({
                type: 'breach_check',
                status: breachCheck ? 'fail' : 'pass',
                message: breachCheck ? 'Password found in data breaches' : 'Password not found in breaches',
                score: breachCheck ? 0 : 100,
                recommendations: breachCheck ? ['Change password immediately'] : [],
            })
        }

        return checks
    }

    /**
     * Calculate password strength
     */
    static calculatePasswordStrength(password: string): number {
        let strength = 0

        // Length bonus
        if (password.length >= 8) strength += 20
        if (password.length >= 12) strength += 10
        if (password.length >= 16) strength += 10

        // Character variety bonus
        if (/[A-Z]/.test(password)) strength += 10
        if (/[a-z]/.test(password)) strength += 10
        if (/[0-9]/.test(password)) strength += 10
        if (/[^A-Za-z0-9]/.test(password)) strength += 10

        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) strength -= 10 // Repeated characters
        if (/123|abc|qwe/i.test(password)) strength -= 15 // Sequential patterns

        return Math.max(0, Math.min(100, strength))
    }

    /**
     * Calculate email score
     */
    static calculateEmailScore(email: string): number {
        let score = 0

        if (this.EMAIL_REGEX.test(email)) score += 40
        if (email.length > 5) score += 20
        if (!this.isDisposableEmail(email)) score += 30
        if (!this.hasEmailTypo(email)) score += 10

        return score
    }

    /**
     * Check if email is disposable
     */
    private static isDisposableEmail(email: string): boolean {
        const disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'temp-mail.org', 'throwaway.email'
        ]

        const domain = email.split('@')[1]
        return disposableDomains.includes(domain)
    }

    /**
     * Check for email typos
     */
    private static hasEmailTypo(email: string): boolean {
        const commonTypos = {
            'gmail.com': ['gmial.com', 'gmail.co', 'gmai.com'],
            'yahoo.com': ['yaho.com', 'yahoo.co', 'yaho.com'],
            'hotmail.com': ['hotmai.com', 'hotmail.co', 'hotmai.com'],
        }

        const domain = email.split('@')[1]
        for (const [correct, typos] of Object.entries(commonTypos)) {
            if (typos.includes(domain)) return true
        }

        return false
    }

    /**
     * Check email typo and suggest correction
     */
    private static checkEmailTypo(email: string): { hasTypo: boolean; suggestion?: string } {
        const commonTypos = {
            'gmial.com': 'gmail.com',
            'gmail.co': 'gmail.com',
            'gmai.com': 'gmail.com',
            'yaho.com': 'yahoo.com',
            'yahoo.co': 'yahoo.com',
            'hotmai.com': 'hotmail.com',
            'hotmail.co': 'hotmail.com',
        }

        const domain = email.split('@')[1]
        if (commonTypos[domain]) {
            return {
                hasTypo: true,
                suggestion: email.replace(domain, commonTypos[domain]),
            }
        }

        return { hasTypo: false }
    }

    /**
     * Check for sequential patterns
     */
    private static hasSequentialPattern(password: string): boolean {
        const sequences = ['123', 'abc', 'qwe', 'asd', 'zxc']
        return sequences.some(seq => password.toLowerCase().includes(seq))
    }

    /**
     * Check for repeated characters
     */
    private static hasRepeatedCharacters(password: string): boolean {
        return /(.)\1{2,}/.test(password)
    }

    /**
     * Check for suspicious patterns in name
     */
    private static hasSuspiciousPattern(name: string): boolean {
        const suspiciousPatterns = [
            /^\d+$/, // Only numbers
            /^[^a-zA-Z]+$/, // No letters
            /(.)\1{3,}/, // Repeated characters
        ]

        return suspiciousPatterns.some(pattern => pattern.test(name))
    }

    /**
     * Check for suspicious phone patterns
     */
    private static hasSuspiciousPhonePattern(phone: string): boolean {
        const suspiciousPatterns = [
            /^(\d)\1{9,}$/, // All same digits
            /^1234567890$/, // Sequential
            /^0000000000$/, // All zeros
        ]

        return suspiciousPatterns.some(pattern => pattern.test(phone.replace(/\D/g, '')))
    }

    /**
     * Check password breach (simulated)
     */
    private static async checkPasswordBreach(password: string): Promise<boolean> {
        // In production, this would use HaveIBeenPwned API
        return false
    }

    /**
     * Get password recommendations
     */
    private static getPasswordRecommendations(password: string): string[] {
        const recommendations: string[] = []

        if (password.length < 12) {
            recommendations.push('Use at least 12 characters')
        }

        if (!/[A-Z]/.test(password)) {
            recommendations.push('Add uppercase letters')
        }

        if (!/[a-z]/.test(password)) {
            recommendations.push('Add lowercase letters')
        }

        if (!/[0-9]/.test(password)) {
            recommendations.push('Add numbers')
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            recommendations.push('Add special characters')
        }

        if (this.hasSequentialPattern(password)) {
            recommendations.push('Avoid sequential patterns')
        }

        if (this.hasRepeatedCharacters(password)) {
            recommendations.push('Avoid repeated characters')
        }

        return recommendations
    }

    /**
     * Get email recommendations
     */
    private static getEmailRecommendations(email: string): string[] {
        const recommendations: string[] = []

        if (this.isDisposableEmail(email)) {
            recommendations.push('Use a permanent email address')
        }

        if (this.hasEmailTypo(email)) {
            recommendations.push('Check for typos in email address')
        }

        return recommendations
    }
}

export default AuthValidation
