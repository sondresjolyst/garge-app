import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))
vi.mock('next-auth/react', () => ({ getSession: vi.fn() }))

import UserService from '@/services/userService'
import axiosInstance from '@/services/axiosInstance'
import { FieldValidationError } from '@/lib/errors'
import { AxiosError } from 'axios'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>
const mockPut = axiosInstance.put as ReturnType<typeof vi.fn>
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>

const validRegistration = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    userName: 'ada',
    email: 'ada@example.com',
    password: 'Sup3r!secret',
    confirmAge16Plus: true,
    acceptTerms: true,
    termsVersion: 'v1',
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('UserService.register', () => {
    it('throws a FieldValidationError with per-field messages on client-side validation failure', async () => {
        const promise = UserService.register({ ...validRegistration, email: 'bad', password: 'weak' })
        await expect(promise).rejects.toBeInstanceOf(FieldValidationError)
        try {
            await UserService.register({ ...validRegistration, email: 'bad' })
        } catch (e) {
            expect(e).toBeInstanceOf(FieldValidationError)
            if (e instanceof FieldValidationError) {
                expect(e.fieldErrors.email).toContain('Please enter a valid email.')
            }
        }
        expect(mockPost).not.toHaveBeenCalled()
    })

    it('posts to /auth/register when validation passes', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok' } })
        const result = await UserService.register(validRegistration)
        expect(mockPost).toHaveBeenCalledWith('/auth/register', validRegistration)
        expect(result).toEqual({ message: 'ok' })
    })

    it('maps server-side validation errors into a FieldValidationError', async () => {
        const axiosErr = new AxiosError('Bad Request')
        axiosErr.response = {
            data: { errors: { Email: ['Email already taken.'] } },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: { headers: {} } as never,
        }
        mockPost.mockRejectedValueOnce(axiosErr)
        try {
            await UserService.register(validRegistration)
            throw new Error('should have thrown')
        } catch (e) {
            expect(e).toBeInstanceOf(FieldValidationError)
            if (e instanceof FieldValidationError) {
                expect(e.fieldErrors.email).toContain('Email already taken.')
            }
        }
    })
})

describe('UserService.getDataRetention', () => {
    it('GETs the data-retention endpoint and returns the preference', async () => {
        mockGet.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-01-01T00:00:00Z' } })
        const result = await UserService.getDataRetention('u1')
        expect(mockGet).toHaveBeenCalledWith('/users/u1/data-retention')
        expect(result).toEqual({ optOut: true, optedOutAt: '2026-01-01T00:00:00Z' })
    })
})

describe('UserService.updateDataRetention', () => {
    it('PUTs optOut=true to opt out of retention', async () => {
        mockPut.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-05-21T00:00:00Z' } })
        const result = await UserService.updateDataRetention('u1', true)
        expect(mockPut).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: true })
        expect(result.optOut).toBe(true)
    })

    it('PUTs optOut=false to keep retention (clears the opt-out)', async () => {
        mockPut.mockResolvedValueOnce({ data: { optOut: false, optedOutAt: null } })
        const result = await UserService.updateDataRetention('u1', false)
        expect(mockPut).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: false })
        expect(result.optedOutAt).toBeNull()
    })

    it('throws a friendly error when the request fails', async () => {
        mockPut.mockRejectedValueOnce(new Error('network down'))
        await expect(UserService.updateDataRetention('u1', true)).rejects.toThrow()
    })
})
