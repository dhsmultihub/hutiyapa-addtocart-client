// import { Middleware } from '@reduxjs/toolkit'
// import { RootState } from '../store'

interface LogEntry {
    timestamp: string
    action: string
    state: any
    duration?: number
    error?: string
}

class Logger {
    private logs: LogEntry[] = []
    private maxLogs = 1000

    log(action: string, state: any, duration?: number, error?: string) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            action,
            state: this.sanitizeState(state),
            duration,
            error,
        }

        this.logs.push(entry)

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }

        // Console logging in development (only errors and important actions)
        if (process.env.NODE_ENV === 'development') {
            // Only log errors or specific actions to reduce spam
            const importantActions = [
                'persist/PERSIST',
                'persist/REHYDRATE',
                'cart/addItem',
                'cart/removeItem',
                'auth/loginSuccess',
                'auth/logout'
            ]
            
            if (error) {
                console.error(`[Redux] ${action}:`, error)
            } else if (importantActions.some(act => action.includes(act))) {
                // Only log action type, not full state
                console.log(`[Redux] ${action}`)
            }
        }
    }

    private sanitizeState(state: any): any {
        // Remove sensitive information
        const sanitized = { ...state }

        if (sanitized.auth) {
            sanitized.auth = {
                ...sanitized.auth,
                token: sanitized.auth.token ? '[REDACTED]' : null,
                refreshToken: sanitized.auth.refreshToken ? '[REDACTED]' : null,
            }
        }

        return sanitized
    }

    getLogs(): LogEntry[] {
        return [...this.logs]
    }

    clearLogs() {
        this.logs = []
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2)
    }
}

const logger = new Logger()

export const loggerMiddleware: any = (store: any) => (next: any) => (action: any) => {
    const startTime = performance.now()

    // Log the action
    logger.log(
        action.type,
        store.getState(),
        undefined,
        undefined
    )

    const result = next(action)

    const endTime = performance.now()
    const duration = endTime - startTime

    // Log the result
    logger.log(
        `${action.type}_COMPLETED`,
        store.getState(),
        duration,
        undefined
    )

    return result
}

export const errorLoggerMiddleware: any = (store: any) => (next: any) => (action: any) => {
    try {
        return next(action)
    } catch (error) {
        // Log the error
        logger.log(
            `${action.type}_ERROR`,
            store.getState(),
            undefined,
            error instanceof Error ? error.message : String(error)
        )

        // Re-throw the error
        throw error
    }
}

export const performanceMiddleware: any = (store: any) => (next: any) => (action: any) => {
    const startTime = performance.now()

    const result = next(action)

    const endTime = performance.now()
    const duration = endTime - startTime

    // Log slow actions (over 100ms)
    if (duration > 100) {
        logger.log(
            `${action.type}_SLOW`,
            store.getState(),
            duration,
            `Action took ${duration.toFixed(2)}ms`
        )
    }

    return result
}

export const analyticsMiddleware: any = (_store: any) => (next: any) => (action: any) => {
    const result = next(action)

    // Track specific actions for analytics
    const analyticsActions = [
        'cart/addItem',
        'cart/removeItem',
        'cart/clearCart',
        'auth/loginSuccess',
        'auth/logout',
        'products/loadProductsSuccess',
        'products/searchProductsSuccess',
    ]

    if (analyticsActions.includes(action.type)) {
        // Send analytics event
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', action.type, {
                event_category: 'Redux',
                event_label: action.type,
                value: 1,
            })
        }
    }

    return result
}

export { logger }
export default loggerMiddleware
