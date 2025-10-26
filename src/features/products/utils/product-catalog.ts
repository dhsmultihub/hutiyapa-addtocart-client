import { Product, ProductFilter } from '../redux/products.slice'

export interface CatalogCategory {
    id: string
    name: string
    slug: string
    description: string
    image: string
    parentId?: string
    children: CatalogCategory[]
    productCount: number
    isActive: boolean
    sortOrder: number
}

export interface CatalogBrand {
    id: string
    name: string
    slug: string
    description: string
    logo: string
    website: string
    productCount: number
    isActive: boolean
    sortOrder: number
}

export interface CatalogTag {
    id: string
    name: string
    slug: string
    color: string
    productCount: number
    isActive: boolean
}

export interface CatalogStats {
    totalProducts: number
    totalCategories: number
    totalBrands: number
    totalTags: number
    averagePrice: number
    priceRange: {
        min: number
        max: number
    }
    ratingDistribution: {
        [key: number]: number
    }
    categoryDistribution: {
        [category: string]: number
    }
    brandDistribution: {
        [brand: string]: number
    }
}

export interface CatalogFilters {
    categories: string[]
    brands: string[]
    tags: string[]
    priceRange: {
        min: number
        max: number
    }
    rating: number
    availability: 'all' | 'inStock' | 'outOfStock'
    features: string[]
}

export class ProductCatalog {
    private products: Product[]
    private categories: CatalogCategory[]
    private brands: CatalogBrand[]
    private tags: CatalogTag[]

    constructor(products: Product[]) {
        this.products = products
        this.categories = this.buildCategories()
        this.brands = this.buildBrands()
        this.tags = this.buildTags()
    }

    /**
     * Build category hierarchy from products
     */
    private buildCategories(): CatalogCategory[] {
        const categoryMap = new Map<string, CatalogCategory>()
        const categoryCounts = new Map<string, number>()

        // Count products per category
        this.products.forEach(product => {
            const count = categoryCounts.get(product.category) || 0
            categoryCounts.set(product.category, count + 1)
        })

        // Build category objects
        Array.from(categoryCounts.entries()).forEach(([name, count]) => {
            const category: CatalogCategory = {
                id: this.slugify(name),
                name,
                slug: this.slugify(name),
                description: `${name} products`,
                image: `/images/categories/${this.slugify(name)}.jpg`,
                children: [],
                productCount: count,
                isActive: true,
                sortOrder: 0,
            }
            categoryMap.set(name, category)
        })

        return Array.from(categoryMap.values()).sort((a, b) => b.productCount - a.productCount)
    }

    /**
     * Build brand list from products
     */
    private buildBrands(): CatalogBrand[] {
        const brandMap = new Map<string, CatalogBrand>()
        const brandCounts = new Map<string, number>()

        // Count products per brand
        this.products.forEach(product => {
            const count = brandCounts.get(product.brand) || 0
            brandCounts.set(product.brand, count + 1)
        })

        // Build brand objects
        Array.from(brandCounts.entries()).forEach(([name, count]) => {
            const brand: CatalogBrand = {
                id: this.slugify(name),
                name,
                slug: this.slugify(name),
                description: `${name} products`,
                logo: `/images/brands/${this.slugify(name)}.png`,
                website: `https://${this.slugify(name)}.com`,
                productCount: count,
                isActive: true,
                sortOrder: 0,
            }
            brandMap.set(name, brand)
        })

        return Array.from(brandMap.values()).sort((a, b) => b.productCount - a.productCount)
    }

    /**
     * Build tag list from products
     */
    private buildTags(): CatalogTag[] {
        const tagMap = new Map<string, CatalogTag>()
        const tagCounts = new Map<string, number>()

        // Count products per tag
        this.products.forEach(product => {
            product.tags.forEach(tag => {
                const count = tagCounts.get(tag) || 0
                tagCounts.set(tag, count + 1)
            })
        })

        // Build tag objects
        Array.from(tagCounts.entries()).forEach(([name, count]) => {
            const tag: CatalogTag = {
                id: this.slugify(name),
                name,
                slug: this.slugify(name),
                color: this.generateTagColor(name),
                productCount: count,
                isActive: true,
            }
            tagMap.set(name, tag)
        })

        return Array.from(tagMap.values()).sort((a, b) => b.productCount - a.productCount)
    }

