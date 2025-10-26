import { Product, ProductFilter, ProductSort } from '../redux/products.slice'

export interface SearchResult {
    products: Product[]
    total: number
    suggestions: string[]
    filters: {
        categories: Array<{ name: string; count: number }>
        brands: Array<{ name: string; count: number }>
        priceRange: { min: number; max: number }
        ratings: Array<{ rating: number; count: number }>
    }
    pagination: {
        page: number
        limit: number
        totalPages: number
    }
}

export interface SearchQuery {
    query: string
    filters: ProductFilter
    sort: ProductSort
    pagination: {
        page: number
        limit: number
    }
}

export interface SearchSuggestion {
    text: string
    type: 'product' | 'category' | 'brand' | 'tag'
    count: number
    relevance: number
}

export class ProductSearchEngine {
    private static readonly MIN_QUERY_LENGTH = 2
    private static readonly MAX_SUGGESTIONS = 10
    private static readonly FUZZY_THRESHOLD = 0.6

    /**
     * Search products with advanced filtering and sorting
     */
    static searchProducts(
        products: Product[],
        searchQuery: SearchQuery
    ): SearchResult {
        let filteredProducts = [...products]

        // Apply text search
        if (searchQuery.query.trim().length >= this.MIN_QUERY_LENGTH) {
            filteredProducts = this.applyTextSearch(filteredProducts, searchQuery.query)
        }

        // Apply filters
        filteredProducts = this.applyFilters(filteredProducts, searchQuery.filters)

        // Apply sorting
        filteredProducts = this.applySorting(filteredProducts, searchQuery.sort)

        // Calculate pagination
        const total = filteredProducts.length
        const totalPages = Math.ceil(total / searchQuery.pagination.limit)
        const startIndex = (searchQuery.pagination.page - 1) * searchQuery.pagination.limit
        const endIndex = startIndex + searchQuery.pagination.limit
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

        // Generate suggestions
        const suggestions = this.generateSuggestions(products, searchQuery.query)

        // Generate filter options
        const filters = this.generateFilterOptions(products, searchQuery.filters)

        return {
            products: paginatedProducts,
            total,
            suggestions,
            filters,
            pagination: {
                page: searchQuery.pagination.page,
                limit: searchQuery.pagination.limit,
                totalPages,
            },
        }
    }

    /**
     * Apply text search with fuzzy matching
     */
    private static applyTextSearch(products: Product[], query: string): Product[] {
        const searchTerms = query.toLowerCase().split(/\s+/)

        return products.filter(product => {
            const searchableText = [
                product.title,
                product.description,
                product.category,
                product.brand,
                product.sku,
                ...product.tags,
            ].join(' ').toLowerCase()

            // Exact match
            if (searchableText.includes(query.toLowerCase())) {
                return true
            }

            // Fuzzy match
            const relevance = this.calculateRelevance(searchableText, searchTerms)
            return relevance >= this.FUZZY_THRESHOLD
        })
    }

    /**
     * Calculate relevance score for fuzzy matching
     */
    private static calculateRelevance(text: string, searchTerms: string[]): number {
        let score = 0
        let totalTerms = searchTerms.length

        for (const term of searchTerms) {
            if (text.includes(term)) {
                score += 1
            } else {
                // Check for partial matches
                const partialMatches = this.findPartialMatches(text, term)
                score += partialMatches * 0.5
            }
        }

        return score / totalTerms
    }

    /**
     * Find partial matches for fuzzy search
     */
    private static findPartialMatches(text: string, term: string): number {
        let matches = 0
        const termLength = term.length

        for (let i = 0; i <= text.length - termLength; i++) {
            const substring = text.substring(i, i + termLength)
            const similarity = this.calculateSimilarity(substring, term)
            if (similarity > 0.7) {
                matches += similarity
            }
        }

        return matches
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private static calculateSimilarity(str1: string, str2: string): number {
        const maxLength = Math.max(str1.length, str2.length)
        if (maxLength === 0) return 1

        const distance = this.levenshteinDistance(str1, str2)
        return 1 - distance / maxLength
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private static levenshteinDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,      // deletion
                    matrix[j - 1][i] + 1,      // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                )
            }
        }

