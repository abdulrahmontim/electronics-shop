import { describe, expect, it } from 'vitest'
import { formatNaira, safeNext } from '../lib/format'

describe('safeNext', () => {
  it('rejects //evil.com', () => {
    expect(safeNext('//evil.com')).toBe('/')
  })
  it('rejects https://x.com', () => {
    expect(safeNext('https://x.com')).toBe('/')
  })
  it('rejects empty values', () => {
    expect(safeNext('')).toBe('/')
    expect(safeNext(null as any)).toBe('/')
    expect(safeNext(undefined as any)).toBe('/')
  })
  it('accepts /orders', () => {
    expect(safeNext('/orders')).toBe('/orders')
  })
})

describe('formatNaira', () => {
  it('formats integer naira', () => {
    expect(formatNaira(14500)).toBe('₦14,500')
  })
  it('formats zero', () => {
    expect(formatNaira(0)).toBe('₦0')
  })
})