    /**
     * Get catalog statistics
     */
    getCatalogStats(): CatalogStats {
        const totalProducts = this.products.length
        const totalCategories = this.categories.length
        const totalBrands = this.brands.length
        const totalTags = this.tags.length

        const prices = this.products.map(p => p.price)
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
        const priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices),
        }

        const ratingDistribution: { [key: number]: number } = {}
        this.products.forEach(product => {
            const rating = Math.floor(product.rating)
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1
        })

        const categoryDistribution: { [category: string]: number } = {}
        this.products.forEach(product => {
            categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1
        })

        const brandDistribution: { [brand: string]: number } = {}
        this.products.forEach(product => {
            brandDistribution[product.brand] = (brandDistribution[product.brand] || 0) + 1
        })

        return {
            totalProducts,
            totalCategories,
            totalBrands,
            totalTags,
            averagePrice,
            priceRange,
            ratingDistribution,
            categoryDistribution,
            brandDistribution,
        }
    }

    /**
     * Get products by category
     */
    getProductsByCategory(categorySlug: string, filters?: ProductFilter): Product[] {
        const category = this.categories.find(c => c.slug === categorySlug)
        if (!category) return []

        let products = this.products.filter(p => p.category === category.name)

        if (filters) {
            products = this.applyFilters(products, filters)
        }

        return products
    }

    /**
     * Get products by brand
     */
    getProductsByBrand(brandSlug: string, filters?: ProductFilter): Product[] {
        const brand = this.brands.find(b => b.slug === brandSlug)
        if (!brand) return []

        let products = this.products.filter(p => p.brand === brand.name)

        if (filters) {
            products = this.applyFilters(products, filters)
        }

        return products
    }

    /**
     * Get products by tag
     */
    getProductsByTag(tagSlug: string, filters?: ProductFilter): Product[] {
        const tag = this.tags.find(t => t.slug === tagSlug)
        if (!tag) return []

        let products = this.products.filter(p => p.tags.includes(tag.name))

        if (filters) {
            products = this.applyFilters(products, filters)
        }

        return products
    }

    /**
     * Get featured products
     */
    getFeaturedProducts(limit?: number): Product[] {
        const featured = this.products.filter(p => p.isFeatured)
        return limit ? featured.slice(0, limit) : featured
    }

    /**
     * Get new products
     */
    getNewProducts(limit?: number): Product[] {
        const newProducts = this.products.filter(p => p.isNew)
        return limit ? newProducts.slice(0, limit) : newProducts
    }

    /**
     * Get sale products
     */
    getSaleProducts(limit?: number): Product[] {
        const saleProducts = this.products.filter(p => p.isOnSale)
        return limit ? saleProducts.slice(0, limit) : saleProducts
    }

    /**
     * Get trending products
     */
    getTrendingProducts(limit?: number): Product[] {
        const trending = this.products
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, limit || 10)
        return trending
    }

    /**
     * Get related products
     */
    getRelatedProducts(productId: string, limit: number = 5): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        const related = this.products
            .filter(p => p.id !== productId)
            .filter(p =>
                p.category === product.category ||
                p.brand === product.brand ||
                p.tags.some(tag => product.tags.includes(tag))
            )
            .sort((a, b) => {
                let scoreA = 0
                let scoreB = 0

                if (a.category === product.category) scoreA += 3
                if (b.category === product.category) scoreB += 3
                if (a.brand === product.brand) scoreA += 2
                if (b.brand === product.brand) scoreB += 2

                const commonTagsA = a.tags.filter(tag => product.tags.includes(tag)).length
                const commonTagsB = b.tags.filter(tag => product.tags.includes(tag)).length
                scoreA += commonTagsA
                scoreB += commonTagsB

                return scoreB - scoreA
            })
            .slice(0, limit)

        return related
    }

    /**
     * Get product recommendations
     */
    getProductRecommendations(productId: string, type: 'similar' | 'related' | 'frequently_bought' = 'similar'): Product[] {
        const product = this.products.find(p => p.id === productId)
        if (!product) return []

        switch (type) {
            case 'similar':
                return this.getRelatedProducts(productId, 5)
            case 'related':
                return this.getRelatedProducts(productId, 8)
            case 'frequently_bought':
                return this.getFrequentlyBoughtTogether(productId, 5)
            default:
                return this.getRelatedProducts(productId, 5)
        }
    }

    /**
     * Get frequently bought together products
     */
    private getFrequentlyBoughtTogether(productId: string, limit: number): Product[] {
        // This would typically use purchase history data
        // For now, return related products
        return this.getRelatedProducts(productId, limit)
    }

    /**
     * Apply filters to products
     */
    private applyFilters(products: Product[], filters: ProductFilter): Product[] {
        return products.filter(product => {
            if (filters.category && product.category !== filters.category) return false
            if (filters.brand && product.brand !== filters.brand) return false
            if (filters.minPrice !== undefined && product.price < filters.minPrice) return false
            if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false
            if (filters.minRating !== undefined && product.rating < filters.minRating) return false
            if (filters.inStock !== undefined && product.inStock !== filters.inStock) return false
            if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag => product.tags.includes(tag))
                if (!hasMatchingTag) return false
            }
            if (filters.isFeatured !== undefined && product.isFeatured !== filters.isFeatured) return false
            if (filters.isNew !== undefined && product.isNew !== filters.isNew) return false
            if (filters.isOnSale !== undefined && product.isOnSale !== filters.isOnSale) return false
            return true
        })
    }

    /**
     * Get all categories
     */
    getCategories(): CatalogCategory[] {
        return this.categories
    }

    /**
     * Get all brands
     */
    getBrands(): CatalogBrand[] {
        return this.brands
    }

    /**
     * Get all tags
     */
    getTags(): CatalogTag[] {
        return this.tags
    }

    /**
     * Get category by slug
     */
    getCategoryBySlug(slug: string): CatalogCategory | undefined {
        return this.categories.find(c => c.slug === slug)
    }

    /**
     * Get brand by slug
     */
    getBrandBySlug(slug: string): CatalogBrand | undefined {
        return this.brands.find(b => b.slug === slug)
    }

    /**
     * Get tag by slug
     */
    getTagBySlug(slug: string): CatalogTag | undefined {
        return this.tags.find(t => t.slug === slug)
    }

    /**
     * Search products in catalog
     */
    searchProducts(query: string, filters?: ProductFilter): Product[] {
        let products = this.products

        if (query.trim()) {
            const searchTerms = query.toLowerCase().split(/\s+/)
            products = products.filter(product => {
                const searchableText = [
                    product.title,
                    product.description,
                    product.category,
                    product.brand,
                    ...product.tags,
                ].join(' ').toLowerCase()

                return searchTerms.some(term => searchableText.includes(term))
            })
        }

        if (filters) {
            products = this.applyFilters(products, filters)
        }

        return products
    }

    /**
     * Generate slug from text
     */
    private slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    /**
     * Generate tag color
     */
    private generateTagColor(tag: string): string {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ]

        let hash = 0
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash)
        }

        return colors[Math.abs(hash) % colors.length]
    }
}

export default ProductCatalog
