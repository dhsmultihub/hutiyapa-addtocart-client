import { Product } from '../redux/products.slice'

export interface RecommendationEngine {
    getRecommendations(productId: string, type: RecommendationType, limit?: number): Product[]
    getPersonalizedRecommendations(userId: string, limit?: number): Product[]
    getTrendingRecommendations(limit?: number): Product[]
    getSimilarProducts(productId: string, limit?: number): Product[]
    getFrequentlyBoughtTogether(productId: string, limit?: number): Product[]
    getRecentlyViewedRecommendations(userId: string, limit?: number): Product[]
}

export type RecommendationType =
    | 'similar'
    | 'related'
    | 'frequently_bought'
    | 'trending'
    | 'personalized'
    | 'recently_viewed'
    | 'category_based'
    | 'brand_based'
    | 'price_based'
    | 'rating_based'

export interface RecommendationScore {
    product: Product
    score: number
    reason: string
    confidence: number
}

export interface UserBehavior {
    userId: string
    viewedProducts: string[]
    purchasedProducts: string[]
    cartItems: string[]
    wishlistItems: string[]
    searchHistory: string[]
    preferences: {
        categories: string[]
        brands: string[]
        priceRange: { min: number; max: number }
        rating: number
    }
    lastActivity: string
}

export interface RecommendationContext {
    currentProduct?: Product
    userBehavior?: UserBehavior
    sessionData?: {
        viewedProducts: string[]
        searchQuery: string
        filters: any
    }
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    season?: 'spring' | 'summer' | 'fall' | 'winter'
}

export class ProductRecommendationEngine implements RecommendationEngine {
    private products: Product[]
    private userBehaviors: Map<string, UserBehavior> = new Map()
    private productSimilarity: Map<string, Map<string, number>> = new Map()
    private categorySimilarity: Map<string, Map<string, number>> = new Map()
    private brandSimilarity: Map<string, Map<string, number>> = new Map()

    constructor(products: Product[]) {
        this.products = products
        this.buildSimilarityMatrices()
    }

    /**
     * Get recommendations based on type
     */
    getRecommendations(
        productId: string,
        type: RecommendationType,
        limit: number = 5
    ): Product[] {
        switch (type) {
            case 'similar':
                return this.getSimilarProducts(productId, limit)
            case 'related':
                return this.getRelatedProducts(productId, limit)
            case 'frequently_bought':
                return this.getFrequentlyBoughtTogether(productId, limit)
            case 'trending':
                return this.getTrendingRecommendations(limit)
            case 'personalized':
                return this.getPersonalizedRecommendations('anonymous', limit)
            case 'recently_viewed':
                return this.getRecentlyViewedRecommendations('anonymous', limit)
            case 'category_based':
                return this.getCategoryBasedRecommendations(productId, limit)
            case 'brand_based':
                return this.getBrandBasedRecommendations(productId, limit)
            case 'price_based':
                return this.getPriceBasedRecommendations(productId, limit)
            case 'rating_based':
                return this.getRatingBasedRecommendations(productId, limit)
            default:
                return this.getSimilarProducts(productId, limit)
        }
    }

