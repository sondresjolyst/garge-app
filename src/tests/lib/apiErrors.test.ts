import { describe, it, expect } from 'vitest'
import { parseValidationErrors } from '@/lib/apiErrors'

describe('parseValidationErrors', () => {
    it('returns null for non-object input', () => {
        expect(parseValidationErrors(null)).toBeNull()
        expect(parseValidationErrors(undefined)).toBeNull()
        expect(parseValidationErrors('error')).toBeNull()
        expect(parseValidationErrors(42)).toBeNull()
    })

    it('returns null when errors field is missing', () => {
        expect(parseValidationErrors({ message: 'oops' })).toBeNull()
    })

    it('returns null when errors field is not an object', () => {
        expect(parseValidationErrors({ errors: 'string' })).toBeNull()
    })

    it('returns null when errors object is empty', () => {
        expect(parseValidationErrors({ errors: {} })).toBeNull()
    })

    it('lowercases the first character of each field key', () => {
        const result = parseValidationErrors({
            errors: {
                Password: ['The field Password must be a string with a minimum length of 10 and a maximum length of 128.'],
            },
        })
        expect(result).toEqual({
            password: ['The field Password must be a string with a minimum length of 10 and a maximum length of 128.'],
        })
    })

    it('preserves arrays of messages', () => {
        const result = parseValidationErrors({
            errors: {
                Email: ['Email is required.', 'Email must be valid.'],
            },
        })
        expect(result).toEqual({
            email: ['Email is required.', 'Email must be valid.'],
        })
    })

    it('handles multiple fields', () => {
        const result = parseValidationErrors({
            errors: {
                Password: ['Too short.'],
                UserName: ['Already taken.'],
            },
        })
        expect(result).toEqual({
            password: ['Too short.'],
            userName: ['Already taken.'],
        })
    })

    it('coerces non-array values to single-element arrays', () => {
        const result = parseValidationErrors({
            errors: {
                Password: 'Too short.',
            },
        })
        expect(result).toEqual({
            password: ['Too short.'],
        })
    })

    it('preserves already-camelCase keys', () => {
        const result = parseValidationErrors({
            errors: {
                password: ['Bad.'],
            },
        })
        expect(result).toEqual({
            password: ['Bad.'],
        })
    })
})
