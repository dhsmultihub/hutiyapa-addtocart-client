export interface BundleChunk {
    name: string
    size: number
    gzippedSize: number
    modules: BundleModule[]
    assets: string[]
    entry: boolean
    initial: boolean
    dynamic: boolean
}

export interface BundleModule {
    name: string
    size: number
    gzippedSize: number
    chunks: string[]
    reasons: string[]
    issuer: string | null
    issuerName: string | null
    issuerId: string | null
    issuerPath: string[]
    providedExports: string[]
    usedExports: string[]
    optimizationBailout: string[]
    depth: number
    source: string
}

export interface BundleAnalysis {
    totalSize: number
    gzippedSize: number
    chunks: BundleChunk[]
    modules: BundleModule[]
    duplicates: DuplicateModule[]
    recommendations: BundleRecommendation[]
    performance: BundlePerformance
}

export interface DuplicateModule {
    name: string
    size: number
    chunks: string[]
    modules: string[]
}

export interface BundleRecommendation {
    type: 'warning' | 'suggestion' | 'error'
    message: string
    impact: 'high' | 'medium' | 'low'
    actionable: boolean
    modules?: string[]
    chunks?: string[]
}

export interface BundlePerformance {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    metrics: {
        totalSize: number
        gzippedSize: number
        chunkCount: number
        moduleCount: number
        duplicateCount: number
        duplicateSize: number
    }
    bottlenecks: string[]
    opportunities: string[]
}

export class BundleAnalyzer {
    private static readonly SIZE_THRESHOLDS = {
        total: 1000 * 1024, // 1MB
        chunk: 500 * 1024, // 500KB
        module: 100 * 1024, // 100KB
    }

    private static readonly PERFORMANCE_THRESHOLDS = {
        excellent: 90,
        good: 80,
        fair: 70,
        poor: 60,
    }

    /**
     * Analyze bundle from webpack stats
     */
    static analyzeBundle(stats: any): BundleAnalysis {
        const chunks = this.extractChunks(stats)
        const modules = this.extractModules(stats)
        const duplicates = this.findDuplicates(modules)
        const recommendations = this.generateRecommendations(chunks, modules, duplicates)
        const performance = this.calculatePerformance(chunks, modules, duplicates)

        return {
            totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
            gzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
            chunks,
            modules,
            duplicates,
            recommendations,
            performance,
        }
    }

    /**
     * Extract chunks from webpack stats
     */
    private static extractChunks(stats: any): BundleChunk[] {
        const chunks: BundleChunk[] = []

        if (stats.chunks) {
            stats.chunks.forEach((chunk: any) => {
                chunks.push({
                    name: chunk.names?.[0] || `chunk-${chunk.id}`,
                    size: chunk.size,
                    gzippedSize: chunk.gzippedSize || 0,
                    modules: chunk.modules || [],
                    assets: chunk.files || [],
                    entry: chunk.entry,
                    initial: chunk.initial,
                    dynamic: chunk.dynamic,
                })
            })
        }

        return chunks
    }

    /**
     * Extract modules from webpack stats
     */
    private static extractModules(stats: any): BundleModule[] {
        const modules: BundleModule[] = []

        if (stats.modules) {
            stats.modules.forEach((module: any) => {
                modules.push({
                    name: module.name || module.identifier,
                    size: module.size,
                    gzippedSize: module.gzippedSize || 0,
                    chunks: module.chunks || [],
                    reasons: module.reasons || [],
                    issuer: module.issuer,
                    issuerName: module.issuerName,
                    issuerId: module.issuerId,
                    issuerPath: module.issuerPath || [],
                    providedExports: module.providedExports || [],
                    usedExports: module.usedExports || [],
                    optimizationBailout: module.optimizationBailout || [],
                    depth: module.depth || 0,
                    source: module.source || '',
                })
            })
        }

        return modules
    }

    /**
     * Find duplicate modules
     */
    private static findDuplicates(modules: BundleModule[]): DuplicateModule[] {
        const moduleMap = new Map<string, BundleModule[]>()
        const duplicates: DuplicateModule[] = []

        // Group modules by name
        modules.forEach(module => {
            if (!moduleMap.has(module.name)) {
                moduleMap.set(module.name, [])
            }
            moduleMap.get(module.name)!.push(module)
        })

        // Find duplicates
        moduleMap.forEach((moduleList, name) => {
            if (moduleList.length > 1) {
                const totalSize = moduleList.reduce((sum, module) => sum + module.size, 0)
                const chunks = [...new Set(moduleList.flatMap(module => module.chunks))]

                duplicates.push({
                    name,
                    size: totalSize,
                    chunks,
                    modules: moduleList.map(module => module.name),
                })
            }
        })

        return duplicates
    }

