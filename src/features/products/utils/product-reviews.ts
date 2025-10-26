import { Product } from '../redux/products.slice'

export interface ProductReview {
    id: string
    productId: string
    userId: string
    userName: string
    userAvatar?: string
    rating: number
    title: string
    comment: string
    pros: string[]
    cons: string[]
    verified: boolean
    helpful: number
    notHelpful: number
    images: string[]
    videos: string[]
    tags: string[]
    createdAt: string
    updatedAt: string
    isVerified: boolean
    purchaseDate?: string
    productVariant?: string
}

export interface ReviewSummary {
    totalReviews: number
    averageRating: number
    ratingDistribution: {
        5: number
        4: number
        3: number
        2: number
        1: number
    }
    helpfulReviews: number
    verifiedReviews: number
    recentReviews: number
}

export interface ReviewFilter {
    rating?: number
    verified?: boolean
    helpful?: boolean
    recent?: boolean
    withImages?: boolean
    withVideos?: boolean
    dateRange?: {
        start: string
        end: string
    }
}

export interface ReviewSort {
    field: 'rating' | 'helpful' | 'date' | 'relevance'
    order: 'asc' | 'desc'
}

export interface ReviewAnalytics {
    totalReviews: number
    averageRating: number
    ratingTrend: Array<{ date: string; rating: number }>
    reviewVolume: Array<{ date: string; count: number }>
    helpfulRate: number
    verifiedRate: number
    responseRate: number
    sentimentScore: number
}

export class ProductReviewSystem {
    private reviews: Map<string, ProductReview[]> = new Map()
    private reviewAnalytics: Map<string, ReviewAnalytics> = new Map()

