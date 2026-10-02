import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../components/CartProvider'

describe('cart logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('adds items and merges duplicates', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      result.current.addItem({ product_id: '11111111-1111-1111-1111-111111111111', name: 'Item', price_ngn: 1000, image_url: '', quantity: 1 })
      result.current.addItem({ product_id: '11111111-1111-1111-1111-111111111111', name: 'Item', price_ngn: 1000, image_url: '', quantity: 1 })
    })
    expect(result.current.items.length).toBe(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('clamps quantity to 1-20', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      result.current.addItem({ product_id: '11111111-1111-1111-1111-111111111111', name: 'Item', price_ngn: 1000, image_url: '', quantity: 1 })
    })
    act(() => {
      result.current.updateQuantity('11111111-1111-1111-1111-111111111111', 50)
    })
    expect(result.current.items[0].quantity).toBe(20)
    act(() => {
      result.current.updateQuantity('11111111-1111-1111-1111-111111111111', 0)
    })
    expect(result.current.items[0].quantity).toBe(1)
  })
})