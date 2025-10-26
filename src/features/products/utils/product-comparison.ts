import { Product } from '../redux/products.slice'

export interface ComparisonItem {
    product: Product
    isSelected: boolean
    addedAt: string
}

export interface ComparisonFeature {
    name: string
    key: string
    type: 'text' | 'number' | 'boolean' | 'array' | 'object'
    displayName: string
    category: 'basic' | 'specifications' | 'features' | 'pricing' | 'availability'
    sortOrder: number
}

export interface ComparisonResult {
    products: Product[]
    features: ComparisonFeature[]
    comparison: {
        [productId: string]: {
            [featureKey: string]: any
        }
    }
    differences: {
        [featureKey: string]: {
            values: { [productId: string]: any }
            isDifferent: boolean
            bestValue?: string
            worstValue?: string
        }
    }
    recommendations: {
        bestOverall: string
        bestValue: string
        bestQuality: string
        bestPrice: string
    }
}

export interface ComparisonAnalytics {
    comparisonId: string
    products: string[]
    features: string[]
    duration: number
    outcome: 'purchase' | 'abandon' | 'continue'
    timestamp: string
}

export class ProductComparison {
    private comparisonItems: Map<string, ComparisonItem> = new Map()
    private maxItems: number = 4
    private comparisonHistory: ComparisonAnalytics[] = []

    /**
     * Add product to comparison
     */
    addProduct(product: Product): boolean {
        if (this.comparisonItems.size >= this.maxItems) {
            return false
        }

        if (this.comparisonItems.has(product.id)) {
            return false
        }

        this.comparisonItems.set(product.id, {
            product,
            isSelected: true,
            addedAt: new Date().toISOString(),
        })

        return true
    }

    /**
     * Remove product from comparison
     */
    removeProduct(productId: string): boolean {
        return this.comparisonItems.delete(productId)
    }

    /**
     * Clear all products from comparison
     */
    clearComparison(): void {
        this.comparisonItems.clear()
    }

    /**
     * Get comparison products
     */
    getComparisonProducts(): Product[] {
        return Array.from(this.comparisonItems.values())
            .filter(item => item.isSelected)
            .map(item => item.product)
    }

    /**
     * Get comparison count
     */
    getComparisonCount(): number {
        return this.comparisonItems.size
    }

    /**
     * Check if product is in comparison
     */
    isInComparison(productId: string): boolean {
        return this.comparisonItems.has(productId)
    }

    /**
     * Check if comparison is full
     */
    isComparisonFull(): boolean {
        return this.comparisonItems.size >= this.maxItems
    }

    /**
     * Get comparison features
     */
    getComparisonFeatures(): ComparisonFeature[] {
        return [
            // Basic features
            {
                name: 'title',
                key: 'title',
                type: 'text',
                displayName: 'Product Name',
                category: 'basic',
                sortOrder: 1,
            },
            {
                name: 'brand',
                key: 'brand',
                type: 'text',
                displayName: 'Brand',
                category: 'basic',
                sortOrder: 2,
            },
            {
                name: 'category',
                key: 'category',
                type: 'text',
                displayName: 'Category',
                category: 'basic',
                sortOrder: 3,
            },
            {
                name: 'description',
                key: 'description',
                type: 'text',
                displayName: 'Description',
                category: 'basic',
                sortOrder: 4,
            },

            // Pricing features
            {
                name: 'price',
                key: 'price',
                type: 'number',
                displayName: 'Price',
                category: 'pricing',
                sortOrder: 1,
            },
            {
                name: 'originalPrice',
                key: 'originalPrice',
                type: 'number',
                displayName: 'Original Price',
                category: 'pricing',
                sortOrder: 2,
            },
            {
                name: 'discount',
                key: 'discount',
                type: 'number',
                displayName: 'Discount',
                category: 'pricing',
                sortOrder: 3,
            },

            // Availability features
            {
                name: 'inStock',
                key: 'inStock',
                type: 'boolean',
                displayName: 'In Stock',
                category: 'availability',
                sortOrder: 1,
            },
            {
                name: 'stockQuantity',
                key: 'stockQuantity',
                type: 'number',
                displayName: 'Stock Quantity',
                category: 'availability',
                sortOrder: 2,
            },

            // Quality features
            {
                name: 'rating',
                key: 'rating',
                type: 'number',
                displayName: 'Rating',
                category: 'features',
                sortOrder: 1,
            },
            {
                name: 'reviewCount',
                key: 'reviewCount',
                type: 'number',
                displayName: 'Review Count',
                category: 'features',
                sortOrder: 2,
            },

            // Product features
            {
                name: 'isFeatured',
                key: 'isFeatured',
                type: 'boolean',
                displayName: 'Featured',
                category: 'features',
                sortOrder: 3,
            },
            {
                name: 'isNew',
                key: 'isNew',
                type: 'boolean',
                displayName: 'New Product',
                category: 'features',
                sortOrder: 4,
            },
            {
                name: 'isOnSale',
                key: 'isOnSale',
                type: 'boolean',
                displayName: 'On Sale',
                category: 'features',
                sortOrder: 5,
            },
            {
                name: 'tags',
                key: 'tags',
                type: 'array',
                displayName: 'Tags',
                category: 'features',
                sortOrder: 6,
            },

            // Specifications
            {
                name: 'weight',
                key: 'weight',
                type: 'number',
                displayName: 'Weight (kg)',
                category: 'specifications',
                sortOrder: 1,
            },
            {
                name: 'dimensions',
                key: 'dimensions',
                type: 'object',
                displayName: 'Dimensions',
                category: 'specifications',
                sortOrder: 2,
            },
            {
                name: 'sku',
                key: 'sku',
                type: 'text',
                displayName: 'SKU',
                category: 'specifications',
                sortOrder: 3,
            },
        ]
    }

