import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { store } from '../../store'
import { authManager } from './auth-manager'
import { ApiErrorHandler } from './error-handler'

export interface RequestContext {
  operation: string
  endpoint: string
  method: string
  timestamp: string
  userId?: string
  sessionId?: string
}

export interface ResponseContext {
  operation: string
  endpoint: string
  method: string
  statusCode: number
  duration: number
  timestamp: string
  userId?: string
  sessionId?: string
}

// Request interceptor factory
export const createRequestInterceptor = () => {
  return (config: AxiosRequestConfig): AxiosRequestConfig => {
    const startTime = performance.now()

    // Add request metadata  
    const metadata = {
      startTime,
      operation: `${config.method?.toUpperCase()} ${config.url}`,
      endpoint: config.url || '',
      method: config.method || 'GET',
      timestamp: new Date().toISOString(),
    };
    (config as any).metadata = metadata

    // Add authentication header
    const authHeader = authManager.getAuthHeader()
    if (authHeader) {
      config.headers = config.headers || {}
      config.headers.Authorization = authHeader
    }

    // Add request ID for tracking
    config.headers = config.headers || {}
    config.headers['X-Request-ID'] = generateRequestId()

    // Add session token
    const sessionToken = getSessionToken()
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken
    }

    // Add user agent
    if (typeof window !== 'undefined') {
      config.headers['User-Agent'] = navigator.userAgent
    }

    // Add content type if not set
    if (!config.headers['Content-Type'] && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
      config.headers['Content-Type'] = 'application/json'
    }

    // Add accept header
    if (!config.headers['Accept']) {
      config.headers['Accept'] = 'application/json'
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params,
      })
    }

    return config
  }
}

// Response interceptor factory
export const createResponseInterceptor = () => {
  return (response: AxiosResponse): AxiosResponse => {
    const endTime = performance.now()
    const startTime = (response.config as any).metadata?.startTime || endTime
    const duration = endTime - startTime

    // Add response metadata
    const configMetadata = (response.config as any).metadata || {};
    (response as any).metadata = {
      ...configMetadata,
      statusCode: response.status,
      duration,
      timestamp: new Date().toISOString(),
    }

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
        data: response.data,
        headers: response.headers,
      })
    }

    // Track performance metrics
    trackPerformanceMetrics((response as any).metadata)

    // Update analytics
    updateAnalytics((response as any).metadata)

    return response
  }
}

// Error interceptor factory
export const createErrorInterceptor = () => {
  return async (error: AxiosError): Promise<never> => {
    const endTime = performance.now()
    const startTime = (error.config as any)?.metadata?.startTime || endTime
    const duration = endTime - startTime

    // Add error metadata
    const errorConfigMetadata = ((error.config as any)?.metadata) || {};
    const errorMetadata = {
      ...errorConfigMetadata,
      statusCode: error.response?.status || 0,
      duration,
      timestamp: new Date().toISOString(),
    }

    // Log error
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      duration: `${duration.toFixed(2)}ms`,
      data: error.response?.data,
      message: error.message,
    })

    // Handle specific error cases
    await handleErrorCases(error, errorMetadata)

    // Transform error
    const transformedError = ApiErrorHandler.handleError(error, {
      operation: errorMetadata.operation || 'unknown',
      endpoint: errorMetadata.endpoint || 'unknown',
      method: errorMetadata.method || 'unknown',
      timestamp: errorMetadata.timestamp,
    })

    throw transformedError
  }
}

// Handle specific error cases
async function handleErrorCases(error: AxiosError, _metadata: any): Promise<void> {
  const statusCode = error.response?.status

  // Handle 401 Unauthorized
  if (statusCode === 401) {
    await handleUnauthorizedError()
  }

  // Handle 403 Forbidden
  if (statusCode === 403) {
    handleForbiddenError()
  }

  // Handle 429 Rate Limited
  if (statusCode === 429) {
    handleRateLimitError(error)
  }

  // Handle network errors
  if (!error.response) {
    handleNetworkError(error)
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    handleTimeoutError(error)
  }
}

