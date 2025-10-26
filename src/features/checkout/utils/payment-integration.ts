import { PaymentMethod, PaymentDetails } from './checkout-flow'

export interface PaymentGateway {
    id: string
    name: string
    type: 'stripe' | 'paypal' | 'razorpay' | 'square' | 'adyen'
    isActive: boolean
    config: PaymentGatewayConfig
}

export interface PaymentGatewayConfig {
    publicKey: string
    secretKey: string
    webhookSecret: string
    environment: 'sandbox' | 'production'
    supportedCurrencies: string[]
    supportedCountries: string[]
}

export interface PaymentRequest {
    amount: number
    currency: string
    orderId: string
    customerId?: string
    description: string
    metadata: Record<string, any>
    returnUrl: string
    cancelUrl: string
}

export interface PaymentResponse {
    success: boolean
    paymentId: string
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
    clientSecret?: string
    redirectUrl?: string
    error?: string
    metadata: Record<string, any>
}

export interface PaymentIntent {
    id: string
    amount: number
    currency: string
    status: string
    clientSecret: string
    metadata: Record<string, any>
}

export interface PaymentMethodData {
    type: string
    card?: {
        number: string
        expMonth: number
        expYear: number
        cvc: string
    }
    upi?: {
        id: string
    }
    netbanking?: {
        bank: string
    }
    wallet?: {
        provider: string
    }
}

export interface PaymentValidation {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export class PaymentIntegration {
    private gateways: Map<string, PaymentGateway> = new Map()
    private activeGateway: PaymentGateway | null = null

    constructor() {
        this.initializeGateways()
    }

    /**
     * Initialize payment gateways
     */
    private initializeGateways(): void {
        // Stripe
        this.gateways.set('stripe', {
            id: 'stripe',
            name: 'Stripe',
            type: 'stripe',
            isActive: true,
            config: {
                publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
                secretKey: process.env.STRIPE_SECRET_KEY || '',
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
                environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
                supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
                supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
            },
        })

        // PayPal
        this.gateways.set('paypal', {
            id: 'paypal',
            name: 'PayPal',
            type: 'paypal',
            isActive: true,
            config: {
                publicKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
                webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET || '',
                environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
                supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
                supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
            },
        })

        // Razorpay
        this.gateways.set('razorpay', {
            id: 'razorpay',
            name: 'Razorpay',
            type: 'razorpay',
            isActive: true,
            config: {
                publicKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
                secretKey: process.env.RAZORPAY_KEY_SECRET || '',
                webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
                environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
                supportedCurrencies: ['INR', 'USD'],
                supportedCountries: ['IN', 'US'],
            },
        })
    }

    /**
     * Set active payment gateway
     */
    setActiveGateway(gatewayId: string): boolean {
        const gateway = this.gateways.get(gatewayId)
        if (gateway && gateway.isActive) {
            this.activeGateway = gateway
            return true
        }
        return false
    }

    /**
     * Get active payment gateway
     */
    getActiveGateway(): PaymentGateway | null {
        return this.activeGateway
    }

    /**
     * Get available payment gateways
     */
    getAvailableGateways(): PaymentGateway[] {
        return Array.from(this.gateways.values()).filter(gateway => gateway.isActive)
    }

