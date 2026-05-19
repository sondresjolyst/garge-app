import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { formatApiError } from '@/lib/errorMessages'

function axiosErrorWith(status: number, data: unknown): AxiosError {
    const headers = new AxiosHeaders()
    const err = new AxiosError('request failed', String(status))
    err.response = {
        status,
        statusText: '',
        headers,
        config: { headers } as never,
        data,
    }
    return err
}

describe('formatApiError', () => {
    it('returns the fallback for a non-AxiosError', () => {
        expect(formatApiError(new Error('boom'), 'fallback')).toBe('fallback')
        expect(formatApiError(null, 'fallback')).toBe('fallback')
        expect(formatApiError('string', 'fallback')).toBe('fallback')
    })

    it('returns the server message on 400', () => {
        const err = axiosErrorWith(400, { message: 'Bad input.' })
        expect(formatApiError(err, 'fallback')).toBe('Bad input.')
    })

    it('returns the fallback on 400 when the body has no message', () => {
        const err = axiosErrorWith(400, {})
        expect(formatApiError(err, 'fallback')).toBe('fallback')
    })

    it('returns the server message on 403 when present', () => {
        const err = axiosErrorWith(403, {
            message: 'You need an active subscription to claim more sensors or switches.',
        })
        expect(formatApiError(err, 'Failed to claim sensor')).toBe(
            'You need an active subscription to claim more sensors or switches.',
        )
    })

    it('returns "Not authorized." on 403 with no body', () => {
        const err = axiosErrorWith(403, undefined)
        expect(formatApiError(err, 'fallback')).toBe('Not authorized.')
    })

    it('returns the server message on 401 when present', () => {
        const err = axiosErrorWith(401, { message: 'Token expired.' })
        expect(formatApiError(err, 'fallback')).toBe('Token expired.')
    })

    it('returns "Not authorized." on 401 with no body', () => {
        const err = axiosErrorWith(401, null)
        expect(formatApiError(err, 'fallback')).toBe('Not authorized.')
    })

    it('returns the server message on 404 when present', () => {
        const err = axiosErrorWith(404, { message: 'Sensor not found.' })
        expect(formatApiError(err, 'fallback')).toBe('Sensor not found.')
    })

    it('returns "Not found." on 404 with no body', () => {
        const err = axiosErrorWith(404, {})
        expect(formatApiError(err, 'fallback')).toBe('Not found.')
    })

    it('returns the server message on 409 when present', () => {
        const err = axiosErrorWith(409, { message: 'Already claimed.' })
        expect(formatApiError(err, 'fallback')).toBe('Already claimed.')
    })

    it('returns the conflict fallback on 409 with no body', () => {
        const err = axiosErrorWith(409, {})
        expect(formatApiError(err, 'fallback')).toBe('Conflict — already exists.')
    })

    it('returns a Vipps-specific message on 502/503', () => {
        expect(formatApiError(axiosErrorWith(502, {}), 'fallback')).toBe('Vipps unreachable. Try again in a moment.')
        expect(formatApiError(axiosErrorWith(503, {}), 'fallback')).toBe('Vipps unreachable. Try again in a moment.')
    })

    it('returns a rate-limit message on 429', () => {
        expect(formatApiError(axiosErrorWith(429, {}), 'fallback')).toBe('Too many requests. Wait a moment.')
    })

    it('falls back to a string body when the response body is a plain string', () => {
        const err = axiosErrorWith(500, 'Something broke.')
        expect(formatApiError(err, 'fallback')).toBe('Something broke.')
    })

    it('returns the fallback when status is unknown and no message is present', () => {
        const err = axiosErrorWith(500, {})
        expect(formatApiError(err, 'fallback')).toBe('fallback')
    })
})
