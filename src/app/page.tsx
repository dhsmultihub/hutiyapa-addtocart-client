'use client'

// import Header from '../components/Header'
import CartPage from '../features/cart/pages/CartPage'
// import CartFeatures from '../features/cart/components/CartFeatures'
import DevUserSelector from '../features/cart/components/DevUserSelector'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Dev User Selector - for testing with real database */}
      <DevUserSelector />
      {/* Cart Page */}
      <CartPage />
    </div>
  )
}