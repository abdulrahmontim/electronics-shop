import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const ID = '11111111-1111-1111-1111-111111111111'

const { addItem } = vi.hoisted(() => ({ addItem: vi.fn() }))

// A stale cart (the page has not re-rendered yet) is the only way the cap can
// trim an add, so the copy for that case is checked against a fixed cart.
vi.mock('../components/CartProvider', async () => {
  const actual = await vi.importActual<any>('../components/CartProvider')
  return {
    ...actual,
    useCart: () => ({
      items: [{ product_id: ID, quantity: 18, name: 'Item' }],
      addItem,
    }),
  }
})

import { AddToCart } from '../components/AddToCart'

function renderProduct() {
  return render(
    <AddToCart
      productId={ID}
      productName="Breadboard 830 points"
      priceNgn={3800}
      inStock
      slug="breadboard-830-points"
      imageUrl={null}
    />
  )
}

describe('add to cart messages when the cap trims the add', () => {
  beforeEach(() => {
    addItem.mockReset()
  })

  it('asks for two but only adds one', async () => {
    addItem.mockReturnValue(1)
    const user = userEvent.setup()
    renderProduct()
    await user.selectOptions(screen.getByLabelText('Quantity'), '2')
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: ID, quantity: 2 })
    )
    expect(
      screen.getByText('Added 1. Maximum is 20 per item.')
    ).toBeInTheDocument()
  })

  it('reports nothing added when the item is already at the cap', async () => {
    addItem.mockReturnValue(0)
    const user = userEvent.setup()
    renderProduct()
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(screen.getByText('Maximum 20 per item.')).toBeInTheDocument()
  })

  it('still shows the amount already in the cart', () => {
    addItem.mockReturnValue(1)
    renderProduct()
    expect(screen.getByText('18 in your cart')).toBeInTheDocument()
  })

  it('offers only the two quantities that still fit', () => {
    addItem.mockReturnValue(1)
    renderProduct()
    expect(
      screen.getByLabelText('Quantity').querySelectorAll('option')
    ).toHaveLength(2)
  })
})