    /**
     * Generate recommendations
     */
    private static generateRecommendations(
        chunks: BundleChunk[],
        modules: BundleModule[],
        duplicates: DuplicateModule[]
    ): BundleRecommendation[] {
        const recommendations: BundleRecommendation[] = []

        // Check total bundle size
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
        if (totalSize > this.SIZE_THRESHOLDS.total) {
            recommendations.push({
                type: 'warning',
                message: `Total bundle size (${this.formatSize(totalSize)}) exceeds recommended threshold (${this.formatSize(this.SIZE_THRESHOLDS.total)})`,
                impact: 'high',
                actionable: true,
            })
        }

        // Check individual chunk sizes
        chunks.forEach(chunk => {
            if (chunk.size > this.SIZE_THRESHOLDS.chunk) {
                recommendations.push({
                    type: 'warning',
                    message: `Chunk "${chunk.name}" (${this.formatSize(chunk.size)}) is too large`,
                    impact: 'medium',
                    actionable: true,
                    chunks: [chunk.name],
                })
            }
        })

        // Check for large modules
        modules.forEach(module => {
            if (module.size > this.SIZE_THRESHOLDS.module) {
                recommendations.push({
                    type: 'suggestion',
                    message: `Module "${module.name}" (${this.formatSize(module.size)}) is large and could be split`,
                    impact: 'medium',
                    actionable: true,
                    modules: [module.name],
                })
            }
        })

        // Check for duplicates
        if (duplicates.length > 0) {
            const duplicateSize = duplicates.reduce((sum, dup) => sum + dup.size, 0)
            recommendations.push({
                type: 'warning',
                message: `Found ${duplicates.length} duplicate modules consuming ${this.formatSize(duplicateSize)}`,
                impact: 'high',
                actionable: true,
            })
        }

        // Check for unused exports
        modules.forEach(module => {
            if (module.providedExports.length > 0 && module.usedExports.length === 0) {
                recommendations.push({
                    type: 'suggestion',
                    message: `Module "${module.name}" has unused exports that could be tree-shaken`,
                    impact: 'low',
                    actionable: true,
                    modules: [module.name],
                })
            }
        })

        // Check for optimization bailouts
        modules.forEach(module => {
            if (module.optimizationBailout.length > 0) {
                recommendations.push({
                    type: 'suggestion',
                    message: `Module "${module.name}" has optimization bailouts: ${module.optimizationBailout.join(', ')}`,
                    impact: 'medium',
                    actionable: true,
                    modules: [module.name],
                })
            }
        })

        return recommendations
    }

    /**
     * Calculate performance score
     */
    private static calculatePerformance(
        chunks: BundleChunk[],
        modules: BundleModule[],
        duplicates: DuplicateModule[]
    ): BundlePerformance {
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
        const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0)
        const duplicateSize = duplicates.reduce((sum, dup) => sum + dup.size, 0)

        // Calculate score based on various factors
        let score = 100

        // Size penalty
        if (totalSize > this.SIZE_THRESHOLDS.total) {
            score -= Math.min(30, (totalSize - this.SIZE_THRESHOLDS.total) / this.SIZE_THRESHOLDS.total * 30)
        }

        // Duplicate penalty
        if (duplicates.length > 0) {
            score -= Math.min(20, duplicates.length * 2)
        }

        // Chunk count penalty
        if (chunks.length > 10) {
            score -= Math.min(15, (chunks.length - 10) * 1.5)
        }

        // Module count penalty
        if (modules.length > 100) {
            score -= Math.min(10, (modules.length - 100) * 0.1)
        }

        score = Math.max(0, Math.min(100, score))

        const grade = this.getGrade(score)
        const bottlenecks = this.identifyBottlenecks(chunks, modules, duplicates)
        const opportunities = this.identifyOpportunities(chunks, modules, duplicates)