    /**
     * Compare products
     */
    compareProducts(): ComparisonResult {
        const products = this.getComparisonProducts()
        const features = this.getComparisonFeatures()

        if (products.length < 2) {
            return {
                products,
                features,
                comparison: {},
                differences: {},
                recommendations: {
                    bestOverall: '',
                    bestValue: '',
                    bestQuality: '',
                    bestPrice: '',
                },
            }
        }

        const comparison: { [productId: string]: { [featureKey: string]: any } } = {}
        const differences: { [featureKey: string]: { values: { [productId: string]: any }; isDifferent: boolean; bestValue?: string; worstValue?: string } } = {}

        // Build comparison data
        products.forEach(product => {
            comparison[product.id] = {}
            features.forEach(feature => {
                const value = this.getFeatureValue(product, feature.key)
                comparison[product.id][feature.key] = value
            })
        })

        // Find differences
        features.forEach(feature => {
            const values: { [productId: string]: any } = {}
            products.forEach(product => {
                values[product.id] = comparison[product.id][feature.key]
            })

            const uniqueValues = [...new Set(Object.values(values))]
            const isDifferent = uniqueValues.length > 1

            let bestValue: string | undefined
            let worstValue: string | undefined

            if (isDifferent && feature.type === 'number') {
                const numericValues = Object.entries(values).map(([id, value]) => ({ id, value: Number(value) }))
                const sorted = numericValues.sort((a, b) => b.value - a.value)
                bestValue = sorted[0].id
                worstValue = sorted[sorted.length - 1].id
            }

            differences[feature.key] = {
                values,
                isDifferent,
                bestValue,
                worstValue,
            }
        })

        // Generate recommendations
        const recommendations = this.generateRecommendations(products, differences)

        return {
            products,
            features,
            comparison,
            differences,
            recommendations,
        }
    }

