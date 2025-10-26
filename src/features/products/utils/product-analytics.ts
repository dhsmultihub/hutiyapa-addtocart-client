import { Product } from '../redux/products.slice'

export interface ProductAnalyticsEvent {
  event: string
  productId: string
  userId?: string
  sessionId: string
  timestamp: number
  data: any
}

export interface ProductMetrics {
  productId: string
  views: number
  cartAdds: number
  purchases: number
  wishlistAdds: number
  shares: number
  reviews: number
  rating: number
  conversionRate: number
  bounceRate: number
  timeOnPage: number
  lastUpdated: string
}

export interface ProductAnalytics {
  productId: string
  metrics: ProductMetrics
  trends: {
    views: Array<{ date: string; count: number }>
    cartAdds: Array<{ date: string; count: number }>
    purchases: Array<{ date: string; count: number }>
    rating: Array<{ date: string; rating: number }>
  }
  demographics: {
    ageGroups: { [ageGroup: string]: number }
    genders: { [gender: string]: number }
    locations: { [location: string]: number }
    devices: { [device: string]: number }
  }
  behavior: {
    averageTimeOnPage: number
    bounceRate: number
    exitRate: number
    scrollDepth: number
    clickThroughRate: number
  }
  performance: {
    pageLoadTime: number
    imageLoadTime: number
    apiResponseTime: number
    errorRate: number
  }
}

export interface AnalyticsFilter {
  dateRange?: {
    start: string
    end: string
  }
  productIds?: string[]
  userIds?: string[]
  eventTypes?: string[]
}

export interface AnalyticsAggregation {
  totalEvents: number
  uniqueUsers: number
  uniqueProducts: number
  averageRating: number
  topProducts: Array<{ productId: string; metrics: ProductMetrics }>
  topEvents: Array<{ event: string; count: number }>
  conversionFunnel: {
    views: number
    cartAdds: number
    purchases: number
    conversionRate: number
  }
}