        return matrix[str2.length][str1.length]
    }

    /**
     * Apply filters to products
     */
    private static applyFilters(products: Product[], filters: ProductFilter): Product[] {
        return products.filter(product => {
            // Category filter
            if (filters.category && product.category !== filters.category) {
                return false
            }

            // Brand filter
            if (filters.brand && product.brand !== filters.brand) {
                return false
            }

            // Price range filter
            if (filters.minPrice !== undefined && product.price < filters.minPrice) {
                return false
            }
            if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
                return false
            }

            // Rating filter
            if (filters.minRating !== undefined && product.rating < filters.minRating) {
                return false
            }

            // Stock filter
            if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
                return false
            }

            // Tags filter
            if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag => product.tags.includes(tag))
                if (!hasMatchingTag) {
                    return false
                }
            }

            // Featured filter
            if (filters.isFeatured !== undefined && product.isFeatured !== filters.isFeatured) {
                return false
            }

            // New filter
            if (filters.isNew !== undefined && product.isNew !== filters.isNew) {
                return false
            }

            // Sale filter
            if (filters.isOnSale !== undefined && product.isOnSale !== filters.isOnSale) {
                return false
            }

            return true
        })
    }

    /**
     * Apply sorting to products
     */
    private static applySorting(products: Product[], sort: ProductSort): Product[] {
        return [...products].sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sort.field) {
                case 'title':
                    aValue = a.title.toLowerCase()
                    bValue = b.title.toLowerCase()
                    break
                case 'price':
                    aValue = a.price
                    bValue = b.price
                    break
                case 'rating':
                    aValue = a.rating
                    bValue = b.rating
                    break
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
                    break
                case 'updatedAt':
                    aValue = new Date(a.updatedAt).getTime()
                    bValue = new Date(b.updatedAt).getTime()
                    break
                case 'popularity':
                    aValue = a.reviewCount
                    bValue = b.reviewCount
                    break
                default:
                    aValue = a.title.toLowerCase()
                    bValue = b.title.toLowerCase()
            }

            if (aValue < bValue) {
                return sort.order === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sort.order === 'asc' ? 1 : -1
            }
            return 0
        })
    }

    /**
     * Generate search suggestions
     */
    private static generateSuggestions(products: Product[], query: string): string[] {
        if (query.length < this.MIN_QUERY_LENGTH) {
            return []
        }

        const suggestions = new Set<string>()
        const queryLower = query.toLowerCase()

        // Product title suggestions
        products.forEach(product => {
            if (product.title.toLowerCase().includes(queryLower)) {
                suggestions.add(product.title)
            }
        })

        // Category suggestions
        const categories = [...new Set(products.map(p => p.category))]
        categories.forEach(category => {
            if (category.toLowerCase().includes(queryLower)) {
                suggestions.add(category)
            }
        })

        // Brand suggestions
        const brands = [...new Set(products.map(p => p.brand))]
        brands.forEach(brand => {
            if (brand.toLowerCase().includes(queryLower)) {
                suggestions.add(brand)
            }
        })

        // Tag suggestions
        const allTags = products.flatMap(p => p.tags)
        const uniqueTags = [...new Set(allTags)]
        uniqueTags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
                suggestions.add(tag)
            }
        })

        return Array.from(suggestions).slice(0, this.MAX_SUGGESTIONS)
    }

    /**
     * Generate filter options with counts
     */
    private static generateFilterOptions(
        products: Product[],
        currentFilters: ProductFilter
    ): SearchResult['filters'] {
        const categories = new Map<string, number>()
        const brands = new Map<string, number>()
        const ratings = new Map<number, number>()
        let minPrice = Infinity
        let maxPrice = -Infinity

        products.forEach(product => {
            // Count categories
            const categoryCount = categories.get(product.category) || 0
            categories.set(product.category, categoryCount + 1)

            // Count brands
            const brandCount = brands.get(product.brand) || 0
            brands.set(product.brand, brandCount + 1)

            // Count ratings
            const rating = Math.floor(product.rating)
            const ratingCount = ratings.get(rating) || 0
            ratings.set(rating, ratingCount + 1)

            // Track price range
            minPrice = Math.min(minPrice, product.price)
            maxPrice = Math.max(maxPrice, product.price)
        })

        return {
            categories: Array.from(categories.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            brands: Array.from(brands.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            priceRange: { min: minPrice, max: maxPrice },
            ratings: Array.from(ratings.entries())
                .map(([rating, count]) => ({ rating, count }))
                .sort((a, b) => b.rating - a.rating),
        }
    }

    /**
     * Get search suggestions for autocomplete
     */
    static getSearchSuggestions(products: Product[], query: string): SearchSuggestion[] {
        if (query.length < this.MIN_QUERY_LENGTH) {
            return []
        }

        const suggestions: SearchSuggestion[] = []
        const queryLower = query.toLowerCase()

        // Product suggestions
        products.forEach(product => {
            if (product.title.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: product.title,
                    type: 'product',
                    count: 1,
                    relevance: this.calculateRelevance(product.title.toLowerCase(), [queryLower]),
                })
            }
        })

        // Category suggestions
        const categories = [...new Set(products.map(p => p.category))]
        categories.forEach(category => {
            if (category.toLowerCase().includes(queryLower)) {
                const count = products.filter(p => p.category === category).length
                suggestions.push({
                    text: category,
                    type: 'category',
                    count,
                    relevance: this.calculateRelevance(category.toLowerCase(), [queryLower]),
                })
            }
        })

        // Brand suggestions
        const brands = [...new Set(products.map(p => p.brand))]
        brands.forEach(brand => {
            if (brand.toLowerCase().includes(queryLower)) {
                const count = products.filter(p => p.brand === brand).length
                suggestions.push({
                    text: brand,
                    type: 'brand',
                    count,
                    relevance: this.calculateRelevance(brand.toLowerCase(), [queryLower]),
                })
            }
        })

        // Tag suggestions
        const allTags = products.flatMap(p => p.tags)
        const uniqueTags = [...new Set(allTags)]
        uniqueTags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
                const count = products.filter(p => p.tags.includes(tag)).length
                suggestions.push({
                    text: tag,
                    type: 'tag',
                    count,
                    relevance: this.calculateRelevance(tag.toLowerCase(), [queryLower]),
                })
            }
        })

        return suggestions
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, this.MAX_SUGGESTIONS)
    }

    /**
     * Highlight search terms in text
     */
    static highlightSearchTerms(text: string, query: string): string {
        if (!query.trim()) return text

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        return text.replace(regex, '<mark>$1</mark>')
    }

    /**
     * Get search analytics
     */
    static getSearchAnalytics(products: Product[], searchQuery: SearchQuery): {
        totalProducts: number
        filteredProducts: number
        searchTime: number
        filtersApplied: number
        sortApplied: boolean
    } {
        const startTime = performance.now()

        const filteredProducts = this.applyFilters(
            this.applyTextSearch(products, searchQuery.query),
            searchQuery.filters
        )

        const endTime = performance.now()

        const filtersApplied = Object.values(searchQuery.filters).filter(value =>
            value !== undefined && value !== null && value !== ''
        ).length

        return {
            totalProducts: products.length,
            filteredProducts: filteredProducts.length,
            searchTime: endTime - startTime,
            filtersApplied,
            sortApplied: !!searchQuery.sort,
        }
    }
}

export default ProductSearchEngine
