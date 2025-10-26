import { AxiosError } from 'axios'
import { ApiError } from '../client'

export interface ErrorContext {
  operation: string
  endpoint: string
  method: string
  timestamp: string
  userId?: string
  sessionId?: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryCondition: (error: any) => boolean
}

export class ApiErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error) => {
      // Retry on network errors and 5xx status codes
      return (
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600)
      )
    }
  }

  static handleError(error: any, context: ErrorContext): ApiError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error, context)
    }

    return this.handleGenericError(error, context)
  }

  private static handleAxiosError(error: AxiosError, context: ErrorContext): ApiError {
    const response = error.response
    const statusCode = response?.status || 500
    const message = this.getErrorMessage(error, statusCode)
    const errors = this.getErrorDetails(error)

    // Log error for debugging
    this.logError(error, context)

    return {
      success: false,
      message,
      errors,
      statusCode,
      timestamp: new Date().toISOString(),
    }
  }

  private static handleGenericError(error: any, context: ErrorContext): ApiError {
    const message = error.message || 'An unexpected error occurred'
    const errors = [message]

    // Log error for debugging
    this.logError(error, context)

    return {
      success: false,
      message,
      errors,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }
  }

  private static getErrorMessage(error: AxiosError, statusCode: number): string {
    const response = error.response

    // Try to get message from response data
    if (response?.data && (response.data as any)?.message) {
      return (response.data as any).message
    }

    // Default messages based on status code
    switch (statusCode) {
      case 400:
        return 'Bad Request - Invalid data provided'
      case 401:
        return 'Unauthorized - Authentication required'
      case 403:
        return 'Forbidden - Access denied'
      case 404:
        return 'Not Found - Resource not found'
      case 409:
        return 'Conflict - Resource already exists'
      case 422:
        return 'Validation Error - Invalid input data'
      case 429:
        return 'Too Many Requests - Rate limit exceeded'
      case 500:
        return 'Internal Server Error - Server error occurred'
      case 502:
        return 'Bad Gateway - Server unavailable'
      case 503:
        return 'Service Unavailable - Server temporarily unavailable'
      case 504:
        return 'Gateway Timeout - Request timeout'
      default:
        return error.message || 'An error occurred'
    }
  }

  private static getErrorDetails(error: AxiosError): string[] {
    const response = error.response

    if (response?.data && (response.data as any)?.errors && Array.isArray((response.data as any).errors)) {
      return (response.data as any).errors
    }

    if (response?.data && (response.data as any)?.error) {
      return [(response.data as any).error]
    }

    if (response?.data && (response.data as any)?.message) {
      return [(response.data as any).message]
    }

    return [error.message || 'An error occurred']
  }

  private static logError(error: any, context: ErrorContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', {
        context,
        error: {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          }
        }
      })
    }

    // Send error to analytics/monitoring service
    this.sendErrorToAnalytics(error, context)
  }

  private static sendErrorToAnalytics(error: any, context: ErrorContext): void {
    try {
      // Send to your analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'api_error', {
          event_category: 'API',
          event_label: context.operation,
          value: error.response?.status || 500,
          custom_map: {
            endpoint: context.endpoint,
            method: context.method,
            status: error.response?.status,
            message: error.message,
          }
        })
      }
    } catch (analyticsError) {
      console.error('Failed to send error to analytics:', analyticsError)
    }
  }

  static shouldRetry(error: any, retryConfig: RetryConfig = this.DEFAULT_RETRY_CONFIG): boolean {
    if (!retryConfig.retryCondition(error)) {
      return false
    }

    // Don't retry if we've exceeded max retries
    const retryCount = error.config?._retryCount || 0
    return retryCount < retryConfig.maxRetries
  }

  static getRetryDelay(retryCount: number, retryConfig: RetryConfig = this.DEFAULT_RETRY_CONFIG): number {
    // Exponential backoff with jitter
    const delay = Math.min(
      retryConfig.baseDelay * Math.pow(2, retryCount),
      retryConfig.maxDelay
    )
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay
    
    return Math.floor(delay + jitter)
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = this.DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: any
    let retryCount = 0

    while (retryCount <= retryConfig.maxRetries) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (!this.shouldRetry(error, retryConfig)) {
          break
        }

        retryCount++
        const delay = this.getRetryDelay(retryCount - 1, retryConfig)
        
        console.log(`Retrying operation in ${delay}ms (attempt ${retryCount}/${retryConfig.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  static isNetworkError(error: any): boolean {
    return (
      !error.response &&
      (error.code === 'NETWORK_ERROR' ||
       error.code === 'ECONNABORTED' ||
       error.message === 'Network Error')
    )
  }

  static isTimeoutError(error: any): boolean {
    return error.code === 'ECONNABORTED' && error.message.includes('timeout')
  }

  static isServerError(error: any): boolean {
    const status = error.response?.status
    return status >= 500 && status < 600
  }

  static isClientError(error: any): boolean {
    const status = error.response?.status
    return status >= 400 && status < 500
  }

  static isAuthError(error: any): boolean {
    const status = error.response?.status
    return status === 401 || status === 403
  }

  static isValidationError(error: any): boolean {
    return error.response?.status === 422
  }

  static isRateLimitError(error: any): boolean {
    return error.response?.status === 429
  }

  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const status = error.response?.status

    if (status >= 500) {
      return 'critical'
    }

    if (status === 401 || status === 403) {
      return 'high'
    }

    if (status >= 400) {
      return 'medium'
    }

    return 'low'
  }

  static formatErrorForUser(error: ApiError): string {
    // Return user-friendly error messages
    switch (error.statusCode) {
      case 400:
        return 'Please check your input and try again.'
      case 401:
        return 'Please log in to continue.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 409:
        return 'This resource already exists.'
      case 422:
        return 'Please check your input and try again.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Something went wrong. Please try again later.'
      default:
        return error.message
    }
  }
}

export default ApiErrorHandler
