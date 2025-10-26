import { CartItem } from '../../cart/redux/cart.slice'
import { Address } from '../../address/redux/address.slice'

export interface CheckoutStep {
    id: string
    title: string
    description: string
    isCompleted: boolean
    isActive: boolean
    isOptional: boolean
    validation: CheckoutValidation
}

export interface CheckoutValidation {
    isValid: boolean
    errors: string[]
    warnings: string[]
    required: string[]
}

export interface CheckoutState {
    currentStep: number
    steps: CheckoutStep[]
    isCompleted: boolean
    canProceed: boolean
    hasErrors: boolean
    progress: number
}

export interface CheckoutData {
    cart: {
        items: CartItem[]
        subtotal: number
        total: number
        shipping: number
        tax: number
        discount: number
    }
    shipping: {
        address: Address | null
        method: ShippingMethod | null
        cost: number
        estimatedDays: string
    }
    billing: {
        address: Address | null
        sameAsShipping: boolean
    }
    payment: {
        method: PaymentMethod | null
        details: PaymentDetails | null
        isProcessed: boolean
    }
    order: {
        id: string | null
        status: OrderStatus
        confirmationNumber: string | null
        estimatedDelivery: string | null
    }
}

export interface ShippingMethod {
    id: string
    name: string
    description: string
    cost: number
    estimatedDays: string
    isAvailable: boolean
    trackingAvailable: boolean
}

export interface PaymentMethod {
    id: string
    type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod'
    name: string
    description: string
    icon: string
    isAvailable: boolean
    processingFee: number
}

export interface PaymentDetails {
    method: PaymentMethod
    card?: {
        number: string
        expiryMonth: number
        expiryYear: number
        cvv: string
        name: string
        type: 'visa' | 'mastercard' | 'amex' | 'discover'
    }
    upi?: {
        id: string
        provider: string
    }
    netbanking?: {
        bank: string
        accountType: string
    }
    wallet?: {
        provider: string
        phone: string
    }
}

export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'confirmed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'

export class CheckoutFlow {
    private steps: CheckoutStep[]
    private currentStepIndex: number
    private checkoutData: CheckoutData
    private validationRules: Map<string, (data: any) => CheckoutValidation>

    constructor() {
        this.currentStepIndex = 0
        this.checkoutData = this.getInitialCheckoutData()
        this.steps = this.initializeSteps()
        this.validationRules = this.initializeValidationRules()
    }

    /**
     * Initialize checkout steps
     */
    private initializeSteps(): CheckoutStep[] {
        return [
            {
                id: 'cart',
                title: 'Review Cart',
                description: 'Review your items and quantities',
                isCompleted: false,
                isActive: true,
                isOptional: false,
                validation: { isValid: false, errors: [], warnings: [], required: ['items'] },
            },
            {
                id: 'shipping',
                title: 'Shipping Information',
                description: 'Enter shipping address and method',
                isCompleted: false,
                isActive: false,
                isOptional: false,
                validation: { isValid: false, errors: [], warnings: [], required: ['address', 'method'] },
            },
            {
                id: 'billing',
                title: 'Billing Information',
                description: 'Enter billing address',
                isCompleted: false,
                isActive: false,
                isOptional: false,
                validation: { isValid: false, errors: [], warnings: [], required: ['address'] },
            },
            {
                id: 'payment',
                title: 'Payment Method',
                description: 'Select and enter payment details',
                isCompleted: false,
                isActive: false,
                isOptional: false,
                validation: { isValid: false, errors: [], warnings: [], required: ['method', 'details'] },
            },
            {
                id: 'review',
                title: 'Review & Confirm',
                description: 'Review your order and confirm',
                isCompleted: false,
                isActive: false,
                isOptional: false,
                validation: { isValid: false, errors: [], warnings: [], required: ['order'] },
            },
        ]
    }

    /**
     * Initialize validation rules
     */
    private initializeValidationRules(): Map<string, (data: any) => CheckoutValidation> {
        const rules = new Map()

        rules.set('cart', (data: any) => {
            const errors: string[] = []
            const warnings: string[] = []

            if (!data.items || data.items.length === 0) {
                errors.push('Cart is empty')
            }

            if (data.subtotal <= 0) {
                errors.push('Invalid cart total')
            }

            return { isValid: errors.length === 0, errors, warnings, required: ['items'] }
        })

        rules.set('shipping', (data: any) => {
            const errors: string[] = []
            const warnings: string[] = []

            if (!data.address) {
                errors.push('Shipping address is required')
            }

            if (!data.method) {
                errors.push('Shipping method is required')
            }

            return { isValid: errors.length === 0, errors, warnings, required: ['address', 'method'] }
        })

        rules.set('billing', (data: any) => {
            const errors: string[] = []
            const warnings: string[] = []

            if (!data.address) {
                errors.push('Billing address is required')
            }

            return { isValid: errors.length === 0, errors, warnings, required: ['address'] }
        })

        rules.set('payment', (data: any) => {
            const errors: string[] = []
            const warnings: string[] = []

            if (!data.method) {
                errors.push('Payment method is required')
            }

            if (!data.details) {
                errors.push('Payment details are required')
            }

            return { isValid: errors.length === 0, errors, warnings, required: ['method', 'details'] }
        })

        rules.set('review', (data: any) => {
            const errors: string[] = []
            const warnings: string[] = []

            if (!data.order || !data.order.id) {
                errors.push('Order must be created before confirmation')
            }

            return { isValid: errors.length === 0, errors, warnings, required: ['order'] }
        })

        return rules
    }

