import { describe, expect, it } from 'vitest'
import { formatResistorValue, hashSlugToBands } from '../lib/resistor'

describe('resistor formatting', () => {
  it('formats 4.7 kΩ', () => {
    expect(formatResistorValue(4, 7, 2)).toBe('4.7 kOhms')
  })
  it('formats 330 Ω', () => {
    expect(formatResistorValue(3, 3, 1)).toBe('330 O')
  })
})

describe('bandsForSlug', () => {
  it('returns same bands for same slug', () => {
    const b1 = hashSlugToBands('arduino-uno')
    const b2 = hashSlugToBands('arduino-uno')
    expect(b1).toEqual(b2)
  })
})