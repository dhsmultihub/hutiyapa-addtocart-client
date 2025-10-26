import { CartItem, CartState } from '../redux/cart.slice'
import { Product } from '../../products/types/product.types'

export interface CartValidationError {
    type: 'stock' | 'price' | 'availability' | 'quantity' | 'product' | 'coupon' | 'gift_card'
    message: string
    itemId?: string
    field?: string
    value?: any
}

export interface CartValidationResult {
    isValid: boolean
    errors: CartValidationError[]
    warnings: CartValidationError[]
    totalErrors: number
    totalWarnings: number
}

export interface StockValidation {
    available: boolean
    stock: number
    reserved: number
    message?: string
}

export interface PriceValidation {
    currentPrice: number
    cartPrice: number
    hasChanged: boolean
    discount?: number
}

export interface ProductValidation {
    exists: boolean
    active: boolean
    available: boolean
    discontinued: boolean
}

export class CartValidator {
    private static readonly MAX_QUANTITY_PER_ITEM = 99
    private static readonly MAX_TOTAL_ITEMS = 50
    private static readonly MIN_ORDER_VALUE = 0
    private static readonly MAX_ORDER_VALUE = 10000

    /**
     * Validate entire cart state
     */
    static validateCart(cart: CartState, products: Product[] = []): CartValidationResult {
        const errors: CartValidationError[] = []
        const warnings: CartValidationError[] = []

        // Validate cart items
        cart.items.forEach(item => {
            const product = products.find(p => p.id === item.id)

            // Stock validation
            const stockValidation = this.validateStock(item, product)
            if (!stockValidation.available) {
                errors.push({
                    type: 'stock',
                    message: stockValidation.message || 'Item out of stock',
                    itemId: item.id,
                })
            }

            // Quantity validation
            const quantityErrors = this.validateQuantity(item)
            errors.push(...quantityErrors)

            // Price validation
            if (product) {
                const priceValidation = this.validatePrice(item, product)
                if (priceValidation.hasChanged) {
                    warnings.push({
                        type: 'price',
                        message: `Price has changed from $${item.price} to $${priceValidation.currentPrice}`,
                        itemId: item.id,
                        value: priceValidation.currentPrice,
                    })
                }
            }

            // Product availability validation
            if (product) {
                const productValidation = this.validateProduct(item, product)
                if (!productValidation.exists) {
                    errors.push({
                        type: 'product',
                        message: 'Product no longer exists',
                        itemId: item.id,
                    })
                } else if (!productValidation.active) {
                    errors.push({
                        type: 'product',
                        message: 'Product is no longer active',
                        itemId: item.id,
                    })
                } else if (productValidation.discontinued) {
                    warnings.push({
                        type: 'product',
                        message: 'Product has been discontinued',
                        itemId: item.id,
                    })
                }
            }
        })

        // Validate cart totals
        const totalErrors = this.validateCartTotals(cart)
        errors.push(...totalErrors)

        // Validate coupon
        if (cart.couponCode) {
            const couponErrors = this.validateCoupon(cart.couponCode, cart.subtotal)
            errors.push(...couponErrors)
        }

        // Validate gift card
        if (cart.giftCardCode) {
            const giftCardErrors = this.validateGiftCard(cart.giftCardCode, cart.subtotal)
            errors.push(...giftCardErrors)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
        }
    }

