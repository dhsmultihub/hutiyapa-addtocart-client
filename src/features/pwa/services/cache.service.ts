export interface CacheConfig {
    name: string
    version: string
    maxAge: number
    maxSize: number
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only'
}

export interface CacheEntry {
    key: string
    data: any
    timestamp: number
    expiresAt: number
    size: number
    hits: number
    lastAccessed: number
}

export interface CacheStats {
    totalEntries: number
    totalSize: number
    hitRate: number
    missRate: number
    oldestEntry: number
    newestEntry: number
}

export interface CacheStrategy {
    name: string
    description: string
    useCase: string
    implementation: (request: Request, cache: Cache) => Promise<Response>
}

export class CacheService {
    private static readonly DEFAULT_CONFIG: CacheConfig = {
        name: 'default',
        version: '1.0.0',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 100 * 1024 * 1024, // 100MB
        strategy: 'stale-while-revalidate',
    }

    private caches: Map<string, Cache> = new Map()
    private configs: Map<string, CacheConfig> = new Map()
    private stats: Map<string, CacheStats> = new Map()
    private strategies: Map<string, CacheStrategy> = new Map()

    constructor() {
        this.initializeStrategies()
        this.setupCleanup()
    }

    /**
     * Initialize cache strategies
     */
    private initializeStrategies(): void {
        // Cache first strategy
        this.strategies.set('cache-first', {
            name: 'Cache First',
            description: 'Check cache first, fallback to network',
            useCase: 'Static assets, images, fonts',
            implementation: async (request: Request, cache: Cache) => {
                const cachedResponse = await cache.match(request)
                if (cachedResponse) {
                    return cachedResponse
                }

                const networkResponse = await fetch(request)
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone())
                }
                return networkResponse
            },
        })

        // Network first strategy
        this.strategies.set('network-first', {
            name: 'Network First',
            description: 'Try network first, fallback to cache',
            useCase: 'API requests, dynamic content',
            implementation: async (request: Request, cache: Cache) => {
                try {
                    const networkResponse = await fetch(request)
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone())
                    }
                    return networkResponse
                } catch (error) {
                    const cachedResponse = await cache.match(request)
                    if (cachedResponse) {
                        return cachedResponse
                    }
                    throw error
                }
            },
        })

        // Stale while revalidate strategy
        this.strategies.set('stale-while-revalidate', {
            name: 'Stale While Revalidate',
            description: 'Return cached version immediately, update in background',
            useCase: 'API responses, frequently accessed data',
            implementation: async (request: Request, cache: Cache) => {
                const cachedResponse = await cache.match(request)

                // Return cached response immediately
                if (cachedResponse) {
                    // Update cache in background
                    fetch(request).then(async (networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone())
                        }
                    }).catch(() => {
                        // Ignore network errors for background updates
                    })

                    return cachedResponse
                }

                // No cached version, fetch from network
                const networkResponse = await fetch(request)
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone())
                }
                return networkResponse
            },
        })

        // Network only strategy
        this.strategies.set('network-only', {
            name: 'Network Only',
            description: 'Always fetch from network, never use cache',
            useCase: 'Critical data, real-time updates',
            implementation: async (request: Request, cache: Cache) => {
                const networkResponse = await fetch(request)
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone())
                }
                return networkResponse
            },
        })

        // Cache only strategy
        this.strategies.set('cache-only', {
            name: 'Cache Only',
            description: 'Only use cache, never fetch from network',
            useCase: 'Offline mode, cached resources',
            implementation: async (request: Request, cache: Cache) => {
                const cachedResponse = await cache.match(request)
                if (cachedResponse) {
                    return cachedResponse
                }
                throw new Error('No cached version available')
            },
        })
    }

    /**
     * Create cache with configuration
     */
    async createCache(name: string, config: Partial<CacheConfig> = {}): Promise<Cache> {
        const fullConfig = { ...CacheService.DEFAULT_CONFIG, ...config, name }
        this.configs.set(name, fullConfig)

        const cache = await caches.open(`${name}-${fullConfig.version}`)
        this.caches.set(name, cache)

        // Initialize stats
        this.stats.set(name, {
            totalEntries: 0,
            totalSize: 0,
            hitRate: 0,
            missRate: 0,
            oldestEntry: Date.now(),
            newestEntry: Date.now(),
        })

        return cache
    }

    /**
     * Get cache by name
     */
    async getCache(name: string): Promise<Cache | null> {
        if (this.caches.has(name)) {
            return this.caches.get(name)!
        }

        // Try to open existing cache
        try {
            const config = this.configs.get(name) || CacheService.DEFAULT_CONFIG
            const cache = await caches.open(`${name}-${config.version}`)
            this.caches.set(name, cache)
            return cache
        } catch (error) {
            console.error(`Failed to get cache ${name}:`, error)
            return null
        }
    }

    /**
     * Cache request with strategy
     */
    async cacheRequest(
        name: string,
        request: Request,
        strategy: string = 'stale-while-revalidate'
    ): Promise<Response> {
        const cache = await this.getCache(name)
        if (!cache) {
            throw new Error(`Cache ${name} not found`)
        }

        const strategyImpl = this.strategies.get(strategy)
        if (!strategyImpl) {
            throw new Error(`Strategy ${strategy} not found`)
        }

        try {
            const response = await strategyImpl.implementation(request, cache)
            this.updateStats(name, true)
            return response
        } catch (error) {
            this.updateStats(name, false)
            throw error
        }
    }

    /**
     * Add entry to cache
     */
    async addEntry(
        name: string,
        key: string,
        data: any,
        options: {
            maxAge?: number
            priority?: 'high' | 'medium' | 'low'
        } = {}
    ): Promise<void> {
        const cache = await this.getCache(name)
        if (!cache) {
            throw new Error(`Cache ${name} not found`)
        }

        const config = this.configs.get(name) || CacheService.DEFAULT_CONFIG
        const maxAge = options.maxAge || config.maxAge
        const entry: CacheEntry = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + maxAge,
            size: JSON.stringify(data).length,
            hits: 0,
            lastAccessed: Date.now(),
        }

        // Check cache size limit
        await this.enforceSizeLimit(name, entry.size)

        // Store entry
        const request = new Request(key)
        const response = new Response(JSON.stringify(entry))
        await cache.put(request, response)

        this.updateStats(name, true)
    }

    /**
     * Get entry from cache
     */
    async getEntry(name: string, key: string): Promise<any | null> {
        const cache = await this.getCache(name)
        if (!cache) {
            return null
        }

        const request = new Request(key)
        const response = await cache.match(request)

        if (response) {
            try {
                const entry: CacheEntry = await response.json()

                // Check if entry is expired
                if (entry.expiresAt < Date.now()) {
                    await cache.delete(request)
                    return null
                }

                // Update access stats
                entry.hits++
                entry.lastAccessed = Date.now()

                // Update entry in cache
                const updatedResponse = new Response(JSON.stringify(entry))
                await cache.put(request, updatedResponse)

                this.updateStats(name, true)
                return entry.data
            } catch (error) {
                console.error('Failed to parse cache entry:', error)
                return null
            }
        }

        this.updateStats(name, false)
        return null
    }

    /**
     * Remove entry from cache
     */
    async removeEntry(name: string, key: string): Promise<boolean> {
        const cache = await this.getCache(name)
        if (!cache) {
            return false
        }

        const request = new Request(key)
        return await cache.delete(request)
    }

    /**
     * Clear cache
     */
    async clearCache(name: string): Promise<void> {
        const cache = await this.getCache(name)
        if (cache) {
            const keys = await cache.keys()
            await Promise.all(keys.map(key => cache.delete(key)))

            // Reset stats
            this.stats.set(name, {
                totalEntries: 0,
                totalSize: 0,
                hitRate: 0,
                missRate: 0,
                oldestEntry: Date.now(),
                newestEntry: Date.now(),
            })
        }
    }

    /**
     * Delete cache
     */
    async deleteCache(name: string): Promise<void> {
        const config = this.configs.get(name)
        if (config) {
            await caches.delete(`${name}-${config.version}`)
            this.caches.delete(name)
            this.configs.delete(name)
            this.stats.delete(name)
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats(name: string): CacheStats | null {
        return this.stats.get(name) || null
    }

    /**
     * Get all cache statistics
     */
    getAllCacheStats(): Map<string, CacheStats> {
        return new Map(this.stats)
    }

    /**
     * Get cache configuration
     */
    getCacheConfig(name: string): CacheConfig | null {
        return this.configs.get(name) || null
    }

    /**
     * Update cache configuration
     */
    updateCacheConfig(name: string, config: Partial<CacheConfig>): void {
        const existingConfig = this.configs.get(name)
        if (existingConfig) {
            this.configs.set(name, { ...existingConfig, ...config })
        }
    }

    /**
     * Get available strategies
     */
    getStrategies(): Map<string, CacheStrategy> {
        return new Map(this.strategies)
    }

    /**
     * Add custom strategy
     */
    addStrategy(name: string, strategy: CacheStrategy): void {
        this.strategies.set(name, strategy)
    }

    /**
     * Remove strategy
     */
    removeStrategy(name: string): boolean {
        return this.strategies.delete(name)
    }

    /**
     * Enforce size limit
     */
    private async enforceSizeLimit(name: string, newEntrySize: number): Promise<void> {
        const config = this.configs.get(name)
        if (!config) return

        const cache = await this.getCache(name)
        if (!cache) return

        const stats = this.stats.get(name)
        if (!stats) return

        // Check if adding this entry would exceed the limit
        if (stats.totalSize + newEntrySize > config.maxSize) {
            // Remove oldest entries until we have enough space
            const keys = await cache.keys()
            const entries: Array<{ key: Request; entry: CacheEntry }> = []

            for (const key of keys) {
                const response = await cache.match(key)
                if (response) {
                    try {
                        const entry: CacheEntry = await response.json()
                        entries.push({ key, entry })
                    } catch (error) {
                        // Remove invalid entries
                        await cache.delete(key)
                    }
                }
            }

            // Sort by last accessed time (oldest first)
            entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed)

            // Remove entries until we have enough space
            let currentSize = stats.totalSize
            for (const { key, entry } of entries) {
                if (currentSize + newEntrySize <= config.maxSize) {
                    break
                }

                await cache.delete(key)
                currentSize -= entry.size
            }
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(name: string, hit: boolean): void {
        const stats = this.stats.get(name)
        if (!stats) return

        if (hit) {
            stats.hitRate = (stats.hitRate + 1) / 2
        } else {
            stats.missRate = (stats.missRate + 1) / 2
        }

        this.stats.set(name, stats)
    }

    /**
     * Setup cleanup
     */
    private setupCleanup(): void {
        // Clean up expired entries every hour
        setInterval(() => {
            this.cleanupExpiredEntries()
        }, 60 * 60 * 1000)
    }

    /**
     * Clean up expired entries
     */
    private async cleanupExpiredEntries(): Promise<void> {
        for (const [name, cache] of this.caches) {
            try {
                const keys = await cache.keys()
                const now = Date.now()

                for (const key of keys) {
                    const response = await cache.match(key)
                    if (response) {
                        try {
                            const entry: CacheEntry = await response.json()
                            if (entry.expiresAt < now) {
                                await cache.delete(key)
                            }
                        } catch (error) {
                            // Remove invalid entries
                            await cache.delete(key)
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to cleanup cache ${name}:`, error)
            }
        }
    }

    /**
     * Get cache health
     */
    getCacheHealth(name: string): {
        isHealthy: boolean
        issues: string[]
        recommendations: string[]
    } {
        const stats = this.stats.get(name)
        const config = this.configs.get(name)

        if (!stats || !config) {
            return {
                isHealthy: false,
                issues: ['Cache not found'],
                recommendations: ['Create cache with proper configuration'],
            }
        }

        const issues: string[] = []
        const recommendations: string[] = []

        // Check hit rate
        if (stats.hitRate < 0.5) {
            issues.push('Low hit rate')
            recommendations.push('Consider adjusting cache strategy or increasing cache size')
        }

        // Check size usage
        const sizeUsage = stats.totalSize / config.maxSize
        if (sizeUsage > 0.9) {
            issues.push('Cache size near limit')
            recommendations.push('Consider increasing maxSize or implementing better cleanup')
        }

        // Check entry count
        if (stats.totalEntries > 1000) {
            issues.push('High entry count')
            recommendations.push('Consider implementing entry expiration or cleanup')
        }

        return {
            isHealthy: issues.length === 0,
            issues,
            recommendations,
        }
    }

    /**
     * Export cache data
     */
    async exportCacheData(name: string): Promise<string> {
        const cache = await this.getCache(name)
        if (!cache) {
            throw new Error(`Cache ${name} not found`)
        }

        const keys = await cache.keys()
        const entries: any[] = []

        for (const key of keys) {
            const response = await cache.match(key)
            if (response) {
                try {
                    const entry: CacheEntry = await response.json()
                    entries.push({
                        key: key.url,
                        data: entry.data,
                        timestamp: entry.timestamp,
                        expiresAt: entry.expiresAt,
                        size: entry.size,
                        hits: entry.hits,
                        lastAccessed: entry.lastAccessed,
                    })
                } catch (error) {
                    console.error('Failed to export cache entry:', error)
                }
            }
        }

        return JSON.stringify({
            name,
            version: this.configs.get(name)?.version || '1.0.0',
            exportedAt: new Date().toISOString(),
            entries,
        }, null, 2)
    }

    /**
     * Import cache data
     */
    async importCacheData(name: string, data: string): Promise<void> {
        try {
            const parsed = JSON.parse(data)
            const cache = await this.getCache(name)
            if (!cache) {
                throw new Error(`Cache ${name} not found`)
            }

            for (const entry of parsed.entries) {
                const request = new Request(entry.key)
                const response = new Response(JSON.stringify({
                    key: entry.key,
                    data: entry.data,
                    timestamp: entry.timestamp,
                    expiresAt: entry.expiresAt,
                    size: entry.size,
                    hits: entry.hits,
                    lastAccessed: entry.lastAccessed,
                }))

                await cache.put(request, response)
            }
        } catch (error) {
            console.error('Failed to import cache data:', error)
            throw error
        }
    }
}

export const cacheService = new CacheService()
export default cacheService
