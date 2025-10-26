// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: UserRole
  isEmailVerified: boolean
  isPhoneVerified: boolean
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'user' | 'guest'

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  timezone: string
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
  orderUpdates: boolean
  priceAlerts: boolean
  stockAlerts: boolean
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private'
  dataSharing: boolean
  analytics: boolean
  marketing: boolean
}

// Authentication Types
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
  marketingConsent?: boolean
}

export interface RegisterResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
  verificationRequired: boolean
}

// Password Management
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

// Profile Management
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  currency?: string
  timezone?: string
  notifications?: Partial<NotificationPreferences>
  privacy?: Partial<PrivacyPreferences>
}

// User Session
export interface UserSession {
  id: string
  userId: string
  token: string
  deviceType: DeviceType
  userAgent: string
  ipAddress: string
  location?: {
    country: string
    city: string
    timezone: string
  }
  isActive: boolean
  lastActivity: string
  createdAt: string
  expiresAt: string
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet'

// User Analytics
export interface UserAnalytics {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  favoriteCategories: Array<{
    category: string
    count: number
  }>
  lastOrderDate?: string
  accountAge: number
  activityScore: number
}
