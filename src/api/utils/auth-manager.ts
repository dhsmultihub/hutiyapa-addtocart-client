import { store } from '../../store'
import { RootState } from '../../store'
import { authService } from '../services/auth.service'

export interface TokenInfo {
  token: string
  refreshToken: string
  expiresAt: number
  issuedAt: number
}

export interface AuthState {
  isAuthenticated: boolean
  user: any | null
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
}

class AuthManager {
  private static instance: AuthManager
  private refreshPromise: Promise<string | null> | null = null

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  // Get current auth state from Redux store
  getAuthState(): AuthState {
    const state = store.getState() as RootState
    return {
      isAuthenticated: state.auth?.isAuthenticated || false,
      user: state.auth?.user || null,
      token: state.auth?.token || null,
      refreshToken: state.auth?.refreshToken || null,
      expiresAt: this.getTokenExpiry(state.auth?.token),
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const authState = this.getAuthState()
    return authState.isAuthenticated && this.isTokenValid()
  }

  // Check if token is valid and not expired
  isTokenValid(): boolean {
    const authState = this.getAuthState()

    if (!authState.token) {
      return false
    }

    const expiresAt = this.getTokenExpiry(authState.token)
    if (!expiresAt) {
      return false
    }

    // Check if token expires in the next 5 minutes
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    return Date.now() < (expiresAt - bufferTime)
  }

  // Get token expiry time from JWT
  private getTokenExpiry(token: string | null): number | null {
    if (!token) {
      return null
    }

    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3 || !tokenParts[1]) {
        return null
      }
      const payload = JSON.parse(atob(tokenParts[1]))
      return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
    } catch (error) {
      console.error('Failed to parse token:', error)
      return null
    }
  }

  // Get token info
  getTokenInfo(): TokenInfo | null {
    const authState = this.getAuthState()

    if (!authState.token || !authState.refreshToken) {
      return null
    }

    const expiresAt = this.getTokenExpiry(authState.token)
    if (!expiresAt) {
      return null
    }

    return {
      token: authState.token,
      refreshToken: authState.refreshToken,
      expiresAt,
      issuedAt: Date.now(),
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      const newToken = await this.refreshPromise
      return newToken
    } finally {
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const authState = this.getAuthState()

    if (!authState.refreshToken) {
      console.error('No refresh token available')
      this.logout()
      return null
    }

    try {
      const response = await authService.refreshToken(authState.refreshToken)

      if (response.success && response.data) {
        // Update Redux store with new tokens
        store.dispatch({
          type: 'auth/refreshTokenSuccess',
          payload: response.data,
        })

        // Store tokens in localStorage for persistence
        this.storeTokens(response.data.token, response.data.refreshToken)

        return response.data.token
      } else {
        console.error('Token refresh failed:', response.message)
        this.logout()
        return null
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      this.logout()
      return null
    }
  }

  // Store tokens in localStorage
  private storeTokens(token: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_refresh_token', refreshToken)
        localStorage.setItem('auth_token_expiry', this.getTokenExpiry(token)?.toString() || '')
      } catch (error) {
        console.error('Failed to store tokens:', error)
      }
    }
  }

  // Get tokens from localStorage
  getStoredTokens(): { token: string | null; refreshToken: string | null; expiresAt: number | null } {
    if (typeof window === 'undefined') {
      return { token: null, refreshToken: null, expiresAt: null }
    }

    try {
      const token = localStorage.getItem('auth_token')
      const refreshToken = localStorage.getItem('auth_refresh_token')
      const expiresAtStr = localStorage.getItem('auth_token_expiry')
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null

      return { token, refreshToken, expiresAt }
    } catch (error) {
      console.error('Failed to get stored tokens:', error)
      return { token: null, refreshToken: null, expiresAt: null }
    }
  }

  // Clear stored tokens
  clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        localStorage.removeItem('auth_token_expiry')
        localStorage.removeItem('auth_user')
      } catch (error) {
        console.error('Failed to clear stored tokens:', error)
      }
    }
  }

  // Restore session from localStorage
  async restoreSession(): Promise<boolean> {
    const storedTokens = this.getStoredTokens()

    if (!storedTokens.token || !storedTokens.refreshToken) {
      return false
    }

    // Check if token is still valid
    if (storedTokens.expiresAt && Date.now() < storedTokens.expiresAt) {
      // Token is still valid, restore session
      store.dispatch({
        type: 'auth/restoreSession',
        payload: {
          token: storedTokens.token,
          refreshToken: storedTokens.refreshToken,
          lastLoginAt: new Date().toISOString(),
        },
      })

      // Get user profile
      try {
        const profileResponse = await authService.getProfile()
        if (profileResponse.success) {
          store.dispatch({
            type: 'auth/updateProfileSuccess',
            payload: profileResponse.data,
          })
          return true
        }
      } catch (error) {
        console.error('Failed to restore user profile:', error)
      }
    } else {
      // Token expired, try to refresh
      try {
        const newToken = await this.refreshAccessToken()
        return !!newToken
      } catch (error) {
        console.error('Failed to refresh expired token:', error)
        this.logout()
        return false
      }
    }

    return false
  }

  // Logout user
  logout(): void {
    // Clear Redux store
    store.dispatch({ type: 'auth/logout' })

    // Clear localStorage
    this.clearStoredTokens()

    // Clear any other stored data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart')
      localStorage.removeItem('session_token')
    }
  }

  // Set up automatic token refresh
  setupTokenRefresh(): void {
    const authState = this.getAuthState()

    if (!authState.isAuthenticated || !authState.token) {
      return
    }

    const expiresAt = this.getTokenExpiry(authState.token)
    if (!expiresAt) {
      return
    }

    // Calculate time until token expires (minus 5 minutes buffer)
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    const refreshTime = expiresAt - Date.now() - bufferTime

    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshAccessToken()
      }, refreshTime)
    } else {
      // Token is already expired or about to expire, refresh immediately
      this.refreshAccessToken()
    }
  }

  // Check session expiry periodically
  checkSessionExpiry(): void {
    const authState = this.getAuthState()

    if (!authState.isAuthenticated) {
      return
    }

    if (!this.isTokenValid()) {
      console.log('Session expired, logging out')
      this.logout()

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Get authorization header
  getAuthHeader(): string | null {
    const authState = this.getAuthState()

    if (!authState.token) {
      return null
    }

    return `Bearer ${authState.token}`
  }

  // Validate token format
  isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3 || !parts[1]) {
        return false
      }

      // Check if all parts are valid base64
      parts.forEach(part => {
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(part)) {
          throw new Error('Invalid base64')
        }
      })

      // Try to parse the payload
      const payload = JSON.parse(atob(parts[1]))
      return payload && typeof payload === 'object'
    } catch (error) {
      return false
    }
  }

  // Get token payload
  getTokenPayload(token: string): any | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3 || !parts[1]) {
        return null
      }
      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch (error) {
      console.error('Failed to parse token payload:', error)
      return null
    }
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const authState = this.getAuthState()

    if (!authState.user || !authState.user.permissions) {
      return false
    }

    return authState.user.permissions.includes(permission)
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const authState = this.getAuthState()

    if (!authState.user || !authState.user.roles) {
      return false
    }

    return authState.user.roles.includes(role)
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance()
export default authManager
