import { describe, it, expect } from 'vitest'
import { earliestEffectiveFrom, priceChangeSchema } from '@/lib/validation/priceChangeSchema'

// Late on 11 October in Norway is still 11 October in UTC, the day garge-api counts from.
const now = new Date('2026-10-11T21:30:00Z')

describe('earliestEffectiveFrom', () => {
    it('is 30 days after today in UTC', () => {
        expect(earliestEffectiveFrom(now)).toBe('2026-11-10')
    })

    it('counts from the UTC day, not the local one', () => {
        expect(earliestEffectiveFrom(new Date('2026-10-11T23:59:59Z'))).toBe('2026-11-10')
        expect(earliestEffectiveFrom(new Date('2026-10-12T00:00:00Z'))).toBe('2026-11-11')
    })
})

describe('priceChangeSchema', () => {
    const schema = priceChangeSchema(4900, now)

    it.each([
        ['59', 5900],
        ['59.5', 5950],
        ['59,50', 5950],
        [' 49.01 ', 4901],
        ['20000', 2_000_000],
    ])('turns %s kr into %i øre', (input, ore) => {
        expect(schema.parse({ newPrice: input, effectiveFrom: '2026-11-10' }).newPrice).toBe(ore)
    })

    it.each(['49', '49.00', '39', '20000.01', '', 'abc', '-59', '1.234'])('refuses the price %j', input => {
        expect(schema.safeParse({ newPrice: input, effectiveFrom: '2026-11-10' }).success).toBe(false)
    })

    it('accepts the earliest date and later', () => {
        expect(schema.safeParse({ newPrice: '59', effectiveFrom: '2026-11-10' }).success).toBe(true)
        expect(schema.safeParse({ newPrice: '59', effectiveFrom: '2027-01-01' }).success).toBe(true)
    })

    it('refuses a date less than 30 days out, naming the earliest one', () => {
        const result = schema.safeParse({ newPrice: '59', effectiveFrom: '2026-11-09' })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toContain('2026-11-10')
    })

    it.each(['', '10.11.2026', '2026-11'])('refuses the date %j', input => {
        expect(schema.safeParse({ newPrice: '59', effectiveFrom: input }).success).toBe(false)
    })
})
