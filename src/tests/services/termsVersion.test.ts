import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

const { publicSpies } = vi.hoisted(() => ({ publicSpies: { get: vi.fn() } }))

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())
vi.mock('@/services/publicClient', () => ({ default: publicSpies }))

import { getTermsVersion, NO_TERMS_VERSION } from '@/services/legalService'

const refusedWith = (status: number) =>
    new AxiosError('refused', String(status), undefined, undefined,
        { status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: {} })

beforeEach(() => {
    publicSpies.get.mockReset()
})

describe('getTermsVersion', () => {
    it('reads the version of the English terms page on the anonymous client', async () => {
        publicSpies.get.mockResolvedValueOnce({ data: { key: 'terms', locale: 'en', version: '2026-10-25T10:00:00.000000Z' } })

        expect(await getTermsVersion()).toBe('2026-10-25T10:00:00.000000Z')
        expect(publicSpies.get).toHaveBeenCalledWith('/content/legal/terms', { params: { locale: 'en' } })
    })

    it('falls back to a fixed version when there is no terms page', async () => {
        publicSpies.get.mockRejectedValueOnce(refusedWith(404))

        expect(await getTermsVersion()).toBe(NO_TERMS_VERSION)
    })

    it('throws for any other failure, so the form waits', async () => {
        publicSpies.get.mockRejectedValueOnce(refusedWith(500))

        await expect(getTermsVersion()).rejects.toThrow()
    })

    it('throws for a page without a version', async () => {
        publicSpies.get.mockResolvedValueOnce({ data: { key: 'terms', locale: 'en', version: '' } })

        await expect(getTermsVersion()).rejects.toThrow('Failed to load the terms')
    })
})