// Handle 401 Unauthorized
async function handleUnauthorizedError(): Promise<void> {
  try {
    // Try to refresh token
    const newToken = await authManager.refreshAccessToken()

    if (!newToken) {
      // Refresh failed, logout user
      authManager.logout()

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  } catch (refreshError) {
    console.error('Token refresh failed:', refreshError)
    authManager.logout()

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Handle 403 Forbidden
function handleForbiddenError(): void {
  // Show access denied message
  store.dispatch({
    type: 'ui/addNotification',
    payload: {
      type: 'error',
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
    },
  })
}

// Handle 429 Rate Limited
function handleRateLimitError(error: AxiosError): void {
  const retryAfter = error.response?.headers['retry-after']
  const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000 // Default 1 minute

  store.dispatch({
    type: 'ui/addNotification',
    payload: {
      type: 'warning',
      title: 'Rate Limited',
      message: `Too many requests. Please try again in ${Math.ceil(delay / 1000)} seconds.`,
    },
  })
}

// Handle network errors
function handleNetworkError(_error: AxiosError): void {
  store.dispatch({
    type: 'ui/addNotification',
    payload: {
      type: 'error',
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
    },
  })
}

// Handle timeout errors
function handleTimeoutError(_error: AxiosError): void {
  store.dispatch({
    type: 'ui/addNotification',
    payload: {
      type: 'error',
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
    },
  })
}

// Track performance metrics
function trackPerformanceMetrics(metadata: any): void {
  if (metadata.duration > 5000) { // Log slow requests (>5s)
    console.warn(`[Slow Request] ${metadata.operation} took ${metadata.duration.toFixed(2)}ms`)
  }

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'api_request', {
      event_category: 'Performance',
      event_label: metadata.operation,
      value: Math.round(metadata.duration),
    })
  }
}

// Update analytics
function updateAnalytics(metadata: any): void {
  // Track API usage
  store.dispatch({
    type: 'ui/trackPageView',
    payload: {
      page: metadata.endpoint,
      title: metadata.operation,
    },
  })
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get session token from localStorage
function getSessionToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('session_token')
  }
  return null
}

// Retry interceptor for failed requests
export const createRetryInterceptor = (maxRetries: number = 3) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number }

    if (!config || !config._retryCount) {
      config._retryCount = 0
    }

    if (config._retryCount >= maxRetries) {
      throw error
    }

    // Only retry on network errors or 5xx status codes
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
      config._retryCount += 1

      // Exponential backoff
      const delay = Math.pow(2, config._retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))

      // Retry the request
      const axios = await import('axios')
      return axios.default(config)
    }

    throw error
  }
}

// Logging interceptor
export const createLoggingInterceptor = () => {
  return (config: AxiosRequestConfig): AxiosRequestConfig => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      console.log('Headers:', config.headers)
      console.log('Data:', config.data)
      console.log('Params:', config.params)
      console.groupEnd()
    }
    return config
  }
}

// Response logging interceptor
export const createResponseLoggingInterceptor = () => {
  return (response: AxiosResponse): AxiosResponse => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`)
      console.log('Status:', response.status)
      console.log('Headers:', response.headers)
      console.log('Data:', response.data)
      console.groupEnd()
    }
    return response
  }
}

// Error logging interceptor
export const createErrorLoggingInterceptor = () => {
  return (error: AxiosError): Promise<never> => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
      console.log('Status:', error.response?.status)
      console.log('Status Text:', error.response?.statusText)
      console.log('Headers:', error.response?.headers)
      console.log('Data:', error.response?.data)
      console.log('Message:', error.message)
      console.groupEnd()
    }
    return Promise.reject(error)
  }
}

export default {
  createRequestInterceptor,
  createResponseInterceptor,
  createErrorInterceptor,
  createRetryInterceptor,
  createLoggingInterceptor,
  createResponseLoggingInterceptor: createResponseLoggingInterceptor,
  createErrorLoggingInterceptor,
}
