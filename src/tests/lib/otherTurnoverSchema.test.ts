import { describe, it, expect } from 'vitest'
import { otherTurnoverSchema } from '@/lib/validation/otherTurnoverSchema'

describe('otherTurnoverSchema', () => {
    it.each([
        ['0', 0],
        ['12500', 1_250_000],
        ['12500.5', 1_250_050],
        ['12500,50', 1_250_050],
        [' 1.01 ', 101],
        ['100000000', 10_000_000_000],
    ])('turns %s kr into %i øre', (input, ore) => {
        expect(otherTurnoverSchema.parse(input)).toBe(ore)
    })

    it.each(['', '-5', '1.234', 'abc', '1e5', '100000000.01'])('refuses %j', input => {
        expect(otherTurnoverSchema.safeParse(input).success).toBe(false)
    })
})
