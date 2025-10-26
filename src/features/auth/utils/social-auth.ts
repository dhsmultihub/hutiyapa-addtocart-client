import { User } from '../redux/auth.slice'

export interface SocialProvider {
    id: string
    name: string
    displayName: string
    icon: string
    color: string
    isEnabled: boolean
    config: SocialProviderConfig
}

export interface SocialProviderConfig {
    clientId: string
    redirectUri: string
    scope: string[]
    responseType: string
    endpoints: {
        auth: string
        token: string
        userInfo: string
    }
}

export interface SocialAuthResponse {
    success: boolean
    user?: User
    token?: string
    refreshToken?: string
    message?: string
    error?: string
}

export interface SocialUserData {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
    phone?: string
    provider: string
    providerId: string
    isEmailVerified: boolean
}

export interface SocialAuthState {
    isAuthenticating: boolean
    provider: string | null
    error: string | null
    redirectUrl: string | null
}

export class SocialAuth {
    private providers: Map<string, SocialProvider> = new Map()
    private authState: SocialAuthState = {
        isAuthenticating: false,
        provider: null,
        error: null,
        redirectUrl: null,
    }

    constructor() {
        this.initializeProviders()
    }

    /**
     * Initialize social providers
     */
    private initializeProviders(): void {
        // Google OAuth
        this.providers.set('google', {
            id: 'google',
            name: 'Google',
            displayName: 'Continue with Google',
            icon: '🔍',
            color: '#4285F4',
            isEnabled: true,
            config: {
                clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                redirectUri: `${window.location.origin}/auth/callback/google`,
                scope: ['openid', 'profile', 'email'],
                responseType: 'code',
                endpoints: {
                    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
                    token: 'https://oauth2.googleapis.com/token',
                    userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
                },
            },
        })

        // Facebook OAuth
        this.providers.set('facebook', {
            id: 'facebook',
            name: 'Facebook',
            displayName: 'Continue with Facebook',
            icon: '📘',
            color: '#1877F2',
            isEnabled: true,
            config: {
                clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || '',
                redirectUri: `${window.location.origin}/auth/callback/facebook`,
                scope: ['email', 'public_profile'],
                responseType: 'code',
                endpoints: {
                    auth: 'https://www.facebook.com/v18.0/dialog/oauth',
                    token: 'https://graph.facebook.com/v18.0/oauth/access_token',
                    userInfo: 'https://graph.facebook.com/v18.0/me',
                },
            },
        })

        // Apple OAuth
        this.providers.set('apple', {
            id: 'apple',
            name: 'Apple',
            displayName: 'Continue with Apple',
            icon: '🍎',
            color: '#000000',
            isEnabled: true,
            config: {
                clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
                redirectUri: `${window.location.origin}/auth/callback/apple`,
                scope: ['name', 'email'],
                responseType: 'code',
                endpoints: {
                    auth: 'https://appleid.apple.com/auth/authorize',
                    token: 'https://appleid.apple.com/auth/token',
                    userInfo: 'https://appleid.apple.com/auth/userinfo',
                },
            },
        })

        // GitHub OAuth
        this.providers.set('github', {
            id: 'github',
            name: 'GitHub',
            displayName: 'Continue with GitHub',
            icon: '🐙',
            color: '#333333',
            isEnabled: true,
            config: {
                clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
                redirectUri: `${window.location.origin}/auth/callback/github`,
                scope: ['user:email'],
                responseType: 'code',
                endpoints: {
                    auth: 'https://github.com/login/oauth/authorize',
                    token: 'https://github.com/login/oauth/access_token',
                    userInfo: 'https://api.github.com/user',
                },
            },
        })
    }

    /**
     * Get available providers
     */
    getAvailableProviders(): SocialProvider[] {
        return Array.from(this.providers.values()).filter(provider => provider.isEnabled)
    }

    /**
     * Get provider by ID
     */
    getProvider(providerId: string): SocialProvider | null {
        return this.providers.get(providerId) || null
    }

