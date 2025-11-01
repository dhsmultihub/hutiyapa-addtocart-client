'use client'

// import Header from '../components/Header'
import CartPage from '../features/cart/pages/CartPage'
// import CartFeatures from '../features/cart/components/CartFeatures'
import { useCart } from '../features/cart/hooks/useCart'

export function _DemoToolbar() {
  const { add, clear } = useCart()
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap gap-2 items-center justify-center">
        <h2 className="text-sm font-medium text-gray-600 mr-4">Demo Products:</h2>
        <button
          onClick={() =>
            add({
              id: 'sku-101',
              title: '501® Men\'s Fit Jeans - Adv Stretch',
              price: 11990.00, // ₹11,990 (approximately $120 equivalent)
              quantity: 1
            })
          }
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Add Jeans
        </button>
        <button
          onClick={() => add({
            id: 'sku-202',
            title: 'Long Sleeve Graphic Tee',
            price: 2990.00, // ₹2,990 (approximately $30 equivalent)
            quantity: 1
          })}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Add T-Shirt
        </button>
        <button
          onClick={() => add({
            id: 'sku-303',
            title: 'Levi\'s® Wellthread™ Sweatshirt',
            price: 4990.00, // ₹4,990 (approximately $50 equivalent)
            quantity: 1
          })}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Add Sweatshirt
        </button>
        <button
          onClick={clear}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 ml-4"
        >
          Clear Cart
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Demo Toolbar for testing */}
      <_DemoToolbar />
      <CartPage />
    </div>
  )
}