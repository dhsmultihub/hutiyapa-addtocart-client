import { httpClient, ApiResponse } from '../client'
import { User } from '../../features/auth/redux/auth.slice'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface RegisterResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
  emailVerificationRequired: boolean
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

class AuthService {
  // User login
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>('/auth/login', credentials)
  }

  // User registration
  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return httpClient.post<RegisterResponse>('/auth/register', userData)
  }

  // User logout
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/logout')
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return httpClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
  }

  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    return httpClient.get<User>('/auth/profile')
  }

  // Update user profile
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return httpClient.patch<User>('/auth/profile', profileData)
  }

  // Change password
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/change-password', passwordData)
  }

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/forgot-password', { email })
  }

  // Reset password
  async resetPassword(resetData: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/reset-password', resetData)
  }

  // Verify email
  async verifyEmail(verificationData: VerifyEmailRequest): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/verify-email', verificationData)
  }

  // Resend email verification
  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/resend-verification', { email })
  }

  // Check if email exists
  async checkEmail(email: string): Promise<ApiResponse<{ exists: boolean }>> {
    return httpClient.post<{ exists: boolean }>('/auth/check-email', { email })
  }

  // Social login (Google, Facebook, etc.)
  async socialLogin(provider: string, token: string): Promise<ApiResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>(`/auth/social/${provider}`, { token })
  }

  // Link social account
  async linkSocialAccount(provider: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>(`/auth/link-social/${provider}`, { token })
  }

  // Unlink social account
  async unlinkSocialAccount(provider: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/auth/unlink-social/${provider}`)
  }

  // Get user sessions
  async getUserSessions(): Promise<ApiResponse<{
    sessions: Array<{
      id: string
      device: string
      location: string
      lastActive: string
      current: boolean
    }>
  }>> {
    return httpClient.get<{
      sessions: Array<{
        id: string
        device: string
        location: string
        lastActive: string
        current: boolean
      }>
    }>('/auth/sessions')
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`)
  }

  // Revoke all sessions
  async revokeAllSessions(): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>('/auth/sessions')
  }

  // Enable two-factor authentication
  async enable2FA(): Promise<ApiResponse<{
    qrCode: string
    secret: string
    backupCodes: string[]
  }>> {
    return httpClient.post<{
      qrCode: string
      secret: string
      backupCodes: string[]
    }>('/auth/2fa/enable')
  }

  // Verify two-factor authentication
  async verify2FA(token: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/2fa/verify', { token })
  }

  // Disable two-factor authentication
  async disable2FA(password: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.post<{ message: string }>('/auth/2fa/disable', { password })
  }

  // Get user preferences
  async getUserPreferences(): Promise<ApiResponse<{
    notifications: boolean
    emailUpdates: boolean
    language: string
    timezone: string
    currency: string
  }>> {
    return httpClient.get<{
      notifications: boolean
      emailUpdates: boolean
      language: string
      timezone: string
      currency: string
    }>('/auth/preferences')
  }

  // Update user preferences
  async updateUserPreferences(preferences: {
    notifications?: boolean
    emailUpdates?: boolean
    language?: string
    timezone?: string
    currency?: string
  }): Promise<ApiResponse<{ message: string }>> {
    return httpClient.patch<{ message: string }>('/auth/preferences', preferences)
  }

  // Delete user account
  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return httpClient.delete<{ message: string }>('/auth/account', { data: { password } })
  }

  // Get account activity
  async getAccountActivity(page?: number, limit?: number): Promise<ApiResponse<{
    activities: Array<{
      id: string
      action: string
      description: string
      ip: string
      userAgent: string
      timestamp: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>> {
    return httpClient.get<{
      activities: Array<{
        id: string
        action: string
        description: string
        ip: string
        userAgent: string
        timestamp: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>('/auth/activity', { params: { page, limit } })
  }
}

export const authService = new AuthService()
export default authService