    /**
     * Validate individual cart item
     */
    static validateCartItem(item: CartItem, product?: Product): CartValidationResult {
        const errors: CartValidationError[] = []
        const warnings: CartValidationError[] = []

        // Stock validation
        if (product) {
            const stockValidation = this.validateStock(item, product)
            if (!stockValidation.available) {
                errors.push({
                    type: 'stock',
                    message: stockValidation.message || 'Item out of stock',
                    itemId: item.id,
                })
            }
        }

        // Quantity validation
        const quantityErrors = this.validateQuantity(item)
        errors.push(...quantityErrors)

        // Price validation
        if (product) {
            const priceValidation = this.validatePrice(item, product)
            if (priceValidation.hasChanged) {
                warnings.push({
                    type: 'price',
                    message: `Price has changed from $${item.price} to $${priceValidation.currentPrice}`,
                    itemId: item.id,
                    value: priceValidation.currentPrice,
                })
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            totalErrors: errors.length,
            totalWarnings: warnings.length,
        }
    }

    /**
     * Validate stock availability
     */
    static validateStock(item: CartItem, product?: Product): StockValidation {
        if (!product) {
            return {
                available: false,
                stock: 0,
                reserved: 0,
                message: 'Product not found',
            }
        }

        const availableStock = product.stock - (product.reserved || 0)
        const isAvailable = availableStock >= item.quantity

        return {
            available: isAvailable,
            stock: product.stock,
            reserved: product.reserved || 0,
            message: isAvailable ? undefined : `Only ${availableStock} items available`,
        }
    }

    /**
     * Validate item quantity
     */
    static validateQuantity(item: CartItem): CartValidationError[] {
        const errors: CartValidationError[] = []

        if (item.quantity <= 0) {
            errors.push({
                type: 'quantity',
                message: 'Quantity must be greater than 0',
                itemId: item.id,
                field: 'quantity',
                value: item.quantity,
            })
        }

        if (item.quantity > this.MAX_QUANTITY_PER_ITEM) {
            errors.push({
                type: 'quantity',
                message: `Maximum ${this.MAX_QUANTITY_PER_ITEM} items per product`,
                itemId: item.id,
                field: 'quantity',
                value: item.quantity,
            })
        }

        return errors
    }

    /**
     * Validate price consistency
     */
    static validatePrice(item: CartItem, product: Product): PriceValidation {
        const hasChanged = item.price !== product.price
        const discount = hasChanged ? product.price - item.price : 0

        return {
            currentPrice: product.price,
            cartPrice: item.price,
            hasChanged,
            discount: discount > 0 ? discount : undefined,
        }
    }

    /**
     * Validate product availability
     */
    static validateProduct(item: CartItem, product: Product): ProductValidation {
        return {
            exists: !!product,
            active: product?.active || false,
            available: product?.available || false,
            discontinued: product?.discontinued || false,
        }
    }

    /**
     * Validate cart totals
     */
    static validateCartTotals(cart: CartState): CartValidationError[] {
        const errors: CartValidationError[] = []

        // Check minimum order value
        if (cart.subtotal < this.MIN_ORDER_VALUE) {
            errors.push({
                type: 'quantity',
                message: `Minimum order value is $${this.MIN_ORDER_VALUE}`,
                field: 'subtotal',
                value: cart.subtotal,
            })
        }

        // Check maximum order value
        if (cart.subtotal > this.MAX_ORDER_VALUE) {
            errors.push({
                type: 'quantity',
                message: `Maximum order value is $${this.MAX_ORDER_VALUE}`,
                field: 'subtotal',
                value: cart.subtotal,
            })
        }

        // Check total quantity
        if (cart.totalQuantity > this.MAX_TOTAL_ITEMS) {
            errors.push({
                type: 'quantity',
                message: `Maximum ${this.MAX_TOTAL_ITEMS} items in cart`,
                field: 'totalQuantity',
                value: cart.totalQuantity,
            })
        }

        return errors
    }

    /**
     * Validate coupon code
     */
    static validateCoupon(code: string, subtotal: number): CartValidationError[] {
        const errors: CartValidationError[] = []

        if (!code || code.trim().length === 0) {
            errors.push({
                type: 'coupon',
                message: 'Coupon code is required',
                field: 'couponCode',
                value: code,
            })
            return errors
        }

        // Check coupon format
        if (code.length < 3) {
            errors.push({
                type: 'coupon',
                message: 'Coupon code must be at least 3 characters',
                field: 'couponCode',
                value: code,
            })
        }

        // Check if coupon is expired (mock validation)
        const expiredCoupons = ['EXPIRED123', 'OLDCOUPON']
        if (expiredCoupons.includes(code.toUpperCase())) {
            errors.push({
                type: 'coupon',
                message: 'Coupon code has expired',
                field: 'couponCode',
                value: code,
            })
        }

        // Check minimum order value for coupon
        const minOrderCoupons = ['SAVE10', 'FESTIVE20']
        if (minOrderCoupons.includes(code.toUpperCase()) && subtotal < 100) {
            errors.push({
                type: 'coupon',
                message: 'Minimum order value of $100 required for this coupon',
                field: 'couponCode',
                value: code,
            })
        }

        return errors
    }

    /**
     * Validate gift card
     */
    static validateGiftCard(code: string, subtotal: number): CartValidationError[] {
        const errors: CartValidationError[] = []

        if (!code || code.trim().length === 0) {
            errors.push({
                type: 'gift_card',
                message: 'Gift card code is required',
                field: 'giftCardCode',
                value: code,
            })
            return errors
        }

        // Check gift card format
        if (code.length < 8) {
            errors.push({
                type: 'gift_card',
                message: 'Gift card code must be at least 8 characters',
                field: 'giftCardCode',
                value: code,
            })
        }

        // Check if gift card is valid (mock validation)
        const invalidGiftCards = ['INVALID123', 'EXPIRED456']
        if (invalidGiftCards.includes(code.toUpperCase())) {
            errors.push({
                type: 'gift_card',
                message: 'Invalid gift card code',
                field: 'giftCardCode',
                value: code,
            })
        }

        return errors
    }

    /**
     * Validate cart for checkout
     */
    static validateForCheckout(cart: CartState, products: Product[] = []): CartValidationResult {
        const validation = this.validateCart(cart, products)

        // Additional checkout-specific validations
        const checkoutErrors: CartValidationError[] = []

        // Must have items
        if (cart.items.length === 0) {
            checkoutErrors.push({
                type: 'quantity',
                message: 'Cart must contain at least one item',
                field: 'items',
            })
        }

        // Must have valid total
        if (cart.subtotal <= 0) {
            checkoutErrors.push({
                type: 'price',
                message: 'Cart total must be greater than $0',
                field: 'subtotal',
                value: cart.subtotal,
            })
        }

        return {
            isValid: validation.isValid && checkoutErrors.length === 0,
            errors: [...validation.errors, ...checkoutErrors],
            warnings: validation.warnings,
            totalErrors: validation.totalErrors + checkoutErrors.length,
            totalWarnings: validation.totalWarnings,
        }
    }

    /**
     * Get validation summary
     */
    static getValidationSummary(result: CartValidationResult): {
        canProceed: boolean
        criticalIssues: number
        warnings: number
        summary: string
    } {
        const criticalIssues = result.errors.filter(e =>
            e.type === 'stock' || e.type === 'product' || e.type === 'quantity'
        ).length

        const canProceed = result.isValid && criticalIssues === 0

        let summary = ''
        if (result.totalErrors === 0 && result.totalWarnings === 0) {
            summary = 'Cart is valid and ready for checkout'
        } else if (result.totalErrors === 0) {
            summary = `Cart is valid with ${result.totalWarnings} warning(s)`
        } else {
            summary = `Cart has ${result.totalErrors} error(s) and ${result.totalWarnings} warning(s)`
        }

        return {
            canProceed,
            criticalIssues,
            warnings: result.totalWarnings,
            summary,
        }
    }
}

export default CartValidator
