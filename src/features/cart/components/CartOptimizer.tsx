'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '../hooks/useCart'
import { CartValidator } from '../utils/cart-validation'
import { cartAnalytics } from '../utils/cart-analytics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Info, ShoppingBag, Truck, Shield, Zap } from 'lucide-react'

interface CartOptimizerProps {
  className?: string
}

export default function CartOptimizer({ className }: CartOptimizerProps) {
  const { items, subtotal, totalQuantity } = useCart()
  const [optimizations, setOptimizations] = useState<Array<{
    type: 'shipping' | 'discount' | 'bundle' | 'recommendation'
    title: string
    description: string
    savings: number
    action: string
    icon: React.ReactNode
  }>>([])
  const [loading, setLoading] = useState(false)
  const [appliedOptimizations, setAppliedOptimizations] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (items.length > 0) {
      generateOptimizations()
    }
  }, [items, subtotal])

  const generateOptimizations = async () => {
    setLoading(true)
    
    try {
      const newOptimizations = await calculateOptimizations()
      setOptimizations(newOptimizations)
    } catch (error) {
      console.error('Failed to generate optimizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOptimizations = async (): Promise<Array<{
    type: 'shipping' | 'discount' | 'bundle' | 'recommendation'
    title: string
    description: string
    savings: number
    action: string
    icon: React.ReactNode
  }>> => {
    const optimizations = []

    // Free shipping optimization
    if (subtotal < 100) {
      const needed = 100 - subtotal
      optimizations.push({
        type: 'shipping',
        title: 'Free Shipping Available',
        description: `Add $${needed.toFixed(2)} more to get free shipping`,
        savings: 9.99,
        action: 'Add Items',
        icon: <Truck className="h-5 w-5" />,
      })
    }

    // Bundle discount optimization
    if (totalQuantity >= 3) {
      optimizations.push({
        type: 'bundle',
        title: 'Bundle Discount',
        description: 'Save 10% on your bundle of 3+ items',
        savings: subtotal * 0.1,
        action: 'Apply Bundle',
        icon: <ShoppingBag className="h-5 w-5" />,
      })
    }

    // Loyalty discount optimization
    if (subtotal >= 200) {
      optimizations.push({
        type: 'discount',
        title: 'Loyalty Discount',
        description: 'You qualify for 15% off your order',
        savings: subtotal * 0.15,
        action: 'Apply Discount',
        icon: <Shield className="h-5 w-5" />,
      })
    }

    // Product recommendations
    if (items.length < 5) {
      optimizations.push({
        type: 'recommendation',
        title: 'Complete Your Look',
        description: 'Add matching accessories to complete your style',
        savings: 0,
        action: 'View Recommendations',
        icon: <Zap className="h-5 w-5" />,
      })
    }

    return optimizations
  }

  const applyOptimization = (optimization: any) => {
    setAppliedOptimizations(prev => new Set([...prev, optimization.title]))
    
    // Track optimization applied
    cartAnalytics.trackOptimizationApplied(optimization.type, optimization.savings)
    
    // Apply the optimization based on type
    switch (optimization.type) {
      case 'shipping':
        // Navigate to products page
        window.location.href = '/products'
        break
      case 'bundle':
        // Apply bundle discount
        // This would typically call an API to apply the discount
        console.log('Applying bundle discount')
        break
      case 'discount':
        // Apply loyalty discount
        console.log('Applying loyalty discount')
        break
      case 'recommendation':
        // Show product recommendations
        console.log('Showing recommendations')
        break
    }
  }

  const totalSavings = optimizations.reduce((sum, opt) => sum + opt.savings, 0)

  if (items.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Cart Optimizer
        </h3>
        {totalSavings > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Save ${totalSavings.toFixed(2)}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Finding optimizations...</span>
        </div>
      ) : optimizations.length > 0 ? (
        <div className="space-y-3">
          {optimizations.map((optimization, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                appliedOptimizations.has(optimization.title)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    optimization.type === 'shipping' ? 'bg-blue-100 text-blue-600' :
                    optimization.type === 'discount' ? 'bg-green-100 text-green-600' :
                    optimization.type === 'bundle' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {optimization.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{optimization.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{optimization.description}</p>
                    {optimization.savings > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Save ${optimization.savings.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={appliedOptimizations.has(optimization.title) ? "outline" : "default"}
                  onClick={() => applyOptimization(optimization)}
                  disabled={appliedOptimizations.has(optimization.title)}
                  className="ml-4"
                >
                  {appliedOptimizations.has(optimization.title) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Applied
                    </>
                  ) : (
                    optimization.action
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your cart is already optimized! No additional savings available.
          </AlertDescription>
        </Alert>
      )}

      {totalSavings > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Total Potential Savings:</span>
            <span className="text-lg font-bold text-green-600">${totalSavings.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