    /**
     * Get feature value from product
     */
    private getFeatureValue(product: Product, featureKey: string): any {
        const keys = featureKey.split('.')
        let value: any = product

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key]
            } else {
                return null
            }
        }

        return value
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(
        products: Product[],
        differences: { [featureKey: string]: { values: { [productId: string]: any }; isDifferent: boolean; bestValue?: string; worstValue?: string } }
    ): { bestOverall: string; bestValue: string; bestQuality: string; bestPrice: string } {
        if (products.length < 2) {
            return {
                bestOverall: products[0]?.id || '',
                bestValue: products[0]?.id || '',
                bestQuality: products[0]?.id || '',
                bestPrice: products[0]?.id || '',
            }
        }

        // Best overall (highest rating with good value)
        const bestOverall = products.reduce((best, current) => {
            const bestScore = best.rating * (best.originalPrice ? best.originalPrice / best.price : 1)
            const currentScore = current.rating * (current.originalPrice ? current.originalPrice / current.price : 1)
            return currentScore > bestScore ? current : best
        })

        // Best value (lowest price per rating point)
        const bestValue = products.reduce((best, current) => {
            const bestValue = best.price / best.rating
            const currentValue = current.price / current.rating
            return currentValue < bestValue ? current : best
        })

        // Best quality (highest rating)
        const bestQuality = products.reduce((best, current) => {
            return current.rating > best.rating ? current : best
        })

        // Best price (lowest price)
        const bestPrice = products.reduce((best, current) => {
            return current.price < best.price ? current : best
        })

        return {
            bestOverall: bestOverall.id,
            bestValue: bestValue.id,
            bestQuality: bestQuality.id,
            bestPrice: bestPrice.id,
        }
    }

    /**
     * Export comparison data
     */
    exportComparison(): string {
        const comparison = this.compareProducts()
        const exportData = {
            timestamp: new Date().toISOString(),
            products: comparison.products.map(p => ({
                id: p.id,
                title: p.title,
                brand: p.brand,
                price: p.price,
                rating: p.rating,
            })),
            features: comparison.features,
            comparison: comparison.comparison,
            recommendations: comparison.recommendations,
        }

        return JSON.stringify(exportData, null, 2)
    }

    /**
     * Share comparison
     */
    shareComparison(): { url: string; text: string } {
        const productIds = this.getComparisonProducts().map(p => p.id).join(',')
        const url = `${window.location.origin}/compare?products=${productIds}`
        const text = `Check out this product comparison: ${this.getComparisonProducts().map(p => p.title).join(' vs ')}`

        return { url, text }
    }

    /**
     * Track comparison analytics
     */
    trackComparisonAnalytics(outcome: 'purchase' | 'abandon' | 'continue'): void {
        const analytics: ComparisonAnalytics = {
            comparisonId: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            products: this.getComparisonProducts().map(p => p.id),
            features: this.getComparisonFeatures().map(f => f.key),
            duration: this.calculateComparisonDuration(),
            outcome,
            timestamp: new Date().toISOString(),
        }

        this.comparisonHistory.push(analytics)
    }

    /**
     * Calculate comparison duration
     */
    private calculateComparisonDuration(): number {
        if (this.comparisonItems.size === 0) return 0

        const firstAdded = Math.min(
            ...Array.from(this.comparisonItems.values()).map(item =>
                new Date(item.addedAt).getTime()
            )
        )

        return Date.now() - firstAdded
    }

    /**
     * Get comparison history
     */
    getComparisonHistory(): ComparisonAnalytics[] {
        return this.comparisonHistory
    }

    /**
     * Get comparison statistics
     */
    getComparisonStats(): {
        totalComparisons: number
        averageDuration: number
        mostComparedProducts: string[]
        mostUsedFeatures: string[]
        conversionRate: number
    } {
        const totalComparisons = this.comparisonHistory.length
        const averageDuration = totalComparisons > 0
            ? this.comparisonHistory.reduce((sum, comp) => sum + comp.duration, 0) / totalComparisons
            : 0

        const productCounts: { [productId: string]: number } = {}
        const featureCounts: { [feature: string]: number } = {}

        this.comparisonHistory.forEach(comp => {
            comp.products.forEach(productId => {
                productCounts[productId] = (productCounts[productId] || 0) + 1
            })
            comp.features.forEach(feature => {
                featureCounts[feature] = (featureCounts[feature] || 0) + 1
            })
        })

        const mostComparedProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId]) => productId)

        const mostUsedFeatures = Object.entries(featureCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([feature]) => feature)

        const purchases = this.comparisonHistory.filter(comp => comp.outcome === 'purchase').length
        const conversionRate = totalComparisons > 0 ? (purchases / totalComparisons) * 100 : 0

        return {
            totalComparisons,
            averageDuration,
            mostComparedProducts,
            mostUsedFeatures,
            conversionRate,
        }
    }

    /**
     * Get comparison suggestions
     */
    getComparisonSuggestions(): string[] {
        const products = this.getComparisonProducts()
        if (products.length === 0) return []

        const suggestions: string[] = []

        // Category suggestions
        const categories = [...new Set(products.map(p => p.category))]
        if (categories.length > 1) {
            suggestions.push('Compare products from the same category for better insights')
        }

        // Price range suggestions
        const prices = products.map(p => p.price)
        const priceRange = Math.max(...prices) - Math.min(...prices)
        if (priceRange > 100) {
            suggestions.push('Consider comparing products in similar price ranges')
        }

        // Brand suggestions
        const brands = [...new Set(products.map(p => p.brand))]
        if (brands.length === 1) {
            suggestions.push('Try comparing products from different brands')
        }

        // Rating suggestions
        const ratings = products.map(p => p.rating)
        const ratingRange = Math.max(...ratings) - Math.min(...ratings)
        if (ratingRange > 2) {
            suggestions.push('Compare products with similar ratings for fair comparison')
        }

        return suggestions
    }
}

export default ProductComparison
