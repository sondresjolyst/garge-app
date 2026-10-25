import { describe, it, expect } from 'vitest'
import { currentMonth, monthsBefore, outsideAmountSchema, outsideMonthSchema } from '@/lib/validation/outsideSalesSchema'

describe('outsideAmountSchema', () => {
    it.each([
        ['0', 0],
        ['12500', 1_250_000],
        ['12500.5', 1_250_050],
        ['12500,50', 1_250_050],
        [' 1.01 ', 101],
        ['10000000', 1_000_000_000],
    ])('turns %s kr into %i øre', (input, ore) => {
        expect(outsideAmountSchema.parse(input)).toBe(ore)
    })

    it.each(['', '-5', '1.234', 'abc', '1e5', '10000000.01'])('refuses %j', input => {
        expect(outsideAmountSchema.safeParse(input).success).toBe(false)
    })
})

describe('outsideMonthSchema', () => {
    // 23:30 UTC on 31 October is already November in Oslo.
    const now = new Date('2026-10-31T23:30:00Z')

    it('reads the current month in Norwegian time', () => {
        expect(currentMonth(now)).toBe('2026-11')
    })

    it('counts months back across years', () => {
        expect(monthsBefore('2026-11', 36)).toBe('2023-11')
        expect(monthsBefore('2026-01', 1)).toBe('2025-12')
    })

    it.each(['2026-11', '2026-01', '2023-11'])('takes %s', month => {
        expect(outsideMonthSchema(now).parse(month)).toBe(month)
    })

    it.each([
        ['2026-12', 'Choose a month that has started.'],
        ['2023-10', 'Choose a month at most 36 months back.'],
        ['2026-13', 'Choose a month.'],
        ['', 'Choose a month.'],
    ])('refuses %j', (month, message) => {
        const result = outsideMonthSchema(now).safeParse(month)
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe(message)
    })
})
