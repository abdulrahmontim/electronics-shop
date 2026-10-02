import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const getUserMock = vi.fn()
const rpcMock = vi.fn()
const fromMock = vi.fn()

vi.mock('../lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: fromMock
  })
}))

vi.mock('../lib/mailgun', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined)
}))

import { POST } from '../app/api/checkout/route'

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not signed in', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})