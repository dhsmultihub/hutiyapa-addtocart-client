import { CartItem } from '../../cart/redux/cart.slice'
import { Address } from '../../address/redux/address.slice'
import { PaymentDetails } from './checkout-flow'

export interface ValidationError {
    field: string
    message: string
    code: string
    severity: 'error' | 'warning' | 'info'
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
    info: ValidationError[]
    totalErrors: number
    totalWarnings: number
    totalInfo: number
}

export interface CheckoutValidationContext {
    cart: {
        items: CartItem[]
        subtotal: number
        total: number
    }
    shipping: {
        address: Address | null
        method: string | null
    }
    billing: {
        address: Address | null
        sameAsShipping: boolean
    }
    payment: {
        method: string | null
        details: PaymentDetails | null
    }
}

export class CheckoutValidator {
    private static readonly MIN_ORDER_VALUE = 0
    private static readonly MAX_ORDER_VALUE = 10000
    private static readonly MAX_ITEMS_PER_ORDER = 50
    private static readonly REQUIRED_FIELDS = {
        address: ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'],
        payment: ['method', 'details'],
    }

    /**
     * Validate entire checkout process
     */
    static validateCheckout(context: CheckoutValidationContext): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Validate cart
        const cartValidation = this.validateCart(context.cart)
        errors.push(...cartValidation.errors)
        warnings.push(...cartValidation.warnings)
        info.push(...cartValidation.info)

        // Validate shipping
        const shippingValidation = this.validateShipping(context.shipping)
        errors.push(...shippingValidation.errors)
        warnings.push(...shippingValidation.warnings)
        info.push(...shippingValidation.info)

        // Validate billing
        const billingValidation = this.validateBilling(context.billing, context.shipping)
        errors.push(...billingValidation.errors)
        warnings.push(...billingValidation.warnings)
        info.push(...billingValidation.info)