export class ProductAnalyticsEngine {
  private events: ProductAnalyticsEvent[] = []
  private productMetrics: Map<string, ProductMetrics> = new Map()
  private sessionId: string
  private startTime: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  /**
   * Track product view
   */
  trackProductView(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_view', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product add to cart
   */
  trackProductAddToCart(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_add_to_cart', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product purchase
   */
  trackProductPurchase(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_purchase', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product wishlist add
   */
  trackProductWishlistAdd(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_wishlist_add', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product share
   */
  trackProductShare(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_share', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product review
   */
  trackProductReview(productId: string, userId?: string, data?: any): void {
    this.addEvent('product_review', productId, userId, {
      ...data,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product search
   */
  trackProductSearch(query: string, results: number, userId?: string): void {
    this.addEvent('product_search', 'search', userId, {
      query,
      results,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product filter
   */
  trackProductFilter(filters: any, results: number, userId?: string): void {
    this.addEvent('product_filter', 'filter', userId, {
      filters,
      results,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product comparison
   */
  trackProductComparison(productIds: string[], userId?: string): void {
    this.addEvent('product_comparison', 'comparison', userId, {
      productIds,
      timestamp: Date.now(),
    })
  }

  /**
   * Track product recommendation click
   */
  trackProductRecommendationClick(productId: string, recommendationType: string, userId?: string): void {
    this.addEvent('product_recommendation_click', productId, userId, {
      recommendationType,
      timestamp: Date.now(),
    })
  }

  /**
   * Get product analytics
   */
  getProductAnalytics(productId: string): ProductAnalytics {
    const metrics = this.productMetrics.get(productId) || this.getDefaultMetrics(productId)
    const trends = this.calculateTrends(productId)
    const demographics = this.calculateDemographics(productId)
    const behavior = this.calculateBehavior(productId)
    const performance = this.calculatePerformance(productId)

    return {
      productId,
      metrics,
      trends,
      demographics,
      behavior,
      performance,
    }
  }

  /**
   * Get analytics aggregation
   */
  getAnalyticsAggregation(filter?: AnalyticsFilter): AnalyticsAggregation {
    let filteredEvents = this.events

    if (filter) {
      filteredEvents = this.applyAnalyticsFilter(filteredEvents, filter)
    }

    const totalEvents = filteredEvents.length
    const uniqueUsers = new Set(filteredEvents.map(e => e.userId).filter(Boolean)).size
    const uniqueProducts = new Set(filteredEvents.map(e => e.productId)).size

    const ratingEvents = filteredEvents.filter(e => e.event === 'product_review')
    const averageRating = ratingEvents.length > 0
      ? ratingEvents.reduce((sum, e) => sum + (e.data.rating || 0), 0) / ratingEvents.length
      : 0

    const topProducts = this.getTopProducts(filteredEvents)
    const topEvents = this.getTopEvents(filteredEvents)
    const conversionFunnel = this.calculateConversionFunnel(filteredEvents)

    return {
      totalEvents,
      uniqueUsers,
      uniqueProducts,
      averageRating,
      topProducts,
      topEvents,
      conversionFunnel,
    }
  }

  /**
   * Get product metrics
   */
  getProductMetrics(productId: string): ProductMetrics {
    return this.productMetrics.get(productId) || this.getDefaultMetrics(productId)
  }

  /**
   * Get trending products
   */
  getTrendingProducts(limit: number = 10): Array<{ productId: string; metrics: ProductMetrics }> {
    const allMetrics = Array.from(this.productMetrics.values())
    
    return allMetrics
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(metrics => ({ productId: metrics.productId, metrics }))
  }

  /**
   * Get top converting products
   */
  getTopConvertingProducts(limit: number = 10): Array<{ productId: string; metrics: ProductMetrics }> {
    const allMetrics = Array.from(this.productMetrics.values())
    
    return allMetrics
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit)
      .map(metrics => ({ productId: metrics.productId, metrics }))
  }

  /**
   * Get product performance insights
   */
  getProductPerformanceInsights(productId: string): {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    score: number
  } {
    const analytics = this.getProductAnalytics(productId)
    const insights = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[],
      score: 0,
    }

    const metrics = analytics.metrics
    const behavior = analytics.behavior
    const performance = analytics.performance

    // Analyze strengths
    if (metrics.conversionRate > 0.1) {
      insights.strengths.push('High conversion rate')
    }
    if (metrics.rating > 4.0) {
      insights.strengths.push('High customer rating')
    }
    if (behavior.averageTimeOnPage > 60) {
      insights.strengths.push('Good user engagement')
    }
    if (performance.pageLoadTime < 2000) {
      insights.strengths.push('Fast page load time')
    }

    // Analyze weaknesses
    if (metrics.bounceRate > 0.7) {
      insights.weaknesses.push('High bounce rate')
    }
    if (metrics.conversionRate < 0.05) {
      insights.weaknesses.push('Low conversion rate')
    }
    if (behavior.averageTimeOnPage < 30) {
      insights.weaknesses.push('Low user engagement')
    }
    if (performance.errorRate > 0.05) {
      insights.weaknesses.push('High error rate')
    }

    // Generate recommendations
    if (metrics.bounceRate > 0.7) {
      insights.recommendations.push('Improve product page content and images')
    }
    if (metrics.conversionRate < 0.05) {
      insights.recommendations.push('Optimize pricing and add social proof')
    }
    if (behavior.averageTimeOnPage < 30) {
      insights.recommendations.push('Add interactive elements and better product descriptions')
    }
    if (performance.pageLoadTime > 3000) {
      insights.recommendations.push('Optimize images and reduce page load time')
    }

    // Calculate overall score
    const scores = [
      metrics.conversionRate * 100,
      metrics.rating * 20,
      (1 - metrics.bounceRate) * 100,
      Math.max(0, 100 - performance.pageLoadTime / 10),
    ]
    insights.score = scores.reduce((sum, score) => sum + score, 0) / scores.length

    return insights
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      metrics: Array.from(this.productMetrics.values()),
      summary: this.getAnalyticsAggregation(),
      exportedAt: new Date().toISOString(),
    }

    if (format === 'csv') {
      return this.convertToCSV(data)
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * Add event to analytics
   */
  private addEvent(event: string, productId: string, userId?: string, data?: any): void {
    const analyticsEvent: ProductAnalyticsEvent = {
      event,
      productId,
      userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data: data || {},
    }

    this.events.push(analyticsEvent)
    this.updateProductMetrics(productId)
    this.sendToAnalyticsService(analyticsEvent)
  }

  /**
   * Update product metrics
   */
  private updateProductMetrics(productId: string): void {
    const productEvents = this.events.filter(e => e.productId === productId)
    
    const views = productEvents.filter(e => e.event === 'product_view').length
    const cartAdds = productEvents.filter(e => e.event === 'product_add_to_cart').length
    const purchases = productEvents.filter(e => e.event === 'product_purchase').length
    const wishlistAdds = productEvents.filter(e => e.event === 'product_wishlist_add').length
    const shares = productEvents.filter(e => e.event === 'product_share').length
    const reviews = productEvents.filter(e => e.event === 'product_review').length

    const ratingEvents = productEvents.filter(e => e.event === 'product_review')
    const rating = ratingEvents.length > 0
      ? ratingEvents.reduce((sum, e) => sum + (e.data.rating || 0), 0) / ratingEvents.length
      : 0

    const conversionRate = views > 0 ? purchases / views : 0
    const bounceRate = views > 0 ? (views - cartAdds) / views : 0

    const metrics: ProductMetrics = {
      productId,
      views,
      cartAdds,
      purchases,
      wishlistAdds,
      shares,
      reviews,
      rating,
      conversionRate,
      bounceRate,
      timeOnPage: 0, // This would be calculated from actual page time
      lastUpdated: new Date().toISOString(),
    }

    this.productMetrics.set(productId, metrics)
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(productId: string): ProductMetrics {
    return {
      productId,
      views: 0,
      cartAdds: 0,
      purchases: 0,
      wishlistAdds: 0,
      shares: 0,
      reviews: 0,
      rating: 0,
      conversionRate: 0,
      bounceRate: 0,
      timeOnPage: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Calculate trends
   */
  private calculateTrends(productId: string): ProductAnalytics['trends'] {
    const productEvents = this.events.filter(e => e.productId === productId)
    
    const viewsTrend = this.calculateEventTrend(productEvents, 'product_view')
    const cartAddsTrend = this.calculateEventTrend(productEvents, 'product_add_to_cart')
    const purchasesTrend = this.calculateEventTrend(productEvents, 'product_purchase')
    const ratingTrend = this.calculateRatingTrend(productEvents)

    return {
      views: viewsTrend,
      cartAdds: cartAddsTrend,
      purchases: purchasesTrend,
      rating: ratingTrend,
    }
  }

  /**
   * Calculate demographics
   */
  private calculateDemographics(productId: string): ProductAnalytics['demographics'] {
    // This would typically come from user profile data
    return {
      ageGroups: {},
      genders: {},
      locations: {},
      devices: {},
    }
  }

  /**
   * Calculate behavior metrics
   */
  private calculateBehavior(productId: string): ProductAnalytics['behavior'] {
    const productEvents = this.events.filter(e => e.productId === productId)
    
    return {
      averageTimeOnPage: 0, // This would be calculated from actual page time
      bounceRate: 0, // This would be calculated from page analytics
      exitRate: 0, // This would be calculated from page analytics
      scrollDepth: 0, // This would be calculated from scroll tracking
      clickThroughRate: 0, // This would be calculated from click tracking
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(productId: string): ProductAnalytics['performance'] {
    return {
      pageLoadTime: 0, // This would be calculated from performance monitoring
      imageLoadTime: 0, // This would be calculated from image loading
      apiResponseTime: 0, // This would be calculated from API calls
      errorRate: 0, // This would be calculated from error tracking
    }
  }

  /**
   * Apply analytics filter
   */
  private applyAnalyticsFilter(events: ProductAnalyticsEvent[], filter: AnalyticsFilter): ProductAnalyticsEvent[] {
    return events.filter(event => {
      if (filter.dateRange) {
        const eventDate = new Date(event.timestamp)
        const startDate = new Date(filter.dateRange.start)
        const endDate = new Date(filter.dateRange.end)
        if (eventDate < startDate || eventDate > endDate) {
          return false
        }
      }

      if (filter.productIds && !filter.productIds.includes(event.productId)) {
        return false
      }

      if (filter.userIds && event.userId && !filter.userIds.includes(event.userId)) {
        return false
      }

      if (filter.eventTypes && !filter.eventTypes.includes(event.event)) {
        return false
      }

      return true
    })
  }

  /**
   * Get top products
   */
  private getTopProducts(events: ProductAnalyticsEvent[]): Array<{ productId: string; metrics: ProductMetrics }> {
    const productCounts = new Map<string, number>()
    
    events.forEach(event => {
      const count = productCounts.get(event.productId) || 0
      productCounts.set(event.productId, count + 1)
    })

    return Array.from(productCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId]) => ({
        productId,
        metrics: this.productMetrics.get(productId) || this.getDefaultMetrics(productId),
      }))
  }

  /**
   * Get top events
   */
  private getTopEvents(events: ProductAnalyticsEvent[]): Array<{ event: string; count: number }> {
    const eventCounts = new Map<string, number>()
    
    events.forEach(event => {
      const count = eventCounts.get(event.event) || 0
      eventCounts.set(event.event, count + 1)
    })

    return Array.from(eventCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }))
  }

  /**
   * Calculate conversion funnel
   */
  private calculateConversionFunnel(events: ProductAnalyticsEvent[]): AnalyticsAggregation['conversionFunnel'] {
    const views = events.filter(e => e.event === 'product_view').length
    const cartAdds = events.filter(e => e.event === 'product_add_to_cart').length
    const purchases = events.filter(e => e.event === 'product_purchase').length
    const conversionRate = views > 0 ? purchases / views : 0

    return {
      views,
      cartAdds,
      purchases,
      conversionRate,
    }
  }

  /**
   * Calculate event trend
   */
  private calculateEventTrend(events: ProductAnalyticsEvent[], eventType: string): Array<{ date: string; count: number }> {
    const trendMap = new Map<string, number>()
    
    events
      .filter(e => e.event === eventType)
      .forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0]
        const count = trendMap.get(date) || 0
        trendMap.set(date, count + 1)
      })

    return Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Calculate rating trend
   */
  private calculateRatingTrend(events: ProductAnalyticsEvent[]): Array<{ date: string; rating: number }> {
    const ratingMap = new Map<string, number[]>()
    
    events
      .filter(e => e.event === 'product_review')
      .forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0]
        const ratings = ratingMap.get(date) || []
        ratings.push(event.data.rating || 0)
        ratingMap.set(date, ratings)
      })

    return Array.from(ratingMap.entries())
      .map(([date, ratings]) => ({
        date,
        rating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Send to analytics service
   */
  private sendToAnalyticsService(event: ProductAnalyticsEvent): void {
    try {
      // Send to Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.event, {
          event_category: 'Product',
          event_label: event.productId,
          value: 1,
          custom_map: {
            product_id: event.productId,
            user_id: event.userId,
            session_id: event.sessionId,
            timestamp: event.timestamp,
          }
        })
      }

      // Send to custom analytics endpoint
      this.sendToCustomAnalytics(event)
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  /**
   * Send to custom analytics
   */
  private async sendToCustomAnalytics(event: ProductAnalyticsEvent): Promise<void> {
    try {
      // This would typically send to your analytics service
      console.log('Analytics event:', event)
    } catch (error) {
      console.error('Failed to send to custom analytics:', error)
    }
  }

  /**
   * Convert to CSV
   */
  private convertToCSV(data: any): string {
    // This would convert the data to CSV format
    return JSON.stringify(data)
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const productAnalytics = new ProductAnalyticsEngine()
export default productAnalytics
