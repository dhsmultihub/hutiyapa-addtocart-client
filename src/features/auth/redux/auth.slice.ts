import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    isEmailVerified: boolean
    createdAt: string
    updatedAt: string
}

export interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    lastLoginAt: string | null
    sessionExpiry: string | null
}

const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastLoginAt: null,
    sessionExpiry: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Login actions
        loginStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.refreshToken = action.payload.refreshToken
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
            state.lastLoginAt = new Date().toISOString()
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.user = null
            state.token = null
            state.refreshToken = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = action.payload
            state.lastLoginAt = null
            state.sessionExpiry = null
        },

        // Registration actions
        registerStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        registerSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.refreshToken = action.payload.refreshToken
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
            state.lastLoginAt = new Date().toISOString()
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        registerFailure: (state, action: PayloadAction<string>) => {
            state.user = null
            state.token = null
            state.refreshToken = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = action.payload
            state.lastLoginAt = null
            state.sessionExpiry = null
        },

        // Logout actions
        logout: (state) => {
            state.user = null
            state.token = null
            state.refreshToken = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = null
            state.lastLoginAt = null
            state.sessionExpiry = null
        },

        // Token refresh actions
        refreshTokenStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        refreshTokenSuccess: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
            state.token = action.payload.token
            state.refreshToken = action.payload.refreshToken
            state.isLoading = false
            state.error = null
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        refreshTokenFailure: (state, action: PayloadAction<string>) => {
            state.user = null
            state.token = null
            state.refreshToken = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = action.payload
            state.lastLoginAt = null
            state.sessionExpiry = null
        },

        // Profile update actions
        updateProfileStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        updateProfileSuccess: (state, action: PayloadAction<User>) => {
            state.user = action.payload
            state.isLoading = false
            state.error = null
        },
        updateProfileFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Password change actions
        changePasswordStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        changePasswordSuccess: (state) => {
            state.isLoading = false
            state.error = null
        },
        changePasswordFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Email verification actions
        verifyEmailStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        verifyEmailSuccess: (state) => {
            if (state.user) {
                state.user.isEmailVerified = true
            }
            state.isLoading = false
            state.error = null
        },
        verifyEmailFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Password reset actions
        resetPasswordStart: (state) => {
            state.isLoading = true
            state.error = null
        },
        resetPasswordSuccess: (state) => {
            state.isLoading = false
            state.error = null
        },
        resetPasswordFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false
            state.error = action.payload
        },

        // Clear error
        clearError: (state) => {
            state.error = null
        },

        // Set loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },

        // Restore session from storage
        restoreSession: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string; lastLoginAt: string }>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.refreshToken = action.payload.refreshToken
            state.isAuthenticated = true
            state.lastLoginAt = action.payload.lastLoginAt
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },

        // Check session expiry
        checkSessionExpiry: (state) => {
            if (state.sessionExpiry && new Date(state.sessionExpiry) < new Date()) {
                state.user = null
                state.token = null
                state.refreshToken = null
                state.isAuthenticated = false
                state.sessionExpiry = null
            }
        },
    },
})

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    registerStart,
    registerSuccess,
    registerFailure,
    logout,
    refreshTokenStart,
    refreshTokenSuccess,
    refreshTokenFailure,
    updateProfileStart,
    updateProfileSuccess,
    updateProfileFailure,
    changePasswordStart,
    changePasswordSuccess,
    changePasswordFailure,
    verifyEmailStart,
    verifyEmailSuccess,
    verifyEmailFailure,
    resetPasswordStart,
    resetPasswordSuccess,
    resetPasswordFailure,
    clearError,
    setLoading,
    restoreSession,
    checkSessionExpiry,
} = authSlice.actions

export default authSlice.reducer
