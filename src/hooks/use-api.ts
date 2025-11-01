import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { ApiResponse, ApiError } from '../api/client'
import { ApiErrorHandler } from '../api/utils/error-handler'

export interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
  retry?: boolean
  retryDelay?: number
  retryAttempts?: number
}

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  success: boolean
  retryCount: number
}

export interface UseApiActions {
  execute: (...args: any[]) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): [UseApiState<T>, UseApiActions] {
  const {
    immediate = false,
    onSuccess,
    onError,
    retry = false,
    retryDelay = 1000,
    retryAttempts = 3,
  } = options

  const dispatch = useDispatch()
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
    retryCount: 0,
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Execute API call
  const execute = useCallback(async (...args: any[]) => {
    if (!isMountedRef.current) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiFunction(...args)
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false,
          success: true,
          error: null,
        }))

        onSuccess?.(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      if (!isMountedRef.current) return

      const apiError = error instanceof Error 
        ? { success: false, message: error.message, errors: [error.message], statusCode: 500, timestamp: new Date().toISOString() }
        : error as ApiError

      setState(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: apiError,
        retryCount: prev.retryCount + 1,
      }))

      onError?.(apiError)

      // Auto retry if enabled
      if (retry && state.retryCount < retryAttempts) {
        retryTimeoutRef.current = setTimeout(() => {
          execute(...args)
        }, retryDelay * Math.pow(2, state.retryCount)) // Exponential backoff
      }
    }
  }, [apiFunction, onSuccess, onError, retry, retryDelay, retryAttempts, state.retryCount])

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
      retryCount: 0,
    })
  }, [])

  // Manual retry
  const retry = useCallback(async () => {
    if (state.retryCount < retryAttempts) {
      await execute()
    }
  }, [execute, state.retryCount, retryAttempts])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return [state, { execute, reset, retry }]
}

// Hook for API mutations
export function useApiMutation<T = any, P = any>(
  mutationFunction: (params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): [UseApiState<T>, (params: P) => Promise<void>] {
  const [state, actions] = useApi(mutationFunction, { ...options, immediate: false })
  
  const mutate = useCallback(async (params: P) => {
    await actions.execute(params)
  }, [actions])

  return [state, mutate]
}

// Hook for API queries with caching
export function useApiQuery<T = any>(
  queryFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  args: any[] = [],
  options: UseApiOptions<T> & { 
    cacheKey?: string
    staleTime?: number
    refetchOnWindowFocus?: boolean
  } = {}
): [UseApiState<T>, UseApiActions] {
  const {
    cacheKey,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
    ...apiOptions
  } = options

  const [state, actions] = useApi(queryFunction, apiOptions)
  const lastFetchRef = useRef<number>(0)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  // Check cache
  const getCachedData = useCallback((key: string): T | null => {
    const cached = cacheRef.current.get(key)
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data
    }
    return null
  }, [staleTime])

  // Set cache
  const setCachedData = useCallback((key: string, data: T) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() })
  }, [])

  // Execute with cache
  const executeWithCache = useCallback(async (...execArgs: any[]) => {
    const key = cacheKey || JSON.stringify(execArgs)
    const cached = getCachedData(key)
    
    if (cached) {
      setState(prev => ({ ...prev, data: cached, success: true }))
      return
    }

    // Execute the API call - the state will be updated by actions.execute
    await actions.execute(...execArgs)
  }, [cacheKey, getCachedData, actions])

  // Cache data when state.data changes
  useEffect(() => {
    if (state.data && cacheKey) {
      setCachedData(cacheKey, state.data)
    }
  }, [state.data, cacheKey, setCachedData])

  // Memoize args to prevent infinite loops
  const argsRef = useRef(args)
  const argsString = useMemo(() => JSON.stringify(args), [args])
  
  useEffect(() => {
    argsRef.current = args
  }, [args])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const now = Date.now()
      if (now - lastFetchRef.current > staleTime) {
        executeWithCache(...argsRef.current)
        lastFetchRef.current = now
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, staleTime, executeWithCache])

  // Execute on mount and when args change (using ref to avoid infinite loops)
  useEffect(() => {
    executeWithCache(...argsRef.current)
    // Only re-execute if args actually change (checked via argsString)
  }, [executeWithCache, argsString])

  return [state, { ...actions, execute: executeWithCache }]
}

// Hook for paginated API calls
export function usePaginatedApi<T = any>(
  apiFunction: (page: number, limit: number, ...args: any[]) => Promise<ApiResponse<{
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>>,
  initialPage: number = 1,
  limit: number = 10,
  options: UseApiOptions<any> = {}
) {
  const [page, setPage] = useState(initialPage)
  const [allData, setAllData] = useState<T[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [state, actions] = useApi(
    (...args: any[]) => apiFunction(page, limit, ...args),
    {
      ...options,
      onSuccess: (data) => {
        setAllData(prev => page === 1 ? data.data : [...prev, ...data.data])
        setPagination(data.pagination)
        options.onSuccess?.(data)
      },
    }
  )

  const loadPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const loadMore = useCallback(() => {
    if (page < pagination.totalPages) {
      setPage(prev => prev + 1)
    }
  }, [page, pagination.totalPages])

  const reset = useCallback(() => {
    setPage(1)
    setAllData([])
    setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 })
    actions.reset()
  }, [actions])

  return {
    ...state,
    data: allData,
    pagination,
    page,
    loadPage,
    loadMore,
    hasMore: page < pagination.totalPages,
    reset,
  }
}

// Hook for real-time API updates
export function useRealtimeApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  interval: number = 30000, // 30 seconds
  options: UseApiOptions<T> = {}
) {
  const [state, actions] = useApi(apiFunction, { ...options, immediate: true })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        actions.execute()
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, actions])

  return state
}

// Hook for API with optimistic updates
export function useOptimisticApi<T = any, P = any>(
  queryFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  mutationFunction: (params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  const [queryState, queryActions] = useApi(queryFunction, { immediate: true })
  const [mutationState, mutate] = useApiMutation(mutationFunction, options)

  const optimisticMutate = useCallback(async (params: P, optimisticData: T) => {
    // Update UI immediately with optimistic data
    queryActions.execute = () => Promise.resolve({
      success: true,
      data: optimisticData,
      message: 'Optimistic update',
      timestamp: new Date().toISOString(),
    })

    try {
      // Perform actual mutation
      await mutate(params)
      
      // Refetch to get real data
      await queryActions.execute()
    } catch (error) {
      // Revert optimistic update on error
      await queryActions.execute()
      throw error
    }
  }, [mutate, queryActions])

  return {
    query: queryState,
    mutation: mutationState,
    optimisticMutate,
    refetch: queryActions.execute,
  }
}

export default useApi
