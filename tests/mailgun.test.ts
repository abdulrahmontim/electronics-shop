import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock fetch
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { sendEmail } from '../lib/mailgun'

describe('mailgun sendEmail', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    process.env.MAILGUN_API_KEY = 'key'
    process.env.MAILGUN_DOMAIN = 'domain.com'
    delete process.env.MAILGUN_API_BASE
    delete process.env.MAILGUN_FROM
  })

  it('sends with correct URL and auth', async () => {
    fetchMock.mockResolvedValue({ ok: true } as any)
    await sendEmail({ to: 'test@test.com', subject: 'Hi', text: 'text', html: '<p>hi</p>' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0] as any
    expect(url).toBe('https://api.mailgun.net/v3/domain.com/messages')
    expect(opts.headers.Authorization).toMatch(/^Basic /)
    expect(opts.method).toBe('POST')
    const bodyStr = typeof opts.body === 'string' ? opts.body : (await new Response(opts.body as any).text())
    expect(bodyStr).toContain('to=test%40test.com')
  })

  it('escapes HTML', async () => {
    fetchMock.mockResolvedValue({ ok: true } as any)
    await sendEmail({ to: 'a@b.com', subject: 'S', text: 't', html: '<p>&"</p>' })
    const [, opts] = fetchMock.mock.calls[0] as any
    const bodyStr = typeof opts.body === 'string' ? opts.body : (await new Response(opts.body as any).text())
    expect(bodyStr).toContain('html')
  })

  it('throws on non-2xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' } as any)
    await expect(sendEmail({ to: 'a@b.com', subject: 'S', text: 't', html: '<p>h</p>' })).rejects.toThrow()
  })
})