        // Validate payment
        const paymentValidation = this.validatePayment(context.payment)
        errors.push(...paymentValidation.errors)
        warnings.push(...paymentValidation.warnings)
        info.push(...paymentValidation.info)

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate cart
     */
    static validateCart(cart: CheckoutValidationContext['cart']): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Check if cart is empty
        if (!cart.items || cart.items.length === 0) {
            errors.push({
                field: 'cart.items',
                message: 'Cart is empty',
                code: 'CART_EMPTY',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, info, totalErrors: 1, totalWarnings: 0, totalInfo: 0 }
        }

        // Check minimum order value
        if (cart.subtotal < this.MIN_ORDER_VALUE) {
            errors.push({
                field: 'cart.subtotal',
                message: `Minimum order value is $${this.MIN_ORDER_VALUE}`,
                code: 'MIN_ORDER_VALUE',
                severity: 'error',
            })
        }

        // Check maximum order value
        if (cart.subtotal > this.MAX_ORDER_VALUE) {
            errors.push({
                field: 'cart.subtotal',
                message: `Maximum order value is $${this.MAX_ORDER_VALUE}`,
                code: 'MAX_ORDER_VALUE',
                severity: 'error',
            })
        }

        // Check maximum items
        if (cart.items.length > this.MAX_ITEMS_PER_ORDER) {
            errors.push({
                field: 'cart.items',
                message: `Maximum ${this.MAX_ITEMS_PER_ORDER} items per order`,
                code: 'MAX_ITEMS',
                severity: 'error',
            })
        }

        // Validate individual items
        cart.items.forEach((item, index) => {
            const itemValidation = this.validateCartItem(item, index)
            errors.push(...itemValidation.errors)
            warnings.push(...itemValidation.warnings)
            info.push(...itemValidation.info)
        })

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate cart item
     */
    static validateCartItem(item: CartItem, index: number): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Check required fields
        if (!item.id) {
            errors.push({
                field: `items[${index}].id`,
                message: 'Product ID is required',
                code: 'MISSING_PRODUCT_ID',
                severity: 'error',
            })
        }

        if (!item.title) {
            errors.push({
                field: `items[${index}].title`,
                message: 'Product title is required',
                code: 'MISSING_PRODUCT_TITLE',
                severity: 'error',
            })
        }

        if (!item.price || item.price <= 0) {
            errors.push({
                field: `items[${index}].price`,
                message: 'Valid price is required',
                code: 'INVALID_PRICE',
                severity: 'error',
            })
        }

        if (!item.quantity || item.quantity <= 0) {
            errors.push({
                field: `items[${index}].quantity`,
                message: 'Valid quantity is required',
                code: 'INVALID_QUANTITY',
                severity: 'error',
            })
        }

        // Check quantity limits
        if (item.quantity > 99) {
            errors.push({
                field: `items[${index}].quantity`,
                message: 'Maximum quantity is 99',
                code: 'MAX_QUANTITY',
                severity: 'error',
            })
        }

        // Check price reasonableness
        if (item.price > 10000) {
            warnings.push({
                field: `items[${index}].price`,
                message: 'Price seems unusually high',
                code: 'HIGH_PRICE',
                severity: 'warning',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate shipping information
     */
    static validateShipping(shipping: CheckoutValidationContext['shipping']): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Check if address is provided
        if (!shipping.address) {
            errors.push({
                field: 'shipping.address',
                message: 'Shipping address is required',
                code: 'MISSING_SHIPPING_ADDRESS',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, info, totalErrors: 1, totalWarnings: 0, totalInfo: 0 }
        }

        // Validate address fields
        const addressValidation = this.validateAddress(shipping.address, 'shipping')
        errors.push(...addressValidation.errors)
        warnings.push(...addressValidation.warnings)
        info.push(...addressValidation.info)

        // Check shipping method
        if (!shipping.method) {
            errors.push({
                field: 'shipping.method',
                message: 'Shipping method is required',
                code: 'MISSING_SHIPPING_METHOD',
                severity: 'error',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate billing information
     */
    static validateBilling(
        billing: CheckoutValidationContext['billing'],
        shipping: CheckoutValidationContext['shipping']
    ): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // If same as shipping, skip validation
        if (billing.sameAsShipping) {
            if (!shipping.address) {
                errors.push({
                    field: 'billing.address',
                    message: 'Shipping address is required when billing same as shipping',
                    code: 'MISSING_SHIPPING_FOR_BILLING',
                    severity: 'error',
                })
            }
            return { isValid: errors.length === 0, errors, warnings, info, totalErrors: errors.length, totalWarnings: 0, totalInfo: 0 }
        }

        // Check if billing address is provided
        if (!billing.address) {
            errors.push({
                field: 'billing.address',
                message: 'Billing address is required',
                code: 'MISSING_BILLING_ADDRESS',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, info, totalErrors: 1, totalWarnings: 0, totalInfo: 0 }
        }

        // Validate billing address
        const addressValidation = this.validateAddress(billing.address, 'billing')
        errors.push(...addressValidation.errors)
        warnings.push(...addressValidation.warnings)
        info.push(...addressValidation.info)

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate payment information
     */
    static validatePayment(payment: CheckoutValidationContext['payment']): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Check payment method
        if (!payment.method) {
            errors.push({
                field: 'payment.method',
                message: 'Payment method is required',
                code: 'MISSING_PAYMENT_METHOD',
                severity: 'error',
            })
        }

        // Check payment details
        if (!payment.details) {
            errors.push({
                field: 'payment.details',
                message: 'Payment details are required',
                code: 'MISSING_PAYMENT_DETAILS',
                severity: 'error',
            })
            return { isValid: false, errors, warnings, info, totalErrors: errors.length, totalWarnings: 0, totalInfo: 0 }
        }

        // Validate payment details based on method
        const detailsValidation = this.validatePaymentDetails(payment.details)
        errors.push(...detailsValidation.errors)
        warnings.push(...detailsValidation.warnings)
        info.push(...detailsValidation.info)

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate address
     */
    static validateAddress(address: Address, type: 'shipping' | 'billing'): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        const requiredFields = this.REQUIRED_FIELDS.address

        // Check required fields
        requiredFields.forEach(field => {
            if (!address[field as keyof Address] || address[field as keyof Address] === '') {
                errors.push({
                    field: `${type}.${field}`,
                    message: `${this.capitalize(field)} is required`,
                    code: `MISSING_${field.toUpperCase()}`,
                    severity: 'error',
                })
            }
        })

        // Validate email format
        if (address.email && !this.isValidEmail(address.email)) {
            errors.push({
                field: `${type}.email`,
                message: 'Invalid email format',
                code: 'INVALID_EMAIL',
                severity: 'error',
            })
        }

        // Validate phone format
        if (address.phone && !this.isValidPhone(address.phone)) {
            warnings.push({
                field: `${type}.phone`,
                message: 'Phone number format may be invalid',
                code: 'INVALID_PHONE',
                severity: 'warning',
            })
        }

        // Validate postal code format
        if (address.postalCode && !this.isValidPostalCode(address.postalCode, address.country)) {
            warnings.push({
                field: `${type}.postalCode`,
                message: 'Postal code format may be invalid',
                code: 'INVALID_POSTAL_CODE',
                severity: 'warning',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate payment details
     */
    static validatePaymentDetails(details: PaymentDetails): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Validate based on payment method type
        switch (details.method.type) {
            case 'card':
                if (!details.card) {
                    errors.push({
                        field: 'payment.card',
                        message: 'Card details are required',
                        code: 'MISSING_CARD_DETAILS',
                        severity: 'error',
                    })
                } else {
                    const cardValidation = this.validateCardDetails(details.card)
                    errors.push(...cardValidation.errors)
                    warnings.push(...cardValidation.warnings)
                    info.push(...cardValidation.info)
                }
                break

            case 'upi':
                if (!details.upi || !details.upi.id) {
                    errors.push({
                        field: 'payment.upi',
                        message: 'UPI ID is required',
                        code: 'MISSING_UPI_ID',
                        severity: 'error',
                    })
                } else if (!this.isValidUPIId(details.upi.id)) {
                    errors.push({
                        field: 'payment.upi.id',
                        message: 'Invalid UPI ID format',
                        code: 'INVALID_UPI_ID',
                        severity: 'error',
                    })
                }
                break

            case 'netbanking':
                if (!details.netbanking || !details.netbanking.bank) {
                    errors.push({
                        field: 'payment.netbanking',
                        message: 'Bank selection is required',
                        code: 'MISSING_BANK',
                        severity: 'error',
                    })
                }
                break

            case 'wallet':
                if (!details.wallet || !details.wallet.provider) {
                    errors.push({
                        field: 'payment.wallet',
                        message: 'Wallet provider is required',
                        code: 'MISSING_WALLET_PROVIDER',
                        severity: 'error',
                    })
                }
                break
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
        }
    }

    /**
     * Validate card details
     */
    static validateCardDetails(card: any): ValidationResult {
        const errors: ValidationError[] = []
        const warnings: ValidationError[] = []
        const info: ValidationError[] = []

        // Validate card number
        if (!card.number || !this.isValidCardNumber(card.number)) {
            errors.push({
                field: 'payment.card.number',
                message: 'Invalid card number',
                code: 'INVALID_CARD_NUMBER',
                severity: 'error',
            })
        }

        // Validate expiry date
        if (!card.expiryMonth || !card.expiryYear || !this.isValidExpiryDate(card.expiryMonth, card.expiryYear)) {
            errors.push({
                field: 'payment.card.expiry',
                message: 'Invalid expiry date',
                code: 'INVALID_EXPIRY_DATE',
                severity: 'error',
            })
        }

        // Validate CVV
        if (!card.cvv || !this.isValidCVV(card.cvv)) {
            errors.push({
                field: 'payment.card.cvv',
                message: 'Invalid CVV',
                code: 'INVALID_CVV',
                severity: 'error',
            })
        }

        // Validate name on card
        if (!card.name || card.name.trim().length < 2) {
            errors.push({
                field: 'payment.card.name',
                message: 'Name on card is required',
                code: 'MISSING_CARD_NAME',
                severity: 'error',
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            totalInfo: info.length,
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
     * Validate postal code format
     */
    private static isValidPostalCode(postalCode: string, country: string): boolean {
        const patterns: { [key: string]: RegExp } = {
            'US': /^\d{5}(-\d{4})?$/,
            'CA': /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
            'GB': /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
            'DE': /^\d{5}$/,
            'FR': /^\d{5}$/,
        }

        const pattern = patterns[country]
        return pattern ? pattern.test(postalCode) : true
    }

    /**
     * Validate card number
     */
    private static isValidCardNumber(cardNumber: string): boolean {
        const cleaned = cardNumber.replace(/\D/g, '')
        if (cleaned.length < 13 || cleaned.length > 19) return false

        // Luhn algorithm
        let sum = 0
        let isEven = false

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i])
            if (isEven) {
                digit *= 2
                if (digit > 9) digit -= 9
            }
            sum += digit
            isEven = !isEven
        }

        return sum % 10 === 0
    }

    /**
     * Validate expiry date
     */
    private static isValidExpiryDate(month: number, year: number): boolean {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1

        if (year < currentYear) return false
        if (year === currentYear && month < currentMonth) return false
        if (month < 1 || month > 12) return false

        return true
    }

    /**
     * Validate CVV
     */
    private static isValidCVV(cvv: string): boolean {
        const cleaned = cvv.replace(/\D/g, '')
        return cleaned.length >= 3 && cleaned.length <= 4
    }

    /**
     * Validate UPI ID
     */
    private static isValidUPIId(upiId: string): boolean {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
        return upiRegex.test(upiId)
    }

    /**
     * Capitalize string
     */
    private static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    /**
     * Get validation summary
     */
    static getValidationSummary(result: ValidationResult): {
        canProceed: boolean
        criticalIssues: number
        warnings: number
        summary: string
    } {
        const criticalIssues = result.errors.length
        const warnings = result.warnings.length
        const canProceed = result.isValid

        let summary = ''
        if (result.isValid && warnings === 0) {
            summary = 'Checkout is valid and ready to proceed'
        } else if (result.isValid && warnings > 0) {
            summary = `Checkout is valid with ${warnings} warning(s)`
        } else {
            summary = `Checkout has ${criticalIssues} error(s) and ${warnings} warning(s)`
        }

        return {
            canProceed,
            criticalIssues,
            warnings,
            summary,
        }
    }
}

export default CheckoutValidator
