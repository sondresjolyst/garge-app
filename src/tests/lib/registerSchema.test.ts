import { describe, it, expect } from 'vitest'
import { registerSchema, zodIssuesToFieldErrors } from '@/lib/validation/registerSchema'

const valid = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    userName: 'ada',
    email: 'ada@example.com',
    password: 'Sup3r!secret',
}

describe('registerSchema', () => {
    it('accepts a fully valid registration', () => {
        expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects names shorter than 2 characters', () => {
        const result = registerSchema.safeParse({ ...valid, firstName: 'A', lastName: 'B', userName: 'c' })
        expect(result.success).toBe(false)
        if (!result.success) {
            const fields = zodIssuesToFieldErrors(result.error.issues)
            expect(fields.firstName).toContain('First Name must be at least 2 characters long.')
            expect(fields.lastName).toContain('Last Name must be at least 2 characters long.')
            expect(fields.userName).toContain('Username must be at least 2 characters long.')
        }
    })

    it('rejects an invalid email', () => {
        const result = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(zodIssuesToFieldErrors(result.error.issues).email).toContain('Please enter a valid email.')
        }
    })

    it('enforces every password rule', () => {
        const cases: Array<[string, string]> = [
            ['Sh1!aaa', 'Be at least 8 characters long.'],
            ['nouppercase1!', 'Contain at least one uppercase letter.'],
            ['NoNumber!!', 'Contain at least one number.'],
            ['NoSpecial123', 'Contain at least one special character.'],
            ['12345678!', 'Contain at least one letter.'],
        ]
        for (const [password, message] of cases) {
            const result = registerSchema.safeParse({ ...valid, password })
            expect(result.success, `expected "${password}" to fail`).toBe(false)
            if (!result.success) {
                expect(zodIssuesToFieldErrors(result.error.issues).password).toContain(message)
            }
        }
    })

    it('groups multiple issues per field', () => {
        const result = registerSchema.safeParse({ ...valid, password: 'a' })
        expect(result.success).toBe(false)
        if (!result.success) {
            const fields = zodIssuesToFieldErrors(result.error.issues)
            expect(fields.password.length).toBeGreaterThan(1)
        }
    })
})