    /**
     * Get initial checkout data
     */
    private getInitialCheckoutData(): CheckoutData {
        return {
            cart: {
                items: [],
                subtotal: 0,
                total: 0,
                shipping: 0,
                tax: 0,
                discount: 0,
            },
            shipping: {
                address: null,
                method: null,
                cost: 0,
                estimatedDays: '',
            },
            billing: {
                address: null,
                sameAsShipping: true,
            },
            payment: {
                method: null,
                details: null,
                isProcessed: false,
            },
            order: {
                id: null,
                status: 'pending',
                confirmationNumber: null,
                estimatedDelivery: null,
            },
        }
    }

    /**
     * Get current checkout state
     */
    getCheckoutState(): CheckoutState {
        const completedSteps = this.steps.filter(step => step.isCompleted).length
        const progress = (completedSteps / this.steps.length) * 100
        const hasErrors = this.steps.some(step => step.validation.errors.length > 0)
        const canProceed = this.steps[this.currentStepIndex]?.validation.isValid || false

        return {
            currentStep: this.currentStepIndex,
            steps: this.steps,
            isCompleted: completedSteps === this.steps.length,
            canProceed,
            hasErrors,
            progress,
        }
    }

    /**
     * Get current step
     */
    getCurrentStep(): CheckoutStep | null {
        return this.steps[this.currentStepIndex] || null
    }

    /**
     * Move to next step
     */
    nextStep(): boolean {
        if (this.currentStepIndex < this.steps.length - 1) {
            // Mark current step as completed
            this.steps[this.currentStepIndex].isCompleted = true
            this.steps[this.currentStepIndex].isActive = false

            // Move to next step
            this.currentStepIndex++
            this.steps[this.currentStepIndex].isActive = true

            return true
        }
        return false
    }

    /**
     * Move to previous step
     */
    previousStep(): boolean {
        if (this.currentStepIndex > 0) {
            // Mark current step as not completed
            this.steps[this.currentStepIndex].isCompleted = false
            this.steps[this.currentStepIndex].isActive = false

            // Move to previous step
            this.currentStepIndex--
            this.steps[this.currentStepIndex].isActive = true

            return true
        }
        return false
    }