    /**
     * Create payment intent
     */
    async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
        if (!this.activeGateway) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: 'No active payment gateway',
                metadata: {},
            }
        }

        try {
            switch (this.activeGateway.type) {
                case 'stripe':
                    return await this.createStripePaymentIntent(request)
                case 'paypal':
                    return await this.createPayPalPayment(request)
                case 'razorpay':
                    return await this.createRazorpayPayment(request)
                default:
                    throw new Error(`Unsupported payment gateway: ${this.activeGateway.type}`)
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Create Stripe payment intent
     */
    private async createStripePaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/stripe/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    paymentId: data.paymentIntent.id,
                    status: 'pending',
                    clientSecret: data.paymentIntent.client_secret,
                    metadata: data.paymentIntent.metadata,
                }
            } else {
                return {
                    success: false,
                    paymentId: '',
                    status: 'failed',
                    error: data.error,
                    metadata: {},
                }
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Create PayPal payment
     */
    private async createPayPalPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    paymentId: data.orderId,
                    status: 'pending',
                    redirectUrl: data.approvalUrl,
                    metadata: data.metadata,
                }
            } else {
                return {
                    success: false,
                    paymentId: '',
                    status: 'failed',
                    error: data.error,
                    metadata: {},
                }
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Create Razorpay payment
     */
    private async createRazorpayPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    paymentId: data.orderId,
                    status: 'pending',
                    metadata: data.metadata,
                }
            } else {
                return {
                    success: false,
                    paymentId: '',
                    status: 'failed',
                    error: data.error,
                    metadata: {},
                }
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Confirm payment
     */
    async confirmPayment(paymentId: string, paymentMethodData: PaymentMethodData): Promise<PaymentResponse> {
        if (!this.activeGateway) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: 'No active payment gateway',
                metadata: {},
            }
        }

        try {
            switch (this.activeGateway.type) {
                case 'stripe':
                    return await this.confirmStripePayment(paymentId, paymentMethodData)
                case 'paypal':
                    return await this.confirmPayPalPayment(paymentId)
                case 'razorpay':
                    return await this.confirmRazorpayPayment(paymentId, paymentMethodData)
                default:
                    throw new Error(`Unsupported payment gateway: ${this.activeGateway.type}`)
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Confirm Stripe payment
     */
    private async confirmStripePayment(paymentId: string, paymentMethodData: PaymentMethodData): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/stripe/confirm-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    paymentMethodData,
                }),
            })

            const data = await response.json()

            return {
                success: data.success,
                paymentId: data.paymentIntent.id,
                status: data.paymentIntent.status,
                metadata: data.paymentIntent.metadata,
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Confirm PayPal payment
     */
    private async confirmPayPalPayment(paymentId: string): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentId }),
            })

            const data = await response.json()

            return {
                success: data.success,
                paymentId: data.paymentId,
                status: data.status,
                metadata: data.metadata,
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Confirm Razorpay payment
     */
    private async confirmRazorpayPayment(paymentId: string, paymentMethodData: PaymentMethodData): Promise<PaymentResponse> {
        try {
            const response = await fetch('/api/payments/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    paymentMethodData,
                }),
            })

            const data = await response.json()

            return {
                success: data.success,
                paymentId: data.paymentId,
                status: data.status,
                metadata: data.metadata,
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Validate payment method
     */
    validatePaymentMethod(paymentMethod: PaymentMethod, paymentDetails: PaymentDetails): PaymentValidation {
        const errors: string[] = []
        const warnings: string[] = []

        // Validate payment method
        if (!paymentMethod) {
            errors.push('Payment method is required')
        }

        // Validate payment details based on method type
        if (paymentDetails.method.type === 'card') {
            if (!paymentDetails.card) {
                errors.push('Card details are required')
            } else {
                // Validate card number
                if (!this.validateCardNumber(paymentDetails.card.number)) {
                    errors.push('Invalid card number')
                }

                // Validate expiry date
                if (!this.validateExpiryDate(paymentDetails.card.expiryMonth, paymentDetails.card.expiryYear)) {
                    errors.push('Invalid expiry date')
                }

                // Validate CVV
                if (!this.validateCVV(paymentDetails.card.cvv)) {
                    errors.push('Invalid CVV')
                }
            }
        }

        if (paymentDetails.method.type === 'upi') {
            if (!paymentDetails.upi || !paymentDetails.upi.id) {
                errors.push('UPI ID is required')
            } else if (!this.validateUPIId(paymentDetails.upi.id)) {
                errors.push('Invalid UPI ID format')
            }
        }

        if (paymentDetails.method.type === 'netbanking') {
            if (!paymentDetails.netbanking || !paymentDetails.netbanking.bank) {
                errors.push('Bank selection is required')
            }
        }

        if (paymentDetails.method.type === 'wallet') {
            if (!paymentDetails.wallet || !paymentDetails.wallet.provider) {
                errors.push('Wallet provider is required')
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Validate card number
     */
    private validateCardNumber(cardNumber: string): boolean {
        // Remove spaces and non-digits
        const cleaned = cardNumber.replace(/\D/g, '')

        // Check length
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false
        }

        // Luhn algorithm
        let sum = 0
        let isEven = false

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i])

            if (isEven) {
                digit *= 2
                if (digit > 9) {
                    digit -= 9
                }
            }

            sum += digit
            isEven = !isEven
        }

        return sum % 10 === 0
    }

    /**
     * Validate expiry date
     */
    private validateExpiryDate(month: number, year: number): boolean {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1

        if (year < currentYear) {
            return false
        }

        if (year === currentYear && month < currentMonth) {
            return false
        }

        if (month < 1 || month > 12) {
            return false
        }

        return true
    }

    /**
     * Validate CVV
     */
    private validateCVV(cvv: string): boolean {
        const cleaned = cvv.replace(/\D/g, '')
        return cleaned.length >= 3 && cleaned.length <= 4
    }

    /**
     * Validate UPI ID
     */
    private validateUPIId(upiId: string): boolean {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
        return upiRegex.test(upiId)
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
        if (!this.activeGateway) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: 'No active payment gateway',
                metadata: {},
            }
        }

        try {
            const response = await fetch(`/api/payments/${this.activeGateway.type}/status/${paymentId}`)
            const data = await response.json()

            return {
                success: data.success,
                paymentId: data.paymentId,
                status: data.status,
                metadata: data.metadata,
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Refund payment
     */
    async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
        if (!this.activeGateway) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: 'No active payment gateway',
                metadata: {},
            }
        }

        try {
            const response = await fetch('/api/payments/refund', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentId,
                    amount,
                }),
            })

            const data = await response.json()

            return {
                success: data.success,
                paymentId: data.paymentId,
                status: data.status,
                metadata: data.metadata,
            }
        } catch (error) {
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                error: error.message,
                metadata: {},
            }
        }
    }

    /**
     * Get supported currencies
     */
    getSupportedCurrencies(): string[] {
        if (!this.activeGateway) return []
        return this.activeGateway.config.supportedCurrencies
    }

    /**
     * Get supported countries
     */
    getSupportedCountries(): string[] {
        if (!this.activeGateway) return []
        return this.activeGateway.config.supportedCountries
    }
}

export const paymentIntegration = new PaymentIntegration()
export default paymentIntegration