    /**
     * Get personalized recommendations for user
     */
    getPersonalizedRecommendations(userId: string, limit: number = 10): Product[] {
        const userBehavior = this.userBehaviors.get(userId)
        if (!userBehavior) {
            return this.getTrendingRecommendations(limit)
        }

        const recommendations: RecommendationScore[] = []
        const viewedProducts = new Set(userBehavior.viewedProducts)
        const purchasedProducts = new Set(userBehavior.purchasedProducts)
        const cartItems = new Set(userBehavior.cartItems)
        const wishlistItems = new Set(userBehavior.wishlistItems)

        this.products.forEach(product => {
            if (viewedProducts.has(product.id) || purchasedProducts.has(product.id)) {
                return // Skip already viewed/purchased products
            }

            let score = 0
            let reasons: string[] = []

            // Category preference
            if (userBehavior.preferences.categories.includes(product.category)) {
                score += 0.3
                reasons.push('matches your category preferences')
            }

            // Brand preference
            if (userBehavior.preferences.brands.includes(product.brand)) {
                score += 0.2
                reasons.push('matches your brand preferences')
            }

            // Price preference
            if (product.price >= userBehavior.preferences.priceRange.min &&
                product.price <= userBehavior.preferences.priceRange.max) {
                score += 0.2
                reasons.push('fits your price range')
            }

            // Rating preference
            if (product.rating >= userBehavior.preferences.rating) {
                score += 0.1
                reasons.push('meets your quality standards')
            }

            // Similar to viewed products
            const similarScore = this.getSimilarityToViewedProducts(product, userBehavior.viewedProducts)
            if (similarScore > 0.5) {
                score += similarScore * 0.2
                reasons.push('similar to products you viewed')
            }

            // Popular in category
            const categoryPopularity = this.getCategoryPopularity(product.category)
            if (categoryPopularity > 0.7) {
                score += 0.1
                reasons.push('popular in this category')
            }

            if (score > 0) {
                recommendations.push({
                    product,
                    score,
                    reason: reasons.join(', '),
                    confidence: Math.min(score, 1),
                })
            }
        })

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => r.product)
    }

    /**
     * Get trending recommendations
     */
    getTrendingRecommendations(limit: number = 10): Product[] {
        return this.products
            .sort((a, b) => {
                // Combine rating and review count for trending score
                const scoreA = a.rating * Math.log(a.reviewCount + 1)
                const scoreB = b.rating * Math.log(b.reviewCount + 1)
                return scoreB - scoreA
            })
            .slice(0, limit)
    }

    /**
     * Get similar products
     */
    getSimilarProducts(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        const similarities = this.productSimilarity.get(productId) || new Map()
        const similarProducts = Array.from(similarities.entries())
            .filter(([id, score]) => id !== productId && score > 0.3)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => this.products.find(p => p.id === id))
            .filter(Boolean) as Product[]

        return similarProducts
    }

    /**
     * Get related products
     */
    getRelatedProducts(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        const related = this.products
            .filter(p => p.id !== productId)
            .map(p => ({
                product: p,
                score: this.calculateRelatednessScore(product, p),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => r.product)

        return related
    }

    /**
     * Get frequently bought together products
     */
    getFrequentlyBoughtTogether(productId: string, limit: number = 5): Product[] {
        // This would typically use purchase history data
        // For now, return products from the same category with different brands
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        return this.products
            .filter(p =>
                p.id !== productId &&
                p.category === product.category &&
                p.brand !== product.brand
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
    }

    /**
     * Get recently viewed recommendations
     */
    getRecentlyViewedRecommendations(userId: string, limit: number = 5): Product[] {
        const userBehavior = this.userBehaviors.get(userId)
        if (!userBehavior || userBehavior.viewedProducts.length === 0) {
            return this.getTrendingRecommendations(limit)
        }

        const recentlyViewed = userBehavior.viewedProducts.slice(-5) // Last 5 viewed
        const recommendations: Product[] = []

        recentlyViewed.forEach(productId => {
            const similar = this.getSimilarProducts(productId, 2)
            recommendations.push(...similar)
        })

        // Remove duplicates and already viewed products
        const uniqueRecommendations = recommendations.filter(
            (product, index, self) =>
                index === self.findIndex(p => p.id === product.id) &&
                !userBehavior.viewedProducts.includes(product.id)
        )

        return uniqueRecommendations.slice(0, limit)
    }

    /**
     * Get category-based recommendations
     */
    getCategoryBasedRecommendations(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        return this.products
            .filter(p => p.id !== productId && p.category === product.category)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
    }

    /**
     * Get brand-based recommendations
     */
    getBrandBasedRecommendations(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        return this.products
            .filter(p => p.id !== productId && p.brand === product.brand)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
    }

    /**
     * Get price-based recommendations
     */
    getPriceBasedRecommendations(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        const priceRange = product.price * 0.2 // 20% price range
        const minPrice = product.price - priceRange
        const maxPrice = product.price + priceRange

        return this.products
            .filter(p =>
                p.id !== productId &&
                p.price >= minPrice &&
                p.price <= maxPrice
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
    }

    /**
     * Get rating-based recommendations
     */
    getRatingBasedRecommendations(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        const ratingRange = 0.5 // 0.5 rating range
        const minRating = Math.max(0, product.rating - ratingRange)
        const maxRating = Math.min(5, product.rating + ratingRange)

        return this.products
            .filter(p =>
                p.id !== productId &&
                p.rating >= minRating &&
                p.rating <= maxRating
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
    }

    /**
     * Build similarity matrices
     */
    private buildSimilarityMatrices(): void {
        this.products.forEach(product => {
            const productSimilarities = new Map<string, number>()
            const categorySimilarities = new Map<string, number>()
            const brandSimilarities = new Map<string, number>()

            this.products.forEach(otherProduct => {
                if (product.id !== otherProduct.id) {
                    // Product similarity
                    const productSim = this.calculateProductSimilarity(product, otherProduct)
                    productSimilarities.set(otherProduct.id, productSim)

                    // Category similarity
                    const categorySim = product.category === otherProduct.category ? 1 : 0
                    categorySimilarities.set(otherProduct.id, categorySim)

                    // Brand similarity
                    const brandSim = product.brand === otherProduct.brand ? 1 : 0
                    brandSimilarities.set(otherProduct.id, brandSim)
                }
            })

            this.productSimilarity.set(product.id, productSimilarities)
            this.categorySimilarity.set(product.id, categorySimilarities)
            this.brandSimilarity.set(product.id, brandSimilarities)
        })
    }

    /**
     * Calculate product similarity
     */
    private calculateProductSimilarity(product1: Product, product2: Product): number {
        let score = 0
        let factors = 0

        // Category similarity
        if (product1.category === product2.category) {
            score += 0.4
        }
        factors += 0.4

        // Brand similarity
        if (product1.brand === product2.brand) {
            score += 0.3
        }
        factors += 0.3

        // Tag similarity
        const commonTags = product1.tags.filter(tag => product2.tags.includes(tag))
        const tagSimilarity = commonTags.length / Math.max(product1.tags.length, product2.tags.length)
        score += tagSimilarity * 0.2
        factors += 0.2

        // Price similarity
        const priceDiff = Math.abs(product1.price - product2.price)
        const maxPrice = Math.max(product1.price, product2.price)
        const priceSimilarity = 1 - (priceDiff / maxPrice)
        score += priceSimilarity * 0.1
        factors += 0.1

        return factors > 0 ? score / factors : 0
    }

    /**
     * Calculate relatedness score
     */
    private calculateRelatednessScore(product1: Product, product2: Product): number {
        let score = 0

        // Same category
        if (product1.category === product2.category) {
            score += 0.4
        }

        // Same brand
        if (product1.brand === product2.brand) {
            score += 0.3
        }

        // Common tags
        const commonTags = product1.tags.filter(tag => product2.tags.includes(tag))
        score += (commonTags.length / Math.max(product1.tags.length, product2.tags.length)) * 0.2

        // Price range similarity
        const priceDiff = Math.abs(product1.price - product2.price)
        const maxPrice = Math.max(product1.price, product2.price)
        if (priceDiff / maxPrice < 0.5) {
            score += 0.1
        }

        return score
    }

    /**
     * Get similarity to viewed products
     */
    private getSimilarityToViewedProducts(product: Product, viewedProductIds: string[]): number {
        let totalSimilarity = 0
        let count = 0

        viewedProductIds.forEach(viewedId => {
            const viewedProduct = this.products.find(p => p.id === viewedId)
            if (viewedProduct) {
                const similarity = this.calculateProductSimilarity(product, viewedProduct)
                totalSimilarity += similarity
                count++
            }
        })

        return count > 0 ? totalSimilarity / count : 0
    }

    /**
     * Get category popularity
     */
    private getCategoryPopularity(category: string): number {
        const categoryProducts = this.products.filter(p => p.category === category)
        const totalProducts = this.products.length
        return categoryProducts.length / totalProducts
    }

    /**
     * Update user behavior
     */
    updateUserBehavior(userId: string, behavior: Partial<UserBehavior>): void {
        const existing = this.userBehaviors.get(userId) || {
            userId,
            viewedProducts: [],
            purchasedProducts: [],
            cartItems: [],
            wishlistItems: [],
            searchHistory: [],
            preferences: {
                categories: [],
                brands: [],
                priceRange: { min: 0, max: 1000 },
                rating: 0,
            },
            lastActivity: new Date().toISOString(),
        }

        const updated = { ...existing, ...behavior, lastActivity: new Date().toISOString() }
        this.userBehaviors.set(userId, updated)
    }

    /**
     * Track product view
     */
    trackProductView(userId: string, productId: string): void {
        const behavior = this.userBehaviors.get(userId)
        if (behavior) {
            const viewedProducts = [...behavior.viewedProducts]
            if (!viewedProducts.includes(productId)) {
                viewedProducts.push(productId)
                this.updateUserBehavior(userId, { viewedProducts })
            }
        }
    }

    /**
     * Track product purchase
     */
    trackProductPurchase(userId: string, productId: string): void {
        const behavior = this.userBehaviors.get(userId)
        if (behavior) {
            const purchasedProducts = [...behavior.purchasedProducts]
            if (!purchasedProducts.includes(productId)) {
                purchasedProducts.push(productId)
                this.updateUserBehavior(userId, { purchasedProducts })
            }
        }
    }

    /**
     * Get recommendation explanation
     */
    getRecommendationExplanation(productId: string, recommendedProductId: string): string {
        const product = this.products.find(p => p.id === productId)
        const recommended = this.products.find(p => p.id === recommendedProductId)

        if (!product || !recommended) return ''

        const reasons: string[] = []

        if (product.category === recommended.category) {
            reasons.push('same category')
        }
        if (product.brand === recommended.brand) {
            reasons.push('same brand')
        }
        if (Math.abs(product.price - recommended.price) / Math.max(product.price, recommended.price) < 0.2) {
            reasons.push('similar price')
        }

        const commonTags = product.tags.filter(tag => recommended.tags.includes(tag))
        if (commonTags.length > 0) {
            reasons.push(`shared tags: ${commonTags.join(', ')}`)
        }

        return reasons.length > 0 ? `Recommended because: ${reasons.join(', ')}` : 'Recommended for you'
    }
}

export default ProductRecommendationEngine