    /**
     * Jump to specific step
     */
    goToStep(stepIndex: number): boolean {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            // Deactivate all steps
            this.steps.forEach(step => {
                step.isActive = false
            })

            // Activate target step
            this.currentStepIndex = stepIndex
            this.steps[stepIndex].isActive = true

            return true
        }
        return false
    }

    /**
     * Update checkout data
     */
    updateCheckoutData(section: keyof CheckoutData, data: any): void {
        this.checkoutData[section] = { ...this.checkoutData[section], ...data }
        this.validateCurrentStep()
    }

    /**
     * Validate current step
     */
    validateCurrentStep(): void {
        const currentStep = this.getCurrentStep()
        if (!currentStep) return

        const validationRule = this.validationRules.get(currentStep.id)
        if (!validationRule) return

        const validation = validationRule(this.checkoutData)
        currentStep.validation = validation
    }

    /**
     * Get checkout data
     */
    getCheckoutData(): CheckoutData {
        return this.checkoutData
    }

    /**
     * Set cart data
     */
    setCartData(cart: CheckoutData['cart']): void {
        this.updateCheckoutData('cart', cart)
    }

    /**
     * Set shipping data
     */
    setShippingData(shipping: CheckoutData['shipping']): void {
        this.updateCheckoutData('shipping', shipping)
    }

    /**
     * Set billing data
     */
    setBillingData(billing: CheckoutData['billing']): void {
        this.updateCheckoutData('billing', billing)
    }

    /**
     * Set payment data
     */
    setPaymentData(payment: CheckoutData['payment']): void {
        this.updateCheckoutData('payment', payment)
    }

    /**
     * Set order data
     */
    setOrderData(order: CheckoutData['order']): void {
        this.updateCheckoutData('order', order)
    }

    /**
     * Get available shipping methods
     */
    getAvailableShippingMethods(): ShippingMethod[] {
        return [
            {
                id: 'standard',
                name: 'Standard Shipping',
                description: '5-7 business days',
                cost: 5.99,
                estimatedDays: '5-7',
                isAvailable: true,
                trackingAvailable: true,
            },
            {
                id: 'express',
                name: 'Express Shipping',
                description: '2-3 business days',
                cost: 12.99,
                estimatedDays: '2-3',
                isAvailable: true,
                trackingAvailable: true,
            },
            {
                id: 'overnight',
                name: 'Overnight Shipping',
                description: 'Next business day',
                cost: 24.99,
                estimatedDays: '1',
                isAvailable: true,
                trackingAvailable: true,
            },
        ]
    }

    /**
     * Get available payment methods
     */
    getAvailablePaymentMethods(): PaymentMethod[] {
        return [
            {
                id: 'card',
                type: 'card',
                name: 'Credit/Debit Card',
                description: 'Visa, Mastercard, American Express',
                icon: '💳',
                isAvailable: true,
                processingFee: 0,
            },
            {
                id: 'upi',
                type: 'upi',
                name: 'UPI',
                description: 'Pay with UPI ID',
                icon: '📱',
                isAvailable: true,
                processingFee: 0,
            },
            {
                id: 'netbanking',
                type: 'netbanking',
                name: 'Net Banking',
                description: 'Internet banking',
                icon: '🏦',
                isAvailable: true,
                processingFee: 0,
            },
            {
                id: 'wallet',
                type: 'wallet',
                name: 'Digital Wallet',
                description: 'Paytm, PhonePe, Google Pay',
                icon: '💰',
                isAvailable: true,
                processingFee: 0,
            },
            {
                id: 'cod',
                type: 'cod',
                name: 'Cash on Delivery',
                description: 'Pay when delivered',
                icon: '💵',
                isAvailable: true,
                processingFee: 2.99,
            },
        ]
    }

    /**
     * Calculate shipping cost
     */
    calculateShippingCost(method: ShippingMethod, address: Address): number {
        // Base cost from method
        let cost = method.cost

        // Add distance-based surcharge
        if (address.country !== 'US') {
            cost += 15.99 // International shipping
        }

        // Add weight-based surcharge
        const totalWeight = this.checkoutData.cart.items.reduce((sum, item) => sum + (item.weight || 0), 0)
        if (totalWeight > 10) {
            cost += 5.99 // Heavy package surcharge
        }

        return cost
    }

    /**
     * Calculate tax
     */
    calculateTax(subtotal: number, address: Address): number {
        // Simple tax calculation based on state
        const taxRates: { [key: string]: number } = {
            'CA': 0.0875, // California
            'NY': 0.08,   // New York
            'TX': 0.0625, // Texas
            'FL': 0.06,   // Florida
        }

        const rate = taxRates[address.state] || 0.08 // Default 8%
        return subtotal * rate
    }

    /**
     * Calculate total
     */
    calculateTotal(): number {
        const { cart, shipping, payment } = this.checkoutData
        const subtotal = cart.subtotal
        const shippingCost = shipping.cost
        const tax = this.calculateTax(subtotal, shipping.address!)
        const processingFee = payment.method?.processingFee || 0

        return subtotal + shippingCost + tax + processingFee
    }

    /**
     * Reset checkout flow
     */
    reset(): void {
        this.currentStepIndex = 0
        this.checkoutData = this.getInitialCheckoutData()
        this.steps = this.initializeSteps()
    }

    /**
     * Complete checkout
     */
    completeCheckout(): boolean {
        if (this.getCheckoutState().isCompleted) {
            this.checkoutData.order.status = 'confirmed'
            this.checkoutData.order.confirmationNumber = this.generateConfirmationNumber()
            this.checkoutData.order.estimatedDelivery = this.calculateEstimatedDelivery()
            return true
        }
        return false
    }

    /**
     * Generate confirmation number
     */
    private generateConfirmationNumber(): string {
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substr(2, 5)
        return `ORD-${timestamp}-${random}`.toUpperCase()
    }

    /**
     * Calculate estimated delivery
     */
    private calculateEstimatedDelivery(): string {
        const shippingMethod = this.checkoutData.shipping.method
        if (!shippingMethod) return ''

        const days = parseInt(shippingMethod.estimatedDays.split('-')[0])
        const deliveryDate = new Date()
        deliveryDate.setDate(deliveryDate.getDate() + days)

        return deliveryDate.toISOString().split('T')[0]
    }

    /**
     * Get checkout summary
     */
    getCheckoutSummary(): {
        items: number
        subtotal: number
        shipping: number
        tax: number
        discount: number
        total: number
        estimatedDelivery: string
    } {
        const { cart, shipping } = this.checkoutData
        const tax = this.calculateTax(cart.subtotal, shipping.address!)
        const total = this.calculateTotal()

        return {
            items: cart.items.length,
            subtotal: cart.subtotal,
            shipping: shipping.cost,
            tax,
            discount: cart.discount,
            total,
            estimatedDelivery: this.calculateEstimatedDelivery(),
        }
    }
}

export default CheckoutFlow
