import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '@/lib/dateUtils'

describe('formatDate', () => {
    it('formats Date object in nb-NO locale', () => {
        const result = formatDate(new Date(2024, 0, 5))
        expect(result).toBe('05.01.2024')
    })

    it('formats ISO string', () => {
        const result = formatDate('2024-06-15T00:00:00Z')
        expect(result).toMatch(/15/)
    })

    it('formats timestamp number', () => {
        const result = formatDate(0)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })
})

describe('formatDateTime', () => {
    it('includes time components', () => {
        const result = formatDateTime(new Date(2024, 0, 5, 14, 30, 0))
        expect(result).toContain('05.01.2024')
        expect(result).toContain('14')
        expect(result).toContain('30')
    })
})
