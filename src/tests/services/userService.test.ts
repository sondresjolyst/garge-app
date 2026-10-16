import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/axiosInstance', async () => (await import('@sjolystinnovation/app-kit/testing')).axiosInstanceMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

import UserService from '@/services/userService'
import { axiosSpies, resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { FieldValidationError } from '@/lib/errors'
import { AxiosError } from 'axios'

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

beforeEach(resetTestMocks)

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
        expect(axiosSpies.post).not.toHaveBeenCalled()
    })

    it('posts to /auth/register when validation passes', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { message: 'ok' } })
        const result = await UserService.register(validRegistration)
        expect(axiosSpies.post).toHaveBeenCalledWith('/auth/register', validRegistration)
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
        axiosSpies.post.mockRejectedValueOnce(axiosErr)
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

describe('UserService.updatePreferences', () => {
    it('PUTs emailNotificationsEnabled with the price zone', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: {} })
        await UserService.updatePreferences('u1', { priceZone: 'NO2', emailNotificationsEnabled: false })
        expect(axiosSpies.put).toHaveBeenCalledWith('/users/u1/preferences', { priceZone: 'NO2', emailNotificationsEnabled: false })
    })

    it('surfaces the API message when Garge Security still needs an alert channel', async () => {
        const message = 'Garge Security is on for one of your sensors and needs push or email notifications. Turn Garge Security off first.'
        const axiosErr = new AxiosError('Conflict')
        axiosErr.response = {
            data: { code: 'security_needs_alert_channel', message },
            status: 409,
            statusText: 'Conflict',
            headers: {},
            config: { headers: {} } as never,
        }
        axiosSpies.put.mockRejectedValueOnce(axiosErr)

        await expect(UserService.updatePreferences('u1', { priceZone: 'NO2', emailNotificationsEnabled: false }))
            .rejects.toThrow(message)
    })
})

describe('UserService.getDataRetention', () => {
    it('GETs the data-retention endpoint and returns the preference', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-01-01T00:00:00Z' } })
        const result = await UserService.getDataRetention('u1')
        expect(axiosSpies.get).toHaveBeenCalledWith('/users/u1/data-retention')
        expect(result).toEqual({ optOut: true, optedOutAt: '2026-01-01T00:00:00Z' })
    })
})

describe('UserService.updateDataRetention', () => {
    it('PUTs optOut=true to opt out of retention', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-05-21T00:00:00Z' } })
        const result = await UserService.updateDataRetention('u1', true)
        expect(axiosSpies.put).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: true })
        expect(result.optOut).toBe(true)
    })

    it('PUTs optOut=false to keep retention (clears the opt-out)', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: { optOut: false, optedOutAt: null } })
        const result = await UserService.updateDataRetention('u1', false)
        expect(axiosSpies.put).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: false })
        expect(result.optedOutAt).toBeNull()
    })

    it('throws a friendly error when the request fails', async () => {
        axiosSpies.put.mockRejectedValueOnce(new Error('network down'))
        await expect(UserService.updateDataRetention('u1', true)).rejects.toThrow()
    })
})
