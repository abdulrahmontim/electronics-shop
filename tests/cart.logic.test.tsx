import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CartProvider,
  MAX_PER_ITEM,
  addToCartList,
  useCart,
} from '../components/CartProvider'
import { AddToCart } from '../components/AddToCart'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [] })
      })
    })
  })
}))

const ID = '11111111-1111-1111-1111-111111111111'
const OTHER_ID = '22222222-2222-2222-2222-222222222222'

function item(overrides: Record<string, unknown> = {}) {
  return {
    product_id: ID,
    name: 'Item',
    price_ngn: 1000,
    image_url: '',
    quantity: 1,
    ...overrides,
  }
}

function renderProduct(quantity = 1) {
  return render(
    <CartProvider>
      <AddToCart
        productId={ID}
        productName="Breadboard 830 points"
        priceNgn={3800}
        inStock
        slug="breadboard-830-points"
        imageUrl={null}
      />
    </CartProvider>
  )
}

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
      result.current.addItem(item())
      result.current.addItem(item())
    })
    expect(result.current.items.length).toBe(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('clamps quantity to 1-20', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      result.current.addItem(item())
    })
    act(() => {
      result.current.updateQuantity(ID, 50)
    })
    expect(result.current.items[0].quantity).toBe(20)
    act(() => {
      result.current.updateQuantity(ID, 0)
    })
    expect(result.current.items[0].quantity).toBe(1)
  })

  it('reports how many were added', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    let first = 0
    let second = 0
    act(() => {
      first = result.current.addItem(item({ quantity: 3 }))
    })
    expect(first).toBe(3)
    act(() => {
      second = result.current.addItem(item({ quantity: 2 }))
    })
    expect(second).toBe(2)
    expect(result.current.items[0].quantity).toBe(5)
  })

  it('adds two lines in one act and counts both', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    const added: number[] = []
    act(() => {
      added.push(result.current.addItem(item({ quantity: 4 })))
      added.push(result.current.addItem(item({ quantity: 6 })))
    })
    expect(added).toEqual([4, 6])
    expect(result.current.items[0].quantity).toBe(10)
  })

  it('trims an add at the 20 cap and reports the trimmed count', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      result.current.addItem(item({ quantity: 19 }))
    })
    let added = 0
    act(() => {
      added = result.current.addItem(item({ quantity: 5 }))
    })
    expect(added).toBe(1)
    expect(result.current.items[0].quantity).toBe(MAX_PER_ITEM)
  })

  it('adds nothing when the item is already at the cap', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => {
      result.current.addItem(item({ quantity: 20 }))
    })
    let added = -1
    act(() => {
      added = result.current.addItem(item({ quantity: 3 }))
    })
    expect(added).toBe(0)
    expect(result.current.items[0].quantity).toBe(20)
  })

  it('addToCartList never mutates the list it is given', () => {
    const start = [item({ quantity: 3 })]
    const result = addToCartList(start, item({ quantity: 2 }))
    expect(result.added).toBe(2)
    expect(result.items[0].quantity).toBe(5)
    expect(start[0].quantity).toBe(3)
  })
})

describe('add to cart on the product page', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('adds the selected amount and shows how many are in the cart', async () => {
    const user = userEvent.setup()
    renderProduct()
    await user.selectOptions(screen.getByLabelText('Quantity'), '3')
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText('3 in your cart')).toBeInTheDocument()
    expect(screen.getByText('Added to your cart')).toBeInTheDocument()
  })

  it('resets the quantity selector to 1 after an add', async () => {
    const user = userEvent.setup()
    renderProduct()
    const select = screen.getByLabelText('Quantity') as HTMLSelectElement
    await user.selectOptions(select, '4')
    expect(select.value).toBe('4')
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(select.value).toBe('1')
  })

  it('offers at most ten quantities', () => {
    renderProduct()
    expect(screen.getByLabelText('Quantity').querySelectorAll('option')).toHaveLength(10)
  })

  it('only offers what the 20 cap still allows', async () => {
    localStorage.setItem(
      'bench-supply-cart',
      JSON.stringify([item({ quantity: 16 })])
    )
    const user = userEvent.setup()
    renderProduct()
    const select = screen.getByLabelText('Quantity')
    expect(select.querySelectorAll('option')).toHaveLength(4)
    await user.selectOptions(select, '4')
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText('20 in your cart')).toBeInTheDocument()
    expect(screen.getByText('Added to your cart')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to cart' })).toBeDisabled()
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument()
  })

  it('disables the button and links to the cart at the cap', () => {
    localStorage.setItem(
      'bench-supply-cart',
      JSON.stringify([item({ quantity: MAX_PER_ITEM })])
    )
    renderProduct()
    const button = screen.getByRole('button', { name: 'Add to cart' })
    expect(button).toBeDisabled()
    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument()
    expect(
      screen.getByText(/^Maximum 20 per item\./)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change the quantity in your cart.' })).toHaveAttribute(
      'href',
      '/cart'
    )
    expect(screen.getByText('20 in your cart')).toBeInTheDocument()
  })

  it('keeps other products in the cart untouched', async () => {
    localStorage.setItem(
      'bench-supply-cart',
      JSON.stringify([
        item({ product_id: OTHER_ID, name: 'Other', quantity: 2 }),
      ])
    )
    const user = userEvent.setup()
    renderProduct()
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText('1 in your cart')).toBeInTheDocument()
  })
})