import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useCart } from '../../features/cart/hooks/useCart'
import cartReducer from '../../features/cart/redux/cart.slice'
import { productFixtures, cartFixtures } from '../../test-utils/fixtures'

// Mock store for testing
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState,
  })
}

const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useCart Hook', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore({
      cart: cartFixtures.emptyCart,
    })
  })

  it('returns initial cart state', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(result.current.items).toEqual([])
    expect(result.current.subtotal).toBe(0)
    expect(result.current.totalQuantity).toBe(0)
    expect(result.current.items.length).toBe(0)
  })

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 1 })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].productId).toBe(productFixtures.electronics.id)
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.totalQuantity).toBe(1)
    expect(result.current.items.length).toBe(1)
  })

  it('updates item quantity', () => {
    // Start with a cart that has one item
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
    })

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.setQty(productFixtures.electronics.id, 3)
    })

    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.items[0].total).toBe(299.97)
  })

  it('removes item from cart', () => {
    // Start with a cart that has one item
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
    })

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.remove(productFixtures.electronics.id)
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.items.length).toBe(0)
  })

  it('clears cart', () => {
    // Start with a cart that has items
    store = createTestStore({
      cart: cartFixtures.multipleItemsCart,
    })

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.clear()
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.items.length).toBe(0)
  })

  it('calculates subtotal correctly', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 2 })
      result.current.add({ id: productFixtures.clothing.id, title: productFixtures.clothing.name, price: productFixtures.clothing.price, quantity: 1 })
    })

    expect(result.current.subtotal).toBe(229.97) // (99.99 * 2) + (29.99 * 1)
  })

  it('handles duplicate items by updating quantity', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 1 })
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 2 })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
  })

  it('validates item quantity', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 0 })
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('handles out of stock items', () => {
    const outOfStockProduct = {
      ...productFixtures.electronics,
      inStock: false,
      stock: 0,
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: outOfStockProduct.id, title: outOfStockProduct.name, price: outOfStockProduct.price, quantity: 1 })
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('updates item count correctly', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 2 })
      result.current.add({ id: productFixtures.clothing.id, title: productFixtures.clothing.name, price: productFixtures.clothing.price, quantity: 1 })
    })

    expect(result.current.totalQuantity).toBe(3)
  })

  it('handles item removal when quantity becomes zero', () => {
    // Start with a cart that has one item
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
    })

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.setQty(productFixtures.electronics.id, 0)
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.items.length).toBe(0)
  })

  it('persists cart state', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 1 })
    })

    // Re-render with same store
    const { result: result2 } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(result2.current.items).toHaveLength(1)
    expect(result2.current.items[0].productId).toBe(productFixtures.electronics.id)
  })

  it('handles cart operations with multiple items', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    act(() => {
      result.current.add({ id: productFixtures.electronics.id, title: productFixtures.electronics.name, price: productFixtures.electronics.price, quantity: 2 })
      result.current.add({ id: productFixtures.clothing.id, title: productFixtures.clothing.name, price: productFixtures.clothing.price, quantity: 1 })
      result.current.add({ id: productFixtures.books.id, title: productFixtures.books.name, price: productFixtures.books.price, quantity: 3 })
    })

    expect(result.current.items).toHaveLength(3)
    expect(result.current.totalQuantity).toBe(6)
    expect(result.current.subtotal).toBe(379.95) // (99.99 * 2) + (29.99 * 1) + (49.99 * 3)
  })
})
