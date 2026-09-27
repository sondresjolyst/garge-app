import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { parseErrorCode, parseValidationErrors } from '@/lib/apiErrors'

function axiosErrorWith(status: number, data: unknown): AxiosError {
    const err = new AxiosError('Request failed')
    err.response = { data, status, statusText: '', headers: {}, config: { headers: {} } as never }
    return err
}

describe('parseErrorCode', () => {
    it('returns the code from the response body', () => {
        const err = axiosErrorWith(400, { code: 'charging_automation_required', message: 'Add a rule.' })
        expect(parseErrorCode(err)).toBe('charging_automation_required')
    })

    it('returns null when the body has no string code', () => {
        expect(parseErrorCode(axiosErrorWith(400, { message: 'Bad.' }))).toBeNull()
        expect(parseErrorCode(axiosErrorWith(400, { code: 42 }))).toBeNull()
        expect(parseErrorCode(axiosErrorWith(400, 'plain text'))).toBeNull()
    })

    it('returns null for non-axios errors', () => {
        expect(parseErrorCode(new Error('network down'))).toBeNull()
        expect(parseErrorCode(undefined)).toBeNull()
    })
})

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