        return {
            score: Math.round(score),
            grade,
            metrics: {
                totalSize,
                gzippedSize,
                chunkCount: chunks.length,
                moduleCount: modules.length,
                duplicateCount: duplicates.length,
                duplicateSize,
            },
            bottlenecks,
            opportunities,
        }
    }

    /**
     * Get grade from score
     */
    private static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score >= this.PERFORMANCE_THRESHOLDS.excellent) return 'A'
        if (score >= this.PERFORMANCE_THRESHOLDS.good) return 'B'
        if (score >= this.PERFORMANCE_THRESHOLDS.fair) return 'C'
        if (score >= this.PERFORMANCE_THRESHOLDS.poor) return 'D'
        return 'F'
    }

    /**
     * Identify bottlenecks
     */
    private static identifyBottlenecks(
        chunks: BundleChunk[],
        modules: BundleModule[],
        duplicates: DuplicateModule[]
    ): string[] {
        const bottlenecks: string[] = []

        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
        if (totalSize > this.SIZE_THRESHOLDS.total) {
            bottlenecks.push('Large total bundle size')
        }

        const largeChunks = chunks.filter(chunk => chunk.size > this.SIZE_THRESHOLDS.chunk)
        if (largeChunks.length > 0) {
            bottlenecks.push(`${largeChunks.length} large chunks`)
        }

        if (duplicates.length > 0) {
            bottlenecks.push(`${duplicates.length} duplicate modules`)
        }

        const largeModules = modules.filter(module => module.size > this.SIZE_THRESHOLDS.module)
        if (largeModules.length > 0) {
            bottlenecks.push(`${largeModules.length} large modules`)
        }

        return bottlenecks
    }

    /**
     * Identify opportunities
     */
    private static identifyOpportunities(
        chunks: BundleChunk[],
        modules: BundleModule[],
        duplicates: DuplicateModule[]
    ): string[] {
        const opportunities: string[] = []

        if (chunks.length < 5) {
            opportunities.push('Consider code splitting for better caching')
        }

        if (duplicates.length > 0) {
            opportunities.push('Remove duplicate modules to reduce bundle size')
        }

        const unusedExports = modules.filter(module =>
            module.providedExports.length > 0 && module.usedExports.length === 0
        )
        if (unusedExports.length > 0) {
            opportunities.push(`Remove ${unusedExports.length} unused exports`)
        }

        const optimizationBailouts = modules.filter(module => module.optimizationBailout.length > 0)
        if (optimizationBailouts.length > 0) {
            opportunities.push(`Fix ${optimizationBailouts.length} optimization bailouts`)
        }

        return opportunities
    }

    /**
     * Format size in human-readable format
     */
    private static formatSize(bytes: number): string {
        if (bytes === 0) return '0 B'

        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    /**
     * Generate bundle report
     */
    static generateReport(analysis: BundleAnalysis): string {
        const { performance, recommendations, duplicates } = analysis

        let report = `# Bundle Analysis Report\n\n`
        report += `## Performance Score: ${performance.score}/100 (Grade: ${performance.grade})\n\n`

        report += `## Metrics\n`
        report += `- Total Size: ${this.formatSize(performance.metrics.totalSize)}\n`
        report += `- Gzipped Size: ${this.formatSize(performance.metrics.gzippedSize)}\n`
        report += `- Chunks: ${performance.metrics.chunkCount}\n`
        report += `- Modules: ${performance.metrics.moduleCount}\n`
        report += `- Duplicates: ${performance.metrics.duplicateCount}\n\n`

        if (performance.bottlenecks.length > 0) {
            report += `## Bottlenecks\n`
            performance.bottlenecks.forEach(bottleneck => {
                report += `- ${bottleneck}\n`
            })
            report += `\n`
        }

        if (performance.opportunities.length > 0) {
            report += `## Opportunities\n`
            performance.opportunities.forEach(opportunity => {
                report += `- ${opportunity}\n`
            })
            report += `\n`
        }

        if (recommendations.length > 0) {
            report += `## Recommendations\n`
            recommendations.forEach((rec, index) => {
                report += `${index + 1}. **${rec.type.toUpperCase()}**: ${rec.message}\n`
                report += `   Impact: ${rec.impact}\n`
                if (rec.actionable) {
                    report += `   Actionable: Yes\n`
                }
                report += `\n`
            })
        }

        if (duplicates.length > 0) {
            report += `## Duplicate Modules\n`
            duplicates.forEach(dup => {
                report += `- ${dup.name}: ${this.formatSize(dup.size)} in ${dup.chunks.length} chunks\n`
            })
        }

        return report
    }

    /**
     * Export analysis data
     */
    static exportAnalysis(analysis: BundleAnalysis): string {
        return JSON.stringify({
            ...analysis,
            exportedAt: new Date().toISOString(),
        }, null, 2)
    }

    /**
     * Import analysis data
     */
    static importAnalysis(data: string): BundleAnalysis {
        try {
            return JSON.parse(data)
        } catch (error) {
            throw new Error('Invalid bundle analysis data format')
        }
    }
}

export default BundleAnalyzer
