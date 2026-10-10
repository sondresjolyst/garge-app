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

    it('accepts one-letter names, as the API does', () => {
        expect(registerSchema.safeParse({ ...valid, firstName: 'A', lastName: 'B' }).success).toBe(true)
    })

    it('rejects empty names and names over 50 characters', () => {
        const result = registerSchema.safeParse({ ...valid, firstName: '', lastName: 'x'.repeat(51) })
        expect(result.success).toBe(false)
        if (!result.success) {
            const fields = zodIssuesToFieldErrors(result.error.issues)
            expect(fields.firstName).toContain('First Name is required.')
            expect(fields.lastName).toContain('Last Name must be at most 50 characters long.')
        }
    })

    it('needs a username of 3 to 64 characters', () => {
        const short = registerSchema.safeParse({ ...valid, userName: 'ad' })
        const long = registerSchema.safeParse({ ...valid, userName: 'a'.repeat(65) })
        expect(short.success || zodIssuesToFieldErrors(short.error.issues).userName).toContain('Username must be at least 3 characters long.')
        expect(long.success || zodIssuesToFieldErrors(long.error.issues).userName).toContain('Username must be at most 64 characters long.')
        expect(registerSchema.safeParse({ ...valid, userName: 'a'.repeat(64) }).success).toBe(true)
    })

    it('allows only the username characters Identity allows', () => {
        expect(registerSchema.safeParse({ ...valid, userName: 'ada.love-lace_1@x+y' }).success).toBe(true)
        for (const userName of ['ada love', 'åse', 'ada!']) {
            const result = registerSchema.safeParse({ ...valid, userName })
            expect(result.success, `expected "${userName}" to fail`).toBe(false)
            if (!result.success) {
                expect(zodIssuesToFieldErrors(result.error.issues).userName).toContain('Username can only use letters A-Z, digits and - . _ @ +.')
            }
        }
    })

    it('rejects an email over 254 characters', () => {
        const result = registerSchema.safeParse({ ...valid, email: `${'a'.repeat(250)}@x.no` })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(zodIssuesToFieldErrors(result.error.issues).email).toContain('Email must be at most 254 characters long.')
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
            ['nouppercase1!', 'Contain at least one uppercase letter (A-Z).'],
            ['NOLOWERCASE1!', 'Contain at least one lowercase letter (a-z).'],
            ['NoNumber!!', 'Contain at least one number (0-9).'],
            [`Aa1${'a'.repeat(126)}`, 'Be at most 128 characters long.'],
        ]
        for (const [password, message] of cases) {
            const result = registerSchema.safeParse({ ...valid, password })
            expect(result.success, `expected "${password}" to fail`).toBe(false)
            if (!result.success) {
                expect(zodIssuesToFieldErrors(result.error.issues).password).toContain(message)
            }
        }
    })

    it('accepts a password without a special character, as the API does', () => {
        expect(registerSchema.safeParse({ ...valid, password: 'Password1' }).success).toBe(true)
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
