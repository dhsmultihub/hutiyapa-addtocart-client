import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG } from '../lib/constants'
import { store } from '../store'
import { RootState } from '../store'

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data: T
    message: string
    timestamp: string
    errors?: string[]
}

export interface ApiError {
    success: false
    message: string
    errors: string[]
    statusCode: number
    timestamp: string
}

// HTTP Client Configuration
interface HttpClientConfig {
    baseURL: string
    timeout: number
    retries: number
    retryDelay: number
    enableLogging: boolean
}

class HttpClient {
    private client: AxiosInstance
    private config: HttpClientConfig
    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (value?: any) => void
        reject: (error?: any) => void
    }> = []

    constructor(config: HttpClientConfig) {
        this.config = config
        this.client = this.createClient()
        this.setupInterceptors()
    }

    private createClient(): AxiosInstance {
        return axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            withCredentials: false,
        })
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Add authentication token
                const state = store.getState() as RootState
                const token = state.auth?.token

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }

                // Add request ID for tracking
                config.headers['X-Request-ID'] = this.generateRequestId()

                // Add session token if available
                const sessionToken = this.getSessionToken()
                if (sessionToken) {
                    config.headers['X-Session-Token'] = sessionToken
                }

                // Log request in development
                if (this.config.enableLogging && process.env.NODE_ENV === 'development') {
                    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                        headers: config.headers,
                        data: config.data,
                        params: config.params,
                    })
                }

                return config
            },
            (error) => {
                if (this.config.enableLogging) {
                    console.error('[API Request Error]', error)
                }
                return Promise.reject(error)
            }
        )

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log response in development
                if (this.config.enableLogging && process.env.NODE_ENV === 'development') {
                    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                        status: response.status,
                        data: response.data,
                        headers: response.headers,
                    })
                }

                return response
            },
            async (error: AxiosError) => {
                const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

                // Handle 401 Unauthorized - Token refresh
                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If already refreshing, queue the request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject })
                        }).then(() => {
                            return this.client(originalRequest)
                        }).catch((err) => {
                            return Promise.reject(err)
                        })
                    }

                    originalRequest._retry = true
                    this.isRefreshing = true

                    try {
                        const newToken = await this.refreshToken()
                        if (newToken) {
                            // Update the authorization header
                            originalRequest.headers = originalRequest.headers || {}
                            originalRequest.headers.Authorization = `Bearer ${newToken}`

                            // Process failed queue
                            this.processQueue(null, newToken)

                            // Retry the original request
                            return this.client(originalRequest)
                        } else {
                            // Refresh failed, redirect to login
                            this.processQueue(new Error('Token refresh failed'), null)
                            this.redirectToLogin()
                            return Promise.reject(error)
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError, null)
                        this.redirectToLogin()
                        return Promise.reject(refreshError)
                    } finally {
                        this.isRefreshing = false
                    }
                }

                // Handle other errors
                if (this.config.enableLogging) {
                    console.error('[API Response Error]', {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        url: error.config?.url,
                        method: error.config?.method,
                    })
                }

                return Promise.reject(this.handleError(error))
            }
        )
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private getSessionToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('session_token')
        }
        return null
    }

    private async refreshToken(): Promise<string | null> {
        try {
            const state = store.getState() as RootState
            const refreshToken = state.auth?.refreshToken

            if (!refreshToken) {
                return null
            }

            const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
                refreshToken,
            })

            if (response.data.success && response.data.data.token) {
                // Update the store with new token
                store.dispatch({
                    type: 'auth/refreshTokenSuccess',
                    payload: response.data.data,
                })

                return response.data.data.token
            }

            return null
        } catch (error) {
            console.error('Token refresh failed:', error)
            return null
        }
    }

    private processQueue(error: any, token: string | null): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error)
            } else {
                resolve(token)
            }
        })

        this.failedQueue = []
    }

    private redirectToLogin(): void {
        if (typeof window !== 'undefined') {
            // Clear auth state
            store.dispatch({ type: 'auth/logout' })

            // Redirect to login page
            window.location.href = '/login'
        }
    }

    private handleError(error: AxiosError): ApiError {
        const response = error.response
        const statusCode = response?.status || 500
        const message = (response?.data as any)?.message || error.message || 'An error occurred'
        const errors = (response?.data as any)?.errors || [message]

        return {
            success: false,
            message,
            errors,
            statusCode,
            timestamp: new Date().toISOString(),
        }
    }

    // HTTP Methods
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.get(url, config)
            return this.transformResponse(response)
        } catch (error) {
            throw this.handleError(error as AxiosError)
        }
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post(url, data, config)
            return this.transformResponse(response)
        } catch (error) {
            throw this.handleError(error as AxiosError)
        }
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.put(url, data, config)
            return this.transformResponse(response)
        } catch (error) {
            throw this.handleError(error as AxiosError)
        }
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.patch(url, data, config)
            return this.transformResponse(response)
        } catch (error) {
            throw this.handleError(error as AxiosError)
        }
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.delete(url, config)
            return this.transformResponse(response)
        } catch (error) {
            throw this.handleError(error as AxiosError)
        }
    }

    private transformResponse<T>(response: AxiosResponse): ApiResponse<T> {
        return {
            success: true,
            data: response.data,
            message: response.data.message || 'Success',
            timestamp: new Date().toISOString(),
        }
    }

    // Utility methods
    setAuthToken(token: string): void {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    removeAuthToken(): void {
        delete this.client.defaults.headers.common['Authorization']
    }

    setSessionToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('session_token', token)
        }
    }

    removeSessionToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('session_token')
        }
    }

    // Health check
    async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
        return this.get('/health')
    }

    // Retry logic
    async withRetry<T>(
        operation: () => Promise<T>,
        retries: number = this.config.retries
    ): Promise<T> {
        let lastError: any

        for (let i = 0; i <= retries; i++) {
            try {
                return await operation()
            } catch (error) {
                lastError = error

                if (i < retries) {
                    const delay = this.config.retryDelay * Math.pow(2, i) // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay))
                }
            }
        }

        throw lastError
    }
}

// Create and export the HTTP client instance
export const httpClient = new HttpClient({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retries: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: 1000,
    enableLogging: process.env.NODE_ENV === 'development',
})

export default httpClient
