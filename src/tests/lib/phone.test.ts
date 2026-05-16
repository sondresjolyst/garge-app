import { describe, it, expect } from 'vitest'
import { normalizeNoPhone } from '@/lib/phone'

describe('normalizeNoPhone', () => {
    it('prefixes 47 to 8-digit Norwegian numbers', () => {
        expect(normalizeNoPhone('91234567')).toBe('4791234567')
    })

    it('strips spaces and formatting characters', () => {
        expect(normalizeNoPhone('91 23 45 67')).toBe('4791234567')
        expect(normalizeNoPhone('+47 912-34-567')).toBe('4791234567')
    })

    it('accepts 10-digit numbers already prefixed with 47', () => {
        expect(normalizeNoPhone('4791234567')).toBe('4791234567')
        expect(normalizeNoPhone('+47 91234567')).toBe('4791234567')
    })

    it('returns null for too-short input', () => {
        expect(normalizeNoPhone('1234567')).toBeNull()
    })

    it('returns null for too-long input', () => {
        expect(normalizeNoPhone('12345678901')).toBeNull()
    })

    it('returns null for 10-digit number not starting with 47', () => {
        expect(normalizeNoPhone('1234567890')).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(normalizeNoPhone('')).toBeNull()
    })
})
