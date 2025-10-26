import { z } from 'zod'
import { VALIDATION_CONFIG } from './constants'

// Common validation schemas
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .regex(VALIDATION_CONFIG.EMAIL_REGEX, 'Invalid email format')

export const passwordSchema = z
    .string()
    .min(VALIDATION_CONFIG.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} characters`)
    .max(100, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')

export const nameSchema = z
    .string()
    .min(VALIDATION_CONFIG.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION_CONFIG.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION_CONFIG.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION_CONFIG.NAME_MAX_LENGTH} characters`)
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

export const phoneSchema = z
    .string()
    .min(1, 'Phone number is required')
    .regex(VALIDATION_CONFIG.PHONE_REGEX, 'Invalid phone number format')

// Additional validation schemas
export const urlSchema = z
    .string()
    .url('Invalid URL format')
    .optional()

export const dateSchema = z
    .string()
    .datetime('Invalid date format')
    .optional()

export const numberSchema = z
    .number()
    .positive('Number must be positive')
    .finite('Number must be finite')

export const positiveIntegerSchema = z
    .number()
    .int('Must be an integer')
    .positive('Must be positive')

export const percentageSchema = z
    .number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')

export const currencySchema = z
    .number()
    .positive('Amount must be positive')
    .max(999999.99, 'Amount is too high')
    .transform(val => Math.round(val * 100) / 100) // Round to 2 decimal places

export const skuSchema = z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU is too long')
    .regex(/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores')

export const slugSchema = z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

export const colorSchema = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)')

export const sizeSchema = z
    .string()
    .min(1, 'Size is required')
    .max(10, 'Size is too long')
    .regex(/^[A-Z0-9]+$/, 'Size can only contain uppercase letters and numbers')

// Cart validation schemas
export const cartItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional(),
    quantity: z
        .number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(99, 'Quantity cannot exceed 99'),
    price: z
        .number()
        .positive('Price must be positive')
        .max(999999, 'Price is too high'),
})

export const addToCartSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional(),
    quantity: z
        .number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(99, 'Quantity cannot exceed 99'),
})

export const updateCartItemSchema = z.object({
    quantity: z
        .number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(99, 'Quantity cannot exceed 99'),
})

// User validation schemas
export const userRegistrationSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const userLoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
})

export const userProfileSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema.optional(),
})

// Address validation schemas
export const addressSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    company: z.string().optional(),
    address1: z.string().min(1, 'Address is required'),
    address2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    isDefault: z.boolean().optional(),
})

// Checkout validation schemas
export const checkoutSchema = z.object({
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    shippingMethod: z.string().min(1, 'Shipping method is required'),
    notes: z.string().optional(),
})

// Product search validation schemas
export const productSearchSchema = z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    sortBy: z.enum(['name', 'price', 'rating', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
})

// Session validation schemas
export const sessionSchema = z.object({
    userId: z.string().optional(),
    sessionId: z.string().min(1, 'Session ID is required'),
    deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    userAgent: z.string().optional(),
})

// Validation utility functions
export const validateEmail = (email: string): boolean => {
    try {
        emailSchema.parse(email)
        return true
    } catch {
        return false
    }
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    try {
        passwordSchema.parse(password)
        return { isValid: true, errors: [] }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { isValid: false, errors: error.errors.map(e => e.message) }
        }
        return { isValid: false, errors: ['Invalid password'] }
    }
}

export const validatePhone = (phone: string): boolean => {
    try {
        phoneSchema.parse(phone)
        return true
    } catch {
        return false
    }
}

export const validateUrl = (url: string): boolean => {
    try {
        urlSchema.parse(url)
        return true
    } catch {
        return false
    }
}

export const validateSku = (sku: string): boolean => {
    try {
        skuSchema.parse(sku)
        return true
    } catch {
        return false
    }
}

export const validateSlug = (slug: string): boolean => {
    try {
        slugSchema.parse(slug)
        return true
    } catch {
        return false
    }
}

export const validateColor = (color: string): boolean => {
    try {
        colorSchema.parse(color)
        return true
    } catch {
        return false
    }
}

export const validateSize = (size: string): boolean => {
    try {
        sizeSchema.parse(size)
        return true
    } catch {
        return false
    }
}

export const validateCurrency = (amount: number): boolean => {
    try {
        currencySchema.parse(amount)
        return true
    } catch {
        return false
    }
}

export const validatePercentage = (percentage: number): boolean => {
    try {
        percentageSchema.parse(percentage)
        return true
    } catch {
        return false
    }
}

// Form validation helpers
export const getFieldError = (errors: z.ZodError, fieldName: string): string | undefined => {
    const fieldError = errors.errors.find(error => error.path.includes(fieldName))
    return fieldError?.message
}

export const hasFieldError = (errors: z.ZodError, fieldName: string): boolean => {
    return errors.errors.some(error => error.path.includes(fieldName))
}

export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
    const formattedErrors: Record<string, string> = {}
    errors.errors.forEach(error => {
        const fieldName = error.path.join('.')
        formattedErrors[fieldName] = error.message
    })
    return formattedErrors
}

// Sanitization functions
export const sanitizeString = (str: string): string => {
    return str.trim().replace(/\s+/g, ' ')
}

export const sanitizeEmail = (email: string): string => {
    return email.trim().toLowerCase()
}

export const sanitizePhone = (phone: string): string => {
    return phone.replace(/\D/g, '') // Remove all non-digits
}

export const sanitizeSlug = (slug: string): string => {
    return slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export const sanitizeSku = (sku: string): string => {
    return sku.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '')
}

// Type exports
export type CartItem = z.infer<typeof cartItemSchema>
export type AddToCartRequest = z.infer<typeof addToCartSchema>
export type UpdateCartItemRequest = z.infer<typeof updateCartItemSchema>
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type UserLogin = z.infer<typeof userLoginSchema>
export type UserProfile = z.infer<typeof userProfileSchema>
export type Address = z.infer<typeof addressSchema>
export type CheckoutRequest = z.infer<typeof checkoutSchema>
export type ProductSearch = z.infer<typeof productSearchSchema>
export type Session = z.infer<typeof sessionSchema>

// Additional type exports
export type UrlInput = z.infer<typeof urlSchema>
export type DateInput = z.infer<typeof dateSchema>
export type NumberInput = z.infer<typeof numberSchema>
export type PositiveInteger = z.infer<typeof positiveIntegerSchema>
export type Percentage = z.infer<typeof percentageSchema>
export type Currency = z.infer<typeof currencySchema>
export type Sku = z.infer<typeof skuSchema>
export type Slug = z.infer<typeof slugSchema>
export type Color = z.infer<typeof colorSchema>
export type Size = z.infer<typeof sizeSchema>