    /**
     * Initiate social authentication
     */
    async initiateSocialAuth(providerId: string, redirectUrl?: string): Promise<SocialAuthResponse> {
        const provider = this.getProvider(providerId)
        if (!provider) {
            return {
                success: false,
                error: 'Provider not found',
            }
        }

        try {
            this.authState = {
                isAuthenticating: true,
                provider: providerId,
                error: null,
                redirectUrl: redirectUrl || null,
            }

            const authUrl = this.buildAuthUrl(provider)
            window.location.href = authUrl

            return {
                success: true,
                message: 'Redirecting to authentication provider',
            }
        } catch (error) {
            this.authState.error = error.message
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Handle social auth callback
     */
    async handleSocialAuthCallback(providerId: string, code: string, state?: string): Promise<SocialAuthResponse> {
        const provider = this.getProvider(providerId)
        if (!provider) {
            return {
                success: false,
                error: 'Provider not found',
            }
        }

        try {
            // Exchange code for access token
            const tokenResponse = await this.exchangeCodeForToken(provider, code)
            if (!tokenResponse.success) {
                return tokenResponse
            }

            // Get user information
            const userInfoResponse = await this.getUserInfo(provider, tokenResponse.token!)
            if (!userInfoResponse.success) {
                return userInfoResponse
            }

            // Create or update user
            const user = await this.createOrUpdateUser(userInfoResponse.userData!, providerId)

            // Generate JWT token
            const jwtToken = this.generateJWT(user)
            const refreshToken = this.generateRefreshToken()

            this.authState.isAuthenticating = false
            this.authState.provider = null
            this.authState.error = null

            return {
                success: true,
                user,
                token: jwtToken,
                refreshToken,
                message: 'Social authentication successful',
            }
        } catch (error) {
            this.authState.error = error.message
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Build authentication URL
     */
    private buildAuthUrl(provider: SocialProvider): string {
        const params = new URLSearchParams({
            client_id: provider.config.clientId,
            redirect_uri: provider.config.redirectUri,
            scope: provider.config.scope.join(' '),
            response_type: provider.config.responseType,
            state: this.generateState(),
        })

        return `${provider.config.endpoints.auth}?${params.toString()}`
    }

    /**
     * Exchange authorization code for access token
     */
    private async exchangeCodeForToken(provider: SocialProvider, code: string): Promise<SocialAuthResponse> {
        try {
            const response = await fetch('/api/auth/social/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: provider.id,
                    code,
                    redirectUri: provider.config.redirectUri,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    token: data.accessToken,
                    message: 'Token exchange successful',
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Token exchange failed',
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Get user information from provider
     */
    private async getUserInfo(provider: SocialProvider, accessToken: string): Promise<SocialAuthResponse> {
        try {
            const response = await fetch('/api/auth/social/userinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: provider.id,
                    accessToken,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    userData: data.userData,
                    message: 'User info retrieved successfully',
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Failed to get user info',
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Create or update user from social data
     */
    private async createOrUpdateUser(userData: SocialUserData, providerId: string): Promise<User> {
        try {
            const response = await fetch('/api/auth/social/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userData,
                    provider: providerId,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return data.user
            } else {
                throw new Error(data.error || 'Failed to create/update user')
            }
        } catch (error) {
            throw new Error(error.message)
        }
    }

    /**
     * Generate JWT token
     */
    private generateJWT(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        }

        // This would use a proper JWT library in production
        return btoa(JSON.stringify(payload))
    }

    /**
     * Generate refresh token
     */
    private generateRefreshToken(): string {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Generate state parameter for OAuth
     */
    private generateState(): string {
        const array = new Uint8Array(16)
        crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Get current auth state
     */
    getAuthState(): SocialAuthState {
        return this.authState
    }

    /**
     * Clear auth state
     */
    clearAuthState(): void {
        this.authState = {
            isAuthenticating: false,
            provider: null,
            error: null,
            redirectUrl: null,
        }
    }

    /**
     * Check if provider is available
     */
    isProviderAvailable(providerId: string): boolean {
        const provider = this.getProvider(providerId)
        return provider ? provider.isEnabled : false
    }

    /**
     * Get provider configuration
     */
    getProviderConfig(providerId: string): SocialProviderConfig | null {
        const provider = this.getProvider(providerId)
        return provider ? provider.config : null
    }

    /**
     * Enable/disable provider
     */
    setProviderEnabled(providerId: string, enabled: boolean): boolean {
        const provider = this.getProvider(providerId)
        if (!provider) return false

        provider.isEnabled = enabled
        this.providers.set(providerId, provider)
        return true
    }

    /**
     * Get social login statistics
     */
    getSocialLoginStats(): {
        totalLogins: number
        providerStats: { [provider: string]: number }
        successRate: number
    } {
        // This would typically come from analytics data
        return {
            totalLogins: 0,
            providerStats: {},
            successRate: 0,
        }
    }

    /**
     * Handle social auth errors
     */
    handleSocialAuthError(error: string): SocialAuthResponse {
        this.authState.error = error
        this.authState.isAuthenticating = false

        return {
            success: false,
            error,
        }
    }

    /**
     * Validate social auth callback
     */
    validateSocialAuthCallback(providerId: string, code: string, state?: string): boolean {
        // Validate state parameter
        if (state && !this.validateState(state)) {
            return false
        }

        // Validate code format
        if (!code || code.length < 10) {
            return false
        }

        // Validate provider
        if (!this.isProviderAvailable(providerId)) {
            return false
        }

        return true
    }

    /**
     * Validate state parameter
     */
    private validateState(state: string): boolean {
        // In production, store and validate state parameter
        return state.length > 0
    }

    /**
     * Get social auth URL for provider
     */
    getSocialAuthUrl(providerId: string): string | null {
        const provider = this.getProvider(providerId)
        if (!provider || !provider.isEnabled) return null

        return this.buildAuthUrl(provider)
    }

    /**
     * Check if user is already linked to social provider
     */
    async isUserLinkedToProvider(userId: string, providerId: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/auth/social/link-status?userId=${userId}&provider=${providerId}`)
            const data = await response.json()
            return data.isLinked || false
        } catch (error) {
            return false
        }
    }

    /**
     * Link social account to existing user
     */
    async linkSocialAccount(userId: string, providerId: string, code: string): Promise<SocialAuthResponse> {
        try {
            const response = await fetch('/api/auth/social/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    provider: providerId,
                    code,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    message: 'Social account linked successfully',
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Failed to link social account',
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Unlink social account
     */
    async unlinkSocialAccount(userId: string, providerId: string): Promise<SocialAuthResponse> {
        try {
            const response = await fetch('/api/auth/social/unlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    provider: providerId,
                }),
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    message: 'Social account unlinked successfully',
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Failed to unlink social account',
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }
    }
}

export const socialAuth = new SocialAuth()
export default socialAuth