    /**
     * Add a new review
     */
    addReview(productId: string, review: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt'>): ProductReview {
        const newReview: ProductReview = {
            ...review,
            id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const productReviews = this.reviews.get(productId) || []
        productReviews.push(newReview)
        this.reviews.set(productId, productReviews)

        this.updateReviewAnalytics(productId)
        return newReview
    }

    /**
     * Update an existing review
     */
    updateReview(productId: string, reviewId: string, updates: Partial<ProductReview>): ProductReview | null {
        const productReviews = this.reviews.get(productId)
        if (!productReviews) return null

        const reviewIndex = productReviews.findIndex(r => r.id === reviewId)
        if (reviewIndex === -1) return null

        const updatedReview = {
            ...productReviews[reviewIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        productReviews[reviewIndex] = updatedReview
        this.reviews.set(productId, productReviews)

        this.updateReviewAnalytics(productId)
        return updatedReview
    }

    /**
     * Delete a review
     */
    deleteReview(productId: string, reviewId: string): boolean {
        const productReviews = this.reviews.get(productId)
        if (!productReviews) return false

        const filteredReviews = productReviews.filter(r => r.id !== reviewId)
        this.reviews.set(productId, filteredReviews)

        this.updateReviewAnalytics(productId)
        return true
    }

    /**
     * Get reviews for a product
     */
    getReviews(
        productId: string,
        filter?: ReviewFilter,
        sort?: ReviewSort,
        pagination?: { page: number; limit: number }
    ): { reviews: ProductReview[]; total: number; pagination: { page: number; limit: number; totalPages: number } } {
        let reviews = this.reviews.get(productId) || []

        // Apply filters
        if (filter) {
            reviews = this.applyReviewFilters(reviews, filter)
        }

        // Apply sorting
        if (sort) {
            reviews = this.applyReviewSorting(reviews, sort)
        }

        const total = reviews.length
        const totalPages = pagination ? Math.ceil(total / pagination.limit) : 1
        const page = pagination?.page || 1
        const limit = pagination?.limit || 10
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit

        const paginatedReviews = reviews.slice(startIndex, endIndex)

        return {
            reviews: paginatedReviews,
            total,
            pagination: { page, limit, totalPages },
        }
    }

    /**
     * Get review summary for a product
     */
    getReviewSummary(productId: string): ReviewSummary {
        const reviews = this.reviews.get(productId) || []

        const totalReviews = reviews.length
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0

        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        reviews.forEach(review => {
            ratingDistribution[review.rating as keyof typeof ratingDistribution]++
        })

        const helpfulReviews = reviews.filter(r => r.helpful > 0).length
        const verifiedReviews = reviews.filter(r => r.verified).length
        const recentReviews = reviews.filter(r => {
            const reviewDate = new Date(r.createdAt)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return reviewDate > thirtyDaysAgo
        }).length

        return {
            totalReviews,
            averageRating,
            ratingDistribution,
            helpfulReviews,
            verifiedReviews,
            recentReviews,
        }
    }

    /**
     * Mark review as helpful
     */
    markReviewHelpful(productId: string, reviewId: string, userId: string): boolean {
        const productReviews = this.reviews.get(productId)
        if (!productReviews) return false

        const review = productReviews.find(r => r.id === reviewId)
        if (!review) return false

        review.helpful++
        this.updateReviewAnalytics(productId)
        return true
    }

    /**
     * Mark review as not helpful
     */
    markReviewNotHelpful(productId: string, reviewId: string, userId: string): boolean {
        const productReviews = this.reviews.get(productId)
        if (!productReviews) return false

        const review = productReviews.find(r => r.id === reviewId)
        if (!review) return false

        review.notHelpful++
        this.updateReviewAnalytics(productId)
        return true
    }

    /**
     * Get review analytics
     */
    getReviewAnalytics(productId: string): ReviewAnalytics {
        return this.reviewAnalytics.get(productId) || {
            totalReviews: 0,
            averageRating: 0,
            ratingTrend: [],
            reviewVolume: [],
            helpfulRate: 0,
            verifiedRate: 0,
            responseRate: 0,
            sentimentScore: 0,
        }
    }

    /**
     * Get trending reviews
     */
    getTrendingReviews(limit: number = 10): ProductReview[] {
        const allReviews = Array.from(this.reviews.values()).flat()

        return allReviews
            .sort((a, b) => b.helpful - a.helpful)
            .slice(0, limit)
    }

    /**
     * Get recent reviews
     */
    getRecentReviews(limit: number = 10): ProductReview[] {
        const allReviews = Array.from(this.reviews.values()).flat()

        return allReviews
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
    }

    /**
     * Get reviews by user
     */
    getReviewsByUser(userId: string, limit: number = 10): ProductReview[] {
        const allReviews = Array.from(this.reviews.values()).flat()

        return allReviews
            .filter(review => review.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
    }

    /**
     * Search reviews
     */
    searchReviews(query: string, limit: number = 10): ProductReview[] {
        const allReviews = Array.from(this.reviews.values()).flat()
        const searchTerms = query.toLowerCase().split(/\s+/)

        return allReviews
            .filter(review => {
                const searchableText = [
                    review.title,
                    review.comment,
                    review.pros.join(' '),
                    review.cons.join(' '),
                    review.tags.join(' '),
                ].join(' ').toLowerCase()

                return searchTerms.some(term => searchableText.includes(term))
            })
            .sort((a, b) => b.helpful - a.helpful)
            .slice(0, limit)
    }

    /**
     * Get review sentiment
     */
    getReviewSentiment(review: ProductReview): {
        score: number
        label: 'positive' | 'negative' | 'neutral'
        confidence: number
    } {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'best', 'awesome', 'fantastic', 'wonderful']
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed', 'poor', 'useless', 'broken']

        const text = `${review.title} ${review.comment}`.toLowerCase()
        const words = text.split(/\s+/)

        let positiveCount = 0
        let negativeCount = 0

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++
            if (negativeWords.includes(word)) negativeCount++
        })

        const totalWords = words.length
        const positiveScore = positiveCount / totalWords
        const negativeScore = negativeCount / totalWords

        const score = positiveScore - negativeScore
        const confidence = Math.abs(score)

        let label: 'positive' | 'negative' | 'neutral'
        if (score > 0.1) label = 'positive'
        else if (score < -0.1) label = 'negative'
        else label = 'neutral'

        return { score, label, confidence }
    }

    /**
     * Apply review filters
     */
    private applyReviewFilters(reviews: ProductReview[], filter: ReviewFilter): ProductReview[] {
        return reviews.filter(review => {
            if (filter.rating !== undefined && review.rating !== filter.rating) {
                return false
            }

            if (filter.verified !== undefined && review.verified !== filter.verified) {
                return false
            }

            if (filter.helpful !== undefined) {
                const isHelpful = review.helpful > 0
                if (filter.helpful !== isHelpful) {
                    return false
                }
            }

            if (filter.recent !== undefined) {
                const reviewDate = new Date(review.createdAt)
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                const isRecent = reviewDate > thirtyDaysAgo
                if (filter.recent !== isRecent) {
                    return false
                }
            }

            if (filter.withImages !== undefined) {
                const hasImages = review.images.length > 0
                if (filter.withImages !== hasImages) {
                    return false
                }
            }

            if (filter.withVideos !== undefined) {
                const hasVideos = review.videos.length > 0
                if (filter.withVideos !== hasVideos) {
                    return false
                }
            }

            if (filter.dateRange) {
                const reviewDate = new Date(review.createdAt)
                const startDate = new Date(filter.dateRange.start)
                const endDate = new Date(filter.dateRange.end)
                if (reviewDate < startDate || reviewDate > endDate) {
                    return false
                }
            }

            return true
        })
    }

    /**
     * Apply review sorting
     */
    private applyReviewSorting(reviews: ProductReview[], sort: ReviewSort): ProductReview[] {
        return [...reviews].sort((a, b) => {
            let aValue: any
            let bValue: any

            switch (sort.field) {
                case 'rating':
                    aValue = a.rating
                    bValue = b.rating
                    break
                case 'helpful':
                    aValue = a.helpful
                    bValue = b.helpful
                    break
                case 'date':
                    aValue = new Date(a.createdAt).getTime()
                    bValue = new Date(b.createdAt).getTime()
                    break
                case 'relevance':
                    aValue = a.helpful + a.rating
                    bValue = b.helpful + b.rating
                    break
                default:
                    aValue = a.rating
                    bValue = b.rating
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
     * Update review analytics
     */
    private updateReviewAnalytics(productId: string): void {
        const reviews = this.reviews.get(productId) || []

        const totalReviews = reviews.length
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0

        const ratingTrend = this.calculateRatingTrend(reviews)
        const reviewVolume = this.calculateReviewVolume(reviews)

        const helpfulReviews = reviews.filter(r => r.helpful > 0).length
        const helpfulRate = totalReviews > 0 ? (helpfulReviews / totalReviews) * 100 : 0

        const verifiedReviews = reviews.filter(r => r.verified).length
        const verifiedRate = totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0

        const responseRate = 0 // This would be calculated based on merchant responses

        const sentimentScores = reviews.map(r => this.getReviewSentiment(r).score)
        const sentimentScore = sentimentScores.length > 0
            ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
            : 0

        this.reviewAnalytics.set(productId, {
            totalReviews,
            averageRating,
            ratingTrend,
            reviewVolume,
            helpfulRate,
            verifiedRate,
            responseRate,
            sentimentScore,
        })
    }

    /**
     * Calculate rating trend
     */
    private calculateRatingTrend(reviews: ProductReview[]): Array<{ date: string; rating: number }> {
        const trendMap = new Map<string, number[]>()

        reviews.forEach(review => {
            const date = review.createdAt.split('T')[0]
            const ratings = trendMap.get(date) || []
            ratings.push(review.rating)
            trendMap.set(date, ratings)
        })

        return Array.from(trendMap.entries())
            .map(([date, ratings]) => ({
                date,
                rating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    /**
     * Calculate review volume
     */
    private calculateReviewVolume(reviews: ProductReview[]): Array<{ date: string; count: number }> {
        const volumeMap = new Map<string, number>()

        reviews.forEach(review => {
            const date = review.createdAt.split('T')[0]
            volumeMap.set(date, (volumeMap.get(date) || 0) + 1)
        })

        return Array.from(volumeMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }
}

export default ProductReviewSystem
