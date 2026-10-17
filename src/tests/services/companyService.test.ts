import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCompanyInfo } from '@/services/companyService'

describe('getCompanyInfo', () => {
    const originalUrl = process.env.NEXT_PUBLIC_API_URL

    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test/api'
    })

    afterEach(() => {
        process.env.NEXT_PUBLIC_API_URL = originalUrl
        vi.unstubAllGlobals()
    })

    it('reads the public company info from /company without caching', async () => {
        const info = { name: 'Garge', orgNumber: '938 517 789', vatRegistered: false }
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(info) })
        vi.stubGlobal('fetch', fetchMock)

        expect(await getCompanyInfo()).toEqual(info)
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/company', { cache: 'no-store' })
    })

    it('returns null when the URL is not configured', async () => {
        delete process.env.NEXT_PUBLIC_API_URL
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        expect(await getCompanyInfo()).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('returns null on a non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

        expect(await getCompanyInfo()).toBeNull()
    })

    it('returns null when the API cannot be reached', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

        expect(await getCompanyInfo()).toBeNull()
    })
})
