import { describe, it, expect } from 'vitest'
import { FieldValidationError } from '@/lib/errors'

describe('FieldValidationError', () => {
    it('is an Error and carries the field errors', () => {
        const err = new FieldValidationError({ email: ['Please enter a valid email.'] })
        expect(err).toBeInstanceOf(Error)
        expect(err).toBeInstanceOf(FieldValidationError)
        expect(err.fieldErrors).toEqual({ email: ['Please enter a valid email.'] })
        expect(err.name).toBe('FieldValidationError')
    })

    it('uses a default message and allows an override', () => {
        expect(new FieldValidationError({}).message).toBe('Validation failed')
        expect(new FieldValidationError({}, 'Bad input').message).toBe('Bad input')
    })

    it('survives an instanceof check after being thrown and caught', () => {
        let caught: unknown
        try {
            throw new FieldValidationError({ password: ['too short'] })
        } catch (e) {
            caught = e
        }
        expect(caught instanceof FieldValidationError).toBe(true)
        if (caught instanceof FieldValidationError) {
            expect(caught.fieldErrors.password).toEqual(['too short'])
        }
    })
})
