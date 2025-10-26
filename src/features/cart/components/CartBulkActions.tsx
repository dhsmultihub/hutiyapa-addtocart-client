'use client'

import React, { useState } from 'react'
import { useCart } from '../hooks/useCart'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  SelectAll, 
  Trash2, 
  Heart, 
  Download, 
  Share2, 
  Copy, 
  Move, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

interface CartBulkActionsProps {
  className?: string
}

export default function CartBulkActions({ className }: CartBulkActionsProps) {
  const { items, saved, add, remove, save, moveSavedToCart, removeSaved, clear } = useCart()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const allItems = [...items, ...saved]
  const selectedCount = selectedItems.size
  const totalCount = allItems.length

  const handleSelectAll = () => {
    if (selectedItems.size === totalCount) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(allItems.map(item => item.id)))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return

    setActionLoading(action)
    
    try {
      switch (action) {
        case 'remove':
          await handleBulkRemove()
          break
        case 'save':
          await handleBulkSave()
          break
        case 'move':
          await handleBulkMove()
          break
        case 'clear':
          await handleBulkClear()
          break
      }
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
    } finally {
      setActionLoading(null)
      setShowConfirm(null)
    }
  }

  const handleBulkRemove = async () => {
    for (const itemId of selectedItems) {
      const item = items.find(i => i.id === itemId)
      if (item) {
        await remove(itemId)
      }
    }
    setSelectedItems(new Set())
  }

  const handleBulkSave = async () => {
    for (const itemId of selectedItems) {
      const item = items.find(i => i.id === itemId)
      if (item) {
        await save(itemId)
      }
    }
    setSelectedItems(new Set())
  }

  const handleBulkMove = async () => {
    for (const itemId of selectedItems) {
      const item = saved.find(i => i.id === itemId)
      if (item) {
        await moveSavedToCart(itemId)
      }
    }
    setSelectedItems(new Set())
  }

  const handleBulkClear = async () => {
    await clear()
    setSelectedItems(new Set())
  }

  const handleShare = () => {
    const cartData = {
      items: Array.from(selectedItems).map(id => 
        allItems.find(item => item.id === id)
      ).filter(Boolean),
      timestamp: new Date().toISOString(),
    }
    
    const shareData = {
      title: 'My Cart',
      text: `Check out my cart with ${selectedCount} items`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(JSON.stringify(cartData, null, 2))
    }
  }

  const handleExport = () => {
    const cartData = {
      items: Array.from(selectedItems).map(id => 
        allItems.find(item => item.id === id)
      ).filter(Boolean),
      timestamp: new Date().toISOString(),
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    }
    
    const blob = new Blob([JSON.stringify(cartData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cart-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    const cartData = {
      items: Array.from(selectedItems).map(id => 
        allItems.find(item => item.id === id)
      ).filter(Boolean),
      timestamp: new Date().toISOString(),
    }
    
    navigator.clipboard.writeText(JSON.stringify(cartData, null, 2))
  }

  if (allItems.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedItems.size === totalCount}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-blue-600"
          />
          <span className="text-sm font-medium text-gray-900">
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select items'}
          </span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} selected
            </Badge>
          )}
        </div>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm('remove')}
              disabled={actionLoading === 'remove'}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {actionLoading === 'remove' ? 'Removing...' : 'Remove'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('save')}
              disabled={actionLoading === 'save'}
              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            >
              <Heart className="h-4 w-4 mr-1" />
              {actionLoading === 'save' ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('move')}
              disabled={actionLoading === 'move'}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Move className="h-4 w-4 mr-1" />
              {actionLoading === 'move' ? 'Moving...' : 'Move to Cart'}
            </Button>
          </div>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      )}

      {showConfirm && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Are you sure you want to {showConfirm} {selectedCount} item(s)? This action cannot be undone.
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction(showConfirm)}
                disabled={actionLoading === showConfirm}
              >
                {actionLoading === showConfirm ? 'Processing...' : 'Confirm'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-2">
        {allItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              selectedItems.has(item.id)
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Checkbox
              checked={selectedItems.has(item.id)}
              onCheckedChange={() => handleSelectItem(item.id)}
              className="data-[state=checked]:bg-blue-600"
            />
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">
                ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {saved.find(s => s.id === item.id) && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                  Saved
                </Badge>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSelectItem(item.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {selectedItems.has(item.id) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <SelectAll className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedItems(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm('clear')}
                disabled={actionLoading === 'clear'}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
