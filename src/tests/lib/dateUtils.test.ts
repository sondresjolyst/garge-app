import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatRelative } from '@/lib/dateUtils'

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

describe('formatRelative', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    it('returns "just now" for < 1 min', () => {
        expect(formatRelative(new Date('2026-01-01T11:59:40Z'), now)).toBe('just now')
    })
    it('returns minutes', () => {
        expect(formatRelative(new Date('2026-01-01T11:55:00Z'), now)).toBe('5 min ago')
    })
    it('returns hours', () => {
        expect(formatRelative(new Date('2026-01-01T09:00:00Z'), now)).toBe('3 h ago')
    })
    it('returns days', () => {
        expect(formatRelative(new Date('2025-12-29T12:00:00Z'), now)).toBe('3 d ago')
    })
    it('returns months', () => {
        expect(formatRelative(new Date('2025-10-01T12:00:00Z'), now)).toBe('3 mo ago')
    })
    it('returns years', () => {
        expect(formatRelative(new Date('2023-01-01T12:00:00Z'), now)).toBe('3 y ago')
    })
})
